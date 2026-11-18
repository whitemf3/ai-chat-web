import clsx from 'clsx'
import { useEffect, useState, type ReactNode } from 'react'
import {
  IconDataOutline16,
  IconDarkOutline16,
  IconFollowsystemOutline16,
  IconLightOutline16,
  IconSettingsOutline16,
  IconUserOutline16,
} from '../base/icons.js'
import {
  setLocale,
  setThemePreference,
  useSettings,
  type Locale,
  type ThemePreference,
} from '../../services/settings.js'
import { Button } from '../base/Button.js'
import { Modal } from '../base/Modal.js'
import { Select } from '../base/Select.js'
import { getJson, logout, request } from '../../services/api/client.js'
import { closeSettings, useSettingsDialog, type SettingsSection } from './settingsDialogState.js'
import styles from './Settings.module.css'

type ProfileResponse = {
  user: { id: string; email: string; username: string; avatar: string | null; created_at: string }
  stats: { total_conversations: number; total_messages: number }
}

type UserProfile = {
  email: string
  username: string
  createdAt: string
  totalConversations: number
  totalMessages: number
  dailyLimit: number
  usedToday: number
  unlimited: boolean
}

type QuotaData = {
  dailyLimit: number
  usedToday: number
  remaining: number
  unlimited: boolean
}

/**
 * 设置弹窗（对齐 DeepSeek chat-demo 结构：桌面居中弹窗 + 左侧图标导航）。
 * 分「账户」（资料、今日额度）、「管理」（修改密码、登出）与「通用设置」（主题、语言）。
 */
export const SettingsDialog = () => {
  const open = useSettingsDialog((state) => state.open)
  return open ? <SettingsContent /> : null
}

const sections: { value: SettingsSection | 'account' | 'management'; label: string; icon: ReactNode }[] = [
  { value: 'account', label: 'settingDialogAsideAccountOptionLabel', icon: <IconUserOutline16 /> },
  { value: 'management', label: 'settingDialogAsideManagementOptionLabel', icon: <IconDataOutline16 /> },
  {
    value: 'general',
    label: 'settingDialogAsideGeneralOptionLabel',
    icon: <IconSettingsOutline16 />,
  },
]

const SettingsContent = () => {
  // 打开设置默认显示「账户」tab（今日额度 + 资料）
  const [section, setSection] = useState<SettingsSection | 'account' | 'management'>('account')
  return (
    <Modal title="设置" closable className={styles.dialog} mainClassName={styles.dialogMain} onClose={closeSettings}>
      <div role="tablist" className={styles.navigation}>
        {sections.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={section === item.value}
            className={clsx(styles.navItem, section === item.value && styles.navItemActive)}
            onClick={() => setSection(item.value)}
          >
            {item.icon}
            <span>{labelOf(item.label as string)}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className={styles.content}>
        {section === 'general' ? (
          <>
            <ThemeSetting />
            <LocaleSetting />
          </>
        ) : section === 'management' ? (
          <ManagementPanel />
        ) : (
          <AccountPanel />
        )}
      </div>
    </Modal>
  )
}

/** TranslationKey 中新增的文案在 zh/en 里直接查表（本文件内联，避免动 i18n 聚合表） */
const labelOf = (key: string): string => {
  const map: Record<string, string> = {
    settingDialogAsideGeneralOptionLabel: '通用设置',
    settingDialogAsideAccountOptionLabel: '账户',
    settingDialogAsideManagementOptionLabel: '管理',
    avatarMenuSettingsDialogThemeItemLabel: '主题',
    avatarMenuSettingsDialogThemeSelectLightOption: '浅色',
    avatarMenuSettingsDialogThemeSelectDarkOption: '深色',
    avatarMenuSettingsDialogThemeSelectSystemOption: '跟随系统',
    settingsLocalePreference: '语言',
  }
  return map[key as string] ?? key as string
}

// ============================================
// 主题（原版三选块结构）
// ============================================
const themeOptions: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: 'light', label: '浅色', icon: <IconLightOutline16 /> },
  { value: 'dark', label: '深色', icon: <IconDarkOutline16 /> },
  { value: 'system', label: '跟随系统', icon: <IconFollowsystemOutline16 /> },
]

