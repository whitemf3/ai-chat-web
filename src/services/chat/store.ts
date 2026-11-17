import { create } from 'zustand'
import { createId } from '../../utils/id.js'
import { ApiError, streamMessage } from '../api/client.js'
import type { UIStreamEvent } from '../api/types.js'
import { getTypingDelay } from '../config.js'
import * as db from './db.js'
import {
  clearDraft,
  clearSentDraft,
  getDraft,
  prepareDraftMessage,
} from './drafts.js'
import { useUploads, uploadAttachment } from '../attachments.js'
import { useSettings } from '../settings.js'
import { appendBranch, getVisibleMessages, normalizeSession, selectVersion } from './branches.js'
import {
  applyEvent,
  canContinueReply,
  settleReply,
  toRequestMessages,
} from './reply.js'
import { createThinkingSplitState } from './thinkingSplit.js'
import {
  toSessionSummary,
  type AssistantMessage,
  type FileAttachment,
  type Message,
  type Session,
  type SessionSummary,
  type UserMessage,
} from './types.js'

/** 会话在内存中的保留数量；详情按访问淘汰，列表始终来自后端 */
const SESSION_CACHE_LIMIT = 5

type ChatState = {
  ready: boolean
  initError: boolean
  importingHistory: boolean
  /** 仅列表元数据，按 updatedAt 降序；流式消息更新不会改变此数组。 */
  sessions: SessionSummary[]
  sessionCache: Record<string, Session>
  sessionLoadErrors: Record<string, boolean>
  sessionSaveErrors: Record<string, boolean>
  /** null 表示新对话（欢迎页） */
  activeId: string | null
  /** 正在生成回复的会话 */
  streaming: Record<string, AbortController>
}

export const useChatStore = create<ChatState>(() => ({
  ready: false,
  initError: false,
  importingHistory: false,
  sessions: [],
  sessionCache: {},
  sessionLoadErrors: {},
  sessionSaveErrors: {},
  activeId: null,
  streaming: {},
}))

const { getState: get, setState: set } = useChatStore

