import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { getRecent, removeRecent, formatTime, type RecentWord } from '../utils/recent'
import { getBookmarks, removeBookmark, type BookmarkedWord } from '../utils/bookmarks'
import { tabPill, microLabel, pageTitle } from '../styles/typography'
import { fetchWords, type EnglishWord } from '../api/words'

const TABS = ['RECENT', 'BOOKMARKS', 'ALL'] as const

const TAB_LABELS: Record<string, string> = {
  RECENT: '最近搜索',
  BOOKMARKS: '我的收藏',
  ALL: '词库浏览',
}

export const POS_COLORS: Record<string, 'purple' | 'green' | 'pink' | 'orange' | 'blue' | 'yellow' | 'gray'> = {
  NOUN: 'purple',
  VERB: 'green',
  ADJECTIVE: 'pink',
  ADVERB: 'orange',
  PREPOSITION: 'blue',
  CONJUNCTION: 'yellow',
  PRONOUN: 'gray',
}

function EmptyState({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', marginBottom: action ? 'var(--space-md)' : 0 }}>
        {message}
      </p>
      {action && <Button variant="ghost" onClick={onAction}>{action}</Button>}
    </div>
  )
}

type Tab = (typeof TABS)[number]

export default function Words() {
  const [tab, setTab] = useState<Tab>('RECENT')
  const [recent, setRecent] = useState<RecentWord[]>(() => getRecent())
  const [bookmarks, setBookmarks] = useState<BookmarkedWord[]>(() => getBookmarks())
  const [allWords, setAllWords] = useState<EnglishWord[]>([])
  const [allTotal, setAllTotal] = useState(0)
  const [allLoading, setAllLoading] = useState(false)

  // Refresh lists when switching tabs
  useEffect(() => {
    if (tab === 'RECENT') setRecent(getRecent())
    if (tab === 'BOOKMARKS') setBookmarks(getBookmarks())
    if (tab === 'ALL' && allWords.length === 0 && !allLoading) {
      setAllLoading(true)
      fetchWords({ limit: 100, offset: 0 })
        .then((r) => { setAllWords(r.words); setAllTotal(r.total) })
        .catch((e) => console.error('[Words]', e))
        .finally(() => setAllLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const loadMore = () => {
    setAllLoading(true)
    fetchWords({ limit: 100, offset: allWords.length })
      .then((r) => setAllWords((prev) => [...prev, ...r.words]))
      .catch((e) => console.error('[Words]', e))
      .finally(() => setAllLoading(false))
  }

  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>
        WORDS
      </p>
      <h2 style={{ ...pageTitle, margin: '0 0 var(--space-xxl)' }}>
        Word Library
      </h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xxl)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} style={tabPill(tab === t)} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab 1: RECENT */}
      {tab === 'RECENT' && (
        <div>
          {recent.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              {recent.map((w) => (
                <Link
                  key={w.word + w.timestamp}
                  to={`/words/${encodeURIComponent(w.word)}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-heading-sm)',
                            fontWeight: 700,
                            letterSpacing: 'var(--tracking-heading)',
                            color: 'var(--color-text)',
                            margin: '0 0 var(--space-xxs)',
                          }}
                        >
                          {w.word}
                        </h4>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                          {w.meaning || '—'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{
                          fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                          letterSpacing: 'var(--tracking-micro)',
                        }}>
                          {formatTime(w.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeRecent(w.word)
                            setRecent(getRecent())
                          }}
                          title="删除记录"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            fontSize: 16,
                            padding: '2px 4px',
                            lineHeight: 1,
                            opacity: 0.4,
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="No recently searched words yet. Start exploring the word library." action="BROWSE WORDS" onAction={() => setTab('ALL')} />
          )}
        </div>
      )}

      {/* Tab 2: BOOKMARKS */}
      {tab === 'BOOKMARKS' && (
        <div>
          {bookmarks.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              {bookmarks.map((b) => (
                <Link
                  key={b.word + b.timestamp}
                  to={`/words/${encodeURIComponent(b.word)}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xxs)' }}>
                          <h4
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 'var(--text-heading-sm)',
                              fontWeight: 700,
                              letterSpacing: 'var(--tracking-heading)',
                              color: 'var(--color-text)',
                              margin: 0,
                            }}
                          >
                            {b.word}
                          </h4>
                          <Badge color={POS_COLORS[b.pos] || 'gray'}>{b.pos}</Badge>
                        </div>
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                          {b.meaning || '—'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{
                          fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                          letterSpacing: 'var(--tracking-micro)',
                        }}>
                          {formatTime(b.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeBookmark(b.word)
                            setBookmarks(getBookmarks())
                          }}
                          title="取消收藏"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                            fontSize: 16,
                            padding: '2px 4px',
                            lineHeight: 1,
                            opacity: 0.4,
                            transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="还没有收藏单词。在单词详情页点击「☆ 收藏」即可添加到此处。" />
          )}
        </div>
      )}

      {/* Tab 3: ALL — browse the full library */}
      {tab === 'ALL' && (
        <div>
          {allLoading && allWords.length === 0 ? (
            <EmptyState message="加载中…" />
          ) : allWords.length > 0 ? (
            <>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                共 {allTotal} 个单词{allWords.length < allTotal ? `,已加载 ${allWords.length} 个` : ''}
              </p>
              <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                {allWords.map((w) => (
                  <Link key={w.word} to={`/words/${encodeURIComponent(w.word)}`} style={{ textDecoration: 'none' }}>
                    <Card>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)', fontWeight: 700, color: 'var(--color-text)', margin: 0, minWidth: 140 }}>
                          {w.word}
                        </h4>
                        <Badge color={POS_COLORS[w.pos] || 'gray'}>{w.pos}</Badge>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {w.meaning || '—'}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              {allWords.length < allTotal && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
                  <Button variant="ghost" onClick={loadMore} disabled={allLoading}>
                    {allLoading ? '加载中…' : '加载更多'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState message="词库为空。请先运行数据导入(npm run seed)。" />
          )}
        </div>
      )}
    </div>
  )
}
