// ============================================
// 分享页（公开访问 /share/:code）
// 后端：GET /api/share/:share_code（无需认证）
// 渲染：只读对话（用户提问 + 回答 + 生成图）
// ============================================

import { useEffect, useState } from 'react'
import { API_ORIGIN } from '../services/api/client.js'
import type { MessageRow } from '../services/api/types.js'
import { Markdown } from '../components/markdown/Markdown.js'
import '../app/theme.css'
import '../app/global.css'
import styles from './SharePage.module.css'

type ShareData = {
  conversation: { title: string; created_at: string }
  messages: MessageRow[]
}

export const SharePage = () => {
  const [data, setData] = useState<ShareData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const code = window.location.pathname.split('/share/')[1]
    if (!code) {
      setError('分享链接无效')
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/share/${encodeURIComponent(code)}`)
        const body = (await res.json()) as {
          success: boolean
          error?: { message: string }
          data?: ShareData
        }
        if (!body.success || !body.data) {
          setError(body.error?.message ?? '分享链接无效或已过期')
          return
        }
        setData(body.data)
      } catch {
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className={styles.sharePage}>
        <div className={styles.shareLoading}>正在加载分享内容…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.sharePage}>
        <div className={styles.shareCard}>
          <div className={styles.shareError}>{error}</div>
        </div>
      </div>
    )
  }

  const messages = data?.messages ?? []
  return (
    <div className={styles.sharePage}>
      <div className={styles.shareCard}>
        <div className={styles.shareHeader}>
          <h1 className={styles.shareTitle}>{data?.conversation.title || '分享的对话'}</h1>
          <div className={styles.shareMeta}>
            <span>由 AI 生成，内容请仔细甄别</span>
            <span className={styles.shareMetaDot} />
            <span>{data?.conversation.created_at?.slice(0, 10)}</span>
          </div>
        </div>
        <div className={styles.shareMessages}>
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className={styles.shareUser}>
                  {message.content}
                </div>
              )
            }
            if (message.role !== 'assistant') {
              return null
            }
            const metadata = message.metadata || {}
            const images = (metadata.attachments ?? []).filter((a) => a.type === 'generated_image')
            return (
              <div key={message.id} className={styles.shareAssistant}>
                {message.content ? (
                  <Markdown
                    className="ds-assistant-message-main-content"
                    content={message.content}
                    loading={false}
                    cacheKey={message.id}
                    disableLink={false}
                    sources={[]}
                  />
                ) : null}
                {images.length > 0 ? (
                  <div className={styles.shareImages}>
                    {images.map((img, index) => (
                      <img
                        key={`${img.url}-${index}`}
                        src={API_ORIGIN ? `${API_ORIGIN}${img.url}` : img.url}
                        alt="生成的图片"
                        className={styles.shareImage}
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
