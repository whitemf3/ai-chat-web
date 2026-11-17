import { IconMenuOutline20, IconNewChatOutline20, IconShareOutline16 } from '../base/icons.js'
import { useTranslate } from '../../i18n/index.js'
import { newChat } from '../../services/chat/store.js'
import { createShareLink } from '../../services/share.js'
import { IconButton } from '../base/IconButton.js'
import { showToast } from '../base/toastState.js'
import { openMobileSider } from '../sider/mobileSiderState.js'
import styles from './MobileHeader.module.css'

/** 移动端顶栏：左侧菜单打开侧边栏；会话页再显示标题、分享与开启新对话 */
export const MobileHeader = ({
  title,
  sessionId,
  shareable,
}: {
  title?: string
  /** 当前会话 ID；传入即显示分享按钮 */
  sessionId?: string
  /** 会话有消息才可分享 */
  shareable?: boolean
}) => {
  const t = useTranslate()

  const share = () => {
    if (!sessionId || !shareable) {
      return
    }
    void createShareLink(sessionId)
      .then(() => showToast({ key: 'shareLinkCopied' }))
      .catch((error: unknown) => {
        console.error('Share error:', error)
        showToast({ key: 'shareFailed' })
      })
  }

  return (
    <div className={styles.header}>
      <IconButton
        size="xl"
        tone="primary"
        icon={<IconMenuOutline20 />}
        aria-label={t('expandSiderbarButton')}
        onClick={openMobileSider}
      />
      {title === undefined ? null : (
        <>
          <div className={styles.title}>{title}</div>
          <IconButton
            size="xl"
            tone="primary"
            icon={<IconShareOutline16 />}
            aria-label={t('shareSession')}
            disabled={!shareable}
            onClick={share}
          />
          <IconButton
            size="xl"
            tone="primary"
            icon={<IconNewChatOutline20 />}
            aria-label={t('newChat')}
            onClick={newChat}
          />
        </>
      )}
    </div>
  )
}
