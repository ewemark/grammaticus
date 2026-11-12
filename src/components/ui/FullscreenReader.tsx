import { Fragment, useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { saveNote } from '../../utils/notes'
import { analyzeGrammarStream, type StreamHandle } from '../../utils/analyze'
import { openSession, closeSession, addCreatedNote, addSavedSentence } from '../../utils/readingSession'
import { findHighlightRange, overlaps, type HighlightRange } from '../../utils/highlight'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import StudyResult from './StudyResult'
import WordPopup from './WordPopup'

/* ── 点词即查:把正文切成可点击的单词 span(所有使用本阅读器的页面统一获得) ── */

/** token 开头的纯字母英文词(含撇号与连字符) */
const WORD_RE = /^[a-zA-Z''-]+/

const WORD_HOVER_CSS = `.fsreader-word { cursor: pointer; border-bottom: 1px dotted transparent; }
.fsreader-word:hover { border-bottom-color: var(--color-text-secondary); }`

/** 正在分析的句子在正文中的马克笔高亮 */
const HL_STYLE: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-adverb) 22%, transparent)',
  borderRadius: 2,
}

function renderTokens(
  line: string,
  onWordClick: (word: string, rect: DOMRect) => void,
  baseOffset: number,
  hl: HighlightRange | null,
): ReactNode[] {
  let off = baseOffset
  return line.split(/(\s+)/).map((tok, ti) => {
    if (!tok) return null
    const tokStart = off
    off += tok.length
    const m = WORD_RE.exec(tok)
    const inHl = hl !== null && overlaps(tokStart, tokStart + tok.length, hl)
    if (!m) return <span key={ti} style={inHl ? HL_STYLE : undefined}>{tok}</span>
    const w = m[0]
    const rest = tok.slice(w.length)
    return (
      <span key={ti} style={inHl ? HL_STYLE : undefined}>
        <span
          className="fsreader-word"
          onClick={(e) => onWordClick(w, e.currentTarget.getBoundingClientRect())}
        >
          {w}
        </span>
        {rest}
      </span>
    )
  })
}

function renderClickableText(
  text: string,
  onWordClick: (word: string, rect: DOMRect) => void,
  hl: HighlightRange | null,
): ReactNode {
  let pos = 0
  const blocks: ReactNode[] = []
  // 捕获组切分:奇数位是分隔符,只推进字符偏移,不渲染
  const parts = text.split(/(\n{2,})/)
  for (let pi = 0; pi < parts.length; pi++) {
    const part = parts[pi]
    if (pi % 2 === 1) { pos += part.length; continue }
    const paraStart = pos
    pos += part.length
    const lineParts = part.split(/(\n)/)
    let linePos = paraStart
    const lineNodes: ReactNode[] = []
    for (let li = 0; li < lineParts.length; li++) {
      const ln = lineParts[li]
      if (li % 2 === 1) {
        linePos += ln.length
        lineNodes.push(<br key={li} />)
        continue
      }
      lineNodes.push(<Fragment key={li}>{renderTokens(ln, onWordClick, linePos, hl)}</Fragment>)
      linePos += ln.length
    }
    blocks.push(<p key={pi} style={{ margin: '0 0 1em' }}>{lineNodes}</p>)
  }
  return (
    <>
      <style>{WORD_HOVER_CSS}</style>
      {blocks}
    </>
  )
}

interface Props {
  title: string
  subtitle?: string
  content: string
  /** Custom rendered content (e.g. with highlights) — overrides plain text */
  contentElement?: ReactNode
  fontSize: number
  onFontSizeChange: (size: number) => void
  onClose: () => void
  actions?: ReactNode
  zIndex?: number
  editing?: boolean
  editValue?: string
  onEditChange?: (val: string) => void
  editActions?: ReactNode
  /** 文章标识(用于阅读会话) */
  articleId?: string
}

const SIDEBAR_KEY = 'grammaticus-sidebar'
const SIDEBAR_MIN = 280
const SIDEBAR_MAX_PCT = 0.5

