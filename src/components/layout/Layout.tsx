import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import FloatingAction from '../ui/FloatingAction'
import ErrorBoundary from '../ui/ErrorBoundary'
import styles from './Layout.module.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className={styles.content}>
          <ErrorBoundary><Outlet /></ErrorBoundary>
        </main>
      </div>
      <FloatingAction />
    </div>
  )
}
