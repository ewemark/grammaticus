import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SpeakerButton, { speakerBtnBase } from '../components/ui/SpeakerButton'
import { useApi } from '../hooks/useApi'
import { fetchWord } from '../api/words'
import { isBookmarked, toggleBookmark } from '../utils/bookmarks'

/* ── shared inline style factories ─────────────────────────────── */

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-micro)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--space-lg)',
}

const quoteBlock: React.CSSProperties = {
  borderLeft: '2px solid var(--color-text)',
  padding: 'var(--space-lg) var(--space-xl)',
  background: '#0a0a0a',
  fontSize: 'var(--text-body)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'pre-line',
}

const tableHeader: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-micro)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  paddingBottom: 'var(--space-sm)',
  borderBottom: '1px solid var(--color-border)',
}

const tableCell: React.CSSProperties = {
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-ui)',
  color: 'var(--color-text-secondary)',
  padding: 'var(--space-sm) 0',
  verticalAlign: 'top',
}

const tableCellStrong: React.CSSProperties = {
  ...tableCell,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  color: 'var(--color-text)',
  letterSpacing: 'var(--tracking-micro)',
}

const posColors: Record<string, 'purple' | 'green' | 'pink' | 'orange' | 'blue' | 'yellow' | 'gray'> = {
  NOUN: 'purple',
  VERB: 'green',
  ADJECTIVE: 'pink',
  ADVERB: 'orange',
  PREPOSITION: 'blue',
  CONJUNCTION: 'yellow',
  PRONOUN: 'gray',
}

/* ── loading skeleton ──────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Link to="/words" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← WORDS
        </Link>
      </div>
      <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
          正在加载…
        </p>
      </div>
    </div>
  )
}

/* ── not-found state ───────────────────────────────────────────── */

function NotFound({ word }: { word: string }) {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Link to="/words" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← WORDS
        </Link>
      </div>
      <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', textTransform: 'uppercase', color: 'var(--color-text)', marginBottom: 'var(--space-md)' }}>
          "{word}"
        </p>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          词库中暂未收录此单词。
        </p>
        <Link to="/words"><Button variant="ghost">浏览词库</Button></Link>
      </div>
    </div>
  )
}

/* ── main component ────────────────────────────────────────────── */

