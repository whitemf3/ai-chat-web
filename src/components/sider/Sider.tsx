import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useTranslate } from '../../i18n/index.js'
import {
  IconCheckOutline16,
  IconCheckedOutline14,
  IconPanelLeftOutline16,
  IconSettingsOutline16,
  NewChatIcon,
} from '../base/icons.js'
import { setSiderCollapsed } from '../../services/settings.js'
import { groupSessions } from '../../services/chat/sessionGroups.js'
import { newChat, removeSession, removeSessions, useChatStore } from '../../services/chat/store.js'
import type { SessionSummary } from '../../services/chat/types.js'
import { Button } from '../base/Button.js'
import { IconButton } from '../base/IconButton.js'
import { Modal } from '../base/Modal.js'
import { showToast } from '../base/toastState.js'
import { openSettings } from '../settings/settingsDialogState.js'
import { closeMobileSider, useMobileSider } from './mobileSiderState.js'
import { SessionItem } from './SessionItem.js'
import styles from './Sider.module.css'

/** 展开的侧边栏：名称与收起按钮、开启新对话、按时间分组的会话列表、底部设置；移动端放在抽屉里，收起按钮关闭抽屉 */
export const Sider = ({ mobile = false }: { mobile?: boolean }) => {
  const t = useTranslate()
  const sessions = useChatStore((state) => state.sessions)
  const activeId = useChatStore((state) => state.activeId)
  const [now, setNow] = useState(Date.now)
  const groups = useMemo(() => groupSessions(sessions, now, t), [sessions, now, t])
  const [deleting, setDeleting] = useState<SessionSummary | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [managing, setManaging] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchConfirm, setBatchConfirm] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  // 仅统计仍存在于列表中的选中项，删除后自动收敛
  const selectedIds = sessions.filter((session) => selected.has(session.id)).map((session) => session.id)
  const selectedCount = selectedIds.length
  const allSelected = sessions.length > 0 && selectedCount === sessions.length

  const toggleSelect = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(sessions.map((session) => session.id)))

  const exitManaging = () => {
    setManaging(false)
    setSelected(new Set())
  }

  const confirmBatchDelete = async () => {
    if (batchDeleting || selectedCount === 0) {
      return
    }
    setBatchDeleting(true)
    try {
      const ok = await removeSessions(selectedIds)
      setBatchConfirm(false)
      if (ok) {
        exitManaging()
      } else {
        showToast({ key: 'sessionDeleteFailed', type: 'error' })
        setSelected(new Set())
      }
    } finally {
      setBatchDeleting(false)
    }
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      clearTimeout(timer)
      const time = Date.now()
      setNow(time)
      const midnight = new Date(time).setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, midnight - time)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    refresh()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <div className={clsx(styles.sider, mobile && styles.mobile)}>
      <div className={styles.top}>
        <div className={styles.appName}>{t('appName')}</div>
        <div className={styles.topActions}>
          {!managing && sessions.length > 0 ? (
            <IconButton
              size="m"
              icon={<IconCheckedOutline14 />}
              tooltip={t('batchManage')}
              tooltipPlacement="bottom"
              onClick={() => setManaging(true)}
            />
          ) : null}
          <IconButton
            size="m"
            icon={<IconPanelLeftOutline16 />}
            tooltip={t('collapseSiderbarButton')}
            tooltipPlacement="bottom"
            onClick={() => (mobile ? closeMobileSider() : setSiderCollapsed(true))}
          />
        </div>
      </div>
      {managing ? (
        <div className={styles.manageBar}>
          <button
            type="button"
            className={styles.selectAll}
            aria-pressed={allSelected}
            onClick={toggleSelectAll}
          >
            <span className={clsx(styles.checkbox, allSelected && styles.checkboxChecked)} aria-hidden="true">
              {allSelected ? <IconCheckOutline16 /> : null}
            </span>
            {t('selectAll')}
          </button>
          <div className={styles.manageActions}>
            <Button
              variant="dangerOutlined"
              size="s"
              disabled={selectedCount === 0 || batchDeleting}
              onClick={() => setBatchConfirm(true)}
            >
              {selectedCount > 0 ? `${t('delete')}(${selectedCount})` : t('delete')}
            </Button>
            <Button variant="outlined" size="s" disabled={batchDeleting} onClick={exitManaging}>
              {t('done')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.newChat}
          onClick={() => {
            newChat()
            closeMobileSider()
          }}
        >
          <span className={styles.newChatIcon}>
            <NewChatIcon />
          </span>
          {t('newChat')}
        </button>
      )}
      <div className={styles.listWrap}>
        <div className={styles.list}>
          {groups.map((group) => (
            <div key={group.key} className={styles.section}>
              <div className={styles.sectionHeader}>{group.label}</div>
              {group.sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  active={session.id === activeId}
                  managing={managing}
                  selected={selected.has(session.id)}
                  onToggleSelect={() => toggleSelect(session.id)}
                  onDelete={() => setDeleting(session)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>
        <button type="button" className={styles.settings} onClick={() => openSettings('general')}>
          <span className={styles.settingsIcon}>
            <IconSettingsOutline16 />
          </span>
          <span className={styles.settingsLabel}>{t('settings')}</span>
        </button>
      </div>
      {deleting ? (
        <Modal
          title={t('deleteSessionModalContentTitle')}
          onClose={() => {
            if (!deletePending) {
              setDeleting(null)
            }
          }}
          footer={
            <>
              <Button variant="outlined" disabled={deletePending} onClick={() => setDeleting(null)}>
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                disabled={deletePending}
                onClick={async () => {
                  setDeletePending(true)
                  try {
                    if (await removeSession(deleting.id)) {
                      setDeleting(null)
                    } else {
                      showToast({ key: 'sessionDeleteFailed', type: 'error' })
                    }
                  } finally {
                    setDeletePending(false)
                  }
                }}
              >
                {t('delete')}
              </Button>
            </>
          }
        >
          {t('deleteSessionWithFilesDescription')}
        </Modal>
      ) : null}
      {batchConfirm ? (
        <Modal
          title={t('batchDeleteConfirmTitle')}
          onClose={() => {
            if (!batchDeleting) {
              setBatchConfirm(false)
            }
          }}
          footer={
            <>
              <Button variant="outlined" disabled={batchDeleting} onClick={() => setBatchConfirm(false)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" disabled={batchDeleting} onClick={() => void confirmBatchDelete()}>
                {t('delete')}
              </Button>
            </>
          }
        >
          {t('batchDeleteConfirmDescription', { count: selectedCount })}
        </Modal>
      ) : null}
    </div>
  )
}

/** 移动端抽屉：浮在页面上方，点空白区域关闭。 */
export const MobileSider = () => {
  const open = useMobileSider((state) => state.open)
  if (!open) {
    return null
  }
  return (
    <>
      <div className={styles.drawerMask} onClick={closeMobileSider} />
      <div className={styles.drawer}>
        <Sider mobile />
      </div>
    </>
  )
}