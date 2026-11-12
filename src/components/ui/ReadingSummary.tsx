import { useState, useRef } from 'react'
import { type ReadingSession, getPreviousArticles } from '../../utils/readingSession'
import { summarizeArticleStream } from '../../api/notes'
import { chatAboutSentenceStream, type StreamHandle } from '../../utils/analyze'
import { saveNote } from '../../utils/notes'
import { toast } from './Toast'
import AnalysisText from './AnalysisText'

/**
 * ReadingSummary — 悬浮球「笔记总览」面板
 * 展示本次阅读积累(查词/笔记/存句),一键生成文章精华总结(流式),
 * 可追问、可保存为阅读笔记。
 */

interface ChatLine {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  session: ReadingSession
  onClose?: () => void
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
  color: 'var(--color-text-secondary)', margin: '0 0 4px',
}

const chipStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)', padding: '2px 10px',
  borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)',
  background: 'transparent', color: 'var(--color-text-soft)', whiteSpace: 'nowrap',
}

const actionBtn = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
  padding: '6px 14px', borderRadius: 'var(--radius-pill)',
  border: active ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
  background: 'none', color: active ? 'var(--color-success)' : 'var(--color-text-secondary)',
  cursor: active ? 'default' : 'pointer', whiteSpace: 'nowrap',
  transition: 'all var(--transition-fast)',
})

