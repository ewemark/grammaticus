import { useState, useEffect } from 'react'

/**
 * InstallPrompt — "加入桌面"引导(PWA 安装)
 *
 * - 安卓 Chrome / Edge:捕获 beforeinstallprompt,显示一键安装按钮
 * - iOS Safari:无安装事件,显示操作指引(分享 → 添加到主屏幕)
 * - 已安装(standalone 模式)或用户关闭后不再打扰
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'grammaticus-install-dismissed'

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as { standalone?: boolean }).standalone === true
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    let dismissed = false
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1' } catch { /* ignore */ }
    if (dismissed) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
      setShowIosHint(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS:延迟 3 秒后显示指引(不打断首屏)
    let timer: number | undefined
    if (isIOS() && !('beforeinstallprompt' in window)) {
      timer = window.setTimeout(() => setShowIosHint(true), 3000)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    setShowIosHint(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setVisible(false)
    setDeferred(null)
  }

  if (!visible && !showIosHint) return null

  return (
    <div style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 76,
      zIndex: 1100, display: 'flex', alignItems: 'center', gap: 10,
      maxWidth: 'min(420px, calc(100vw - 24px))',
      background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-raised)',
      padding: '8px 8px 8px 16px', boxSizing: 'border-box',
    }}>
      {visible && deferred ? (
        <>
          <span style={{ fontSize: 12, color: 'var(--color-text-soft)', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
            把 Grammaticus 加入桌面,像 App 一样打开
          </span>
          <button onClick={install} style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)', padding: '6px 14px',
            background: 'var(--color-text)', color: 'var(--color-canvas)',
            border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            加入桌面
          </button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: 'var(--color-text-soft)', lineHeight: 1.5, flex: 1, minWidth: 0 }}>
            加入桌面:点浏览器 <b>分享</b> 按钮 → <b>添加到主屏幕</b>
          </span>
        </>
      )}
      <button onClick={dismiss} aria-label="关闭提示" style={{
        fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', flexShrink: 0,
      }}>
        ✕
      </button>
    </div>
  )
}
