import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { searchWords } from '../api/words'
import type { EnglishWord } from '../api/words'
import { addRecent } from '../utils/recent'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EnglishWord[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [btnFocus, setBtnFocus] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.trim().length === 0) {
      setResults([])
      setOpen(false)
      return
    }
    const found = await searchWords(q)
    setResults(found)
    setOpen(found.length > 0)
    setHighlight(-1)
  }, [])

  const goTo = (w: string, meaning?: string) => {
    setOpen(false)
    setQuery('')
    addRecent(w, meaning ?? '')
    navigate(`/words/${encodeURIComponent(w)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        goTo(query.trim())
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0) {
        goTo(results[highlight].word, results[highlight].meaning)
      } else {
        goTo(query.trim())
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section style={{ marginBottom: 'var(--space-section)', paddingTop: 'var(--space-huge)' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-micro)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--space-xl)',
          }}
        >
          英语学习参考工具
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-display-xxl)',
            fontWeight: 700,
            lineHeight: 'var(--leading-display)',
            letterSpacing: 'var(--tracking-display)',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-xl)',
            maxWidth: 700,
          }}
        >
          Grammaticus
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body-lg)',
            lineHeight: 'var(--leading-body)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--space-xxl)',
            maxWidth: 520,
          }}
        >
          每一个单词都有完整的释义。每一个短语都有清晰的解析。为英语学习者打造的高效参考工具。
        </p>
      </section>

      {/* Search */}
      <section style={{ marginBottom: 'var(--space-section)' }}>
        <div ref={containerRef} style={{ position: 'relative', maxWidth: 520 }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <Input
              placeholder="搜索单词…"
              style={{ flex: 1 }}
              value={query}
              onChange={(e) => doSearch((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setOpen(true) }}
            />
            <Button
              variant="ghost"
              onFocus={() => setBtnFocus(true)}
              onBlur={() => setBtnFocus(false)}
              style={{
                height: 44,
                padding: '0 var(--space-md)',
                borderRadius: 'var(--radius-xs)',
                borderColor: btnFocus ? 'var(--color-text)' : 'var(--color-border)',
                background: 'var(--color-canvas-soft)',
                outline: 'none',
              }}
              onClick={() => query.trim() && goTo(query.trim())}
            >
              搜索
            </Button>
          </div>

          {/* Dropdown */}
          {open && results.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 4,
              boxShadow: 'var(--shadow-raised)',
              overflow: 'hidden', zIndex: 100,
            }}>
              {results.map((w, i) => (
                <button
                  key={w.word}
                  onClick={() => goTo(w.word, w.meaning)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                    width: '100%', padding: 'var(--space-sm) var(--space-md)',
                    background: i === highlight ? 'var(--color-text)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-body-sm)', fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)',
                    color: i === highlight ? 'var(--color-canvas)' : 'var(--color-text)',
                    flexShrink: 0,
                  }}>
                    {w.word}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                    padding: '1px 6px', borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--color-border)',
                    color: i === highlight ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                    flexShrink: 0, opacity: 0.6,
                  }}>
                    {w.pos}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-micro)', color: i === highlight ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {w.meaning}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ marginBottom: 'var(--space-section)' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-micro)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--space-xl)',
          }}
        >
          探索
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 'var(--space-md)' }}>
          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              WORDS
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              单词记忆是"提取"的残留物，而不是"重复"的产物
            </p>
            <Link to="/words">
              <Button>VIEW WORDS</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              GRAMMAR
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              这里有语法讲解的视频和基础的语法练习
            </p>
            <Link to="/grammar">
              <Button>VIEW GRAMMAR</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              READING
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              阅读是你提高语法能力和认识单词最好的方法
            </p>
            <Link to="/read">
              <Button>START READING</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              SPACE
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              你的学习空间:笔记、句子库、词典、收藏文章与 AI 老师
            </p>
            <Link to="/space">
              <Button>OPEN SPACE</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              SCAN
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              拍照即可翻译英语文本，并提供语法分析
            </p>
            <Link to="/scan">
              <Button>OPEN CAMERA</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              UPLOAD
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              上传你的文章对应的文档，我们提供单词的查找和语法分析
            </p>
            <Link to="/upload">
              <Button>UPLOAD FILE</Button>
            </Link>
          </Card>

          <Card>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              GUESTBOOK
            </h4>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xl)' }}>
              给作者留言。问题、反馈，或者只是打个招呼
            </p>
            <Link to="/guestbook">
              <Button>VIEW MESSAGES</Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  )
}