function loadSidebarPrefs(): { side: 'left' | 'right'; width: number } {
  try {
    const s = localStorage.getItem(SIDEBAR_KEY)
    if (s) {
      const p = JSON.parse(s) as { side?: string; width?: number }
      return {
        side: (p.side === 'left' || p.side === 'right') ? p.side : 'right',
        width: typeof p.width === 'number' ? Math.max(SIDEBAR_MIN, p.width) : 380,
      }
    }
  } catch { /* ignore */ }
  return { side: 'right', width: 380 }
}

export default function FullscreenReader({
  title, subtitle, content, contentElement, fontSize, onFontSizeChange, onClose,
  actions, zIndex = 999, editing, editValue, onEditChange, editActions, articleId,
}: Props) {
  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)',
    background: 'none', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer',
  }

  /* ── 阅读会话 ── */
  const sessionArticleId = articleId ?? title

  useEffect(() => {
    openSession(sessionArticleId, title, content)
    return () => { closeSession(sessionArticleId) }
  }, [sessionArticleId, title, content])

  /* ── 选中文字 → 记笔记 / 分析 ─────────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null)
  const [selText, setSelText] = useState('')
  const [selPos, setSelPos] = useState<{ x: number; y: number } | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteQuote, setNoteQuote] = useState('')
  const [noteThought, setNoteThought] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  /* ── 点词即查弹层 ── */
  const [popupState, setPopupState] = useState<{ word: string; rect: DOMRect } | null>(null)
  const closePopup = useCallback(() => setPopupState(null), [])
  /* 单击(无选区)弹词卡;拖选(有选区)留给"记笔记/分析"工具条 */
  const handleWordClick = useCallback((w: string, rect: DOMRect) => {
    const sel = window.getSelection()
    if (sel && sel.toString()) return
    sel?.removeAllRanges()
    setPopupState({ word: w, rect })
  }, [])

  const handleMouseUp = () => {
    if (editing) return
    setTimeout(() => {
      const sel = window.getSelection()
      const selected = sel?.toString().trim() ?? ''
      if (!selected || !sel || sel.rangeCount === 0) { setSelText(''); setSelPos(null); return }
      const range = sel.getRangeAt(0)
      if (containerRef.current && !containerRef.current.contains(range.commonAncestorContainer)) { setSelText(''); setSelPos(null); return }
      const rect = range.getBoundingClientRect()
      setSelText(selected)
      setSelPos({ x: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90), y: rect.top - 8 })
    }, 30)
  }

  const openNoteFor = (quote: string) => {
    setNoteQuote(quote)
    setNoteThought('')
    setNoteSaved(false)
    setNoteOpen(true)
    setSelText('')
    setSelPos(null)
    window.getSelection()?.removeAllRanges()
  }

  const saveReadingNote = () => {
    const saved = saveNote({ type: 'reading', title: `${title} · 摘录`, content: noteThought.trim(), sourceText: noteQuote })
    addCreatedNote(sessionArticleId, { id: saved.id, type: 'reading', title: saved.title, content: saved.content })
    setNoteSaved(true)
    setTimeout(() => setNoteOpen(false), 900)
  }

  /* ── 分析侧栏 ── */
  const [sidebarPrefs, setSidebarPrefs] = useState(loadSidebarPrefs)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarSentence, setSidebarSentence] = useState('')
  const [sidebarResult, setSidebarResult] = useState('')
  const [sidebarStreaming, setSidebarStreaming] = useState(false)
  const [resizingSidebar, setResizingSidebar] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartW = useRef(0)
  const streamRef = useRef<StreamHandle | null>(null)
  const [analysisSessionKey, setAnalysisSessionKey] = useState(0)

  const sidebarWidth = Math.min(sidebarPrefs.width, Math.floor(window.innerWidth * SIDEBAR_MAX_PCT))

  /* 分析侧栏打开时,正在分析的句子在正文里持续高亮(马克笔效果),关闭即消失 */
  const highlightRange = useMemo(
    () => (sidebarOpen && sidebarSentence ? findHighlightRange(content, sidebarSentence) : null),
    [sidebarOpen, sidebarSentence, content],
  )

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, JSON.stringify(sidebarPrefs)) } catch { /* ignore */ }
  }, [sidebarPrefs])

  const startAnalysis = (sentence: string) => {
    setAnalysisSessionKey((k) => k + 1)
    streamRef.current?.abort()
    setSidebarSentence(sentence)
    setSidebarResult('')
    setSidebarStreaming(true)
    setSidebarOpen(true)
    setSelText('')
    setSelPos(null)
    window.getSelection()?.removeAllRanges()

    analyzeGrammarStream(sentence.trim(), (delta) => {
      setSidebarResult((prev) => prev + delta)
    }).done.then((final) => {
      setSidebarResult(final)
    }).catch(() => {
      setSidebarResult('分析失败,请稍后重试')
    }).finally(() => {
      setSidebarStreaming(false)
    })
  }

  const toggleSidebarSide = () => {
    setSidebarPrefs((p) => ({ ...p, side: p.side === 'right' ? 'left' : 'right' }))
  }

  const onResizeDown = (e: React.PointerEvent) => {
    setResizingSidebar(true)
    resizeStartX.current = e.clientX
    resizeStartW.current = sidebarWidth
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizingSidebar) return
    let dx = e.clientX - resizeStartX.current
    // 右侧面板:把手在左缘,向左拖(dx<0)增大宽度 → 取反
    // 左侧面板:把手在右缘,向右拖(dx>0)增大宽度 → 原样
    if (sidebarPrefs.side === 'right') dx = -dx
    const newW = Math.min(Math.max(SIDEBAR_MIN, resizeStartW.current + dx), Math.floor(window.innerWidth * SIDEBAR_MAX_PCT))
    setSidebarPrefs((p) => ({ ...p, width: newW }))
  }
  const onResizeUp = () => { setResizingSidebar(false) }

  const isSideLeft = sidebarPrefs.side === 'left'
  /* 窄屏(平板竖屏/手机):分析侧栏改为覆盖层,不挤压正文 */
  const isNarrow = useMediaQuery('(max-width: 900px)')

  const sidebarPanel = sidebarOpen && (
    <>
      {isNarrow && (
        <div
          onClick={() => { streamRef.current?.abort(); setSidebarOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', zIndex: 4 }}
        />
      )}
      {!isNarrow && !isSideLeft && (
        <div
          onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={onResizeUp}
          title="拖动调整分析栏宽度"
          style={{ width: 6, cursor: 'col-resize', background: 'var(--color-border)', opacity: 0.3, transition: 'opacity var(--transition-fast)', flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3' }}
        />
      )}
      <div style={isNarrow ? {
        position: 'fixed', top: 0, bottom: 0, right: 0, width: 'min(440px, 94vw)', zIndex: 5,
        background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--color-border)', boxShadow: 'var(--shadow-raised)',
      } : {
        width: sidebarWidth, flexShrink: 0, overflow: 'auto',
        borderLeft: isSideLeft ? 'none' : '1px solid var(--color-border)',
        borderRight: isSideLeft ? '1px solid var(--color-border)' : 'none',
        background: 'var(--color-canvas)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)' }}>句子分析</span>
          <span style={{ flex: 1 }} />
          {!isNarrow && (
            <button onClick={toggleSidebarSide} title={isSideLeft ? '移到右侧' : '移到左侧'} style={{ ...btnStyle, padding: '4px 8px', fontSize: 10 }}>
              {isSideLeft ? '→' : '←'}
            </button>
          )}
          <button onClick={() => { streamRef.current?.abort(); setSidebarOpen(false) }} style={{ ...btnStyle, padding: '4px 8px', fontSize: 10 }}>✕ 关闭</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-md)' }}>
          <StudyResult
            key={analysisSessionKey}
            mode="grammar"
            sentence={sidebarSentence}
            analysis={sidebarResult}
            streaming={sidebarStreaming}
            compact={isNarrow || sidebarWidth < 380}
            onSaved={(kind) => {
              if (kind === 'sentence') {
                addSavedSentence(sessionArticleId, { id: `s-${Date.now()}`, title: sidebarSentence.slice(0, 40), sourceText: sidebarSentence })
              }
            }}
          />
        </div>
      </div>
      {!isNarrow && isSideLeft && (
        <div
          onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={onResizeUp}
          title="拖动调整分析栏宽度"
          style={{ width: 6, cursor: 'col-resize', background: 'var(--color-border)', opacity: 0.3, transition: 'opacity var(--transition-fast)', flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.6' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3' }}
        />
      )}
    </>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isNarrow ? '10px 12px' : '16px 24px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 12, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{subtitle}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!editing && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                <button onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))} style={{ ...btnStyle, padding: '6px 10px', borderRadius: 0, border: 'none', borderRight: '1px solid var(--color-border)' }}>A⁻</button>
                <button onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))} style={{ ...btnStyle, padding: '6px 10px', borderRadius: 0, border: 'none' }}>A⁺</button>
              </div>
              <button onClick={() => openNoteFor('')} style={btnStyle} title="写整篇阅读心得">写心得</button>
              {actions}
            </>
          )}
          {editing && editActions}
          <button onClick={onClose} style={btnStyle}>✕ 关闭</button>
        </div>
      </div>

      {/* Body: content + sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isSideLeft && sidebarPanel}

        <div ref={containerRef} onMouseUp={handleMouseUp}
          style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xxl)', maxWidth: sidebarOpen ? undefined : 800, margin: sidebarOpen ? undefined : '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {editing ? (
            <textarea value={editValue} onChange={e => onEditChange?.(e.target.value)}
              style={{ width: '100%', height: '100%', minHeight: 300, fontSize, lineHeight: 1.9, color: 'var(--color-text-soft)', background: 'var(--color-canvas-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: 'var(--space-lg)', fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          ) : contentElement ? (
            <div style={{ fontSize, lineHeight: 1.9, color: 'var(--color-text-soft)', fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px' }}>{contentElement}</div>
          ) : (
            <div style={{ fontSize, lineHeight: 1.9, color: 'var(--color-text-soft)', fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px' }}>
              {renderClickableText(content, handleWordClick, highlightRange)}
            </div>
          )}
        </div>

        {!isSideLeft && sidebarPanel}
      </div>

      {/* Selection toolbar — 只保留「分析」,记笔记走分析面板内部入口 */}
      {selPos && selText && !noteOpen && (
        <div style={{ position: 'fixed', left: selPos.x, top: selPos.y, transform: 'translate(-50%, -100%)', zIndex: zIndex + 10, display: 'flex', gap: 6, padding: 6, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-raised)' }}>
          <button onClick={() => startAnalysis(selText)}
            style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', padding: '5px 12px', background: 'var(--color-text)', border: '1px solid var(--color-text)', borderRadius: 'var(--radius-pill)', color: 'var(--color-canvas)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            分析
          </button>
        </div>
      )}

      {/* Note editor modal */}
      {noteOpen && (
        <div onClick={() => setNoteOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: zIndex + 20, background: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 94vw)', maxHeight: '80vh', overflow: 'auto', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-raised)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: 0 }}>
              阅读笔记 · {title}
            </p>
            {noteQuote ? (
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-soft)', borderLeft: '3px solid var(--color-text)', background: 'var(--color-canvas-soft)', padding: '10px 14px', borderRadius: '0 var(--radius-xs) var(--radius-xs) 0', fontFamily: 'Georgia, "Noto Serif", serif' }}>{noteQuote}</div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>整篇心得 — 读完《{title}》,你想到了什么?</p>
            )}
            <textarea value={noteThought} onChange={(e) => setNoteThought(e.target.value)}
              placeholder={noteQuote ? '我的想法:这段为什么打动你?哪个结构值得学?' : '写下你的阅读总结、收获或疑问…'}
              rows={4} autoFocus
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setNoteOpen(false)} style={btnStyle}>取消</button>
              <button onClick={saveReadingNote}
                style={{ ...btnStyle, background: noteSaved ? 'var(--color-success)' : 'var(--color-text)', color: noteSaved ? '#fff' : 'var(--color-canvas)', borderColor: noteSaved ? 'var(--color-success)' : 'var(--color-text)' }}>
                {noteSaved ? '已保存 ✓' : '保存到学习空间'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 点词即查迷你词卡(WordPopup 自带 fixed zIndex 1200,高于阅读器) */}
      {popupState && (
        <WordPopup
          word={popupState.word}
          anchorRect={popupState.rect}
          onClose={closePopup}
        />
      )}
    </div>
  )
}