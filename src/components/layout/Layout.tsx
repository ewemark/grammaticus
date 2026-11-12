import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import FloatingAction from '../ui/FloatingAction'
import ErrorBoundary from '../ui/ErrorBoundary'
import OnboardingTour from '../ui/OnboardingTour'
import { ToastHost } from '../ui/Toast'
import styles from './Layout.module.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className={styles.content}>
          <div key={pathname} className={styles.pageFade}>
            <ErrorBoundary><Outlet /></ErrorBoundary>
          </div>
        </main>
      </div>
      <FloatingAction />
      <OnboardingTour />
      <ToastHost />
    </div>
  )
}
