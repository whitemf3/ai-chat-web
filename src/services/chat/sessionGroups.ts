import type { TranslationKey, TranslationParams } from '../../i18n/index.js'
import type { SessionSummary } from './types.js'

/** 会话列表的时间分组：今天 / 昨天 / 本周 / 本月 / 更早 */
type SessionGroup = {
  key: string
  label: string
  sessions: SessionSummary[]
}

type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string

export const groupSessions = (
  sessions: SessionSummary[],
  now: number,
  t: TranslateFn
): SessionGroup[] => {
  const groups: SessionGroup[] = [
    { key: 'today', label: t('siderGroupToday'), sessions: [] },
    { key: 'yesterday', label: t('siderGroupYesterday'), sessions: [] },
    { key: 'thisWeek', label: t('siderGroupThisWeek'), sessions: [] },
    { key: 'thisMonth', label: t('siderGroupThisMonth'), sessions: [] },
    { key: 'earlier', label: t('siderGroupEarlier'), sessions: [] },
  ]
  const byKey = new Map(groups.map((group) => [group.key, group]))

  const current = new Date(now)
  const startOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate()).setHours(0, 0, 0, 0)
  const dayMs = 24 * 60 * 60 * 1000

  for (const session of sessions) {
    const time = session.updatedAt
    let key: string
    if (time >= startOfToday) {
      key = 'today'
    } else if (time >= startOfToday - dayMs) {
      key = 'yesterday'
    } else if (time >= startOfToday - 6 * dayMs) {
      key = 'thisWeek'
    } else if (time >= new Date(current.getFullYear(), current.getMonth(), 1).getTime()) {
      key = 'thisMonth'
    } else {
      key = 'earlier'
    }
    byKey.get(key)?.sessions.push(session)
  }

  return groups.filter((group) => group.sessions.length > 0)
}