const sortSessions = (sessions: SessionSummary[]) =>
  [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

const getSession = (id: string) => {
  const cache = get().sessionCache
  return Object.hasOwn(cache, id) ? cache[id] : undefined
}

const getStreamController = (id: string) => {
  const streams = get().streaming
  return Object.hasOwn(streams, id) ? streams[id] : undefined
}

const sameSummary = (a: SessionSummary, b: SessionSummary) =>
  a.title === b.title && a.createdAt === b.createdAt && a.updatedAt === b.updatedAt

const sessionAccess = new Map<string, number>()
/** 尚未在后端创建 conversation 的本地乐观会话（临时 ID） */
const unsavedSessions = new Set<string>()
const deletingSessions = new Set<string>()
const deletionTasks = new Set<Promise<boolean>>()
const streamFlushes = new Map<string, () => void>()
let accessSequence = 0
let initTask: Promise<void> | undefined
const sessionLoads = new Map<string, { promise: Promise<void> }>()

const touchSession = (id: string) => sessionAccess.set(id, ++accessSequence)

const trimSessionCache = () => {
  const state = get()
  const ids = Object.keys(state.sessionCache)
  if (ids.length <= SESSION_CACHE_LIMIT) {
    return
  }
  const removable = ids
    .filter(
      (id) =>
        id !== state.activeId &&
        !Object.hasOwn(state.streaming, id) &&
        !deletingSessions.has(id)
    )
    .sort((a, b) => (sessionAccess.get(a) ?? 0) - (sessionAccess.get(b) ?? 0))
  const evicted = new Set(removable.slice(0, ids.length - SESSION_CACHE_LIMIT))
  for (const id of evicted) {
    sessionAccess.delete(id)
  }
  if (evicted.size > 0) {
    set({
      sessionCache: Object.fromEntries(
        Object.entries(state.sessionCache).filter(([id]) => !evicted.has(id))
      ),
    })
  }
}

const updateSession = (id: string, update: (session: Session) => Session) =>
  set((state) => {
    const previous = Object.hasOwn(state.sessionCache, id) ? state.sessionCache[id] : undefined
    if (!previous) {
      return state
    }
    const session = update(previous)
    if (session === previous) {
      return state
    }
    return {
      sessionCache: { ...state.sessionCache, [id]: session },
      sessions: sameSummary(toSessionSummary(previous), toSessionSummary(session))
        ? state.sessions
        : sortSessions(
            state.sessions.map((summary) =>
              summary.id === id ? toSessionSummary(session) : summary
            )
          ),
    }
  })

const updateReply = (sessionId: string, reply: AssistantMessage) =>
  updateSession(sessionId, (session) => ({
    ...session,
    messages: session.messages.map((message) =>
      message.id === reply.id
        ? { ...reply, parentId: message.parentId, selectedChildId: message.selectedChildId }
        : message
    ),
  }))

/** start 事件把本地临时 id 对齐为服务端 messageId：消息 id 与所有 selectedChildId/rootMessageId 引用必须同步改，否则消息链断裂、回复从可见路径消失 */
const renameMessage = (sessionId: string, oldId: string, newId: string) =>
  updateSession(sessionId, (session) => ({
    ...session,
    rootMessageId: session.rootMessageId === oldId ? newId : session.rootMessageId,
    messages: session.messages.map((message) => ({
      ...(message.id === oldId ? { ...message, id: newId } : message),
      ...(message.selectedChildId === oldId ? { selectedChildId: newId } : {}),
    })),
  }))

/** 本地临时会话 ID → 服务端 conversation ID 迁移：消息 parentId 保持不变，仅替换会话键 */
const updateReplyId = (newSessionId: string, oldSessionId: string) =>
  set((state) => {
    const previous = state.sessionCache[oldSessionId]
    if (!previous) {
      return state
    }
    const sessionCache = { ...state.sessionCache }
    delete sessionCache[oldSessionId]
    sessionCache[newSessionId] = { ...previous, id: newSessionId }
    return { sessionCache }
  })

/** 列表元数据同步（后端持久化时机与前端不同步，以本地为准乐观更新） */
const bumpSessionList = (sessionId: string, patch: Partial<SessionSummary>) =>
  set((state) => ({
    sessions: sortSessions(
      state.sessions.map((summary) =>
        summary.id === sessionId ? { ...summary, ...patch } : summary
      )
    ),
  }))

export const retrySaveSessions = () => {
  // REST 后端：保存失败重试 = 重新拉取列表
  void refreshSessions()
}

/** 离开前先合并尚未绘制的增量；隐藏期间浏览器可能暂停动画帧。 */
export const bindChatPersistence = () => {
  const save = () => {
    for (const [, flush] of streamFlushes) {
      flush()
    }
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      save()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', save)
  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', save)
  }
}

/** 按当前开关创建回复 */
const createReply = (): AssistantMessage => {
  const { thinking } = useSettings.getState()
  return {
    id: createId(),
    role: 'assistant',
    createdAt: Date.now(),
    model: null,
    thinking,
    prefix: true,
    status: 'pending',
    blocks: [],
  }
}

/** 仍在生成中的回复（页面关闭或读取时未结束）按「已停止」处理 */
const settleInterrupted = (session: Session): Session => {
  if (
    !session.messages.some(
      (m) => m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
    )
  ) {
    return session
  }
  return {
    ...session,
    messages: session.messages.map((m) =>
      m.role === 'assistant' && (m.status === 'pending' || m.status === 'streaming')
        ? settleReply(m, 'stopped', session.updatedAt)
        : m
    ),
  }
}

/** 重新拉取会话列表 */
const refreshSessions = (): Promise<void> => {
  const task = (async () => {
    const summaries = await db.loadSessionSummaries()
    set({ ready: true, sessions: sortSessions(summaries), initError: false })
  })()
  task.catch(() => {
    set({ initError: true })
  })
  return task
}

export const initChat = (): Promise<void> => {
  if (get().ready) {
    return Promise.resolve()
  }
  if (initTask) {
    return initTask
  }
  set({ initError: false })
  initTask = refreshSessions().finally(() => {
    initTask = undefined
  })
  return initTask
}

/** 同一会话合并并发读取；切换只改变 activeId，旧请求不会把界面切回去。 */
const ensureSessionLoaded = (id: string): Promise<void> => {
  if (getSession(id)) {
    return Promise.resolve()
  }
  const pending = sessionLoads.get(id)
  if (pending) {
    return pending.promise
  }
  const load = { promise: Promise.resolve() }
  sessionLoads.set(id, load)
  load.promise = (async () => {
    try {
      const stored = await db.loadSession(id)
      if (sessionLoads.get(id) !== load) {
        return
      }
      const summary = get().sessions.find((session) => session.id === id)
      if (!summary) {
        return
      }
      if (!stored) {
        throw new Error(`Session ${id} is missing from backend`)
      }
      const settled = settleInterrupted(normalizeSession(stored))
      // 读取期间可能已在列表重命名，保留最新元数据
      const session = sameSummary(settled, summary) ? settled : { ...settled, ...summary }
      touchSession(id)
      set((state) => ({ sessionCache: { ...state.sessionCache, [id]: session } }))
      trimSessionCache()
    } catch (error) {
      if (sessionLoads.get(id) === load) {
        set((state) => ({ sessionLoadErrors: { ...state.sessionLoadErrors, [id]: true } }))
        db.reportStorageError('read session')(error)
      }
    } finally {
      if (sessionLoads.get(id) === load) {
        sessionLoads.delete(id)
      }
    }
  })()
  return load.promise
}

/** 等所有回复的收尾完成 */
const waitForIdle = (sessionId?: string) =>
  new Promise<void>((resolve) => {
    const isIdle = (state: ChatState) =>
      sessionId === undefined
        ? Object.keys(state.streaming).length === 0
        : !Object.hasOwn(state.streaming, sessionId)
    if (isIdle(get())) {
      resolve()
      return
    }
    const unsubscribe = useChatStore.subscribe((state) => {
      if (isIdle(state)) {
        unsubscribe()
        resolve()
      }
    })
  })

export const newChat = () => {
  if (!get().importingHistory) {
    set({ activeId: null })
    trimSessionCache()
  }
}

export const selectSession = (id: string) => {
  if (!get().importingHistory && get().sessions.some((session) => session.id === id)) {
    touchSession(id)
    set({ activeId: id })
    void ensureSessionLoaded(id)
    trimSessionCache()
  }
}

export const renameSession = (id: string, title: string) => {
  if (get().importingHistory || deletingSessions.has(id)) {
    return
  }
  const trimmed = title.trim()
  if (!trimmed) {
    return
  }
  if (getSession(id)) {
    updateSession(id, (session) => ({ ...session, title: trimmed }))
  }
  bumpSessionList(id, { title: trimmed })
  void db.renameSession(id, trimmed).catch((error: unknown) => {
    db.reportStorageError('rename session')(error)
    // 失败时回滚列表显示
    void refreshSessions()
  })
}

/** 删除会话；后端级联删除消息与 R2 附件 */
export const removeSession = (id: string): Promise<boolean> => {
  const task = removeSessionData(id).finally(() => deletionTasks.delete(task))
  deletionTasks.add(task)
  return task
}

const removeSessionData = async (id: string): Promise<boolean> => {
  if (get().importingHistory || deletingSessions.has(id)) {
    return false
  }
  deletingSessions.add(id)
  try {
    getStreamController(id)?.abort()
    await waitForIdle(id)
    await db.deleteSession(id)
    sessionLoads.delete(id)
    sessionAccess.delete(id)
    clearDraft(id)
    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== id),
      sessionCache: Object.fromEntries(
        Object.entries(state.sessionCache).filter(([key]) => key !== id)
      ),
      sessionLoadErrors: Object.fromEntries(
        Object.entries(state.sessionLoadErrors).filter(([key]) => key !== id)
      ),
      sessionSaveErrors: Object.fromEntries(
        Object.entries(state.sessionSaveErrors).filter(([key]) => key !== id)
      ),
      activeId: state.activeId === id ? null : state.activeId,
    }))
    return true
  } catch (error) {
    db.reportStorageError('delete session')(error)
    return false
  } finally {
    deletingSessions.delete(id)
  }
}

