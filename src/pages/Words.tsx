import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { getRecent, formatTime, type RecentWord } from '../utils/recent'
import { getBookmarks, removeBookmark, type BookmarkedWord } from '../utils/bookmarks'
import { tabPill, microLabel, pageTitle } from '../styles/typography'
import LearnTab from './words/LearnTab'

const TABS = ['RECENT', 'BOOKMARKS', 'LEARN'] as const

export const POS_COLORS: Record<string, 'purple' | 'green' | 'pink' | 'orange' | 'blue' | 'yellow' | 'gray'> = {
  NOUN: 'purple',
  VERB: 'green',
  ADJECTIVE: 'pink',
  ADVERB: 'orange',
  PREPOSITION: 'blue',
  CONJUNCTION: 'yellow',
  PRONOUN: 'gray',
}

function EmptyState({ message, action }: { message: string; action?: string }) {
  return (
    <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', marginBottom: action ? 'var(--space-md)' : 0 }}>
        {message}
      </p>
      {action && <Button variant="ghost">{action}</Button>}
    </div>
  )
}

type Tab = (typeof TABS)[number]

export default function Words() {
  const [tab, setTab] = useState<Tab>('RECENT')
  const [recent, setRecent] = useState<RecentWord[]>(() => getRecent())
  const [bookmarks, setBookmarks] = useState<BookmarkedWord[]>(() => getBookmarks())

  // Refresh lists when switching tabs
  useEffect(() => {
    if (tab === 'RECENT') setRecent(getRecent())
    if (tab === 'BOOKMARKS') setBookmarks(getBookmarks())
  }, [tab])

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
            {t}
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
                      <span style={{
                        fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-micro)',
                      }}>
                        {formatTime(w.timestamp)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message="No recently searched words yet. Start exploring the word library." action="BROWSE WORDS" />
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
                      <span style={{
                        fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-display)', textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-micro)',
                      }}>
                        {formatTime(b.timestamp)}
                      </span>
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

      {/* Tab 3: LEARN */}
      {tab === 'LEARN' && <LearnTab />}
    </div>
  )
}
