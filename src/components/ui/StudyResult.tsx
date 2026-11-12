import { useMemo, useRef, useState } from 'react'
import AnalysisText, { parseAnalysisBlocks, blockAnchorId } from './AnalysisText'
import { chatAboutSentenceStream, type StreamHandle } from '../../utils/analyze'
import { saveNote } from '../../utils/notes'

/**
 * StudyResult — 句子研习窗内容区
 *
 * 结构:原句置顶 → 快速跳转条 → 折叠式分析 → 追问对话区 → 保存动作
 * 在小面板(360px)与大视图(720px)中复用,compact 控制字号密度。
 */

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  mode: 'grammar' | 'preposition'
  sentence: string
  analysis: string
  /** 分析仍在流式生成 */
  streaming: boolean
  /** 小面板(true)还是大视图(false) */
  compact?: boolean
  /** 大视图字号调节覆盖 */
  fontSizeOverride?: number
  onSaved?: (kind: 'sentence' | 'note') => void
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  margin: '0 0 4px',
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border)',
  background: active ? 'var(--color-text)' : 'transparent',
  color: active ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
})

export default function StudyResult({ mode, sentence, analysis, streaming, compact = true, fontSizeOverride, onSaved }: Props) {
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savedKind, setSavedKind] = useState<'sentence' | 'note' | null>(null)
  const chatStreamRef = useRef<StreamHandle | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const fontSize = fontSizeOverride ?? (compact ? 12.5 : 15)
  const { blocks } = useMemo(() => parseAnalysisBlocks(analysis), [analysis])
  const hasBlocks = blocks.length > 0

  const jumpTo = (blockId: string | null) => {
    if (!blockId) {
      // 回到顶部(翻译区)— 滚动最近的可滚动祖先
      scrollerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }
    document.getElementById(blockAnchorId(blockId))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const buildChatLog = () =>
    chat.filter((m) => m.content.trim()).map((m) => `${m.role === 'user' ? '问' : '答'}: ${m.content}`).join('\n\n')

  const ask = async () => {
    const q = question.trim()
    if (!q || asking || streaming) return
    setQuestion('')
    const history = chat.filter((m) => m.content.trim())
    setChat([...history, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    setAsking(true)
    const handle = chatAboutSentenceStream(
      { sentence, analysis, question: q, mode, history },
      (delta) => {
        setChat((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: last.content + delta }
          }
          return next
        })
      },
    )
    chatStreamRef.current = handle
    try {
      const finalText = await handle.done
      setChat((prev) => {
        const next = [...prev]
        if (next[next.length - 1]?.role === 'assistant') {
          next[next.length - 1] = { role: 'assistant', content: finalText }
        }
        return next
      })
    } catch {
      setChat((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant' && !last.content) {
          next[next.length - 1] = { role: 'assistant', content: '(回答失败,请稍后重试)' }
        }
        return next
      })
    } finally {
      setAsking(false)
      chatStreamRef.current = null
    }
  }

  const saveSentence = () => {
    const log = buildChatLog()
    saveNote({
      type: 'sentence',
      title: sentence.replace(/\s+/g, ' ').slice(0, 40),
      content: '',
      analysis: log ? `${analysis}\n\n【追问问答】\n${log}` : analysis,
      sourceText: sentence,
    })
    setSavedKind('sentence')
    onSaved?.('sentence')
  }

  const saveAsNote = () => {
    if (!noteText.trim()) return
    saveNote({
      type: 'text',
      content: noteText.trim(),
      sourceText: sentence,
      analysis: analysis.slice(0, 1500),
    })
    setNoteOpen(false)
    setNoteText('')
    setSavedKind('note')
    onSaved?.('note')
  }

  const actionBtn = (highlight: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-display)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 'var(--tracking-micro)',
    textTransform: 'uppercase',
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    border: highlight ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
    background: 'none',
    color: highlight ? 'var(--color-success)' : 'var(--color-text-secondary)',
    cursor: highlight ? 'default' : 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  })

  return (
    <div ref={scrollerRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', minHeight: 0 }}>
      {/* ═══ 原句置顶 ═══ */}
      <div style={{
        background: 'var(--color-canvas-soft)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xs)',
        padding: '8px 12px',
        flexShrink: 0,
      }}>
        <p style={labelStyle}>原句</p>
        <p style={{
          margin: 0,
          fontFamily: 'Georgia, "Noto Serif", serif',
          fontSize: compact ? 13 : 15,
          lineHeight: 1.6,
          color: 'var(--color-text)',
        }}>
          {sentence}
        </p>
      </div>

      {/* ═══ 快速跳转条 ═══ */}
      {hasBlocks && !streaming && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, flexShrink: 0,
          scrollbarWidth: 'thin',
        }}>
          <button style={chipStyle(false)} onClick={() => jumpTo(null)}>翻译</button>
          {blocks.map((b) => (
            <button key={b.id} style={chipStyle(false)} onClick={() => jumpTo(b.id)} title={b.heading}>
              {b.heading.length > 14 ? b.heading.slice(0, 14) + '…' : b.heading}
            </button>
          ))}
        </div>
      )}

      {/* ═══ 折叠式分析 ═══ */}
      <div style={{ flexShrink: 0 }}>
        {analysis ? (
          <AnalysisText text={analysis} fontSize={fontSize} collapsible streaming={streaming} />
        ) : streaming ? (
          <p style={{ fontSize: fontSize - 1, color: 'var(--color-text-secondary)', margin: 0 }}>老师正在拆解句子…</p>
        ) : null}
      </div>

      {/* ═══ 追问对话区 ═══ */}
      {!streaming && analysis && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-sm)',
          marginTop: 2,
          flexShrink: 0,
        }}>
          <p style={labelStyle}>还有哪里不懂?追问老师</p>

          {chat.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {chat.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: compact ? 12 : 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  overflowWrap: 'break-word',
                  ...(m.role === 'user'
                    ? { background: 'var(--color-text)', color: 'var(--color-canvas)' }
                    : { background: 'var(--color-canvas-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-soft)' }),
                }}>
                  {m.content || (i === chat.length - 1 && asking ? '思考中…' : '')}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
              placeholder={asking ? '老师回答中…' : '例如:为什么这里用 which 不用 that?'}
              disabled={asking}
              aria-label="追问"
              style={{
                flex: 1, minWidth: 0,
                padding: '7px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: compact ? 12 : 13,
                color: 'var(--color-text)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)',
                outline: 'none',
              }}
            />
            <button
              onClick={ask}
              disabled={!question.trim() || asking}
              style={{
                ...actionBtn(false),
                background: question.trim() && !asking ? 'var(--color-text)' : 'transparent',
                color: question.trim() && !asking ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                borderColor: question.trim() && !asking ? 'var(--color-text)' : 'var(--color-border)',
                opacity: question.trim() && !asking ? 1 : 0.5,
              }}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* ═══ 保存动作区 ═══ */}
      {!streaming && analysis && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-sm)',
          flexShrink: 0,
        }}>
          <button onClick={saveSentence} disabled={savedKind === 'sentence'} style={actionBtn(savedKind === 'sentence')}>
            {savedKind === 'sentence' ? '已存入句子库 ✓' : chat.length > 0 ? '存入句子库(含问答)' : '存入句子库'}
          </button>
          <button onClick={() => setNoteOpen((v) => !v)} style={actionBtn(savedKind === 'note')}>
            {savedKind === 'note' ? '已存笔记 ✓' : '记笔记'}
          </button>
        </div>
      )}

      {/* 记笔记 mini 表单 */}
      {noteOpen && savedKind !== 'note' && (
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xs)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0,
        }}>
          <p style={{ ...labelStyle, margin: 0 }}>我的想法(原句与分析会自动附上)</p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="这个句子让我学到 / 还疑惑的是…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 10px',
              fontFamily: 'var(--font-body)',
              fontSize: compact ? 12 : 13,
              lineHeight: 1.6,
              color: 'var(--color-text)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => setNoteOpen(false)} style={actionBtn(false)}>取消</button>
            <button
              onClick={saveAsNote}
              disabled={!noteText.trim()}
              style={{
                ...actionBtn(false),
                background: noteText.trim() ? 'var(--color-text)' : 'transparent',
                color: noteText.trim() ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                opacity: noteText.trim() ? 1 : 0.5,
              }}
            >
              保存笔记
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
