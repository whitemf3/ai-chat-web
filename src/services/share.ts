// ============================================
// 分享链接服务（对接现有后端 /api/share）
// ============================================

import { requestJson } from './api/client.js'

/** POST /api/share 创建分享链接（24 小时有效，与旧版一致） */
export const createShareLink = async (conversationId: string): Promise<string> => {
  const body = await requestJson<{ success: boolean; data?: { share_code: string } }>('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId }),
  })
  if (!body.success || !body.data) {
    throw new Error('创建分享链接失败')
  }
  const shareUrl = `${window.location.origin}/share/${body.data.share_code}`
  await navigator.clipboard.writeText(shareUrl)
  return shareUrl
}
