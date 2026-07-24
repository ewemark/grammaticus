import { useLocation } from 'react-router-dom'
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
  const title = PAGE_TITLES[pathname] ?? (pathname.startsWith('/words/') ? 'WORD' : 'GRAMMATICUS')

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="MENU">
          <span className={styles.menuIcon}>☰</span>
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.right}>
        <span className={styles.hint}>SEARCH</span>
      </div>
    </header>
  )
}