export const stopReply = (sessionId: string) => getStreamController(sessionId)?.abort()

/**
 * 提交指定会话的最新草稿；null 表示新建会话。
 * 发送时后端隐式持有会话（首次发送前由前端先建 conversation）。
 */
export const sendMessage = (targetSessionId: string | null) => {
  if (get().importingHistory || !get().ready) {
    return false
  }
  const prepared = prepareDraftMessage(getDraft(targetSessionId), useUploads.getState().tasks)
  if (!prepared) {
    return false
  }
  const { text, files } = prepared
  const now = Date.now()
  let sessionId = targetSessionId
  if (
    sessionId !== null &&
    (deletingSessions.has(sessionId) || getStreamController(sessionId) || !getSession(sessionId))
  ) {
    return false
  }
  if (sessionId === null) {
    // 新对话：先乐观展示（本地临时 ID 标记为未同步），conversation 由 streamReply 前置创建并映射
    const session: Session = {
      id: createId(),
      title: '',
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    sessionId = session.id
    unsavedSessions.add(session.id)
    touchSession(session.id)
    set((state) => ({
      sessions: [toSessionSummary(session), ...state.sessions],
      sessionCache: { ...state.sessionCache, [session.id]: session },
      activeId: session.id,
    }))
  }
  const current = getSession(sessionId)
  if (!current) {
    return false
  }
  const history = getVisibleMessages(current)
  const question: UserMessage = {
    id: createId(),
    role: 'user',
    content: text,
    files: files.map(({ id, serverId, name, size, isImage, mimeType, url, textContent }) => ({
      id,
      serverId,
      name,
      size,
      isImage,
      mimeType,
      url,
      ...(textContent ? { textContent } : {}),
    })),
    createdAt: now,
  }
  const reply = createReply()
  updateSession(sessionId, (session) => ({
    ...appendBranch(session, history.at(-1)?.id ?? null, [question, reply]),
    updatedAt: now,
  }))
  bumpSessionList(sessionId, { updatedAt: now })
  clearSentDraft(targetSessionId)
  void streamReply(sessionId, reply, { history, question })
  return true
}

/** 重新生成当前路径上的回答：在原问题下新增版本 */
export const regenerateReply = (sessionId: string, messageId?: string) => {
  if (get().importingHistory || deletingSessions.has(sessionId)) {
    return
  }
  const session = getSession(sessionId)
  if (!session || getStreamController(sessionId)) {
    return
  }
  const path = getVisibleMessages(session)
  const index =
    messageId === undefined ? path.length - 1 : path.findIndex((m) => m.id === messageId)
  const question = path[index - 1]
  if (question?.role !== 'user' || path[index]?.role !== 'assistant') {
    return
  }
  const history = path.slice(0, index - 1)
  const reply = createReply()
  updateSession(sessionId, (s) => ({
    ...appendBranch(s, question.id, [reply]),
    updatedAt: Date.now(),
  }))
  void streamReply(sessionId, reply, { history, question })
}

/** 编辑提问后新增同父版本，保留原文件 */
export const editMessage = (sessionId: string, messageId: string, content: string): boolean => {
  if (get().importingHistory || deletingSessions.has(sessionId)) {
    return false
  }
  const session = getSession(sessionId)
  if (!session || getStreamController(sessionId)) {
    return false
  }
  const path = getVisibleMessages(session)
  const index = path.findIndex((message) => message.id === messageId)
  const previous = path[index]
  const text = content.trim()
  if (previous?.role !== 'user' || (!text && previous.files.length === 0)) {
    return false
  }
  // 后端契约：编辑会截断该消息之后的所有消息（PUT + rowid 截断），本地镜像截断
  const question: UserMessage = {
    id: createId(),
    role: 'user',
    content: text,
    files: previous.files,
    createdAt: Date.now(),
  }
  const reply = createReply()
  const truncated = path.slice(0, index)
  updateSession(sessionId, (s) => ({
    ...appendBranch(s, truncated.at(-1)?.id ?? null, [question, reply]),
    updatedAt: Date.now(),
  }))
  // 服务端同步：PUT 编辑 + 截断（编辑后旧行已在服务端被删除）
  void db.editMessage(sessionId, previous.id, text)
  void streamReply(sessionId, reply, { history: truncated, question })
  return true
}

export const selectMessageVersion = (sessionId: string, messageId: string) => {
  if (get().importingHistory || deletingSessions.has(sessionId)) {
    return
  }
  if (getStreamController(sessionId)) {
    return
  }
  updateSession(sessionId, (session) => selectVersion(session, messageId))
}

/** 继续最后一条未完成的回答 */
export const continueReply = (sessionId: string, messageId: string) => {
  if (get().importingHistory || deletingSessions.has(sessionId)) {
    return
  }
  const session = getSession(sessionId)
  if (!session || getStreamController(sessionId)) {
    return
  }
  const path = getVisibleMessages(session)
  const question = path.at(-2)
  const previous = path.at(-1)
  if (
    question?.role !== 'user' ||
    previous?.role !== 'assistant' ||
    previous.id !== messageId ||
    !canContinueReply(previous)
  ) {
    return
  }
  const { thinking } = useSettings.getState()
  const reply: AssistantMessage = {
    ...previous,
    thinking: previous.thinking ?? thinking,
    status: 'pending',
    error: undefined,
  }
  updateReply(sessionId, reply)
  updateSession(sessionId, (s) => ({ ...s, updatedAt: Date.now() }))
  void streamReply(sessionId, reply, { history: path.slice(0, -2), question, prefix: previous })
}

/** 附件补传失败后重试 */
export const retryUpload = (sessionId: string, messageId: string) => {
  if (get().importingHistory || deletingSessions.has(sessionId)) {
    return
  }
  const session = getSession(sessionId)
  if (!session || getStreamController(sessionId)) {
    return
  }
  const path = getVisibleMessages(session)
  const index = path.findIndex((message) => message.id === messageId)
  const question = path[index - 1]
  const previous = path[index]
  if (
    question?.role !== 'user' ||
    previous?.role !== 'assistant' ||
    previous.error?.kind !== 'upload'
  ) {
    return
  }
  const reply: AssistantMessage = { ...previous, status: 'pending', error: undefined }
  updateReply(sessionId, reply)
  void streamReply(sessionId, reply, { history: path.slice(0, index - 1), question })
}

type Request = { history: Message[]; question: UserMessage; prefix?: AssistantMessage }

/** 把上传得到的 serverId/url 写回会话里所有引用同一附件的消息 */
const saveServerIds = (sessionId: string, updates: Map<string, { serverId: string; url: string }>) => {
  if (updates.size === 0) {
    return
  }
  updateSession(sessionId, (session) => ({
    ...session,
    messages: session.messages.map((message) =>
      message.role === 'user' && message.files.some((file) => updates.has(file.id))
        ? {
            ...message,
            files: message.files.map((file) =>
              updates.has(file.id)
                ? {
                    ...file,
                    serverId: updates.get(file.id)?.serverId ?? file.serverId,
                    url: updates.get(file.id)?.url ?? file.url,
                  }
                : file
            ),
          }
        : message
    ),
  }))
}

/**
 * 附件的 serverId：已有直接用；正在上传的等待同一任务；否则读取本地原件补传。
 */
const ensureServerId = async (file: FileAttachment): Promise<{ serverId: string; url: string } | null> => {
  if (file.serverId) {
    return { serverId: file.serverId, url: file.url ?? file.serverId }
  }
  const task = useUploads.getState().tasks[file.id]
  if (task?.status === 'done') {
    return { serverId: task.serverId, url: task.url }
  }
  const blob = await db.loadFile(file.id)
  if (!blob) {
    return null
  }
  return uploadAttachment(file.id, blob, file.name, file.isImage)
}

/**
 * 发送前补齐附件的 serverId。任一失败则整体失败。
 */
const prepareFiles = async (sessionId: string, request: Request, signal: AbortSignal) => {
  const updates = new Map<string, { serverId: string; url: string }>()
  const aborted = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
  const uploads = Promise.allSettled(
    request.question.files.map(async (file) => {
      const uploaded = await ensureServerId(file)
      if (uploaded) {
        updates.set(file.id, uploaded)
      }
    })
  )
  void uploads.then(() => {
    saveServerIds(sessionId, updates)
  })
  const results = await Promise.race([uploads, aborted])
  const failed = results.find((result) => result.status === 'rejected')
  if (failed) {
    throw failed.reason
  }
  // 用补齐后的会话重新取提问
  const session = getSession(sessionId)
  const resolve = <T extends Message>(message: T): T =>
    (session?.messages.find((m) => m.id === message.id) as T | undefined) ?? message
  return {
    history: request.history.map(resolve),
    question: resolve(request.question),
    prefix: request.prefix,
  }
}

/**
 * 请求并消费流：先建会话（新对话）→ 补齐附件 serverId → 发请求；
 * 流式增量按动画帧刷新内存；后端 onEnd 自动持久化，前端无需写回。
 */
const streamReply = async (sessionId: string, initial: AssistantMessage, request: Request) => {
  const controller = new AbortController()
  set((state) => ({ streaming: { ...state.streaming, [sessionId]: controller } }))
  let reply = initial
  let frame = 0
  const flush = () => {
    cancelAnimationFrame(frame)
    frame = 0
    updateReply(sessionId, reply)
  }
  streamFlushes.set(sessionId, flush)

  let serverIdAligned = false
  let conversationId = sessionId

  try {
    try {
      // 新对话（unsavedSessions 标记的本地临时 ID）：先在后端创建 conversation，
      // 再把本地乐观会话映射为服务端 ID（缓存/列表/streaming 全量对齐）
      if (unsavedSessions.has(sessionId)) {
        conversationId = await db.createSession()
        unsavedSessions.delete(sessionId)
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, id: conversationId } : s)),
          sessionCache: Object.fromEntries(
            Object.entries(state.sessionCache).map(([id, session]) =>
              id === sessionId ? [conversationId, { ...session, id: conversationId }] : [id, session]
            )
          ),
          activeId: state.activeId === sessionId ? conversationId : state.activeId,
          streaming: Object.fromEntries(
            Object.entries(state.streaming).map(([id, ctl]) =>
              id === sessionId ? [conversationId, ctl] : [id, ctl]
            )
          ),
        }))
        streamFlushes.set(conversationId, streamFlushes.get(sessionId)!)
        streamFlushes.delete(sessionId)
        // 回复消息也要迁移到新 ID 下
        updateReplyId(conversationId, sessionId)
        sessionId = conversationId
        request = { ...request }
      }
    } catch (error) {
      reply = settleReply(reply, 'error', Date.now(), {
        kind: 'http',
        message: error instanceof Error ? error.message : String(error),
      })
      flush()
      return
    }

    try {
      const prepared = await prepareFiles(sessionId, request, controller.signal)
      const messages = toRequestMessages(
        prepared.history,
        prepared.question,
        prepared.prefix
      )
      const { thinking } = useSettings.getState()
      const events = streamMessage(
        sessionId,
        {
          messages,
          deep_think: initial.thinking ?? thinking ?? false,
        },
        controller.signal
      )
      const blockIndexes = new Map<string, number>()
      const split = createThinkingSplitState()

      // 打字机效果：delta 事件进入队列，按后台「AI 打字效果延迟」逐字应用；延迟为 0 时直接透传
      const typingDelay = await getTypingDelay()
      const queue: UIStreamEvent[] = []
      let streamFinished = false
      let streamFailure: unknown = null

      const processEvent = (event: UIStreamEvent) => {
        if (event.type === 'start' && event.messageId && !serverIdAligned) {
          serverIdAligned = true
          const previousId = reply.id
          reply = { ...reply, id: event.messageId }
          renameMessage(sessionId, previousId, event.messageId)
        }
        reply = applyEvent(reply, event, Date.now(), blockIndexes, split)
        if (document.visibilityState === 'hidden') {
          flush()
        } else if (frame === 0) {
          frame = requestAnimationFrame(flush)
          // 后台标签页 rAF 可能被节流，用短超时兜底保证打字机持续推进
          setTimeout(() => {
            if (frame !== 0) {
              flush()
            }
          }, 100)
        }
      }

      const play = async () => {
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
        while (!streamFinished || queue.length > 0) {
          const event = queue.shift()
          if (!event) {
            await sleep(15)
            continue
          }
          if (typingDelay > 0 && (event.type === 'text-delta' || event.type === 'reasoning-delta')) {
            for (const char of event.delta) {
              if (controller.signal.aborted) {
                return
              }
              processEvent({ type: event.type, id: event.id, delta: char })
              await sleep(typingDelay)
            }
          } else {
            processEvent(event)
          }
        }
      }

      const read = async () => {
        try {
          for await (const event of events) {
            queue.push(event)
          }
        } catch (error) {
          streamFailure = error
        } finally {
          streamFinished = true
        }
      }

      await Promise.all([read(), play()])

      if (streamFailure) {
        throw streamFailure
      }
      reply = settleReply(reply, 'done', Date.now())
      // 乐观更新列表时间戳
      bumpSessionList(sessionId, { updatedAt: Date.now() })
      flush()
      void refreshSessions()
    } catch (error) {
      if (controller.signal.aborted) {
        reply = settleReply(reply, 'stopped', Date.now())
      } else if (error instanceof ApiError) {
        reply = settleReply(reply, 'error', Date.now(), {
          kind: error.kind,
          message: error.message,
          status: error.status,
          localMessage: error.localMessage,
        })
      } else {
        reply = settleReply(reply, 'error', Date.now(), {
          kind: 'protocol',
          message: error instanceof Error ? error.message : String(error),
        })
      }
      flush()
      void refreshSessions()
    }
  } finally {
    streamFlushes.delete(sessionId)
    streamFlushes.delete(conversationId)
    cancelAnimationFrame(frame)
    updateReply(sessionId, reply)
    set((state) => ({
      streaming: Object.fromEntries(
        Object.entries(state.streaming).filter(([id]) => id !== sessionId)
      ),
    }))
  }
}
