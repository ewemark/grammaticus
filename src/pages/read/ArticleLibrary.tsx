import { useState, useEffect, useCallback } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { fetchArticles, fetchArticle, fetchBooks, type ArticleListItem, type ArticleFull } from '../../api/articles'
import { tabPill } from '../../styles/typography'
import { isRead, toggleRead, getReadArticles } from '../../utils/readingProgress'

/* ── hard-coded articles for non-NCE categories ─────────────── */

const OTHER_ARTICLES = [
  { id: 'gettysburg', title: 'The Gettysburg Address', title_cn: '葛底斯堡演说', level: 'INTERMEDIATE', category: '经典演讲', content: `Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.\n\nNow we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this.\n\nBut, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth.` },
  { id: 'modest', title: 'A Modest Proposal', title_cn: '一个温和的建议', level: 'ADVANCED', category: '经典文学', content: `It is a melancholy object to those who walk through this great town or travel in the country, when they see the streets, the roads, and cabin doors, crowded with beggars of the female sex, followed by three, four, or six children, all in rags and importuning every passenger for an alms. These mothers, instead of being able to work for their honest livelihood, are forced to employ all their time in strolling to beg sustenance for their helpless infants: who as they grow up either turn thieves for want of work, or leave their dear native country to fight for the Pretender in Spain, or sell themselves to the Barbadoes.\n\nI think it is agreed by all parties that this prodigious number of children in the arms, or on the backs, or at the heels of their mothers, and frequently of their fathers, is in the present deplorable state of the kingdom a very great additional grievance; and, therefore, whoever could find out a fair, cheap, and easy method of making these children sound, useful members of the commonwealth, would deserve so well of the public as to have his statue set up for a preserver of the nation.` },
  { id: 'climate', title: 'Daily: Climate Change', title_cn: '每日：气候变化', level: 'INTERMEDIATE', category: '每日短文', content: `Climate change is one of the most pressing issues of our time. Rising global temperatures have led to more frequent extreme weather events, from devastating wildfires in Australia and California to unprecedented floods in Europe and Asia.\n\nScientists warn that we have less than a decade to take meaningful action before the damage becomes irreversible. However, there is still hope. Renewable energy sources like solar and wind power are becoming cheaper and more efficient every year. Young activists around the world are demanding change from their governments.\n\nThe question is no longer whether we should act, but how quickly we can transform our economies and lifestyles to protect the planet for future generations. Every small action counts—from reducing plastic use to supporting green policies. Together, we can make a difference.` },
  { id: 'habits', title: 'Daily: The Power of Habits', title_cn: '每日：习惯的力量', level: 'BEGINNER', category: '每日短文', content: `We are what we repeatedly do. Excellence, then, is not an act, but a habit. This famous quote from Aristotle reminds us that our daily routines shape who we become.\n\nThink about your morning. Do you reach for your phone first thing? Or do you take a moment to stretch and breathe? Small choices add up. If you read just ten pages a day, you will finish about fifteen books in a year. If you walk for twenty minutes every morning, you will cover more than a hundred kilometers in a year.\n\nThe secret is not in doing something huge once. The secret is in doing something small, again and again, until it becomes part of who you are. Start small. Stay consistent. Watch your life transform.` },
]

/* ── helpers ─────────────────────────────────────────────────── */

/** Group articles into parts. Book 1 uses groups of 10, others use 5. */
function groupIntoParts(articles: ArticleListItem[], groupSize: number): { label: string; items: ArticleListItem[] }[] {
  const parts: { label: string; items: ArticleListItem[] }[] = []
  for (let i = 0; i < articles.length; i += groupSize) {
    const chunk = articles.slice(i, i + groupSize)
    const firstLesson = chunk[0].lesson
    const lastLesson = chunk[chunk.length - 1].lesson
    const label = firstLesson === lastLesson ? `Lesson ${firstLesson}` : `Lessons ${firstLesson}–${lastLesson}`
    parts.push({ label, items: chunk })
  }
  return parts
}

/* ── collapsible part header ────────────────────────────────── */

const partHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-micro)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  padding: 'var(--space-sm) 0',
  borderBottom: '1px solid var(--color-border)',
  marginBottom: 'var(--space-md)',
  userSelect: 'none',
}

const chevronStyle = (open: boolean): React.CSSProperties => ({
  display: 'inline-block',
  transition: 'transform var(--transition-fast)',
  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
  fontSize: 10,
})

