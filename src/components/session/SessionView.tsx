import clsx from 'clsx'
import { useState } from 'react'
import { useIsMobile } from '../../app/viewport.js'
import { useTranslate } from '../../i18n/index.js'
import type { Session } from '../../services/chat/types.js'
import { IconShareOutline16 } from '../base/icons.js'
import { createShareLink } from '../../services/share.js'
import { IconButton } from '../base/IconButton.js'
import { showToast } from '../base/toastState.js'
import { ChatInput } from '../chatInput/ChatInput.js'
import { MessageList } from '../messages/MessageList.js'
import { MobileHeader } from './MobileHeader.js'
import styles from './SessionView.module.css'

/** 会话页：标题栏（移动端为顶栏）+ 消息列表，输入框吸底 */
export const SessionView = ({
  session,
  streaming,
  siderCollapsed,
}: {
  session: Session
  streaming: boolean
  siderCollapsed: boolean
}) => {
  const t = useTranslate()
  const isMobile = useIsMobile()
  const [sharing, setSharing] = useState(false)
  const title = session.title || t('untitledChat')

  const share = () => {
    if (sharing) {
      return
    }
    setSharing(true)
    void createShareLink(session.id)
      .then(() => showToast({ key: 'shareLinkCopied' }))
      .catch((error: unknown) => {
        console.error('Share error:', error)
        showToast({ key: 'shareFailed' })
      })
      .finally(() => setSharing(false))
  }

  return (
    <div className={styles.view}>
      {isMobile ? (
        <MobileHeader
          title={title}
          sessionId={session.id}
          shareable={session.messages.length > 0}
        />
      ) : (
        <div className={styles.header}>
          <div className={clsx(styles.headerTitle, siderCollapsed && styles.withCollapsedSider)}>
            <div className={styles.title}>{title}</div>
          </div>
          <IconButton
            size="m"
            icon={<IconShareOutline16 />}
            tooltip={t('shareSession')}
            tooltipPlacement="bottom"
            disabled={sharing || session.messages.length === 0}
            onClick={share}
          />
        </div>
      )}
      <MessageList
        session={session}
        streaming={streaming}
        footer={
          <div className={styles.inputContainer}>
            <ChatInput sessionId={session.id} />
            <div className={styles.caveat}>{t('contentCaveat')}</div>
          </div>
        }
      />
    </div>
  )
}
