import { useEffect, useRef, useState } from 'react'
import { API_ORIGIN, setToken } from '../services/api/client.js'
import '../app/theme.css'
import '../app/global.css'
import styles from './Login.module.css'

const TURNSTILE_SITE_KEY = '0x4AAAAAAD_yxEkCTD6muHx5'

export const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const turnstileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 已登录直接回首页
    if (localStorage.getItem('ai-chat:token')) {
      window.location.href = '/'
      return
    }
    // 注入 Turnstile
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  useEffect(() => {
    if (!turnstileRef.current) {
      return
    }
    const render = () => {
      if (window.turnstile && turnstileRef.current && !turnstileRef.current.hasChildNodes()) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: 'turnstile-spin-v2',
        })
      }
    }
    const timer = setInterval(render, 500)
    return () => clearInterval(timer)
  }, [])

  const submit = async () => {
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (mode === 'register' && password.length < 6) {
      setError('密码至少需要 6 位')
      return
    }
    if (mode === 'register' && !username.trim()) {
      setError('请输入用户名')
      return
    }

    // 同源相对路径（dev proxy）或 localhost 直连时豁免 Turnstile，与后端 dev 行为一致
    const isDev =
      !API_ORIGIN ||
      API_ORIGIN.includes('localhost') ||
      API_ORIGIN.includes('127.0.0.1')
    let turnstileToken: string | undefined
    if (!isDev) {
      const input = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
      turnstileToken = input?.value
      if (!turnstileToken) {
        setError('请完成人机验证')
        return
      }
    }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body =
        mode === 'login'
          ? { email, password, turnstileToken }
          : { email, username, password, turnstileToken }
      const res = await fetch(`${API_ORIGIN}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as {
        success: boolean
        error?: { message: string }
        data?: { token: string }
      }
      if (!data.success || !data.data) {
        setError(data.error?.message ?? '请求失败')
        window.turnstile?.reset()
        return
      }
      setToken(data.data.token)
      window.location.href = '/'
    } catch {
      setError('网络错误，请稍后重试')
      window.turnstile?.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="56" height="56" rx="16" fill="#3964FE" />
            <path
              d="M32 15.5C24.5446 15.5 18.6 21.4446 18.6 28.9C18.6 36.3554 24.5446 42.3 32 42.3C34.2899 42.3 36.4524 41.7469 38.361 40.7655L44.6 45.5C45.5452 46.2084 46.847 45.2243 46.4081 44.1151L44.5478 39.4108C47.1699 36.6163 48.7 32.9263 48.7 28.9C48.7 21.4446 42.4554 15.5 35 15.5H32Z"
              fill="#ffffff"
            />
            <path
              d="M38.5 25.5C38.5 26.3284 37.8284 27 37 27C36.1716 27 35.5 26.3284 35.5 25.5C35.5 24.6716 36.1716 24 37 24C37.8284 24 38.5 24.6716 38.5 25.5Z"
              fill="#3964FE"
            />
            <path
              d="M31.5 25.5C31.5 26.3284 30.8284 27 30 27C29.1716 27 28.5 26.3284 28.5 25.5C28.5 24.6716 29.1716 24 30 24C30.8284 24 31.5 24.6716 31.5 25.5Z"
              fill="#3964FE"
            />
            <path
              d="M24.5 25.5C24.5 26.3284 23.8284 27 23 27C22.1716 27 21.5 26.3284 21.5 25.5C21.5 24.6716 22.1716 24 23 24C23.8284 24 24.5 24.6716 24.5 25.5Z"
              fill="#3964FE"
            />
            <path
              d="M46.8 10.2L47.9 13.1L50.8 14.2L47.9 15.3L46.8 18.2L45.7 15.3L42.8 14.2L45.7 13.1L46.8 10.2Z"
              fill="#ffffff"
              fillOpacity="0.9"
            />
          </svg>
        </div>
        <h1 className={styles.title}>开始使用</h1>
        <p className={styles.subtitle}>{mode === 'login' ? '登录以继续' : '注册新账号'}</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === 'login' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === 'register' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <input
            className={styles.input}
            type="email"
            placeholder="邮箱地址"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {mode === 'register' ? (
            <input
              className={styles.input}
              type="text"
              placeholder="用户名"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          ) : null}
          <input
            className={styles.input}
            type="password"
            placeholder="密码"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === 'register' ? (
            <input
              className={styles.input}
              type="password"
              placeholder="确认密码"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          ) : null}

          <div className={styles.turnstile} ref={turnstileRef} />

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? (mode === 'login' ? '登录中…' : '注册中…') : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className={styles.switch}>
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            className={styles.switchButton}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? '注册账号' : '立即登录'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Turnstile 全局类型声明
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: { sitekey: string; action?: string }) => string
      reset: (widgetId?: string) => void
    }
  }
}
