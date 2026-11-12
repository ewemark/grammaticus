import { useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { getBookmarks } from '../../utils/bookmarks'
import { getRecent } from '../../utils/recent'
import { getDictionary } from '../../utils/dictionary'
import { sectionTitle } from '../../styles/typography'
import { generateArticle } from '../../api/context'
import { saveArticle } from '../../utils/savedArticles'
import FullscreenReader from '../../components/ui/FullscreenReader'

const NOW = Date.now()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function ContextLearning() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [article, setArticle] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [articleId, setArticleId] = useState('')
  const [saved, setSaved] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [customWords, setCustomWords] = useState<string[]>([])
  const [inputWord, setInputWord] = useState('')

  const { dictWords, recentWords, bookmarkWords } = useMemo(() => {
    // 词典收录的词是第一优先级词源
    const dict = getDictionary().map((d) => d.word)
    const dictSet = new Set(dict.map((w) => w.toLowerCase()))
    const recent = getRecent()
      .filter((r) => NOW - r.timestamp < WEEK_MS)
      .map((r) => r.word)
    const bookmarks = getBookmarks().map((b) => b.word)
    const bookmarkSet = new Set(bookmarks.map((w) => w.toLowerCase()))
    // 去重:已出现在词典区的词不再重复展示
    const uniqueRecent = recent.filter((w) => !bookmarkSet.has(w.toLowerCase()) && !dictSet.has(w.toLowerCase()))
    const uniqueBookmarks = bookmarks.filter((w) => !dictSet.has(w.toLowerCase()))
    return {
      dictWords: [...new Set(dict)],
      recentWords: [...new Set(uniqueRecent)],
      bookmarkWords: [...new Set(uniqueBookmarks)],
    }
  }, [])

  const toggle = (word: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(word)) next.delete(word)
      else next.add(word)
      return next
    })
  }

  const selectAll = (words: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const w of words) next.add(w)
      return next
    })
  }

  const clearAll = () => setSelected(new Set())

  const addCustomWord = () => {
    const w = inputWord.trim()
    if (!w) return
    if (!customWords.some((c) => c.toLowerCase() === w.toLowerCase())) {
      setCustomWords((prev) => [...prev, w])
      // Ensure the word is selected (toggle would flip it off if already selected)
      setSelected((prev) => new Set(prev).add(w))
    }
    setInputWord('')
  }

  const removeCustomWord = (w: string) => {
    setCustomWords((prev) => prev.filter((c) => c !== w))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(w)
      return next
    })
  }

  const generate = async () => {
    const picked = [...selected]
    if (picked.length === 0) return

    setLoading(true)
    try {
      const result = await generateArticle(picked)
      setArticle(result.article)
      setArticleTitle(result.title)
      setUsedWords(picked)
      const id = String(Date.now())
      setArticleId(id)
      setSaved(false)
    } catch {
      // Fallback: use local template
      const [a, b, c, d, e, f] = [...picked, ...picked]
      const fallback = `I decided to improve my English today. The first thing I wanted to do was to "${a}" in a real conversation. My friend suggested that I should also try to "${b}" while reading an article.\n\nIt wasn't easy at first. I needed to "${c}" carefully and "${d}" whenever I had free time. But after a while, things started to make sense. I could "${e}" without thinking too much, and I even started to "${f}" with more confidence.\n\nLearning a language is a journey, not a destination. Every small step counts.`
      setArticle(fallback)
      setArticleTitle('学习英语的每一天')
      setUsedWords(picked)
      setArticleId(String(Date.now()))
      setSaved(false)
    }
    setLoading(false)
  }

  const handleSave = () => {
    if (!articleId || saved) return
    saveArticle({
      id: articleId,
      title: articleTitle,
      content: article,
      words: usedWords,
      createdAt: Date.now(),
    })
    setSaved(true)
  }

  const chipStyle = (word: string): React.CSSProperties => ({
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 'var(--tracking-micro)',
    padding: 'var(--space-xs) var(--space-md)',
    borderRadius: 'var(--radius-pill)',
    border: selected.has(word) ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
    background: selected.has(word) ? 'var(--color-text)' : 'transparent',
    color: selected.has(word) ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)' }}>
        选择或手动输入要记忆的词汇，由 AI 生成包含这些单词的短文，在真实语境中理解和记忆单词。
      </p>

      {/* Manual word input */}
      <div style={{ marginBottom: 'var(--space-xxl)' }}>
        <h4 style={{ ...sectionTitle, margin: '0 0 var(--space-md)' }}>自选单词</h4>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: customWords.length > 0 ? 'var(--space-md)' : 0 }}>
          <input
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustomWord() }}
            placeholder="输入单词，按回车添加…"
            style={{
              flex: 1,
              maxWidth: 300,
              padding: '8px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: 'var(--color-text)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <Button variant="ghost" onClick={addCustomWord} disabled={!inputWord.trim()}>
            添加
          </Button>
        </div>
        {customWords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {customWords.map((w) => (
              <button key={w} onClick={() => removeCustomWord(w)} style={chipStyle(w)}>
                {w} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dictionary words — 第一优先词源 */}
      {dictWords.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h4 style={{ ...sectionTitle, margin: 0 }}>我的词典</h4>
            <span
              onClick={() => selectAll(dictWords)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              全选
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {dictWords.map((w) => (
              <button key={w} onClick={() => toggle(w)} style={chipStyle(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent words */}
      {recentWords.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h4 style={{ ...sectionTitle, margin: 0 }}>最近一周查过的单词</h4>
            <span
              onClick={() => selectAll(recentWords)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              全选
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {recentWords.map((w) => (
              <button key={w} onClick={() => toggle(w)} style={chipStyle(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarked words */}
      {bookmarkWords.length > 0 && (
        <div style={{ marginBottom: 'var(--space-xxl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <h4 style={{ ...sectionTitle, margin: 0 }}>收藏的单词</h4>
            <span
              onClick={() => selectAll(bookmarkWords)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                color: 'var(--color-text-secondary)', cursor: 'pointer',
              }}
            >
              全选
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            {bookmarkWords.map((w) => (
              <button key={w} onClick={() => toggle(w)} style={chipStyle(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {dictWords.length === 0 && recentWords.length === 0 && bookmarkWords.length === 0 && (
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          词典还是空的,也没有查词记录。先去「词条」收录一些单词,或在阅读中查词,再回来生成语境文章。
        </p>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xxl)' }}>
        <Button onClick={generate} disabled={selected.size === 0 || loading}>
          {loading ? 'AI 生成中…' : `生成文章 (${selected.size} 词)`}
        </Button>
        {selected.size > 0 && (
          <span
            onClick={clearAll}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
              letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}
          >
            清空选择
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-huge) 0' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-md)' }}>
            AI 正在生成语境文章…
          </p>
          <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-text)', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Generated article */}
      {!loading && article && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-sm)', fontWeight: 700, letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)', margin: '0 0 var(--space-xxs)' }}>{articleTitle}</h4>
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)' }}>{usedWords.length} 个目标词汇</span>
            </div>
            <button
              onClick={() => setFullscreen(true)}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                color: 'var(--color-text-secondary)', background: 'none',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
                padding: '4px 12px', cursor: 'pointer',
              }}
            >
              放大阅读
            </button>
          </div>
          <Card>
            <div style={{ padding: 'var(--space-md) 0' }}>
              <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text)', whiteSpace: 'pre-line' }}>
                {article.split(' ').map((word, i) => {
                  const clean = word.replace(/[.,;:!?"']/g, '')
                  const isUsed = usedWords.some((h) => h.toLowerCase() === clean.toLowerCase())
                  return (
                    <span key={i}>
                      {i > 0 && ' '}
                      {isUsed ? (
                        <span style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700,
                          color: 'var(--color-canvas)', background: 'var(--color-text)',
                          padding: '1px 4px', borderRadius: 2,
                        }}>
                          {word}
                        </span>
                      ) : word}
                    </span>
                  )
                })}
              </p>
            </div>
          </Card>
          <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
            高亮单词为你选择的目标词汇
          </p>
        </div>
      )}

      {/* Fullscreen reading overlay */}
      {fullscreen && article && (
        <FullscreenReader
          title={`语境记忆 · ${articleTitle}`}
          subtitle={`${usedWords.length} 个目标词汇`}
          content={article}
          contentElement={
            <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
              {article.split(' ').map((word, i) => {
                const clean = word.replace(/[.,;:!?"']/g, '')
                const isUsed = usedWords.some((h) => h.toLowerCase() === clean.toLowerCase())
                return (
                  <span key={i}>
                    {i > 0 && ' '}
                    {isUsed ? (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-canvas)', background: 'var(--color-text)', padding: '1px 4px', borderRadius: 2 }}>{word}</span>
                    ) : word}
                  </span>
                )
              })}
            </p>
          }
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClose={() => setFullscreen(false)}
          actions={
            <button onClick={handleSave} disabled={saved} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: saved ? 'var(--color-success)' : 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: saved ? 'default' : 'pointer' }}>{saved ? '已收藏 ✓' : '☆ 收藏'}</button>
          }
        />
      )}
    </div>
  )
}
