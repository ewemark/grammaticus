import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'HOME' },
  { to: '/words', label: 'WORDS' },
  { to: '/read', label: 'READING' },
  { to: '/grammar', label: 'GRAMMAR' },
  { to: '/scan', label: 'SCAN' },
  { to: '/upload', label: 'UPLOAD' },
  { to: '/guestbook', label: 'GUESTBOOK' },
  { to: '/about', label: 'ABOUT' },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandName}>GRAMMATICUS</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <span className={styles.version}>V 0.1</span>
        </div>
      </aside>
    </>
  )
}
