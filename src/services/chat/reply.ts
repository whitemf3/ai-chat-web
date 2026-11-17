import type { UIStreamEvent } from '../api/types.js'
import type { AssistantMessage, Message, ReplyBlock, ReplyStatus, UserMessage } from './types.js'
import {
  flushThinkingSplit,
  pushThinkingDelta,
  type SplitSegment,
  type ThinkingSplitState,
} from './thinkingSplit.js'

const updateBlock = (
  reply: AssistantMessage,
  index: number,
  update: (block: ReplyBlock) => ReplyBlock
): AssistantMessage => {
  const block = reply.blocks[index]
  if (!block) {
    return reply
  }
  const blocks = [...reply.blocks]
  blocks[index] = update(block)
  return { ...reply, blocks }
}

/** 把拆分后的片段写入 blocks：text 追加到指定文本块，thinking 追加/新建思考块 */
const appendSegments = (
  reply: AssistantMessage,
  textIndex: number,
  segments: SplitSegment[],
  now: number
): AssistantMessage => {
  let result = reply
  for (const seg of segments) {
    if (seg.kind === 'text') {
      result = updateBlock(result, textIndex, (block) =>
        block.type === 'text' ? { ...block, text: block.text + seg.value } : block
      )
      continue
    }
    const lastIndex = result.blocks.length - 1
    const last = result.blocks[lastIndex]
    if (last && last.type === 'thinking' && last.endedAt === undefined) {
      result = updateBlock(result, lastIndex, (block) =>
        block.type === 'thinking' ? { ...block, thinking: block.thinking + seg.value } : block
      )
    } else {
      result = {
        ...result,
        blocks: [...result.blocks, { type: 'thinking', thinking: seg.value, startedAt: now }],
      }
    }
  }
  return result
}

/**
 * 把一个 UIMessageStream 事件合并进回复。
 * - text/reasoning 的 start/delta/end 维护独立块；同一请求的临时索引映射处理增量；
 * - data-image 直接追加 ImagePart；
 * - finish 更新用量与路由信息；
 * - start 携带的 messageId 对齐逻辑由 store 处理（事件含 messageMetadata.model / route）。
 */
export const applyEvent = (
  reply: AssistantMessage,
  event: UIStreamEvent,
  now: number,
  blockIndexes: Map<string, number>,
  split?: ThinkingSplitState
): AssistantMessage => {
  const next: AssistantMessage =
    reply.status === 'streaming' ? reply : { ...reply, status: 'streaming' }
  switch (event.type) {
    case 'start': {
      const metadata = event.messageMetadata ?? {}
      const route = metadata.route as AssistantMessage['route'] | undefined
      const model =
        typeof metadata.model === 'string' ? (metadata.model as AssistantMessage['model']) : next.model
      return { ...next, model, route: route ?? next.route }
    }
    case 'text-start': {
      blockIndexes.delete(event.id)
      const block: ReplyBlock = { type: 'text', text: '' }
      blockIndexes.set(event.id, next.blocks.length)
      return { ...next, blocks: [...next.blocks, block] }
    }
    case 'text-delta': {
      const index = blockIndexes.get(event.id)
      if (index === undefined) {
        return next
      }
      if (!split) {
        return updateBlock(next, index, (block) =>
          block.type === 'text' ? { ...block, text: block.text + event.delta } : block
        )
      }
      return appendSegments(next, index, pushThinkingDelta(split, event.delta), now)
    }
    case 'reasoning-start': {
      blockIndexes.delete(event.id)
      const block: ReplyBlock = { type: 'thinking', thinking: '', startedAt: now }
      blockIndexes.set(event.id, next.blocks.length)
      return { ...next, blocks: [...next.blocks, block] }
    }
    case 'reasoning-delta': {
      const index = blockIndexes.get(event.id)
      if (index === undefined) {
        return next
      }
      return updateBlock(next, index, (block) =>
        block.type === 'thinking' ? { ...block, thinking: block.thinking + event.delta } : block
      )
    }
    case 'text-end':
    case 'reasoning-end': {
      const index = blockIndexes.get(event.id)
      if (index === undefined) {
        return next
      }
      blockIndexes.delete(event.id)
      const flushed = split
        ? appendSegments(next, index, flushThinkingSplit(split), now)
        : next
      return updateBlock(flushed, index, (block) =>
        block.type === 'thinking' && block.startedAt !== undefined && block.endedAt === undefined
          ? { ...block, endedAt: now }
          : block
      )
    }
    case 'data-image': {
      const block: ReplyBlock = { type: 'image', image: event.data }
      return { ...next, blocks: [...next.blocks, block] }
    }
    case 'finish': {
      const metadata = event.messageMetadata ?? {}
      const usage = metadata.usage as { input: number; output: number } | undefined
      const route = metadata.route as AssistantMessage['route'] | undefined
      const stopReason: AssistantMessage['stopReason'] =
        event.finishReason === 'length' ? 'max_tokens'
          : event.finishReason === 'stop' ? 'end_turn'
            : (metadata.stopReason as AssistantMessage['stopReason']) ?? 'interrupted'
      return {
        ...next,
        ...(usage ? { usage } : {}),
        route: route ?? next.route,
        ...(stopReason ? { stopReason } : {}),
      }
    }
    default:
      return next
  }
}

