// ============================================
// API 协议类型（本项目 Cloudflare Workers 后端）
// 对接 ai@7 UIMessageStream（SSE）协议与现有 REST 契约
// ============================================

/** 本项目所有模型 ID 均为 Workers AI 形态（@cf/...）；路由由后端 Dispatcher 完成 */
export type ChatModel = string

/** UIMessageChunk（ai@7 SSE 帧子集，本项目后端实际产出） */
export type UIStreamEvent =
  | { type: 'start'; messageId?: string; messageMetadata?: Record<string, unknown> }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'text-end'; id: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'data-image'; id: string; data: { url: string; model?: string } }
  | { type: 'error'; errorText: string }
  | { type: 'finish'; finishReason?: string; messageMetadata?: Record<string, unknown> }

/** 文件上传响应（/api/files/upload，沿用现有契约） */
export type UploadedFile = {
  id: string
  filename: string
  url: string
  size: number
  mime_type: string
}

/** 生成图 data part 的载荷 */
export type ImagePartData = {
  url: string
  model?: string
}

/** 会话摘要（/api/chat/conversations 行） */
export type ConversationRow = {
  id: string
  title: string
  model: string
  created_at: string
  updated_at: string
}

/** 消息行（/api/chat/conversations/:id/messages 行） */
export type MessageRow = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  metadata: {
    model?: string
    deep_think?: boolean
    route?: { intent?: string; reason?: string; confidence?: number }
    attachments?: Array<{ type: string; url: string; model?: string; name?: string }>
    image_prompt?: string
    tokens?: { input?: number; output?: number }
    stopped?: boolean
    stopReason?: 'end_turn' | 'max_tokens' | 'aborted' | 'interrupted'
    branch?: { parentId: string | null; selectedChildId?: string; selectedRoot?: boolean }
  } | null
}

/** 错误响应体 */
export type ApiErrorBody = {
  success: false
  error: { code: string; message: string }
}