export default function WordDetail() {
  const { lemma } = useParams<{ lemma: string }>()
  const word = lemma ?? ''
  const { data: detail, loading } = useApi(() => fetchWord(word), [word])

  const simple = detail?.simple
  const rich = detail?.rich
  const pos = rich?.pos ?? simple?.pos ?? ''
  const badgeColor = posColors[pos] ?? 'gray'

  const [bookmarked, setBookmarked] = useState(() => isBookmarked(word))
  const handleToggleBookmark = useCallback(() => {
    const meaning = rich?.posNote ?? simple?.meaning ?? ''
    const nowBookmarked = toggleBookmark(word, meaning, pos)
    setBookmarked(nowBookmarked)
  }, [word, pos, rich?.posNote, simple?.meaning])

  useEffect(() => { setBookmarked(isBookmarked(word)) }, [word])

  if (loading) return <LoadingSkeleton />
  if (!simple && !rich) return <NotFound word={word} />

  /* ── rich-data layout ─────────────────────────────────────── */

  if (rich) {
    return (
      <div>
        {/* Back link */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <Link to="/words" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            ← WORDS
          </Link>
        </div>

        {/* ═══ 1. Hero ═══ */}
        <div style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <Badge color={badgeColor}>{rich.pos}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-xl)', fontWeight: 700,
              lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)',
              color: 'var(--color-text)', margin: 0,
            }}>
              {rich.word}
            </h2>
            <button
              onClick={handleToggleBookmark}
              style={{
                ...speakerBtnBase,
                marginBottom: 6,
                color: bookmarked ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                background: bookmarked ? 'var(--color-text)' : 'transparent',
                borderColor: bookmarked ? 'var(--color-text)' : 'var(--color-border)',
              }}
            >
              {bookmarked ? '★ 已收藏' : '☆ 收藏'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <p style={{ fontSize: 'var(--text-body-lg)', color: 'var(--color-text-secondary)', margin: 0 }}>
              {rich.pronunciation}
            </p>
            <SpeakerButton word={rich.word} />
          </div>
        </div>

        {/* ═══ 2. 核心意象 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>核心意象</h3>
          <div style={quoteBlock}>{rich.coreImage}</div>
        </section>

        {/* ═══ 3. 形态与词性 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>形态与词性</h3>
          <Card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeader, textAlign: 'left', width: '25%' }}>词形</th>
                  <th style={{ ...tableHeader, textAlign: 'left', width: '25%' }}>词性</th>
                  <th style={{ ...tableHeader, textAlign: 'left', width: '50%' }}>说明</th>
                </tr>
              </thead>
              <tbody>
                {rich.forms.map((f, i) => (
                  <tr key={i} style={{ borderBottom: i < rich.forms.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <td style={{ ...tableCellStrong, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>{f.form}</td>
                    <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text)' }}>{f.pos}</td>
                    <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ═══ 4. 语义辐射 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>语义辐射</h3>
          <div style={{ ...quoteBlock, marginBottom: 'var(--space-xl)', borderLeftColor: 'var(--color-text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)', display: 'block', marginBottom: 'var(--space-sm)' }}>
              原子核心义
            </span>
            {rich.atomicCore}
          </div>
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '18%' }}>半径</th>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '22%' }}>词性 + 结构</th>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '22%' }}>含义</th>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '38%' }}>例句</th>
                  </tr>
                </thead>
                <tbody>
                  {rich.semanticRadii.map((r, i) => (
                    <tr key={i} style={{ borderBottom: i < rich.semanticRadii.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ ...tableCellStrong, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)', textTransform: 'none', fontSize: 'var(--text-micro)' }}>{r.label}</td>
                      <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', color: 'var(--color-text)' }}>{r.structure}</td>
                      <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>{r.meaning}</td>
                      <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)', fontStyle: 'italic' }}>{r.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* ═══ 5. 语法与强制搭配 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>语法与强制搭配</h3>
          <Card>
            <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
              {rich.grammarRules.map((rule, i) => (
                <div key={i}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0 0 var(--space-sm)' }}>
                    {rule.title}
                  </p>
                  <ul style={{ margin: 0, padding: '0 0 0 var(--space-lg)', display: 'grid', gap: 'var(--space-xs)' }}>
                    {rule.items.map((item, j) => (
                      <li key={j} style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ═══ 6. 深度例句诊断 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>深度例句诊断</h3>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {rich.exampleDiagnoses.map((ex, i) => (
              <Card key={i}>
                <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text)', fontStyle: 'italic', margin: '0 0 var(--space-md)' }}>
                  "{ex.example}"
                </p>
                <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 'var(--space-md)' }} />
                <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {ex.diagnosis}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ 7. 认知陷阱与近义词边界 ═══ */}
        <section style={{ marginBottom: 'var(--space-section)' }}>
          <h3 style={sectionTitle}>认知陷阱与近义词边界</h3>
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '18%' }}>词汇</th>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '40%' }}>核心区别</th>
                    <th style={{ ...tableHeader, textAlign: 'left', width: '42%' }}>对比例句</th>
                  </tr>
                </thead>
                <tbody>
                  {rich.synonymComparisons.map((s, i) => (
                    <tr key={i} style={{ borderBottom: i < rich.synonymComparisons.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ ...tableCellStrong, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>{s.word}</td>
                      <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>{s.difference}</td>
                      <td style={{ ...tableCell, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)', fontStyle: 'italic' }}>{s.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* ═══ 8. 一句话穿透 ═══ */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h3 style={sectionTitle}>一句话穿透</h3>
          <div style={quoteBlock}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text)', display: 'block', marginBottom: 'var(--space-sm)' }}>
              🧠
            </span>
            {rich.oneLinePenetration}
          </div>
        </section>

      </div>
    )
  }

  /* ── simple-data fallback layout ──────────────────────────── */

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <Link to="/words" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          ← WORDS
        </Link>
      </div>

      <div style={{ marginBottom: 'var(--space-xxl)' }}>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Badge color={badgeColor}>{pos}</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-xl)', fontWeight: 700,
            lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)',
            color: 'var(--color-text)', margin: 0,
          }}>
            {simple?.word ?? word}
          </h2>
          <button
            onClick={handleToggleBookmark}
            style={{
              ...speakerBtnBase,
              marginBottom: 6,
              color: bookmarked ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
              background: bookmarked ? 'var(--color-text)' : 'transparent',
              borderColor: bookmarked ? 'var(--color-text)' : 'var(--color-border)',
            }}
          >
            {bookmarked ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
        {simple && (
          <p style={{ fontSize: 'var(--text-body-lg)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>
            {simple.meaning}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <SpeakerButton word={simple?.word ?? word} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-md)', marginBottom: 'var(--space-xxl)' }}>
        {simple && (
          <Card>
            <h4 style={{ ...sectionTitle, marginBottom: 'var(--space-md)' }}>例句</h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
              "{simple.example}"
            </p>
          </Card>
        )}
        <Card>
          <h4 style={{ ...sectionTitle, marginBottom: 'var(--space-md)' }}>详细解析</h4>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            此单词的深度解析尚未收录。词库中已有 {word} 的基础释义，完整解析正在制作中。
          </p>
        </Card>
      </div>

    </div>
  )
}
