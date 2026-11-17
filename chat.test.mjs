import { registerHooks, stripTypeScriptTypes } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { test } from 'node:test'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const url = new URL(specifier.slice(0, -3) + '.ts', context.parentURL)
      if (existsSync(url)) return nextResolve(url.href, context)
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform', sourceUrl: fileURLToPath(url) }) }
    }
    return nextLoad(url, context)
  },
})
globalThis.__API_ORIGIN__ = 'http://localhost'
const { canContinueReply, toRequestMessages, applyEvent } = await import('./src/services/chat/reply.ts')
const { normalizeSession, getVisibleMessages } = await import('./src/services/chat/branches.ts')
const { loadSession } = await import('./src/services/chat/db.ts')
const { streamMessage } = await import('./src/services/api/client.ts')
const { readServerSentEvents, StreamIdleTimeoutError } = await import('./src/services/api/sse.ts')
const { ServerSentEventDecoder } = await import('./src/services/api/sse.ts')

const question = { id: 'q1', role: 'user', content: 'snake', files: [], createdAt: 1, parentId: null }
const reply = { id: 'a1', role: 'assistant', blocks: [{ type: 'text', text: 'partial' }], model: null, status: 'stopped', prefix: true, createdAt: 2, parentId: 'q1' }
const sse = (events) => new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } })

test('request context retains user and assistant identities', () => {
  const messages = toRequestMessages([question, { ...reply, status: 'done' }], { ...question, id: 'q2' })
  assert.deepEqual(messages.map(message => message.id), ['q1', 'a1', 'q2'])
})

test('continue is available only for interrupted text', () => {
  assert.equal(canContinueReply(reply), true)
  assert.equal(canContinueReply({ ...reply, status: 'done' }), false)
  assert.equal(canContinueReply({ ...reply, blocks: [] }), false)
  assert.equal(canContinueReply({ ...reply, status: 'error', error: { kind: 'interrupted', message: '' } }), true)
  assert.equal(canContinueReply({ ...reply, status: 'error', error: { kind: 'http', status: 429, message: 'quota' } }), false)
  assert.equal(canContinueReply({ ...reply, blocks: [{ type: 'image', image: { url: '/image' } }] }), false)
})

test('finish reason length is not a normal end turn', () => {
  const result = applyEvent(reply, { type: 'finish', finishReason: 'length' }, Date.now(), new Map())
  assert.equal(result.stopReason, 'max_tokens')
})

test('reload restores selected siblings rather than a linear transcript', async () => {
  globalThis.fetch = async () => Response.json({ success: true, data: [
    { id: 'q1', role: 'user', content: 'snake', created_at: '2026-11-17 00:00:00', metadata: { branch: { parentId: null, selectedChildId: 'a2', selectedRoot: true } } },
    { id: 'a1', role: 'assistant', content: 'first', created_at: '2026-11-17 00:00:01', metadata: { branch: { parentId: 'q1' } } },
    { id: 'a2', role: 'assistant', content: 'second', created_at: '2026-11-17 00:00:02', metadata: { branch: { parentId: 'q1' } } },
  ] })
  assert.deepEqual(getVisibleMessages(normalizeSession(await loadSession('s'))).map(message => message.id), ['q1', 'a2'])
})

test('stream preserves finish reason', async () => {
  globalThis.fetch = async () => sse([{ type: 'finish', finishReason: 'length' }])
  const events = []
  for await (const event of streamMessage('s', { messages: [], deep_think: false }, new AbortController().signal)) events.push(event)
  assert.equal(events.at(-1).finishReason, 'length')
})

test('EOF without finish remains interrupted', async () => {
  globalThis.fetch = async () => sse([{ type: 'text-start', id: 't' }, { type: 'text-delta', id: 't', delta: 'partial' }])
  await assert.rejects(async () => {
    for await (const event of streamMessage('s', { messages: [], deep_think: false }, new AbortController().signal)) void event
  }, error => error.kind === 'interrupted')
})

test('SSE silent idle timeout releases the stream', async () => {
  let cancelled = false
  const stream = new ReadableStream({ cancel() { cancelled = true } })
  await assert.rejects(async () => {
    for await (const event of readServerSentEvents(stream, undefined, 20)) void event
  }, StreamIdleTimeoutError)
  assert.equal(cancelled, true)
})

