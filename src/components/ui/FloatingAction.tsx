import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeGrammar, analyzePreposition, analyzeGrammarAPI, analyzePrepositionAPI } from '../../utils/analyze'

type AnalysisMode = 'grammar' | 'preposition' | 'word' | null
type PanelView = 'menu' | 'selecting' | 'result'

export default function FloatingAction() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AnalysisMode>(null)
  const [view, setView] = useState<PanelView>('menu')
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  // Panel size — persisted in localStorage, drag-to-resize
  const [panelSize, setPanelSize] = useState(() => {
    try {
      const saved = localStorage.getItem('grammaticus-panel-size')
      if (saved) return JSON.parse(saved) as { w: number; h: number }
    } catch { /* ignore — localStorage may be unavailable */ }
    return { w: 360, h: 480 }
  })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [panelPos, setPanelPos] = useState<'left' | 'right'>('right')
  const [initialized, setInitialized] = useState(false)
  const [captured, setCaptured] = useState(false)
  const dragging = useRef(false)
  const resizing = useRef(false)
  const resizeDir = useRef({ dx: 1, dy: 1 })  // direction: 1 = grow, -1 = shrink from that edge
  const offset = useRef({ x: 0, y: 0 })
  const moved = useRef(false)
  const fabRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const analysisId = useRef(0)
  const navigate = useNavigate()

  // Font scale based on panel width (1.0 at 360px default)
  const fontSizeScale = panelSize.w / 360

  // Persist panel size
  useEffect(() => {
    localStorage.setItem('grammaticus-panel-size', JSON.stringify(panelSize))
  }, [panelSize])

  // Resize handlers — dx/dy direction: 1=grow, -1=shrink from that edge
  const onResizeDown = (dxDir: number, dyDir: number) => (e: React.PointerEvent) => {
    resizing.current = true
    resizeDir.current = { dx: dxDir, dy: dyDir }
    offset.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
    e.stopPropagation()
  }
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizing.current) return
    const dx = (e.clientX - offset.current.x) * resizeDir.current.dx
    const dy = (e.clientY - offset.current.y) * resizeDir.current.dy
    offset.current = { x: e.clientX, y: e.clientY }
    setPanelSize((s) => ({
      w: Math.min(600, Math.max(280, s.w + dx)),
      h: Math.min(Math.min(800, window.innerHeight - 40), Math.max(320, s.h + dy)),
    }))
  }
  const onResizeUp = () => {
    resizing.current = false
  }

  // Init position — bottom-right corner
  useEffect(() => {
    if (!initialized) {
      setPos({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
      setInitialized(true)
    }
  }, [initialized])

  // Decide panel side
  useEffect(() => {
    setPanelPos(pos.x > window.innerWidth - 400 ? 'right' : 'left')
  }, [pos.x])

  // Close panel on outside click (except when selecting — user needs to click page)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (view === 'selecting' || view === 'result') return // Don't close while selecting or viewing results
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (fabRef.current?.contains(target)) return
      setOpen(false)
      setMode(null)
      setView('menu')
      analysisId.current++
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [view])

  // Text selection listener — active only when in "selecting" view
  useEffect(() => {
    if (!open || view !== 'selecting') return
    const handleMouseUp = (e: MouseEvent) => {
      // Don't capture selections from within the panel or FAB
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (fabRef.current?.contains(target)) return
      // Small delay so selection registers
      setTimeout(() => {
        const sel = window.getSelection()
        const selected = sel?.toString().trim()
        if (selected && selected.length > 0) {
          setText(selected)
          setCaptured(true)
          setTimeout(() => setCaptured(false), 800)
          // Immediately run analysis with the current mode
          runAnalysis(mode!, selected)
        }
      }, 50)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [open, view, mode])

  // Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (fabRef.current) {
      const rect = fabRef.current.getBoundingClientRect()
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      dragging.current = true
      moved.current = false
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = Math.abs(e.clientX - (pos.x + offset.current.x))
    const dy = Math.abs(e.clientY - (pos.y + offset.current.y))
    if (dx > 3 || dy > 3) moved.current = true
    setPos({
      x: Math.max(0, Math.min(e.clientX - offset.current.x, window.innerWidth - 48)),
      y: Math.max(0, Math.min(e.clientY - offset.current.y, window.innerHeight - 48)),
    })
  }, [pos])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    if (!moved.current) {
      if (open && view !== 'menu') {
        analysisId.current++   // cancel pending
        setView('menu')
        setMode(null)
        setResult('')
        setText('')
      } else {
        setOpen((v) => !v)
        if (open) {
          analysisId.current++
          setMode(null)
          setView('menu')
          setResult('')
          setText('')
        }
      }
    }
  }, [open, view])

  const selectMode = (m: AnalysisMode) => {
    analysisId.current++           // cancel any pending analysis from previous mode
    setMode(m)
    setView('selecting')
    setResult('')
    setText('')
  }

  const runAnalysis = async (m: AnalysisMode, q: string) => {
    if (!q.trim()) return
    const id = ++analysisId.current   // capture id for this specific analysis
    setView('result')
    setResult('分析中…')

    const clean = q.trim().toLowerCase()

    if (m === 'word') {
      const wordOnly = clean.split(/\s+/)[0]
      fetch(`/api/words/${encodeURIComponent(wordOnly)}`)
        .then((r) => r.json())
        .then((d) => {
          if (analysisId.current !== id) return  // stale, discard
          if (d.simple) {
            setResult(`${d.simple.word} · ${d.simple.pos}\n\n${d.simple.meaning}\n\n${d.simple.example}`)
          } else {
            setResult(`词库中暂未收录 "${wordOnly}"`)
          }
        })
        .catch(() => { if (analysisId.current === id) setResult('查询失败，请稍后重试') })
    } else if (m === 'grammar') {
      try {
        const r = await analyzeGrammarAPI(q.trim())
        if (analysisId.current === id) setResult(r)
      } catch {
        if (analysisId.current === id) setResult(analyzeGrammar(q.trim()))
      }
    } else if (m === 'preposition') {
      try {
        const r = await analyzePrepositionAPI(q.trim())
        if (analysisId.current === id) setResult(r)
      } catch {
        if (analysisId.current === id) setResult(analyzePreposition(q.trim()))
      }
    }
  }

  const modeLabel = (m: AnalysisMode) => {
    if (m === 'word') return '单词查找'
    if (m === 'grammar') return '语法分析'
    if (m === 'preposition') return '介词分析'
    return ''
  }

  const modeHint = (m: AnalysisMode) => {
    if (m === 'word') return '请在网页中选中一个单词'
    if (m === 'grammar') return '请在网页中选中一个句子进行语法分析'
    if (m === 'preposition') return '请在网页中选中一个句子进行介词分析'
    return ''
  }

  // Panel position helpers
  const panelRight = panelPos === 'right'
    ? window.innerWidth - pos.x + 56
    : undefined
  const panelLeft = panelPos === 'left'
    ? pos.x + 56
    : undefined
  const panelBottom = window.innerHeight - pos.y

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            zIndex: 1001,
            bottom: panelBottom,
            right: panelRight,
            left: panelLeft,
            width: Math.min(panelSize.w, window.innerWidth - 16),
            maxHeight: panelSize.h,
            background: '#0a0a0a',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
              color: 'var(--color-text)',
            }}>
              学习助手
            </span>
            <button
              onClick={() => { analysisId.current++; setOpen(false); setMode(null); setView('menu'); setResult(''); setText('') }}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* VIEW: Menu — 3 mode buttons */}
          {view === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{
                fontSize: 11, color: 'var(--color-text-secondary)',
                lineHeight: 1.5, margin: '0 0 2px',
              }}>
                选择功能，然后选中网页中的单词或句子即可分析
              </p>
              {([
                { key: 'word' as const, label: '单词查找' },
                { key: 'grammar' as const, label: '语法分析' },
                { key: 'preposition' as const, label: '介词分析' },
              ]).map((a) => (
                <button
                  key={a.key}
                  onClick={() => selectMode(a.key)}
                  style={{
                    fontFamily: 'var(--font-display)',
                    textAlign: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-text)'
                    e.currentTarget.style.color = 'var(--color-text)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* VIEW: Selecting — hint to user */}
          {view === 'selecting' && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 'var(--space-xs)',
            }}>
              {/* Back to menu */}
              <button
                onClick={() => { analysisId.current++; setView('menu'); setMode(null); setResult(''); setText('') }}
                style={{
                  alignSelf: 'flex-start',
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                  letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-sm)',
                }}
              >
                ← 返回
              </button>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '2px solid var(--color-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{
                fontSize: Math.round(11 * fontSizeScale), color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0,
              }}>
                {modeHint(mode)}
              </p>
              {/* Manual input fallback */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                    e.preventDefault()
                    runAnalysis(mode!, text)
                  }
                }}
                placeholder="或手动输入…"
                rows={2}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--color-text)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  marginTop: 4,
                }}
              />
              <button
                onClick={() => { if (text.trim()) runAnalysis(mode!, text) }}
                disabled={!text.trim()}
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                  letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                  padding: '4px 16px', borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  background: text.trim() ? 'var(--color-text)' : 'transparent',
                  color: text.trim() ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                  cursor: text.trim() ? 'pointer' : 'default',
                  opacity: text.trim() ? 1 : 0.4,
                  transition: 'all var(--transition-fast)',
                }}
              >
                分析
              </button>
            </div>
          )}

          {/* VIEW: Result */}
          {view === 'result' && (
            <>
              {/* Back + mode badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => { analysisId.current++; setView('menu'); setMode(null); setResult(''); setText('') }}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  ← 返回
                </button>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                  letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                  padding: '1px 8px', borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
                }}>
                  {modeLabel(mode)}
                </span>
              </div>

              {/* Selected text preview */}
              <div style={{
                fontSize: Math.round(11 * fontSizeScale), color: 'var(--color-text)',
                padding: '6px 10px',
                borderLeft: '2px solid var(--color-border)', lineHeight: 1.5,
              }}>
                {text}
              </div>

              {/* Result */}
              <div style={{
                flex: 1, overflow: 'auto',
                fontSize: Math.round(12 * fontSizeScale),
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-line',
                borderTop: '1px solid var(--color-border)',
                paddingTop: 'var(--space-sm)',
              }}>
                {result}
              </div>

              {/* Quick nav for word lookup */}
              {mode === 'word' && result && !result.includes('暂未收录') && (
                <button
                  onClick={() => {
                    const wordOnly = text.trim().split(/\s+/)[0]
                    navigate(`/words/${encodeURIComponent(wordOnly)}`)
                    setOpen(false)
                  }}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0,
                  }}
                >
                  查看完整释义 →
                </button>
              )}
            </>
          )}

          {/* Resize handles — all 4 corners */}
          {[
            { corner: 'bottom-right', dx: 1, dy: 1, cursor: 'nwse-resize', bottom: 0, right: 0 },
            { corner: 'bottom-left', dx: -1, dy: 1, cursor: 'nesw-resize', bottom: 0, left: 0 },
            { corner: 'top-left', dx: -1, dy: -1, cursor: 'nwse-resize', top: 0, left: 0 },
          ].map((h) => (
            <div
              key={h.corner}
              onPointerDown={onResizeDown(h.dx, h.dy)}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
              style={{
                position: 'absolute',
                [h.top !== undefined ? 'top' : 'bottom']: 0,
                [h.left !== undefined ? 'left' : 'right']: 0,
                width: 24, height: 24,
                cursor: h.cursor,
                display: 'flex',
                alignItems: h.corner.includes('bottom') ? 'flex-end' : 'flex-start',
                justifyContent: h.corner.includes('right') ? 'flex-end' : 'flex-start',
                padding: 4, opacity: 0.2,
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.2' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="8.5" y1="0.5" x2="0.5" y2="8.5" />
                <line x1="8.5" y1="4" x2="4.5" y2="8" />
                <line x1="8.5" y1="7.5" x2="7.5" y2="8.5" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        ref={fabRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 1002,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: captured ? '#22c55e' : open ? 'var(--color-text)' : '#0a0a0a',
          border: captured ? '1px solid #22c55e' : open ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          touchAction: 'none',
          userSelect: 'none',
          transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease',
          boxShadow: captured ? '0 0 16px rgba(34,197,94,0.4)' : open ? 'none' : '0 0 1px rgba(255,255,255,0.15)',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--color-text)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(255,255,255,0.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.boxShadow = '0 0 1px rgba(255,255,255,0.15)'
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={captured ? '#fff' : open ? '#000' : '#fff'} strokeWidth="1.5" strokeLinecap="round"
          style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          {captured ? (
            <path d="M5 13l4 4L19 7" />
          ) : (
            <>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </>
          )}
        </svg>
      </button>

      {/* Pulse animation for selecting state */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </>
  )
}

