import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isLoggedIn, clearToken, getMe, type User } from '../../api/auth'
import { getEffectiveTheme, toggleTheme, type Theme } from '../../utils/theme'
import styles from './Header.module.css'

const PAGE_TITLES: Record<string, string> = {
  '/': 'GRAMMATICUS',
  '/words': 'WORDS',
  '/grammar': 'GRAMMAR',
  '/upload': 'UPLOAD',
  '/scan': 'SCAN',
  '/about': 'ABOUT',
  '/read': 'READING',
  '/space': 'SPACE',
  '/guestbook': 'GUESTBOOK',
}

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[pathname] ?? (pathname.startsWith('/words/') ? 'WORD' : 'GRAMMATICUS')
  const [user, setUser] = useState<User | null>(null)
  const [theme, setThemeState] = useState<Theme>(() => getEffectiveTheme())

  const handleToggleTheme = () => {
    setThemeState(toggleTheme())
  }

  // Fetch user info on mount and whenever the route changes (picks up login/logout)
  useEffect(() => {
    if (!isLoggedIn()) {
      setUser(null)
      return
    }
    let cancelled = false
    getMe()
      .then((r) => { if (!cancelled) setUser(r.user) })
      .catch(() => { if (!cancelled) { clearToken(); setUser(null) } })
    return () => { cancelled = true }
  }, [pathname])

  const handleLogout = () => {
    clearToken()
    setUser(null)
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="MENU">
          <span className={styles.menuIcon}>☰</span>
        </button>
        <h1
          className={styles.title}
          onClick={() => navigate('/')}
          title="回到首页"
          style={{ cursor: 'pointer' }}
        >
          {title}
        </h1>
      </div>
      <div className={styles.right}>
        <button
          className={styles.themeBtn}
          onClick={handleToggleTheme}
          aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
          title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
        >
          {theme === 'dark' ? (
            /* 太阳 — 点击切换到浅色 */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4.5" />
              <line x1="12" y1="1.5" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22.5" />
              <line x1="4.2" y1="4.2" x2="6" y2="6" />
              <line x1="18" y1="18" x2="19.8" y2="19.8" />
              <line x1="1.5" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22.5" y2="12" />
              <line x1="4.2" y1="19.8" x2="6" y2="18" />
              <line x1="18" y1="6" x2="19.8" y2="4.2" />
            </svg>
          ) : (
            /* 月亮 — 点击切换到深色 */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {user ? (
          <>
            <span className={styles.hint} style={{ marginRight: 'var(--space-md)' }}>{user.username}</span>
            <button onClick={handleLogout} style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-micro)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-micro)',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              padding: '4px 12px',
              cursor: 'pointer',
            }}>
              退出
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')} style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-micro)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)',
            padding: '4px 12px',
            cursor: 'pointer',
          }}>
            登录
          </button>
        )}
      </div>
    </header>
  )
}
