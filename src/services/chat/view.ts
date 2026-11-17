import type { AssistantMessage, ThinkingPart } from './types.js'

/**
 * 由回复的内容块推导界面需要的结构（简化版：无服务端工具/搜索）。
 * 只做纯计算，不改动内容块。
 */

export type Source = {
  url: string
  title: string
  siteName: string
  publishedAt: string | null
  snippet: string | null
  siteIcon: string | null
  index: number
}

export type ThinkingStep = { type: 'thinking'; key: string; blocks: ThinkingPart[] }

export type Step = ThinkingStep

export type ReplyView = {
  steps: Step[]
  /** 最后一个思考块之后的正文 */
  answer: { markdown: string; text: string } | null
  /** 正文引用可指向的全部来源（本项目恒为空） */
  sources: Source[]
  /** 搜索到的网页（本项目恒为空） */
  searchResults: Source[]
}

/** 文本块拼成 markdown */
const joinTextBlocks = (blocks: { text: string }[]) => ({
  markdown: blocks.map((block) => block.text).join(''),
  text: blocks.map((block) => block.text).join(''),
})

export const buildReplyView = (reply: AssistantMessage, _streaming: boolean): ReplyView => {
  const steps: Step[] = []
  const textBlocks: { text: string }[] = []
  let mergedThinking: ThinkingStep | null = null

  reply.blocks.forEach((block, index) => {
    if (block.type === 'text') {
      textBlocks.push({ text: block.text })
      return
    }
    if (block.type === 'thinking') {
      // 相邻思考块沿用同一个圆点和 Markdown
      if (mergedThinking) {
        mergedThinking.blocks.push(block)
      } else if (block.thinking) {
        mergedThinking = { type: 'thinking', key: `thinking-${index}`, blocks: [block] }
        steps.push(mergedThinking)
      }
      return
    }
    // image 块由 AssistantMessage 单独渲染，不进视图结构
  })

  const answer = textBlocks.length > 0 ? joinTextBlocks(textBlocks) : null
  return {
    steps,
    answer: answer && answer.text ? answer : null,
    sources: [],
    searchResults: [],
  }
}

/** 思考总用时（秒）：各思考块用时之和，至少 1 秒；有块缺少用时时返回 null。 */
export const getTotalThinkingSeconds = (steps: Step[], now: number) => {
  let total = 0
  for (const step of steps) {
    for (const block of step.blocks) {
      if (block.elapsedSeconds !== undefined) {
        total += block.elapsedSeconds * 1000
        continue
      }
      if (block.startedAt === undefined) {
        return null
      }
      total += (block.endedAt ?? now) - block.startedAt
    }
  }
  return Math.max(1, Math.round(total / 1000))
}

/** 折叠区标题 */
export const getAreaTitle = (
  view: ReplyView,
  streaming: boolean,
  now: number,
  hasResponse = view.answer !== null,
  translate: (key: string, params?: Record<string, unknown>) => string = (key) => key
) => {
  if (hasResponse) {
    const count = getTotalThinkingSeconds(view.steps, now)
    if (count === null) {
      return translate('thinkingSwitch')
    }
    return translate(count === 1 ? 'messageThinkDuration' : 'messageThinkDurationPlural', { count })
  }
  if (!streaming) {
    return translate('messageThinkStopped')
  }
  return translate('messageThinking')
}
