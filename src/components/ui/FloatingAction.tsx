import { useState, useRef, useEffect, useCallback } from 'react'
import { saveNote } from '../../utils/notes'
import { getActiveSession } from '../../utils/readingSession'
import { toast } from './Toast'
import WordPopup from './WordPopup'
import ReadingSummary from './ReadingSummary'

/**
 * FloatingAction — 全局工具环悬浮球
 *
 * 定位:快速字典 + 笔记全局入口(分析功能已归阅读器侧栏)
 * 交互:点球 → 三个功能圆环绕弹出(半圆,朝屏幕内侧):
 *   ① 快速查词:进入选词模式,页面选中单词 → 弹迷你词卡(含"我的积累")
 *   ② 速记笔记:近球小卡片,自动带入页面选中文字作引用
 *   ③ 笔记总览:阅读会话中亮起,打开 ReadingSummary(精华总结)
 * 悬浮球可拖拽、吸边、半透明待机、位置持久化。
 */

type Side = 'left' | 'right'
type RadialAction = 'word' | 'note' | 'summary'

const FAB_POS_KEY = 'grammaticus-fab-pos'
const FAB_SIZE = 44
const RADIUS_X = 78
const RADIUS_Y = 68
const CIRCLE = 48

function loadFabPos(): { side: Side; y: number } {
  try {
    const s = localStorage.getItem(FAB_POS_KEY)
    if (s) {
      const p = JSON.parse(s) as { side?: Side; y?: number }
      if ((p.side === 'left' || p.side === 'right') && typeof p.y === 'number') {
        return { side: p.side, y: clampY(p.y) }
      }
    }
  } catch { /* localStorage unavailable */ }
  return { side: 'right', y: Math.round(window.innerHeight * 0.6) }
}

/** 限制 y 使工具环圆圈不出屏 */
function clampY(y: number): number {
  return Math.min(Math.max(y, 70), Math.max(70, window.innerHeight - FAB_SIZE - 70))
}