export const flushReplySplit = (reply: AssistantMessage, split: ThinkingSplitState, now: number) => {
  const textIndex = reply.blocks.findLastIndex((block) => block.type === 'text')
  return textIndex < 0 ? reply : appendSegments(reply, textIndex, flushThinkingSplit(split), now)
}

/** 回复结束：未结束的思考块以当前时间收尾。 */
export const settleReply = (
  reply: AssistantMessage,
  status: Extract<ReplyStatus, 'done' | 'stopped' | 'error'>,
  now: number,
  error?: AssistantMessage['error']
): AssistantMessage => ({
  ...reply,
  status,
  error,
  blocks: reply.blocks.flatMap((block): ReplyBlock[] =>
    block.type === 'thinking' && block.startedAt !== undefined && block.endedAt === undefined
      ? [{ ...block, endedAt: now }]
      : [block]
  ),
})

/** 回复里所有文本块拼起来，用于复制与判断是否有回答 */
export const getReplyText = (reply: AssistantMessage) =>
  reply.blocks.map((block) => (block.type === 'text' ? block.text : '')).join('')

/** 回复是否包含生成图 */
export const hasGeneratedImage = (reply: AssistantMessage) =>
  reply.blocks.some((block) => block.type === 'image')

export const canContinueReply = (reply: AssistantMessage): boolean => {
  if (!reply.prefix || !getReplyText(reply) || hasGeneratedImage(reply)) {
    return false
  }
  return reply.status === 'stopped' || (
    reply.status === 'error' &&
    (reply.error?.kind === 'interrupted' || reply.error?.kind === 'stream' || reply.error?.kind === 'network')
  )
}

/** 已结束或停止且有回答内容的回复才放进上下文 */
const isUsableReply = (message: Message): message is AssistantMessage =>
  message.role === 'assistant' &&
  (message.status === 'done' || message.status === 'stopped') &&
  (getReplyText(message) !== '' || hasGeneratedImage(message))

/** 用户消息：图片附件以后端 AttachmentLike 形态放入 metadata.attachments */
const toUserParam = ({ id, content, files }: UserMessage): unknown => {
  const attachments = files
    .filter((file) => file.serverId)
    .map((file) => ({
      type: file.isImage ? 'image' : 'document',
      url: file.url || file.serverId,
      name: file.name,
      // 文本类附件带上内容，后端注入 [文档内容: ...] 供模型阅读
      ...(file.textContent ? { content: file.textContent } : {}),
      // 保留原始大小，供历史会话附件卡片展示
      ...(file.size ? { size: file.size } : {}),
    }))
  return {
    id,
    role: 'user' as const,
    parts: [{ type: 'text' as const, text: content }],
    ...(attachments.length > 0 ? { metadata: { attachments } } : {}),
  }
}

/** assistant 消息：文本块进 parts，生成图进 metadata.attachments */
const toAssistantParam = ({ id, blocks }: AssistantMessage): unknown => {
  const parts: Array<{ type: 'text'; text: string }> = []
  const imageAttachments: Array<{ type: string; url: string; model?: string }> = []
  for (const block of blocks) {
    if (block.type === 'text' && block.text !== '') {
      parts.push({ type: 'text', text: block.text })
    } else if (block.type === 'image') {
      imageAttachments.push({
        type: 'generated_image',
        url: block.image.url,
        model: block.image.model,
      })
    }
  }
  return {
    id,
    role: 'assistant' as const,
    parts: parts.length > 0 ? parts : [{ type: 'text', text: '' }],
    ...(imageAttachments.length > 0 ? { metadata: { attachments: imageAttachments } } : {}),
  }
}

/** 历史中会进入请求上下文的轮次：提问后紧跟可用回答的才保留 */
export const getContextRounds = (history: Message[]): [UserMessage, AssistantMessage][] => {
  const rounds: [UserMessage, AssistantMessage][] = []
  for (let i = 0; i + 1 < history.length; i++) {
    const [user, reply] = [history[i], history[i + 1]]
    if (user.role === 'user' && isUsableReply(reply)) {
      rounds.push([user, reply])
      i++
    }
  }
  return rounds
}

/**
 * 构建发送到后端的 UIMessage 数组：
 * - 保留「提问 + 有回答的回复」成对轮次，最后接上本轮提问；
 * - 续写时末尾再带上本轮 assistant（作为模型前缀，后端 /continue 路径由 store 另行调用）。
 */
export const toRequestMessages = (
  history: Message[],
  question: UserMessage,
  prefix?: AssistantMessage
): unknown[] => {
  const messages: unknown[] = []
  for (const [user, reply] of getContextRounds(history)) {
    messages.push(toUserParam(user))
    messages.push(toAssistantParam(reply))
  }
  messages.push(toUserParam(question))
  if (prefix?.prefix) {
    messages.push(toAssistantParam(prefix))
  }
  return messages
}

/** 思考用时（秒），至少 1 秒 */
export const getThinkingSeconds = (startedAt: number, endedAt: number) =>
  Math.max(1, Math.round((endedAt - startedAt) / 1000))
