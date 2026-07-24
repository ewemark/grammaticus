import { useState, useMemo } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { getBookmarks } from '../../utils/bookmarks'
import { getRecent } from '../../utils/recent'
import { sectionTitle } from '../../styles/typography'

const NOW = Date.now()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function ContextLearning() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generated, setGenerated] = useState(false)
  const [article, setArticle] = useState('')
  const [usedWords, setUsedWords] = useState<string[]>([])

  const { recentWords, bookmarkWords } = useMemo(() => {
    const recent = getRecent()
      .filter((r) => NOW - r.timestamp < WEEK_MS)
      .map((r) => r.word)
    const bookmarks = getBookmarks().map((b) => b.word)
    // Dedupe across lists
    const bookmarkSet = new Set(bookmarks.map((w) => w.toLowerCase()))
    const uniqueRecent = recent.filter((w) => !bookmarkSet.has(w.toLowerCase()))
    return {
      recentWords: [...new Set(uniqueRecent)],
      bookmarkWords: [...new Set(bookmarks)],
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

  const generate = () => {
    const picked = [...selected]
    if (picked.length === 0) return

    // Shuffle to vary word usage
    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5)
    const w = shuffle(picked)
    const [a,b,c,d,e,f,g,h] = [...w, ...w, ...w] // ensure enough words

    const templates = [
      // Narrative story
      `It was a quiet Tuesday morning when Maria decided to ${a}. She had been thinking about it for weeks. Her friend had told her that if she wanted to ${b}, she needed to take action. "You can't just wait for things to happen," he said. "Sometimes you have to ${c} first, and the results will follow."

So Maria started. At first, it was difficult. She didn't know how to ${d} properly, and she made mistakes. But she remembered what her grandmother used to say: "Life is about learning to ${e} even when things are hard."

After a few weeks, something changed. Maria noticed she could ${f} more naturally now. The effort was paying off. She called her friend and said, "You were right. I just needed to ${g}." Her friend laughed. "That's the secret. Keep going, and one day you'll ${h} better than you ever imagined."

The lesson was clear: growth comes from action, not from waiting. Whether you want to ${a}, ${b}, or ${c}, the first step is always the hardest — but it's also the most important.`,

      // Opinion essay
      `In recent years, there has been much discussion about what it means to ${a} in modern society. Some people believe that to ${b} is a natural human instinct, while others argue that we must learn to ${c} through education and practice.

Consider the example of a young professional named Alex. When Alex started his career, he found it challenging to ${d} in a competitive environment. His mentor advised him: "Instead of trying to ${e} perfectly, focus on learning how to ${f} consistently. Excellence comes from habit, not from talent."

Alex took this advice seriously. He began to ${g} every day, even for just a few minutes. Slowly, he noticed improvement. He could ${h} with greater confidence, and his colleagues began to notice the change.

What this shows is that the ability to ${a} is not something we are born with — it is something we develop. The question is not whether you can ${b}, but whether you are willing to ${c} enough to make it happen.`,

      // Dialogue-based story
      `"I don't think I can do it," said Jamie, staring at the challenge ahead.
"Of course you can," replied Taylor. "You've been preparing to ${a} for months now."
"But what if I fail? What if I can't ${b} the way I'm supposed to?"
Taylor put a hand on Jamie's shoulder. "Listen. Everyone struggles to ${c} at first. The important thing is that you ${d} with intention. Don't worry about being perfect."

Jamie took a deep breath. "Okay. I'll try."
"You'll do more than try. You'll ${e} like you've never done before."

And Jamie did. It wasn't perfect. There were moments when Jamie wanted to give up, moments when the desire to ${f} seemed impossible. But each time, Taylor was there, reminding Jamie: "Remember why you started. Remember that every expert was once a beginner who refused to ${g}."

Months later, someone asked Jamie what made the difference. Jamie smiled and said: "Someone believed I could ${h}. And then I started to believe it too."`,

      // Daily life reflection
      `Every morning, I wake up with one goal: to ${a}. It sounds simple, but anyone who has tried to ${b} knows that simple doesn't mean easy. There are distractions everywhere — notifications buzzing, emails piling up, a hundred reasons to ${c} instead of focus.

I used to think that successful people were just naturally good at ${d}. But then I read about a study that changed my perspective. The researchers found that the key difference wasn't talent or intelligence — it was consistency. People who ${e} a little every day achieved far more than those who tried to ${f} intensely but sporadically.

So I started small. Five minutes of ${g} before breakfast. Then ten. Then twenty. It felt strange at first — I wasn't used to ${h} without immediate results. But over time, the small efforts accumulated.

Now I understand: mastery isn't about big moments. It's about small, daily choices. It's about choosing to ${a} when no one is watching. It's about trusting that ${b} today will lead to ${c} tomorrow. That's the power of persistence.`,

      // Travel/adventure narrative
      `When I arrived in the small coastal town, I had no idea what to expect. I had come to ${a}, or at least to learn how. The locals were friendly. An old fisherman told me, "If you want to ${b} here, you need to understand the sea. The sea will teach you to ${c} in ways you never imagined."

I spent my days watching the waves, trying to ${d} like the fishermen did. In the evenings, I would sit at the harbour and ${e} while the sun set. It was during one of those evenings that I met a young woman who had also come to ${f}. She told me about her journey, how she had left everything behind to ${g}. "The hardest part," she said, "was not learning to ${h}, but learning to let go of who I thought I was supposed to be."

Her words stayed with me. I realized that I hadn't just come to ${a}. I had come to become someone new. And in learning to ${b}, I had found something more valuable: the courage to ${c} on my own terms.`,

    ]

    const template = templates[Math.floor(Math.random() * templates.length)]
    setArticle(template)
    setUsedWords(picked)
    setGenerated(true)
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
        点击下方单词选择要记忆的词汇，然后生成包含这些单词的短文，在真实语境中理解和记忆单词。
      </p>

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

      {recentWords.length === 0 && bookmarkWords.length === 0 && (
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          还没有查过单词或收藏单词。先去搜索或收藏一些单词再来吧。
        </p>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xxl)' }}>
        <Button onClick={generate} disabled={selected.size === 0}>
          生成文章 ({selected.size} 词)
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

      {/* Generated article */}
      {generated && article && (
        <div>
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
    </div>
  )
}
