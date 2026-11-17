// ============================================
// 会话持久层（本项目 Cloudflare Workers D1 REST）
// 替换 DeepSeek 版 IndexedDB：
// - loadSessionSummaries → GET /api/chat/conversations
// - loadSession          → GET /api/chat/conversations/:id/messages
// - saveSession          → 后端流式 onEnd 自动持久化（前端无需写回）
// - renameSession        → PATCH /api/chat/conversations/:id
// - deleteSession        → DELETE /api/chat/conversations/:id
// - uploadFile           → POST /api/files/upload（R2）
// 文件原件（本地 blob）仍存 IndexedDB：缩略图展示、上传队列重试
// ============================================

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { getJson, request } from '../api/client.js'
import type { MessageRow, UploadedFile } from '../api/types.js'
import { toSessionSummary, type Message, type Session, type SessionSummary } from './types.js'
import { applyEvent, getReplyText, settleReply } from './reply.js'
import { splitThinkingTags } from './thinkingSplit.js'
import { createId } from '../../utils/id.js'

/** IndexedDB 存储结构版本（仅本地附件原件缓存） */
const DB_VERSION = 1

/** 文件原件按附件的本地 id 存储 */
export type StoredFile = {
  id: string
  blob: Blob
}

interface ChatDB extends DBSchema {
  files: { key: string; value: StoredFile }
}

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null

const getDB = () =>
  (dbPromise ??= openDB<ChatDB>('ai-chat-attachments', DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' })
      }
    },
  }).catch((error: unknown) => {
    dbPromise = null
    throw error
  }))

export const loadFile = async (id: string): Promise<Blob | undefined> =>
  (await (await getDB()).get('files', id))?.blob

export const saveFile = async (id: string, blob: Blob): Promise<void> => {
  await (await getDB()).put('files', { id, blob })
}

export const deleteFile = async (id: string): Promise<void> => {
  await (await getDB()).delete('files', id)
}

export const reportStorageError =
  (operation: string) =>
  (error: unknown): void => {
    console.error(`[storage] ${operation} failed:`, error)
  }

// ============================================
// REST 持久层
// ============================================

const toDate = (value: string): number => {
  const time = Date.parse(value)
  return Number.isNaN(time) ? Date.now() : time
}

/** GET /api/chat/conversations → 会话摘要列表（按 updated_at 降序由后端保证） */
export const loadSessionSummaries = async (): Promise<SessionSummary[]> => {
  const rows = await getJson<
    Array<{ id: string; title: string; created_at: string; updated_at: string }>
  >('/api/chat/conversations')
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }))
}

/** D1 消息行 → 本地 Message（附件/生成图/思考块重建） */
const rowToMessage = (row: MessageRow): Message => {
  const metadata = row.metadata || {}
  const attachments = metadata.attachments ?? []
  const generatedImages = attachments.filter((a) => a.type === 'generated_image')

  if (row.role === 'user') {
    // 上传附件（后端 metadata.attachments 中 type=image/document 的行）
    const uploadAttachments = attachments
      .filter((a) => a.type === 'image' || a.type === 'document')
      .map((a) => ({
        id: a.url,
        serverId: a.url,
        name: a.name ?? a.type,
        size: 0,
        isImage: a.type === 'image',
        mimeType: a.type === 'image' ? 'image/*' : '',
        url: a.url,
      }))
    return {
      id: row.id,
      role: 'user',
      content: row.content,
      createdAt: toDate(row.created_at),
      files: uploadAttachments,
    }
  }

  // assistant：文本 + 生成图块（+ 可选思考块）
  const blocks: Array<
    | { type: 'text'; text: string }
    | { type: 'thinking'; thinking: string }
    | { type: 'image'; image: { url: string; model?: string } }
  > = []
  const text = row.content || ''
  if (text) {
    // DeepSeek R1 类模型把思考内容以  标签混在正文里，历史加载时同样拆分
    for (const seg of splitThinkingTags(text)) {
      if (seg.kind === 'text') {
        blocks.push({ type: 'text', text: seg.value })
      } else {
        blocks.push({ type: 'thinking', thinking: seg.value })
      }
    }
  }
  for (const img of generatedImages) {
    blocks.push({ type: 'image', image: { url: img.url, model: img.model } })
  }
  const thinking = (metadata as any).thinking
  if (typeof thinking === 'string' && thinking) {
    blocks.unshift({ type: 'thinking', thinking })
  }
  return {
    id: row.id,
    role: 'assistant',
    createdAt: toDate(row.created_at),
    model: metadata.model ?? null,
    route: metadata.route,
    prefix: true,
    status: metadata.stopped ? 'stopped' : 'done',
    blocks,
    ...(metadata.tokens ? { usage: { input: metadata.tokens.input ?? 0, output: metadata.tokens.output ?? 0 } } : {}),
  }
}

/** GET /api/chat/conversations/:id/messages → 完整会话（重建分支线性列表） */
export const loadSession = async (id: string): Promise<Session | undefined> => {
  const rows = await getJson<MessageRow[]>(
    `/api/chat/conversations/${encodeURIComponent(id)}/messages`
  )
  // 会话标题从摘要行取不到，用占位（列表切换时由 store 以摘要覆盖）
  const messages = rows.map(rowToMessage)
  // 后端为线性消息流；rootMessageId 留 undefined 交给 normalizeSession
  // 构建单分支链（parentId/selectedChildId），getVisibleMessages 才能从根走通
  const session: Session = {
    id,
    title: '',
    createdAt: messages.length > 0 ? messages[0].createdAt : Date.now(),
    updatedAt: messages.length > 0 ? messages[messages.length - 1].createdAt : Date.now(),
    messages,
  }
  return session
}

/** PATCH /api/chat/conversations/:id（重命名） */
export const renameSession = async (id: string, title: string): Promise<void> => {
  await request(`/api/chat/conversations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

/** DELETE /api/chat/conversations/:id（级联删除消息与 R2 附件，后端负责） */
export const deleteSession = async (id: string): Promise<void> => {
  await request(`/api/chat/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** PUT /api/chat/conversations/:cid/messages/:mid（编辑提问；后端按 rowid 截断后续消息） */
export const editMessage = async (
  conversationId: string,
  messageId: string,
  content: string
): Promise<void> => {
  await request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  )
}

/** POST /api/chat/conversations（创建空对话；实际由后端首次发送时隐式创建，此处保留兼容） */
export const createSession = async (title = '新对话'): Promise<string> => {
  const body = await requestJsonSuccess<{ id: string }>('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return body.id
}

const requestJsonSuccess = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await request(path, init)
  const body = (await response.json()) as { success: boolean; data?: T }
  if (!body.success || body.data === undefined) {
    throw new Error('Unexpected response shape')
  }
  return body.data
}

/** POST /api/files/upload（R2 上传；表单字段 file） */
export const uploadFile = async (file: File): Promise<UploadedFile> => {
  const form = new FormData()
  form.append('file', file)
  const response = await request('/api/files/upload', { method: 'POST', body: form })
  const body = (await response.json()) as { success: boolean; data?: UploadedFile }
  if (!body.success || !body.data) {
    throw new Error('Upload failed')
  }
  return body.data
}

// 重建工具引用（store 依赖）
export { applyEvent, getReplyText, settleReply, toSessionSummary, createId }