test('SSE parser tolerates split CRLF and ignores heartbeat comments', () => {
  const decoder = new ServerSentEventDecoder()
  assert.deepEqual(decoder.push(': heartbeat\r'), [])
  assert.deepEqual(decoder.push('\n\r\ndata: {"ok":true}\r'), [])
  const events = decoder.push('\n\r\n')
  assert.equal(events.length, 1)
  assert.equal(events[0].data, '{"ok":true}')
})

globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.cancelAnimationFrame = clearTimeout
const store = await import('./src/services/chat/store.ts')
const initialSession = () => ({
  id: 's', title: 'test', createdAt: 1, updatedAt: 2, rootMessageId: 'q1',
  messages: [{ ...question, selectedChildId: 'a1' }, { ...reply, status: 'done' }],
})
const waitFor = (predicate) => new Promise((resolve, reject) => {
  if (predicate(store.useChatStore.getState())) return resolve()
  const timer = setTimeout(() => { unsubscribe(); reject(new Error('store test timed out')) }, 3000)
  const unsubscribe = store.useChatStore.subscribe(state => {
    if (predicate(state)) { clearTimeout(timer); unsubscribe(); resolve() }
  })
})
const idle = () => waitFor(state => !state.streaming.s)
function setupStore({ stopped = false, text = 'suffix', reason = 'stop', error = false } = {}) {
  const session = initialSession()
  if (stopped) session.messages[1].status = 'stopped'
  store.useChatStore.setState({ ready: true, sessions: [{ id: 's', title: 'test', createdAt: 1, updatedAt: 2 }], sessionCache: { s: session }, activeId: 's', streaming: {}, sessionSaveErrors: {} })
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname
    const body = init.body ? JSON.parse(init.body) : null
    calls.push({ path, body, method: init.method })
    if (path === '/api/config/public') return Response.json({ success: true, data: { typing_delay: 2 } })
    if (path === '/api/chat/conversations') return Response.json({ success: true, data: [{ id: 's', title: 'test', created_at: '2026-11-17', updated_at: '2026-11-17' }] })
    if (path.endsWith('/save') || path.endsWith('/branch')) return Response.json({ success: true, data: { saved: true } })
    const id = body.assistant_message_id
    return sse([
      { type: 'start', messageId: id }, { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', delta: text }, { type: 'text-end', id: 't' },
      error ? { type: 'error', errorText: 'test interruption' } : { type: 'finish', finishReason: reason },
    ])
  }
  return calls
}
const visible = () => getVisibleMessages(store.useChatStore.getState().sessionCache.s)

test('store regenerate uses generate endpoint and keeps original user and old reply', async () => {
  const calls = setupStore()
  store.regenerateReply('s', 'a1')
  await idle()
  const call = calls.find(call => call.path.endsWith('/generate'))
  assert.equal(call.body.message_id, 'q1')
  assert.equal(store.useChatStore.getState().sessionCache.s.messages.length, 3)
  assert.equal(visible().length, 2)
  assert.equal(visible()[1].status, 'done')
  assert.equal(calls.some(call => call.path.endsWith('/messages')), false)
})

test('store continue appends to the same answer without creating a question', async () => {
  const calls = setupStore({ stopped: true })
  store.continueReply('s', 'a1')
  await idle()
  const call = calls.find(call => call.path.endsWith('/continue'))
  assert.equal(call.body.message_id, 'a1')
  assert.equal(call.body.existing_content, 'partial')
  assert.equal(visible()[1].id, 'a1')
  assert.equal(visible()[1].blocks.map(block => block.text ?? '').join(''), 'partialsuffix')
  assert.equal(visible()[1].status, 'done')
  assert.equal(store.useChatStore.getState().sessionCache.s.messages.length, 2)
})

test('store edit creates a root sibling and never calls destructive PUT', async () => {
  const calls = setupStore()
  assert.equal(store.editMessage('s', 'q1', 'edited'), true)
  await idle()
  const call = calls.find(call => call.path.endsWith('/messages'))
  assert.equal(call.body.parent_id, null)
  assert.notEqual(call.body.messages.at(-1).id, 'q1')
  assert.equal(calls.some(call => call.method === 'PUT'), false)
  assert.equal(store.useChatStore.getState().sessionCache.s.messages.length, 4)
  assert.equal(visible()[0].content, 'edited')
})

