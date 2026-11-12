/**
 * Toast — 事件总线式全局提示
 *
 * 用法(任何文件):import { toast } from '../../components/ui/Toast'; toast.success('已存入句子库')
 * 挂载一次在 Layout:<ToastHost />
 * 右下角堆叠展示,最多同屏 3 条(超出移除最旧),2.2s 后自动滑出。
 */
import { useEffect, useState, useSyncExternalStore } from 'react'

type ToastKind = 'success' | 'info'

interface ToastItem {
  id: number
  msg: string
  kind: ToastKind
}

const MAX_VISIBLE = 3
/** 停留时长,之后开始滑出 */
const LIFETIME_MS = 2200
/** 滑出动画时长(与 HOST_CSS 中 gtoast-out 保持一致) */
const OUT_MS = 200

/* ── 模块级事件总线 ─────────────────────────────────────────── */

let nextId = 1
let items: ToastItem[] = []
const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) listener()
}

function push(msg: string, kind: ToastKind): void {
  items = [...items, { id: nextId++, msg, kind }].slice(-MAX_VISIBLE)
  emitChange()
}

function remove(id: number): void {
  items = items.filter((t) => t.id !== id)
  emitChange()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): ToastItem[] {
  return items
}

export const toast = {
  success(msg: string): void {
    push(msg, 'success')
  },
  info(msg: string): void {
    push(msg, 'info')
  },
}

/* ── 展示 ───────────────────────────────────────────────────── */

const HOST_CSS = `
.gtoast-host {
  position: fixed;
  bottom: 24px;
  right: 24px;
  zIndex: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.gtoast {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 320px;
  padding: 10px 18px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-raised);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: var(--leading-ui);
  color: var(--color-text);
  pointer-events: auto;
  animation: gtoast-in 200ms ease;
}
.gtoast-out {
  animation: gtoast-out 200ms ease forwards;
}
@keyframes gtoast-in {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: none; }
}
@keyframes gtoast-out {
  from { opacity: 1; transform: none; }
  to { opacity: 0; transform: translateX(24px); }
}
`

function ToastCard({ item }: { item: ToastItem }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const lifeTimer = window.setTimeout(() => setLeaving(true), LIFETIME_MS)
    const removeTimer = window.setTimeout(() => remove(item.id), LIFETIME_MS + OUT_MS)
    return () => {
      window.clearTimeout(lifeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [item.id])

  return (
    <div className={leaving ? 'gtoast gtoast-out' : 'gtoast'} role="status">
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
          background: item.kind === 'success' ? 'var(--color-success)' : 'var(--color-text-secondary)',
        }}
      />
      {item.msg}
    </div>
  )
}

export function ToastHost() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot)
  return (
    <>
      <style>{HOST_CSS}</style>
      <div className="gtoast-host" aria-live="polite">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} />
        ))}
      </div>
    </>
  )
}
