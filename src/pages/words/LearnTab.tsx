import { useState, useEffect, useRef } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { fetchQueue, fetchStats, startLearning, submitReview, type WordLearning } from '../../api/learn'
import { request } from '../../api/client'
import { getBookmarks } from '../../utils/bookmarks'

type View = 'menu' | 'entry' | 'review' | 'complete'

export default function LearnTab() {
  const [view, setView] = useState<View>('menu')
  const [queue, setQueue] = useState<WordLearning[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, dormant: 0, due: 0 })
  const [loading, setLoading] = useState(false)

  // Entry form
  const [entryWord, setEntryWord] = useState('')
  const [entryMeaning, setEntryMeaning] = useState('')
  const [entryAnchor, setEntryAnchor] = useState('')

  // Review
  const [reviewIndex, setReviewIndex] = useState(0)
  const [spellingInput, setSpellingInput] = useState('')
  const [spellingResult, setSpellingResult] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    setLoading(true)
    // Sync bookmarked words to learning system
    const bookmarks = getBookmarks().map(b => b.word)
    if (bookmarks.length > 0) {
      await request('/learn/sync', { method: 'POST', body: JSON.stringify({ words: bookmarks }), headers: { 'Content-Type': 'application/json' } }).catch(() => {})
    }
    const [q, s] = await Promise.all([fetchQueue(), fetchStats()])
    setQueue(q)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (view === 'review' && spellingResult === 'idle' && inputRef.current) inputRef.current.focus()
  }, [view, reviewIndex, spellingResult])

  /* ── Entry ──────────────────────────────────────────────── */

  const handleEntry = async () => {
    if (!entryWord.trim() || !entryMeaning.trim()) return
    try {
      await startLearning(entryWord.trim(), entryMeaning.trim(), entryAnchor.trim())
      setEntryWord(''); setEntryMeaning(''); setEntryAnchor('')
      setView('menu')
      loadData()
    } catch (err) {
      alert('录入失败，请稍后重试')
    }
  }

  /* ── Review ─────────────────────────────────────────────── */

  const handleStartReview = () => {
    if (queue.length === 0) return
    setReviewIndex(0); setSessionCorrect(0); setSessionWrong(0)
    setSpellingInput(''); setSpellingResult('idle')
    setView('review')
  }

  const handleSpellingSubmit = async () => {
    const current = queue[reviewIndex]
    const answer = spellingInput.trim()
    const isCorrect = answer.toLowerCase() === current.word.toLowerCase()

    if (isCorrect) {
      setSpellingResult('correct')
      setSessionCorrect((c) => c + 1)
    } else {
      setSpellingResult('wrong')
      setCorrectAnswer(current.word)
      setSessionWrong((w) => w + 1)
    }
    await submitReview(current.word, isCorrect, isCorrect ? 0 : 1)
  }

  const handleNextReview = () => {
    const next = reviewIndex + 1
    if (next >= queue.length) { setView('complete'); loadData() }
    else { setReviewIndex(next); setSpellingInput(''); setSpellingResult('idle'); setCorrectAnswer('') }
  }

  /* ── Styles ─────────────────────────────────────────────── */

  const s = {
    label: { fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  }

  /* ── menu ───────────────────────────────────────────────── */

  if (view === 'menu') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          {[{ label: '待复习', value: stats.due }, { label: '已激活', value: stats.active }, { label: '已休眠', value: stats.dormant }].map((st) => (
            <Card key={st.label}>
              <div style={{ textAlign: 'center', padding: 'var(--space-sm) var(--space-lg)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{st.value}</p>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', margin: '4px 0 0', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{st.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <Button onClick={() => setView('entry')}>录入新词</Button>
          <Button onClick={handleStartReview} disabled={queue.length === 0}>
            开始复习 {queue.length > 0 ? `(${queue.length})` : ''}
          </Button>
        </div>

        {loading && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>加载中…</p>}

        {queue.length > 0 && (
          <div>
            <p style={{ ...s.label, marginBottom: 'var(--space-sm)' }}>待复习列表</p>
            <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
              {queue.slice(0, 10).map((w) => (
                <div key={w.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{w.word}</span>
                    {w.memory_anchor && <span style={{ fontSize: 11, marginLeft: 8 }}>📌</span>}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                    {w.state === 'learning' ? '🆕 新学' : `间隔 ${Math.round(w.interval_hours)}h`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ── entry ──────────────────────────────────────────────── */

  if (view === 'entry') {
    return (
      <div style={{ maxWidth: 500 }}>
        <button onClick={() => setView('menu')} style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-md)' }}>← 返回</button>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: '0 0 var(--space-xl)' }}>录入新词</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <p style={s.label}>单词</p>
            <input value={entryWord} onChange={(e) => setEntryWord(e.target.value)} placeholder="输入英文单词" style={{ ...s.input, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }} />
          </div>
          <div>
            <p style={s.label}>中文释义（必须手动输入）</p>
            <input value={entryMeaning} onChange={(e) => setEntryMeaning(e.target.value)} placeholder="手动输入释义，强制记忆" style={s.input} />
          </div>
          <div>
            <p style={s.label}>记忆锚点（今日真实经历，可选）</p>
            <textarea value={entryAnchor} onChange={(e) => setEntryAnchor(e.target.value)} placeholder="例：今天在星巴克点咖啡时想到了这个词…" rows={3} style={{ ...s.input, resize: 'none' }} />
          </div>
          <Button onClick={handleEntry} disabled={!entryWord.trim() || !entryMeaning.trim()}>录入并开始记忆</Button>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>有锚点的词初始稳固值更高，30分钟后弹出拼写测试。</p>
        </div>
      </div>
    )
  }

  /* ── review ─────────────────────────────────────────────── */

  if (view === 'review' && queue.length > 0) {
    const current = queue[reviewIndex]
    return (
      <div style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <button onClick={() => { setView('menu'); loadData() }} style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← 退出</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--color-text-secondary)' }}>{reviewIndex + 1} / {queue.length}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#22c55e' }}>✓ {sessionCorrect}</span>
        </div>
        <Card>
          <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>拼写测试</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 var(--space-xl)' }}>请输入对应单词</p>
            {current.memory_anchor && <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', fontStyle: 'italic', opacity: 0.6 }}>📌 {current.memory_anchor}</p>}
            <p style={{ marginBottom: 'var(--space-lg)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', padding: '2px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>{current.word}</span>
            </p>
            {spellingResult === 'idle' ? (
              <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                <input ref={inputRef} value={spellingInput} onChange={(e) => setSpellingInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSpellingSubmit() }} placeholder="输入英文拼写…" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  style={{ width: 260, padding: '10px 16px', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
                <Button onClick={handleSpellingSubmit} disabled={!spellingInput.trim()}>确认</Button>
              </div>
            ) : spellingResult === 'correct' ? (
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginBottom: 'var(--space-md)' }}>✓ 正确！</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>{current.word}</p>
                <Button onClick={handleNextReview}>下一个 →</Button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 'var(--space-md)' }}>✗ 错误</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>你的输入:</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 var(--space-sm)', textDecoration: 'line-through' }}>{spellingInput}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>正确答案:</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', margin: '0 0 var(--space-md)' }}>{correctAnswer}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>30分钟后将重新测试此词</p>
                <Button onClick={handleNextReview}>下一个 →</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  /* ── complete ───────────────────────────────────────────── */

  if (view === 'complete') {
    return (
      <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: 'var(--tracking-heading)', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>🎉 复习完成</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xxl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', margin: 0 }}>{sessionCorrect}</p><p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>正确</p></div>
          <div style={{ textAlign: 'center' }}><p style={{ fontSize: 28, fontWeight: 700, color: '#ef4444', margin: 0 }}>{sessionWrong}</p><p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>需重练</p></div>
        </div>
        <Button onClick={() => { setView('menu'); loadData() }}>返回</Button>
      </div>
    )
  }

  return null
}
