import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isLoggedIn, clearToken, getMe, type User } from '../../api/auth'
import styles from './Header.module.css'

const PAGE_TITLES: Record<string, string> = {
  '/': 'GRAMMATICUS',
  '/words': 'WORDS',
  '/grammar': 'GRAMMAR',
  '/upload': 'UPLOAD',
  '/scan': 'SCAN',
  '/about': 'ABOUT',
  '/read': 'READING',
  '/guestbook': 'GUESTBOOK',
}

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[pathname] ?? (pathname.startsWith('/words/') ? 'WORD' : 'GRAMMATICUS')
  const [user, setUser] = useState<User | null>(null)

  // Lazy fetch user info
  if (isLoggedIn() && !user) {
    getMe().then(r => setUser(r.user)).catch(() => clearToken())
  }

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
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
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
