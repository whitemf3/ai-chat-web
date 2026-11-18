import clsx from 'clsx'
import { memo, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconCheckOutline16,
  IconEditOutline16,
  IconEllipsisOutline16,
  IconShareOutline16,
  IconTrashOutline16,
} from '../base/icons.js'
import { renameSession, selectSession } from '../../services/chat/store.js'
import { createShareLink } from '../../services/share.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { IconButton } from '../base/IconButton.js'
import { Menu } from '../base/Menu.js'
import { showToast } from '../base/toastState.js'
import { closeMobileSider } from './mobileSiderState.js'
import styles from './SessionItem.module.css'

export const SessionItem = memo(function SessionItem({
  session,
  active,
  managing = false,
  selected = false,
  onToggleSelect,
  onDelete,
}: {
  session: SessionSummary
  active: boolean
  managing?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  onDelete: () => void
}) {
  const t = useTranslate()
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const displayTitle = session.title || t('untitledChat')

  if (editing) {
    const finish = (title: string) => {
      setEditing(false)
      if (title.trim() && title.trim() !== displayTitle) {
        renameSession(session.id, title.trim())
      }
    }
    return (
      <input
        className={styles.renameInput}
        defaultValue={displayTitle}
        autoFocus
        onFocus={(event) => event.target.select()}
        onBlur={(event) => finish(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            finish(event.currentTarget.value)
          } else if (event.key === 'Escape') {
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <div
      className={clsx(styles.item, active && !managing && styles.active)}
      role={managing ? 'checkbox' : undefined}
      aria-checked={managing ? selected : undefined}
      onClick={() => {
        if (managing) {
          onToggleSelect?.()
          return
        }
        selectSession(session.id)
        closeMobileSider()
      }}
    >
      {managing ? (
        <span className={clsx(styles.checkbox, selected && styles.checkboxChecked)} aria-hidden="true">
          {selected ? <IconCheckOutline16 /> : null}
        </span>
      ) : null}
      <div className={styles.title}>{displayTitle}</div>
      {managing ? null : (
        <Menu
          options={[
            {
              key: 'rename',
              label: t('sessionItemMenuRenameOption'),
              icon: <IconEditOutline16 />,
              onSelect: () => setEditing(true),
            },
            {
              key: 'share',
              label: t('shareSession'),
              icon: <IconShareOutline16 />,
              onSelect: () => {
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
              },
            },
            {
              key: 'delete',
              label: t('delete'),
              icon: <IconTrashOutline16 />,
              danger: true,
              onSelect: onDelete,
            },
          ]}
        >
          {({ open, toggle }) => (
            <div
              className={clsx(styles.action, open && styles.actionOpen)}
              onClick={(event) => event.stopPropagation()}
            >
              <IconButton icon={<IconEllipsisOutline16 />} aria-label={t('more')} onClick={toggle} />
            </div>
          )}
        </Menu>
      )}
    </div>
  )
})
