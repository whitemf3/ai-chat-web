/**
 * DeepSeek R1 类模型的思考标签拆分：
 * Workers AI 不输出独立 reasoning 流，思考内容以 `...` 混在正文文本里。
 * 这里把文本增量拆成 text / thinking 两类片段，供渲染层分区展示。
 */

const OPEN = '<think>'
const CLOSE = '</think>'

export type SplitSegment = { kind: 'text' | 'thinking'; value: string }

/** 流式拆分状态：跨分片缓冲可能残缺的标签前缀 */
export type ThinkingSplitState = {
  inThinking: boolean
  pending: string
}

export const createThinkingSplitState = (): ThinkingSplitState => ({
  inThinking: false,
  pending: '',
})

/** 消费一段文本增量，返回可立即写入 blocks 的片段 */
export const pushThinkingDelta = (state: ThinkingSplitState, delta: string): SplitSegment[] => {
  let s = state.pending + delta
  state.pending = ''
  const segments: SplitSegment[] = []
  const emit = (kind: SplitSegment['kind'], value: string) => {
    if (value) {
      segments.push({ kind, value })
    }
  }
  for (;;) {
    if (state.inThinking) {
      const close = s.indexOf(CLOSE)
      if (close !== -1) {
        emit('thinking', s.slice(0, close))
        s = s.slice(close + CLOSE.length)
        state.inThinking = false
        continue
      }
      const keep = safePrefixLength(s, CLOSE)
      if (keep < s.length) {
        emit('thinking', s.slice(0, keep))
        s = s.slice(keep)
      }
      state.pending = s
      return segments
    }
    const open = s.indexOf(OPEN)
    if (open !== -1) {
      emit('text', s.slice(0, open))
      s = s.slice(open + OPEN.length)
      state.inThinking = true
      continue
    }
    const keep = safePrefixLength(s, OPEN)
    if (keep < s.length) {
      emit('text', s.slice(0, keep))
      s = s.slice(keep)
    }
    state.pending = s
    return segments
  }
}

/** text-end / 流结束时清空缓冲 */
export const flushThinkingSplit = (state: ThinkingSplitState): SplitSegment[] => {
  const rest = state.pending
  state.pending = ''
  return rest ? [{ kind: state.inThinking ? 'thinking' : 'text', value: rest }] : []
}

/** 历史整段文本一次性拆分（刷新后从服务端加载的消息） */
export const splitThinkingTags = (text: string): SplitSegment[] => {
  const state = createThinkingSplitState()
  return [...pushThinkingDelta(state, text), ...flushThinkingSplit(state)]
}

/** s 末尾可能是 tag 前缀的长度；返回可安全输出的长度（剩余部分继续缓冲） */
const safePrefixLength = (s: string, tag: string): number => {
  const max = Math.min(tag.length - 1, s.length)
  for (let len = max; len > 0; len--) {
    if (s.endsWith(tag.slice(0, len))) {
      return s.length - len
    }
  }
  return s.length
}