import type { TranslationMessage } from '../../i18n/index.js'
import type { ApiErrorKind } from '../api/client.js'
import type { ChatModel, ImagePartData } from '../api/types.js'

/**
 * 消息附件。id 为本地标识；serverId 为后端 files 表主键（/api/files/upload 返回），
 * 发送前先上传拿 serverId，失败可重试。isImage 的附件以 R2 url 引用进入请求。
 */
export type FileAttachment = {
  id: string
  serverId: string | null
  name: string
  size: number
  /** 附件类别；图片走视觉/描述回退链路 */
  isImage: boolean
  /** 具体 MIME；无法识别的为空字符串，不影响图片身份。 */
  mimeType: string
  /** 本地预览（图片）；发送后以 serverId 换取后端 url */
  url?: string | null
  /** 文本类附件的内容（发送时随附件交给模型阅读，截断到上限） */
  textContent?: string
}

/** 本地消息的分支关系；字段缺省时按线性消息列表处理。 */
type MessageBranch = {
  parentId?: string | null
  /** 当前选中的下一条消息；切换版本时保留每条分支原有的选择。 */
  selectedChildId?: string
}

export type UserMessage = MessageBranch & {
  id: string
  role: 'user'
  content: string
  files: FileAttachment[]
  createdAt: number
}

/** 思考块：reasoning-delta 累积（后端 deep_think 开启时产出） */
export type ThinkingPart = {
  type: 'thinking'
  thinking: string
  /** content 块开始的时间；没有事件时间的历史块缺省 */
  startedAt?: number
  /** content 块结束（或回复结束）的时间 */
  endedAt?: number
  /** 仅有耗时、没有事件时间时保存秒数。 */
  elapsedSeconds?: number
}

/** 文本块：text-delta 累积 */
export type TextPart = {
  type: 'text'
  text: string
}

/** 生成图块：后端 data-image part（生图链路产出，存 R2 公开 url） */
export type ImagePart = {
  type: 'image'
  image: ImagePartData
}

export type ReplyBlock = ThinkingPart | TextPart | ImagePart

/**
 * pending：已发出请求，还没收到事件；streaming：正在接收；
 * done：收到 finish；stopped：用户停止或页面关闭；error：请求或流出错
 */
export type ReplyStatus = 'pending' | 'streaming' | 'done' | 'stopped' | 'error'

export type AssistantMessage = MessageBranch & {
  id: string
  role: 'assistant'
  createdAt: number
  /** 后端 start chunk 的 messageId（与 D1 主键一致）；未同步前为本地生成值 */
  model: ChatModel | null
  /** 请求时是否开启深度思考 */
  thinking?: boolean
  /** 是否允许作为续写前缀；仍需满足回复状态与内容限制。 */
  prefix: boolean
  status: ReplyStatus
  /** 可识别的内容块按接收顺序排列；续写产生的块追加在已有块之后 */
  blocks: ReplyBlock[]
  /** 路由信息（后端 start chunk messageMetadata.route） */
  route?: { intent?: string; reason?: string; confidence?: number }
  stopReason?: 'end_turn' | 'max_tokens' | 'aborted' | 'interrupted'
  /** 最近一次请求的用量，续写后更新 */
  usage?: { input: number; output: number }
  error?: {
    kind: ApiErrorKind | 'upload'
    message: string
    status?: number
    localMessage?: TranslationMessage
    /** 仅 upload：重新上传是否可能成功 */
    retryable?: boolean
  }
}

export type Message = UserMessage | AssistantMessage

export type Session = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  /** 包含所有分支的消息，按创建顺序存储。 */
  messages: Message[]
  /** undefined 表示线性消息列表；null 表示空会话。 */
  rootMessageId?: string | null
}

/** 会话列表元数据；消息只在打开会话时加载。 */
export type SessionSummary = Pick<Session, 'id' | 'title' | 'createdAt' | 'updatedAt'>

/** 显式提取字段，避免将完整会话的消息带进列表。 */
export const toSessionSummary = (session: SessionSummary): SessionSummary => ({
  id: session.id,
  title: session.title,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
})