const ThemeSetting = () => {
  const themePreference = useSettings((state) => state.themePreference)
  const label = '主题'
  return (
    <div className={styles.theme}>
      {label}
      <div role="radiogroup" aria-label={label} className={styles.themeOptions}>
        {themeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={themePreference === option.value}
            className={clsx(
              styles.themeOption,
              themePreference === option.value && styles.themeOptionSelected
            )}
            onClick={() => setThemePreference(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 语言（原版 SettingCell + Select）
// ============================================
const LocaleSetting = () => {
  const locale = useSettings((state) => state.locale)
  return (
    <SettingCell
      label="语言"
      status={null}
      action={
        <Select
          ariaLabel="语言"
          value={locale}
          options={[
            { value: 'zh-CN', label: '简体中文', lang: 'zh-CN' },
            { value: 'en-US', label: 'English', lang: 'en' },
          ]}
          onChange={(value) => setLocale(value as Locale)}
        />
      }
    />
  )
}

// ============================================
// 账户：今日额度 + 资料
// ============================================
const AccountPanel = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [profileData, quotaData] = await Promise.all([
          getJson<ProfileResponse>('/api/user/profile'),
          getJson<QuotaData>('/api/user/quota'),
        ])
        if (!cancelled) {
          setProfile({
            email: profileData.user.email,
            username: profileData.user.username,
            createdAt: profileData.user.created_at,
            totalConversations: profileData.stats.total_conversations,
            totalMessages: profileData.stats.total_messages,
            dailyLimit: quotaData.dailyLimit,
            usedToday: quotaData.usedToday,
            unlimited: quotaData.unlimited,
          })
        }
      } catch {
        if (!cancelled) {
          setProfileError(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <div className={styles.quotaPanel}>
        <div className={styles.quotaHeader}>
          <span>今日额度</span>
          {profile && !profile.unlimited && profile.dailyLimit > 0 ? (
            <span className={styles.quotaPercent}>
              {((profile.usedToday / profile.dailyLimit) * 100).toFixed(1)}%
            </span>
          ) : null}
        </div>
        <div className={styles.quotaBar}>
          <div
            className={styles.quotaUsed}
            style={{
              width:
                profile && !profile.unlimited && profile.dailyLimit > 0
                  ? `${Math.min(100, (profile.usedToday / profile.dailyLimit) * 100)}%`
                  : '0%',
            }}
          />
        </div>
        <div className={styles.quotaInfo}>
          {profile
            ? profile.unlimited || profile.dailyLimit <= 0
              ? `${profile.usedToday.toLocaleString()} / 无限制`
              : `${profile.usedToday.toLocaleString()} / ${profile.dailyLimit.toLocaleString()}`
            : '加载中…'}
        </div>
      </div>
      <SettingCell
        label="邮箱"
        status={
          profile
            ? null
            : profileError
              ? { text: '账户信息加载失败', error: true }
              : { text: '加载中…', error: false }
        }
        action={<span className={styles.profileValue}>{profile?.email ?? ''}</span>}
      />
      <SettingCell
        label="用户名"
        status={null}
        action={<span className={styles.profileValue}>{profile?.username ?? ''}</span>}
      />
      <SettingCell
        label="对话数"
        status={null}
        action={<span className={styles.profileValue}>{profile?.totalConversations ?? ''}</span>}
      />
      <SettingCell
        label="消息数"
        status={null}
        action={<span className={styles.profileValue}>{profile?.totalMessages ?? ''}</span>}
      />
    </>
  )
}

// ============================================
// 管理：修改密码 + 登出
// ============================================
const ManagementPanel = () => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{ text: string; error: boolean } | null>(null)
  const [saving, setSaving] = useState(false)

  const changePassword = async () => {
    if (saving) {
      return
    }
    if (!oldPassword || !newPassword) {
      setPasswordStatus({ text: '请填写当前密码与新密码', error: true })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ text: '两次输入的新密码不一致', error: true })
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ text: '新密码至少 6 位', error: true })
      return
    }
    setSaving(true)
    setPasswordStatus(null)
    try {
      // 修改密码失败（如原密码错误、演示账号 403）只提示，不触发全局登出
      await request(
        '/api/user/password',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword }),
        },
        30_000,
        { logoutOnAuthError: false }
      )
      setPasswordStatus({ text: '密码修改成功', error: false })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordStatus({
        text: error instanceof Error ? error.message : '修改失败',
        error: true,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className={styles.passwordPanel}>
        <div className={styles.passwordTitle}>修改密码</div>
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="当前密码"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
        />
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="新密码（至少 6 位）"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="确认新密码"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        {passwordStatus ? (
          <div className={clsx(styles.passwordStatus, passwordStatus.error && styles.passwordError)}>
            {passwordStatus.text}
          </div>
        ) : null}
        <Button variant="outlined" size="m" disabled={saving} onClick={() => void changePassword()}>
          {saving ? '提交中…' : '修改密码'}
        </Button>
      </div>
      <SettingCell
        label="退出登录"
        status={null}
        action={
          <Button variant="dangerOutlined" size="m" onClick={logout}>
            登出
          </Button>
        }
      />
    </>
  )
}

// ============================================
// SettingCell（原版行式布局）
// ============================================
type Status = { text: string; error?: boolean } | null

const SettingCell = ({
  label,
  status,
  action,
  className,
}: {
  label: string
  status: Status
  action: ReactNode
  className?: string
}) => (
  <div className={clsx(styles.cell, styles.row, className)}>
    <div className={styles.text}>
      <div className={styles.label}>{label}</div>
      {status ? <div className={clsx(styles.description, status.error && styles.error)}>{status.text}</div> : null}
    </div>
    {action}
  </div>
)