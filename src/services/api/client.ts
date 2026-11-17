// ============================================
// API 客户端（本项目 Cloudflare Workers 后端）
// - JWT Bearer 鉴权（token 存 localStorage）
// - SSE：ai@7 UIMessageStream 协议（与后端 createUIMessageStreamResponse 对接）
// - 401 时统一登出（清除 token 并跳转登录页）
// ============================================

import { translate, type TranslationMessage } from '../../i18n/index.js'
import { readServerSentEvents } from './sse.js'
import type { ApiErrorBody, UIStreamEvent } from './types.js'

/** 构建期注入的后端 API 地址（rspack DefinePlugin __API_ORIGIN__） */
export const API_ORIGIN = __API_ORIGIN__

const TOKEN_KEY = 'ai-chat:token'

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token: string | null) => {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      localStorage.setItem(TOKEN_KEY, token)
    }
  } catch {
    // 存储不可用时只在内存中生效
  }
}

/** 登出：清 token 并回到登录页 */
export const logout = () => {
  setToken(null)
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export type ApiErrorKind =
  /** 非 2xx 响应 */
  | 'http'
  /** 流中返回的 error 帧 */
  | 'stream'
  /** 请求没有到达服务端（断网、跨域被拦截等） */
  | 'network'
  /** 流在 finish 之前结束 */
  | 'interrupted'
  /** 响应不符合协议（如非 SSE 响应） */
  | 'protocol'

export class ApiError extends Error {
  readonly localMessage?: TranslationMessage

  constructor(
    readonly kind: ApiErrorKind,
    message: string | TranslationMessage,
    readonly status?: number
  ) {
    super(typeof message === 'string' ? message : translate(message.key, message.params))
    this.name = 'ApiError'
    this.localMessage = typeof message === 'string' ? undefined : message
  }
}

const isErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' &&
  value !== null &&
  'error' in value &&
  typeof (value as ApiErrorBody).error?.message === 'string'

const readErrorResponse = async (
  response: Response,
  kind: 'http' | 'protocol' = 'http',
  fallback = response.statusText
): Promise<ApiError> => {
  const text = await response.text().catch(() => '')
  let message = text || fallback
  try {
    const bodyJson: unknown = JSON.parse(text)
    if (isErrorBody(bodyJson)) {
      message = bodyJson.error.message
    }
  } catch {
    // 非 JSON 响应体直接展示原文
  }
  return new ApiError(kind, message, response.status)
}

/** 统一鉴权请求：401/403 时登出（banned/expired） */
export const request = async (path: string, init: RequestInit): Promise<Response> => {
  const token = getToken()
  let response: Response
  try {
    response = await fetch(
      path.startsWith('http') ? path : `${API_ORIGIN}${path}`,
      {
        ...init,
        headers: {
          ...init.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    )
  } catch (error) {
    if (init.signal?.aborted) {
      throw error
    }
    throw new ApiError('network', error instanceof Error ? error.message : String(error))
  }
  if (response.status === 401 || response.status === 403) {
    logout()
    throw await readErrorResponse(response)
  }
  if (!response.ok) {
    throw await readErrorResponse(response)
  }
  return response
}

/** JSON 请求快捷封装 */
export const requestJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await request(path, init)
  return (await response.json()) as T
}

/** GET JSON（带 success 信封拆包） */
export const getJson = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const body = await requestJson<{ success: true; data: T }>(path, { signal })
  return body.data
}

/**
 * POST 发送消息并消费 UIMessageStream SSE。
 * 后端契约：POST /api/chat/conversations/:id/messages
 * 载荷：{ messages: UIMessage[], deep_think: boolean, temperature?, max_tokens? }
 * 响应：data: {...UIMessageChunk}\n\n（keep-alive 心跳由 SDK 注释帧承担）
 */
export async function* streamMessage(
  conversationId: string,
  body: {
    messages: unknown[]
    deep_think: boolean
    temperature?: number
    max_tokens?: number
  },
  signal: AbortSignal
): AsyncGenerator<UIStreamEvent> {
  const response = await request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    }
  )

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!response.body || !contentType.includes('text/event-stream')) {
    throw await readErrorResponse(response, 'protocol', '')
  }

  let seenFinish = false
  for await (const { data } of readServerSentEvents(response.body, signal)) {
    let payload: unknown
    try {
      payload = JSON.parse(data)
    } catch {
      continue
    }
    const event = readUIStreamEvent(payload)
    if (event) {
      if (event.type === 'error') {
        throw new ApiError('stream', event.errorText)
      }
      if (event.type === 'finish') {
        seenFinish = true
        yield event
        return
      }
      yield event
    }
  }
  if (!seenFinish) {
    // 服务端没有提供错误内容时保持为空，不推测、不猜测
    throw new ApiError('interrupted', '')
  }
}

/** 解析 UIMessageChunk 帧（容忍未知 chunk 类型，跳过不产出） */
const readUIStreamEvent = (payload: unknown): UIStreamEvent | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null
  }
  const chunk = payload as Record<string, unknown>
  switch (chunk.type) {
    case 'start':
      return {
        type: 'start',
        messageId: typeof chunk.messageId === 'string' ? chunk.messageId : undefined,
        messageMetadata: (chunk.messageMetadata as Record<string, unknown>) || {},
      }
    case 'text-start':
    case 'text-end':
    case 'reasoning-start':
    case 'reasoning-end':
      return { type: chunk.type, id: String(chunk.id ?? '') }
    case 'text-delta':
    case 'reasoning-delta':
      return {
        type: chunk.type,
        id: String(chunk.id ?? ''),
        delta: String(chunk.delta ?? ''),
      }
    case 'data-image': {
      const data = chunk.data as { url?: string; model?: string } | undefined
      if (!data?.url) {
        return null
      }
      return {
        type: 'data-image',
        id: String(chunk.id ?? ''),
        data: { url: data.url, model: data.model },
      }
    }
    case 'error': {
      const errorText =
        typeof chunk.errorText === 'string'
          ? chunk.errorText
          : typeof (chunk.error as { message?: string } | undefined)?.message === 'string'
            ? (chunk.error as { message: string }).message
            : ''
      return {
        type: 'error',
        errorText,
      }
    }
    case 'finish':
      return {
        type: 'finish',
        messageMetadata: (chunk.messageMetadata as Record<string, unknown>) || {},
      }
    default:
      return null
  }
}