test('store length limit stays resumable and normal stop does not', async () => {
  setupStore({ reason: 'length' })
  store.regenerateReply('s', 'a1')
  await idle()
  assert.equal(visible()[1].status, 'stopped')
  assert.equal(canContinueReply(visible()[1]), true)
})

test('stream failure saves displayed content before becoming idle', async () => {
  const calls = setupStore({ error: true })
  store.regenerateReply('s', 'a1')
  await idle()
  assert.equal(visible()[1].status, 'stopped')
  assert.equal(canContinueReply(visible()[1]), true)
  const saved = calls.find(call => call.path.endsWith('/save'))
  assert.equal(saved.body.content, 'suffix')
  assert.equal(saved.body.stop_reason, 'interrupted')
  assert.ok(saved.body.generation_id)
})

test('R1 code truncated at EOF is immediately resumable without reloading or repeating its prefix', async () => {
  const calls = setupStore()
  const fetch = globalThis.fetch
  const model = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
  const thinking = '先分析贪吃蛇的移动和碰撞检测。'
  const prefix = '```python\nif x1 == foodx and y1 == foody:\n    foodx = round(random.randrange(0, 800 - snake_block) / 20'
  const suffix = '.0) * 20.0\n```'
  globalThis.fetch = async (url, init) => {
    const path = new URL(url).pathname
    if (!path.endsWith('/generate') && !path.endsWith('/continue')) return fetch(url, init)
    const body = JSON.parse(init.body)
    calls.push({ path, body, method: init.method })
    const continuing = path.endsWith('/continue')
    return sse([
      { type: 'start', messageId: continuing ? body.message_id : body.assistant_message_id, messageMetadata: { model } },
      { type: 'text-start', id: 't' },
      ...((continuing ? [suffix] : ['<thi', `nk>${thinking}</thi`, `nk>${prefix}`]).map(delta => ({ type: 'text-delta', id: 't', delta }))),
      ...(continuing ? [{ type: 'text-end', id: 't' }, { type: 'finish', finishReason: 'stop' }] : []),
    ])
  }
  store.regenerateReply('s', 'a1')
  await idle()
  const interrupted = visible()[1]
  const textOf = message => message.blocks.filter(block => block.type === 'text').map(block => block.text).join('')
  assert.equal(interrupted.status, 'stopped')
  assert.equal(interrupted.stopReason, 'interrupted')
  assert.equal(interrupted.error.kind, 'interrupted')
  assert.equal(interrupted.error.localMessage.key, 'replyInterrupted')
  assert.equal(canContinueReply(interrupted), true)
  assert.equal(textOf(interrupted), prefix)
  assert.equal(interrupted.blocks.filter(block => block.type === 'thinking').map(block => block.thinking).join(''), thinking)
  const saved = calls.find(call => call.path.endsWith('/save'))
  assert.equal(saved.body.content, prefix)
  assert.equal(saved.body.stop_reason, 'interrupted')
  const count = store.useChatStore.getState().sessionCache.s.messages.length
  store.continueReply('s', interrupted.id)
  await idle()
  const continued = visible()[1]
  const request = calls.find(call => call.path.endsWith('/continue'))
  assert.equal(request.body.message_id, interrupted.id)
  assert.equal(request.body.existing_content, prefix)
  assert.equal(continued.id, interrupted.id)
  assert.equal(textOf(continued), prefix + suffix)
  assert.equal(continued.status, 'done')
  assert.equal(canContinueReply(continued), false)
  assert.equal(store.useChatStore.getState().sessionCache.s.messages.length, count)
})

test('stop during typewriter playback cannot be overwritten by a queued finish', async () => {
  const calls = setupStore({ text: 'abcdefghijklmnopqrstuvwxyz'.repeat(4) })
  store.regenerateReply('s', 'a1')
  await waitFor(() => visible()[1].blocks.some(block => block.type === 'text' && block.text.length >= 3))
  store.stopReply('s')
  await idle()
  assert.equal(visible()[1].status, 'stopped')
  assert.equal(canContinueReply(visible()[1]), true)
  const saved = calls.find(call => call.path.endsWith('/save'))
  assert.ok(saved.body.content.length >= 3 && saved.body.content.length < 104)
})