export default function ReadingSummary({ session }: Props) {
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [chat, setChat] = useState<ChatLine[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [saved, setSaved] = useState(false)
  const summaryStreamRef = useRef<StreamHandle | null>(null)
  const chatStreamRef = useRef<StreamHandle | null>(null)

  const hasContent = !!(session.content && session.content.trim())
  const total = session.lookedUpWords.length + session.notesCreated.length + session.sentencesSaved.length

  const sessionNotes = [
    ...session.notesCreated.map((n) => ({ title: n.title, content: n.content })),
    ...session.sentencesSaved.map((s) => ({ title: s.title, content: '', sourceText: s.sourceText })),
  ]

  const requestSummary = () => {
    if (summarizing || !hasContent) return
    summaryStreamRef.current?.abort()
    setSummarizing(true)
    setSummary('')
    setSaved(false)
    const handle = summarizeArticleStream(
      {
        title: session.articleTitle,
        content: session.content ?? '',
        notes: sessionNotes,
        words: session.lookedUpWords.map((w) => w.word),
        previousArticles: getPreviousArticles(),
      },
      (delta) => setSummary((prev) => prev + delta),
    )
    summaryStreamRef.current = handle
    handle.done
      .then((final) => setSummary(final))
      .catch(() => setSummary((prev) => prev || '总结生成失败,请稍后重试'))
      .finally(() => {
        setSummarizing(false)
        summaryStreamRef.current = null
      })
  }

  const ask = async () => {
    const q = question.trim()
    if (!q || asking || summarizing) return
    setQuestion('')
    const history = chat.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content }))
    setChat((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    setAsking(true)
    const handle = chatAboutSentenceStream(
      {
        sentence: `文章《${session.articleTitle}》`,
        analysis: summary,
        question: q,
        mode: 'grammar',
        history,
      },
      (delta) => setChat((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + delta }
        return next
      }),
    )
    chatStreamRef.current = handle
    try {
      const final = await handle.done
      setChat((prev) => {
        const next = [...prev]
        if (next[next.length - 1]?.role === 'assistant') next[next.length - 1] = { role: 'assistant', content: final }
        return next
      })
    } catch {
      setChat((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant' && !last.content) next[next.length - 1] = { role: 'assistant', content: '(回答失败,请稍后重试)' }
        return next
      })
    } finally {
      setAsking(false)
      chatStreamRef.current = null
    }
  }

  const saveSummary = () => {
    if (saved || !summary) return
    const chatText = chat
      .filter((m) => m.content.trim())
      .map((m) => (m.role === 'user' ? `问: ${m.content}` : `答: ${m.content}`))
      .join('\n')
    saveNote({
      type: 'reading',
      title: `《${session.articleTitle}》精华总结`,
      content: chatText ? `${summary}\n\n--- 追问 ---\n${chatText}` : summary,
    })
    setSaved(true)
    toast.success('精华总结已存入阅读笔记')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {/* 统计行 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <span style={{ ...labelStyle, margin: 0 }}>本文积累</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          查词 {session.lookedUpWords.length} · 笔记 {session.notesCreated.length} · 存句 {session.sentencesSaved.length}
        </span>
      </div>

      {/* 查过的词 */}
      {session.lookedUpWords.length > 0 && (
        <div>
          <p style={labelStyle}>查过的词</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {session.lookedUpWords.map((w) => (
              <span key={w.word + w.timestamp} style={chipStyle} title={w.meaning}>{w.word}</span>
            ))}
          </div>
        </div>
      )}

      {/* 笔记 */}
      {session.notesCreated.length > 0 && (
        <div>
          <p style={labelStyle}>做的笔记</p>
          {session.notesCreated.map((n) => (
            <div key={n.id} style={{ fontSize: 11, color: 'var(--color-text-soft)', lineHeight: 1.5, marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid var(--color-border)' }}>
              {n.title || n.content.slice(0, 40)}
            </div>
          ))}
        </div>
      )}

      {/* 存的句子 */}
      {session.sentencesSaved.length > 0 && (
        <div>
          <p style={labelStyle}>存下的句子</p>
          {session.sentencesSaved.map((s) => (
            <div key={s.id} style={{ fontSize: 11, color: 'var(--color-text-soft)', fontStyle: 'italic', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid var(--color-border)' }}>
              {s.sourceText.slice(0, 60)}{s.sourceText.length > 60 ? '…' : ''}
            </div>
          ))}
        </div>
      )}

      {/* 精华总结按钮 */}
      {!summary && (
        <button
          onClick={requestSummary}
          disabled={summarizing || !hasContent}
          style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
            padding: '10px 16px', borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--color-text)', background: 'transparent',
            color: 'var(--color-text)', cursor: hasContent && !summarizing ? 'pointer' : 'default',
            opacity: hasContent ? 1 : 0.4, textAlign: 'center',
            transition: 'all var(--transition-fast)',
          }}
          title={hasContent ? 'AI 通读全文和你的标记,生成精华总结' : '需要文章正文才能总结,请从阅读器打开'}
        >
          {summarizing ? 'AI 正在通读全文…' : total === 0 ? '生成文章精华总结' : `生成文章精华总结(含你的 ${total} 条标记)`}
        </button>
      )}

      {/* 总结结果(流式渲染) */}
      {summary && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)' }}>
          <p style={labelStyle}>{summarizing ? '总结生成中…' : '文章精华总结'}</p>
          <AnalysisText text={summary} fontSize={12} />
        </div>
      )}

      {/* 追问区 */}
      {summary && !summarizing && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)' }}>
          {chat.map((m, i) => (
            <div key={i} style={{
              maxWidth: '88%',
              padding: '4px 10px',
              borderRadius: 'var(--radius-xs)',
              fontSize: 11, lineHeight: 1.5, marginBottom: 4,
              whiteSpace: 'pre-line', overflowWrap: 'break-word',
              marginLeft: m.role === 'user' ? 'auto' : 0,
              ...(m.role === 'user'
                ? { background: 'var(--color-text)', color: 'var(--color-canvas)' }
                : { background: 'var(--color-canvas-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text-soft)' }),
            }}>
              {m.content || (i === chat.length - 1 && asking ? '思考中…' : '')}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask() } }}
              placeholder={asking ? '回答中…' : '追问这篇文章…'}
              disabled={asking}
              aria-label="追问"
              style={{
                flex: 1, minWidth: 0, padding: '5px 10px',
                fontFamily: 'var(--font-body)', fontSize: 11,
                color: 'var(--color-text)', background: 'transparent',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', outline: 'none',
              }}
            />
            <button onClick={ask} disabled={!question.trim() || asking}
              style={{
                ...chipStyle,
                borderColor: question.trim() && !asking ? 'var(--color-text)' : 'var(--color-border)',
                color: question.trim() && !asking ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                background: question.trim() && !asking ? 'var(--color-text)' : 'transparent',
                cursor: question.trim() && !asking ? 'pointer' : 'default',
              }}>
              发送
            </button>
          </div>
        </div>
      )}

      {/* 保存 */}
      {summary && !summarizing && (
        <button onClick={saveSummary} disabled={saved} style={actionBtn(saved)}>
          {saved ? '已存入阅读笔记 ✓' : chat.length > 0 ? '保存总结(含追问)' : '保存为阅读笔记'}
        </button>
      )}
    </div>
  )
}