/* ── component ───────────────────────────────────────────────── */

export default function ArticleLibrary() {
  const [category, setCategory] = useState('新概念英语')
  const [books, setBooks] = useState<string[]>([])
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [book, setBook] = useState('Book 1')
  const [selected, setSelected] = useState<ArticleFull | null>(null)
  const [selectedOther, setSelectedOther] = useState<(typeof OTHER_ARTICLES)[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingArticle, setLoadingArticle] = useState(false)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [fullscreen, setFullscreen] = useState<{ title: string; content: string; subtitle: string; articleId: number | string } | null>(null)
  const [readArticles, setReadArticles] = useState(getReadArticles())
  const [fontSize, setFontSize] = useState(18)
  const refreshRead = useCallback(() => setReadArticles(getReadArticles()), [])

  const categories = ['新概念英语', '经典演讲', '经典文学', '每日短文']

  // Book 1 groups of 10, others groups of 5
  const groupSize = book === 'Book 1' ? 10 : 5

  const togglePart = (key: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    fetchBooks()
      .then((data) => { setBooks(data); if (data.length > 0) setBook(data[0]) })
      .catch(() => {}) // books list non-critical
  }, [])

  useEffect(() => {
    if (category !== '新概念英语' || !book) return
    setLoading(true)
    fetchArticles(book)
      .then((data) => { setArticles(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [category, book])

  const handleSelectArticle = (a: ArticleListItem) => {
    setLoadingArticle(true)
    fetchArticle(a.id)
      .then((full) => { setSelected(full); setLoadingArticle(false) })
      .catch(() => setLoadingArticle(false))
  }

  /* ── Determine content ─────────────────────────────────── */
  let content: React.ReactNode = null

  if (loadingArticle) {
    content = (
      <div style={{ textAlign: 'center', padding: 'var(--space-huge) 0' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>加载文章…</p>
      </div>
    )
  } else if (selected) {
    const lc = selected.level === 'BEGINNER' ? 'green' : selected.level === 'INTERMEDIATE' ? 'blue' : 'purple'
    content = (
      <div>
        <button onClick={() => setSelected(null)} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-md)' }}>
          ← 返回 {selected.book}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Badge color={lc}>{selected.level}</Badge>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{selected.book} · Lesson {selected.lesson}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg)', fontWeight: 700, lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: '0 0 var(--space-xs)' }}>{selected.title}</h3>
            {selected.title_cn && <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>{selected.title_cn}</p>}
          </div>
          <button
            onClick={() => setFullscreen({ title: selected.title + (selected.title_cn ? ' · '+selected.title_cn : ''), content: selected.content, subtitle: selected.book + ' Lesson '+selected.lesson, articleId: selected.id })}
            style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '4px 12px', cursor: 'pointer', flexShrink: 0, marginLeft: 'var(--space-md)' }}
          >
            放大阅读
          </button>
        </div>
        <Card><div style={{ padding: 'var(--space-lg) 0' }}><p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{selected.content}</p></div></Card>
      </div>
    )
  } else if (selectedOther) {
    const lc = selectedOther.level === 'BEGINNER' ? 'green' : selectedOther.level === 'INTERMEDIATE' ? 'blue' : 'purple'
    content = (
      <div>
        <button onClick={() => setSelectedOther(null)} style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'var(--space-md)' }}>
          ← 返回 {selectedOther.category}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <Badge color={lc}>{selectedOther.level}</Badge>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{selectedOther.category}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-lg)', fontWeight: 700, lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: '0 0 var(--space-xs)' }}>{selectedOther.title}</h3>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>{selectedOther.title_cn}</p>
          </div>
          <button
            onClick={() => setFullscreen({ title: selectedOther.title + ' · '+selectedOther.title_cn, content: selectedOther.content, subtitle: selectedOther.category, articleId: selectedOther.id })}
            style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '4px 12px', cursor: 'pointer', flexShrink: 0, marginLeft: 'var(--space-md)' }}
          >
            放大阅读
          </button>
        </div>
        <Card><div style={{ padding: 'var(--space-lg) 0' }}><p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{selectedOther.content}</p></div></Card>
      </div>
    )
  } else {
    /* ── Main list ──────────────────────────────────────────── */
    content = (
    <div>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button key={c} style={tabPill(category === c)} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {/* NCE: book sub-tabs + grouped articles */}
      {category === '新概念英语' && (
        <>
          <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
            {books.map((b) => (
              <button key={b} style={{
                ...tabPill(false), padding: 'var(--space-xs) var(--space-sm)', fontSize: 11,
                borderColor: book === b ? 'var(--color-text)' : 'var(--color-border)',
                color: book === b ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                background: book === b ? 'var(--color-text)' : 'transparent',
              }} onClick={() => setBook(b)}>
                {b.replace('Book ', '第')}册
              </button>
            ))}
          </div>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', textAlign: 'center', padding: 'var(--space-huge) 0' }}>加载中…</p>
          ) : (
            <div>
              {groupIntoParts(articles, groupSize).map((part, pi) => {
                const partKey = `${book}-${pi}`
                const isOpen = expandedParts.has(partKey)
                const partHasRead = part.items.some((a) => readArticles.has(String(a.id)))
                return (
                <div key={pi} style={{ marginBottom: 'var(--space-xxl)' }}>
                  <div style={partHeaderStyle} onClick={() => togglePart(partKey)}>
                    <span style={{ ...chevronStyle(isOpen), color: partHasRead ? '#22c55e' : 'var(--color-text-secondary)' }}>▶</span>
                    <span>Part {pi + 1} — {part.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                      {part.items.filter((a) => readArticles.has(String(a.id))).length}/{part.items.length} 课{isOpen ? '' : ' (已折叠)'}
                    </span>
                  </div>
                  {isOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 'var(--space-md)' }}>
                    {part.items.map((a) => {
                      const articleRead = readArticles.has(String(a.id))
                      return (
                      <Card key={a.id}>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                          <Badge color={a.level === 'BEGINNER' ? 'green' : a.level === 'INTERMEDIATE' ? 'blue' : 'purple'}>{a.level}</Badge>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)', color: 'var(--color-text-secondary)' }}>Lesson {a.lesson}</span>
                          {articleRead && <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 'auto' }}>已读 ✓</span>}
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: articleRead ? '#22c55e' : 'var(--color-text)', margin: '0 0 var(--space-sm)' }}>{a.title}</h4>
                        <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>{a.title_cn}</p>
                        <Button variant="ghost" onClick={() => handleSelectArticle(a)}>阅读全文</Button>
                      </Card>
                      )
                    })}
                  </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Other categories: local data */}
      {category !== '新概念英语' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 'var(--space-md)' }}>
          {OTHER_ARTICLES.filter((a) => a.category === category).map((a) => {
            const articleRead = readArticles.has(String(a.id))
            return (
            <Card key={a.id}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <Badge color={a.level === 'BEGINNER' ? 'green' : a.level === 'INTERMEDIATE' ? 'blue' : 'purple'}>{a.level}</Badge>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)', color: 'var(--color-text-secondary)' }}>{a.category}</span>
                {articleRead && <span style={{ fontSize: 10, color: '#22c55e', marginLeft: 'auto' }}>已读 ✓</span>}
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: articleRead ? '#22c55e' : 'var(--color-text)', margin: '0 0 var(--space-sm)' }}>{a.title}</h4>
              <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>{a.title_cn}</p>
              <Button variant="ghost" onClick={() => setSelectedOther(a)}>阅读全文</Button>
            </Card>
            )
          })}
        </div>
      )}
    </div>
    )
  }

  return (
    <>
      {content}
      {/* Fullscreen reading overlay */}
      {fullscreen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#000000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{fullscreen.title}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 12, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{fullscreen.subtitle}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                <button onClick={() => setFontSize((s) => Math.max(12, s - 2))} style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRight: '1px solid var(--color-border)' }}>A⁻</button>
                <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>A⁺</button>
              </div>
              <button
                onClick={() => { toggleRead(fullscreen.articleId); refreshRead() }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: isRead(fullscreen.articleId) ? '#22c55e' : 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}
              >
                {isRead(fullscreen.articleId) ? '已读 ✓' : '标记已读'}
              </button>
              <button
                onClick={() => setFullscreen(null)}
                style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}
              >
                ✕ 关闭
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xxl)', maxWidth: 800, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ fontSize, lineHeight: 1.9, color: '#d8d8d8', whiteSpace: 'pre-line', margin: 0, fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px' }}>
              {fullscreen.content}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