export default function FloatingAction() {
  const [open, setOpen] = useState(false)               // 工具环展开
  const [action, setAction] = useState<RadialAction | null>(null)
  const [hoveredCircle, setHoveredCircle] = useState<RadialAction | null>(null)
  const [popup, setPopup] = useState<{ word: string; rect: DOMRect } | null>(null)
  const [noteQuote, setNoteQuote] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  const [fabPos, setFabPos] = useState(loadFabPos)
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null)
  const [hovered, setHovered] = useState(false)
  const [captured, setCaptured] = useState(false)

  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const grabOffset = useRef({ x: 0, y: 0 })
  const moved = useRef(false)
  const fabRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  /* ── 位置持久化 ── */
  useEffect(() => {
    if (dragXY) return
    try { localStorage.setItem(FAB_POS_KEY, JSON.stringify(fabPos)) } catch { /* ignore */ }
  }, [fabPos, dragXY])

  useEffect(() => {
    const onResize = () => setFabPos((p) => ({ ...p, y: clampY(p.y) }))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* ── FAB 拖拽 + 吸边 ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = fabRef.current?.getBoundingClientRect()
    if (!rect) return
    dragStart.current = { x: e.clientX, y: e.clientY }
    grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    dragging.current = true
    moved.current = false
    setDragXY({ x: rect.left, y: rect.top })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    if (Math.abs(e.clientX - dragStart.current.x) > 4 || Math.abs(e.clientY - dragStart.current.y) > 4) moved.current = true
    setDragXY({
      x: Math.max(0, Math.min(e.clientX - grabOffset.current.x, window.innerWidth - FAB_SIZE)),
      y: Math.max(0, Math.min(e.clientY - grabOffset.current.y, window.innerHeight - FAB_SIZE)),
    })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (moved.current && dragXY) {
      const side: Side = dragXY.x + FAB_SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right'
      setFabPos({ side, y: clampY(dragXY.y) })
      setDragXY(null)
    } else {
      setDragXY(null)
      // 点击:开/关工具环(同时退出进行中的动作)
      setOpen((v) => {
        if (v) { setAction(null) }
        return !v
      })
    }
  }, [dragXY])

  /* ── 关闭所有浮层 ── */
  const closeAll = useCallback(() => {
    setOpen(false)
    setAction(null)
    setPopup(null)
    setNoteText('')
    setNoteQuote('')
    setNoteSaved(false)
  }, [])

  /* ── ESC / 点外部关闭 ── */
  useEffect(() => {
    if (!open && !action && !popup) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (fabRef.current?.contains(t)) return
      // 选词模式下点击页面属于正常操作,不关闭
      if (action === 'word') return
      closeAll()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [open, action, popup, closeAll])

  /* ── 选词模式:监听页面选中 ── */
  useEffect(() => {
    if (action !== 'word') return
    const handleMouseUp = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || fabRef.current?.contains(t)) return
      setTimeout(() => {
        const sel = window.getSelection()
        const selected = sel?.toString().trim() ?? ''
        if (!selected || !sel || sel.rangeCount === 0) return
        const m = /[a-zA-Z''-]+/.exec(selected)
        if (!m) return
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        setPopup({ word: m[0], rect })
        setAction(null)
        setCaptured(true)
        setTimeout(() => setCaptured(false), 800)
        sel.removeAllRanges()
      }, 50)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [action])

  /* ── 三个圆圈动作 ── */
  const startWordLookup = () => {
    setPopup(null)
    setOpen(false)
    setAction('word')
    window.getSelection()?.removeAllRanges()
  }

  const startQuickNote = () => {
    // 带上页面当前选中文字作为引用
    const sel = window.getSelection()?.toString().trim() ?? ''
    setNoteQuote(sel.length > 0 && sel.length <= 500 ? sel : '')
    setNoteText('')
    setNoteSaved(false)
    setOpen(false)
    setAction('note')
    window.getSelection()?.removeAllRanges()
  }

  const openSummary = () => {
    setOpen(false)
    setAction('summary')
  }

  const saveQuickNote = () => {
    if (!noteText.trim() && !noteQuote) return
    saveNote({
      type: 'text',
      title: noteQuote ? noteQuote.replace(/\s+/g, ' ').slice(0, 24) : undefined,
      content: noteText.trim(),
      sourceText: noteQuote || undefined,
    })
    setNoteSaved(true)
    toast.success('已存入手写笔记')
    setTimeout(() => { setAction(null); setNoteText(''); setNoteQuote(''); setNoteSaved(false) }, 700)
  }

  const session = getActiveSession()

  /* ── 几何:球心 + 圆圈位置(半圆朝屏幕内侧) ── */
  const dir = fabPos.side === 'right' ? -1 : 1 // 圆圈弹出方向
  const centerX = dragXY
    ? dragXY.x + FAB_SIZE / 2
    : fabPos.side === 'right'
      ? window.innerWidth - 8 - FAB_SIZE / 2
      : 8 + FAB_SIZE / 2
  const centerY = (dragXY ? dragXY.y : fabPos.y) + FAB_SIZE / 2

  const circles: { key: RadialAction; dx: number; dy: number; label: string; disabled?: boolean; icon: React.ReactNode }[] = [
    {
      key: 'word', dx: dir * RADIUS_X * 0.72, dy: -RADIUS_Y, label: '快速查词',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
        </svg>
      ),
    },
    {
      key: 'note', dx: dir * RADIUS_X, dy: 0, label: '速记笔记',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      key: 'summary', dx: dir * RADIUS_X * 0.72, dy: RADIUS_Y, label: session ? '笔记总览' : '笔记总览(阅读中可用)', disabled: !session,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
  ]

  const fabIdle = !open && !action && !popup && !hovered && !dragXY

  /* ── 近球面板定位(速记/总览) ── */
  const panelStyle: React.CSSProperties = {
    position: 'fixed', zIndex: 1001, bottom: 16,
    ...(fabPos.side === 'right' ? { right: FAB_SIZE + 20 } : { left: FAB_SIZE + 20 }),
    width: Math.min(380, window.innerWidth - FAB_SIZE - 40),
    maxHeight: 'min(78vh, 640px)',
    background: 'var(--color-surface-raised)',
    border: '1px solid var(--color-border)',
    borderRadius: 12, boxShadow: 'var(--shadow-raised)',
    padding: 'var(--space-md)',
    boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
    overflow: 'hidden',
    animation: `panelIn-${fabPos.side} 180ms ease`,
  }

  return (
    <div ref={rootRef}>
      {/* ── 工具环圆圈 ── */}
      {circles.map((c, i) => {
        const shown = open && !dragXY
        return (
          <button
            key={c.key}
            onClick={() => {
              if (c.disabled) return
              if (c.key === 'word') startWordLookup()
              else if (c.key === 'note') startQuickNote()
              else openSummary()
            }}
            onMouseEnter={() => setHoveredCircle(c.key)}
            onMouseLeave={() => setHoveredCircle(null)}
            disabled={c.disabled}
            aria-label={c.label}
            style={{
              position: 'fixed', zIndex: 1003,
              left: centerX - CIRCLE / 2,
              top: centerY - CIRCLE / 2,
              width: CIRCLE, height: CIRCLE, borderRadius: '50%',
              transform: shown ? `translate(${c.dx}px, ${c.dy}px) scale(1)` : 'translate(0, 0) scale(0)',
              opacity: shown ? (c.disabled ? 0.35 : 1) : 0,
              pointerEvents: shown && !c.disabled ? 'auto' : 'none',
              transition: `transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1) ${shown ? i * 40 : 0}ms, opacity 150ms ease ${shown ? i * 40 : 0}ms`,
              background: hoveredCircle === c.key && !c.disabled ? 'var(--color-text)' : 'var(--color-surface-raised)',
              color: hoveredCircle === c.key && !c.disabled ? 'var(--color-canvas)' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-raised)',
              cursor: c.disabled ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            {c.icon}
          </button>
        )
      })}

      {/* ── 圆圈 hover 标签 ── */}
      {open && hoveredCircle && (() => {
        const c = circles.find((x) => x.key === hoveredCircle)
        if (!c) return null
        return (
          <span style={{
            position: 'fixed', zIndex: 1003,
            left: centerX + c.dx + (dir < 0 ? -CIRCLE / 2 - 8 : CIRCLE / 2 + 8),
            top: centerY + c.dy - 10,
            transform: dir < 0 ? 'translateX(-100%)' : 'none',
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)', whiteSpace: 'nowrap',
            background: 'var(--color-text)', color: 'var(--color-canvas)',
            padding: '3px 10px', borderRadius: 'var(--radius-pill)',
            pointerEvents: 'none',
          }}>
            {c.label}
          </span>
        )
      })()}

      {/* ── 选词模式提示 ── */}
      {action === 'word' && !popup && (
        <div style={{
          position: 'fixed', zIndex: 1003,
          left: centerX + dir * (FAB_SIZE / 2 + 12),
          top: centerY - 14,
          transform: dir < 0 ? 'translateX(-100%)' : 'none',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-raised)', padding: '6px 14px',
          animation: 'pulse 1.8s ease-in-out infinite',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', color: 'var(--color-text)' }}>
            选中任意英文单词
          </span>
          <button onClick={() => setAction(null)}
            style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            取消 ✕
          </button>
        </div>
      )}

      {/* ── 速记笔记卡片 ── */}
      {action === 'note' && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)' }}>
              速记笔记
            </span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setAction(null)} aria-label="关闭"
              style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
              ✕
            </button>
          </div>
          {noteQuote && (
            <div style={{
              fontSize: 11, lineHeight: 1.6, color: 'var(--color-text-soft)', fontStyle: 'italic',
              borderLeft: '2px solid var(--color-border)', background: 'var(--color-canvas-soft)',
              padding: '6px 10px', borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
              maxHeight: 80, overflow: 'auto',
            }}>
              {noteQuote}
            </div>
          )}
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={noteQuote ? '对这段文字的想法…' : '此刻的想法…'}
            autoFocus
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 12px',
              fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.7,
              color: 'var(--color-text)', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
              outline: 'none', resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAction(null)}
              style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              取消
            </button>
            <button onClick={saveQuickNote} disabled={noteSaved || (!noteText.trim() && !noteQuote)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                border: '1px solid', 
                borderColor: noteSaved ? 'var(--color-success)' : 'var(--color-text)',
                background: noteSaved ? 'var(--color-success)' : noteText.trim() || noteQuote ? 'var(--color-text)' : 'transparent',
                color: noteSaved || noteText.trim() || noteQuote ? (noteSaved ? '#fff' : 'var(--color-canvas)') : 'var(--color-text-secondary)',
                cursor: noteSaved ? 'default' : 'pointer',
              }}>
              {noteSaved ? '已保存 ✓' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* ── 笔记总览面板 ── */}
      {action === 'summary' && session && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)' }}>
              笔记总览
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {session.articleTitle}
            </span>
            <button onClick={() => setAction(null)} aria-label="关闭"
              style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <ReadingSummary session={session} />
          </div>
        </div>
      )}

      {/* ── 迷你词卡(查词结果) ── */}
      {popup && (
        <WordPopup word={popup.word} anchorRect={popup.rect} onClose={() => setPopup(null)} />
      )}

      {/* ── FAB ── */}
      <button
        ref={fabRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="学习工具环"
        style={{
          position: 'fixed', zIndex: 1004,
          ...(dragXY
            ? { left: dragXY.x, top: dragXY.y }
            : fabPos.side === 'right' ? { right: 8, top: fabPos.y } : { left: 8, top: fabPos.y }),
          width: FAB_SIZE, height: FAB_SIZE, borderRadius: '50%',
          background: captured ? 'var(--color-success)' : open ? 'var(--color-text)' : 'var(--color-surface-raised)',
          border: captured ? '1px solid var(--color-success)' : open ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
          cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, touchAction: 'none', userSelect: 'none',
          opacity: fabIdle ? 0.5 : 1,
          transition: dragXY
            ? 'opacity 200ms ease, background 150ms ease'
            : 'top 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease, background 150ms ease, box-shadow 200ms ease',
          boxShadow: captured
            ? '0 0 16px color-mix(in srgb, var(--color-success) 40%, transparent)'
            : open ? 'none' : 'var(--shadow-raised)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={captured ? '#fff' : open ? 'var(--color-canvas)' : 'var(--color-text)'} strokeWidth="1.5" strokeLinecap="round"
          style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          {captured ? (
            <path d="M5 13l4 4L19 7" />
          ) : (
            <>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
            </>
          )}
        </svg>
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        @keyframes panelIn-right { from{transform:translateX(24px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes panelIn-left { from{transform:translateX(-24px);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  )
}