test('request timeout aborts a pending response without becoming a generation deadline', async () => {
  const { request } = await import('./src/services/api/client.ts')
  globalThis.fetch = (url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
  })
  await assert.rejects(request('/api/test', {}, 15), error => error.kind === 'network')
})

test('hidden pages drain long answers without waiting for per-character timers', async t => {
  const text = 'const snake = [];'.repeat(2000)
  setupStore({ text })
  document.visibilityState = 'hidden'
  t.after(() => { document.visibilityState = 'visible' })
  store.regenerateReply('s', 'a1')
  await idle()
  assert.equal(visible()[1].blocks.map(b => b.text ?? '').join(''), text)
  assert.equal(visible()[1].status, 'done')
})

test('abnormal finish drains queued text immediately even on a visible page', async () => {
  const text = 'interrupted code'.repeat(2000)
  setupStore({ text, error: true })
  store.regenerateReply('s', 'a1')
  await idle()
  assert.equal(visible()[1].blocks.map(b => b.text ?? '').join(''), text)
  assert.equal(visible()[1].status, 'stopped')
})

test('failed in-flight branch selection retains and retries the complete new question', async () => {
  const calls = setupStore()
  const { setDraftText } = await import('./src/services/chat/drafts.ts')
  const session = initialSession()
  session.messages.push({ ...reply, id: 'a2', status: 'done' })
  store.useChatStore.setState({ sessionCache: { s: session } })
  const fetch = globalThis.fetch
  let rejectBranch
  let firstBranch = true
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/branch') && firstBranch) {
      firstBranch = false
      return new Promise((resolve, reject) => { rejectBranch = reject })
    }
    return fetch(url, init)
  }
  store.selectMessageVersion('s', 'a2')
  setDraftText('s', 'question that must survive')
  assert.equal(store.sendMessage('s'), true)
  await new Promise(resolve => setImmediate(resolve))
  rejectBranch(new Error('branch offline'))
  await idle()
  const pendingId = visible().at(-2).id
  assert.equal(calls.some(c => c.path.endsWith('/messages')), false)
  assert.equal(store.useChatStore.getState().sessionSaveErrors.s, true)
  store.retrySaveSessions()
  await idle()
  const sent = calls.filter(c => c.path.endsWith('/messages'))
  assert.equal(sent.length, 1)
  assert.equal(sent[0].body.messages.at(-1).id, pendingId)
  assert.equal(sent[0].body.messages.at(-1).parts[0].text, 'question that must survive')
  assert.equal(visible().at(-1).status, 'done')
  assert.equal(store.useChatStore.getState().sessionSaveErrors.s, false)
})

test('failed saves for separate replies survive other successful saves and retry independently', async () => {
  const calls = setupStore({ error: true })
  const fetch = globalThis.fetch
  const failed = []
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/save') && failed.length < 2) {
      failed.push({ url, body: JSON.parse(init.body) })
      throw new Error('save offline')
    }
    return fetch(url, init)
  }
  for (let i = 0; i < 3; i++) {
    store.regenerateReply('s', visible().at(-1).id)
    await idle()
  }
  assert.equal(store.useChatStore.getState().sessionSaveErrors.s, true)
  store.retrySaveSessions()
  await waitFor(state => !state.sessionSaveErrors.s)
  for (const entry of failed) {
    const retry = calls.find(c => entry.url.endsWith(c.path) && c.body.generation_id === entry.body.generation_id)
    assert.ok(retry)
    assert.equal(retry.body.content, entry.body.content)
  }
})

test('a hanging partial save releases busy state after its deadline and remains retryable', async t => {
  setupStore({ error: true })
  const fetch = globalThis.fetch
  const originalTimeout = globalThis.setTimeout
  t.mock.method(globalThis, 'setTimeout', (fn, ms, ...args) => originalTimeout(fn, ms === 30_000 ? 15 : ms, ...args))
  globalThis.fetch = (url, init) => {
    if (url.endsWith('/save')) return new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })
    })
    return fetch(url, init)
  }
  store.regenerateReply('s', 'a1')
  await idle()
  assert.equal(store.useChatStore.getState().sessionSaveErrors.s, true)
  assert.equal(canContinueReply(visible()[1]), true)
  globalThis.fetch = fetch
  store.retrySaveSessions()
  await waitFor(state => !state.sessionSaveErrors.s)
})
