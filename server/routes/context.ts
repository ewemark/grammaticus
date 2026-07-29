import { Router } from 'express'
import { callLLM } from '../llm.js'

const router = Router()

/* ── System prompt for context article generation ───────────── */

const CONTEXT_PROMPT = `# 英语语境文章生成器

## 角色定位
你是一位英语教学专家，擅长为语言学习者创作简短、自然的英语文章。你的任务是将给定的单词列表编织成一篇流畅的英语短文，让学习者在真实语境中理解和记忆这些单词。

## 核心规则
1. 必须使用提供的每一个单词（或该单词的常见变形：复数、过去式、进行时等）。
2. 文章长度控制在 150–250 词之间。
3. 文章必须是叙事、议论或日常随笔风格，读起来自然流畅，不能像单词堆砌。
4. 难度控制在中等英语水平（CEFR B1-B2）。
5. 标题用中文写在第一行，格式为"标题：xxx"。
6. 标题之后空一行，再开始正文。

## 输出格式
标题：你的标题

英文正文（150–250词），自然分段。`

/* ── POST /api/context/generate ────────────────────────────── */

router.post('/generate', async (req, res, next) => {
  try {
    const { words } = req.body
    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({ error: '请提供要使用的单词列表' })
      return
    }

    const result = await generateArticle(words)
    res.json({ article: result.article, title: result.title })
  } catch (err) {
    next(err)
  }
})

/* ── AI caller ──────────────────────────────────────────────── */

async function generateArticle(words: string[]): Promise<{ article: string; title: string }> {
  const wordList = words.join('、')
  const result = await callLLM(CONTEXT_PROMPT, `请使用以下单词创作一篇英语短文：${wordList}`, { temperature: 0.8, maxTokens: 1200 })
  if (!result) return fallbackGenerate(words)
  return parseResponse(result)
}

/* ── Parse AI response into title + article ─────────────────── */

function parseResponse(text: string): { article: string; title: string } {
  const lines = text.trim().split('\n')
  let title = '语境记忆短文'
  let articleStart = 0

  // Try to extract Chinese title from first line
  const firstLine = lines[0]?.trim() || ''
  const titleMatch = firstLine.match(/^标题[：:]\s*(.+)/)
  if (titleMatch) {
    title = titleMatch[1].trim()
    articleStart = 1
  }

  // Skip blank lines after title
  while (articleStart < lines.length && lines[articleStart].trim() === '') {
    articleStart++
  }

  const article = lines.slice(articleStart).join('\n').trim()
  return { article, title }
}

/* ── Local fallback (when API key not configured) ──────────── */

function fallbackGenerate(words: string[]): { article: string; title: string } {
  const [a, b, c, d, e, f] = [...words, ...words]

  const article = `It was an ordinary day when I decided to focus on learning English. The first word I encountered was "${a}", which I found particularly useful. As I continued reading, I came across "${b}" in a sentence that perfectly illustrated its meaning.

Language learning requires patience. Every time you "${c}", you build stronger neural connections. My teacher always says that to truly "${d}" something, you need to see it in context repeatedly.

The best part is when you "${e}" naturally in conversation without thinking. That's the moment you realize the effort was worth it. Remember to "${f}" a little every day — consistency matters more than intensity.

⚠️ 这是本地生成的模板文章。配置 LLM_API_KEY 环境变量后，将由 DeepSeek AI 生成更自然、更丰富的语境文章。`

  return { article, title: '学习英语的每一天' }
}

export default router
