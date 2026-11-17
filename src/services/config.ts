import { getJson } from './api/client.js'

/** 打字效果延迟（毫秒），后台系统配置 typing_delay；0 表示禁用 */
let cachedDelay: number | null = null
let inflight: Promise<number> | null = null

/** 读取后台「AI 打字效果延迟」配置（内存缓存一次；失败按 0 处理，保证可用性） */
export const getTypingDelay = async (): Promise<number> => {
  if (cachedDelay !== null) {
    return cachedDelay
  }
  if (!inflight) {
    inflight = (async () => {
      try {
        const data = await getJson<{ typing_delay: number }>('/api/config/public')
        const delay = Number(data.typing_delay)
        cachedDelay = Number.isFinite(delay) && delay > 0 ? Math.round(delay) : 0
      } catch {
        cachedDelay = 0
      }
      return cachedDelay
    })()
  }
  return inflight
}