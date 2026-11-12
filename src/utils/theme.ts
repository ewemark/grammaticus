/**
 * 主题管理 — 深色/浅色双主题
 *
 * - 用户手动选择保存在 localStorage('grammaticus-theme')
 * - 未选择时跟随系统 prefers-color-scheme
 * - index.html 中有防闪烁初始化脚本,须在页面加载前设置 data-theme
 */

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'grammaticus-theme'

/** 读取用户手动选择的主题(null = 跟随系统) */
export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

/** 系统偏好主题 */
export function getSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** 当前生效主题 */
export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

/** 应用主题到 <html data-theme>,并同步浏览器 UI 颜色 */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff')
}

/** 保存并应用用户选择 */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage 不可用时仅本次会话生效
  }
  applyTheme(theme)
}

/** 切换到另一主题,返回切换后的主题 */
export function toggleTheme(): Theme {
  const next: Theme = getEffectiveTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
