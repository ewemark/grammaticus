import { Router, type Request, type Response } from 'express'
import { callLLM, callLLMStream } from '../llm.js'
import { cleanMarkdown } from '../utils/text.js'

const router = Router()

/* ── AI 老师 — 学习诊断 prompt ───────────────────────────── */

const DIAGNOSE_PROMPT = `# 英语学习诊断导师

## 角色
你是用户的私人英语学习导师,温暖而专业,像一位真正关心学生的老师。用户把学习软件中积累的全部"学习资产"交给你:手写笔记、AI 语法分析收藏、阅读笔记、句子库(含 AI 分析和用户想法)、个人词典(含用户自己写的"我的理解")、最近查过的词。你的任务是**基于这些证据**诊断用户到底哪里不懂——绝不泛泛而谈。

## 诊断方法(铁律)
1. 证据优先:每个结论必须引用用户的具体笔记标题、句子或词典词条作为证据,禁止凭空推测。
2. 聚类:先把资产按知识点归类(从句/时态/非谓语/介词/词义辨析/…),统计哪类反复出现。
3. 找"不懂的信号":用户反复分析同类句子、词典里"我的理解"写得含糊或有偏差、笔记里的疑问句、同一语法点多次出现——这些都是薄弱点信号。
4. 深挖模式:跨资产找关联,例如"句子库 3 个长难句都卡在从句判断 + 词典里对 whichever 的理解偏差,共同指向:名词性从句与形容词性从句的区分不稳"。
5. 建议落地:结合本软件功能给建议(语法视频 28 讲按词性/简单句/从句/非谓语/时态/虚拟语气分类;阅读页有新概念 1-4 册;学习助手可做介词五步法分析;词典可写"我的理解"让 AI 点评)。

## 输出格式(严格遵守,纯文本,不用 markdown 符号)
【学习画像概览】
(一段话:资产总量、覆盖话题、整体印象与亮点)

【薄弱点诊断】
① 薄弱点名称
证据:(引用具体笔记/句子/词条)
分析:(为什么这说明"不懂",问题的本质是什么)
② …(最多 4 个,按严重程度排序)

【深层模式】
(跨资产的规律,2-3 条,每条一段)

【行动建议】
1. (具体、可执行、结合软件功能的建议)
2. …
3. …

【老师寄语】
(一句话鼓励,肯定用户记笔记/建句子库这个习惯本身的价值)

## 特殊情况
- 资产少于 3 条:如实说明材料太少无法准确诊断,先简要点评现有内容,然后具体建议用户接下来记录什么(例如"把你下次遇到的长难句存进句子库")。
- 用户的"我的理解"有明显偏差:必须在薄弱点诊断中指出,并给出正确理解。`

/* ── POST /api/notes/diagnose ─────────────────────────────── */

interface DiagnoseBody {
  notes?: { type: string; title: string; content: string; analysis?: string; sourceText?: string }[]
  dictionary?: { word: string; meaning: string; myUnderstanding: string }[]
  recentWords?: string[]
}

router.post('/diagnose', async (req, res, next) => {
  try {
    const body = req.body as DiagnoseBody
    const notes = Array.isArray(body.notes) ? body.notes.slice(0, 100) : []
    const dictionary = Array.isArray(body.dictionary) ? body.dictionary.slice(0, 100) : []
    const recentWords = Array.isArray(body.recentWords) ? body.recentWords.slice(0, 30) : []

    if (notes.length + dictionary.length === 0) {
      res.status(400).json({ error: '还没有任何学习记录,先去查词、分析句子或写笔记吧' })
      return
    }

    // 组装学习资产(截断超长内容,控制 token)
    const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s)
    const assetLines: string[] = []

    assetLines.push('== 笔记与句子库 ==')
    for (const n of notes) {
      const parts = [`[${n.type}] ${clip(n.title || '(无标题)', 40)}`]
      if (n.sourceText) parts.push(`原句: ${clip(n.sourceText, 120)}`)
      if (n.analysis) parts.push(`AI分析摘录: ${clip(n.analysis, 200)}`)
      if (n.content) parts.push(`我的想法: ${clip(n.content, 200)}`)
      assetLines.push(parts.join('\n  '))
    }

    assetLines.push('\n== 个人词典(重点看"我的理解") ==')
    for (const d of dictionary) {
      assetLines.push(`${d.word} (${clip(d.meaning || '无释义', 40)})\n  我的理解: ${clip(d.myUnderstanding || '(未写)', 150)}`)
    }

    if (recentWords.length > 0) {
      assetLines.push(`\n== 最近查过的词 ==\n${recentWords.join(', ')}`)
    }

    const result = await callLLM(DIAGNOSE_PROMPT, assetLines.join('\n'), {
      temperature: 0.4,
      maxTokens: 3000,
      timeout: 90_000,
    })

    if (!result) {
      res.status(503).json({ error: 'AI 服务暂不可用(请检查 LLM_API_KEY 配置)' })
      return
    }
    res.json({ result: cleanMarkdown(result) })
  } catch (err) {
    next(err)
  }
})

/* ── 文章精华总结(流式)— 原料:全文 + 用户阅读中的标记 ── */

const SUMMARIZE_PROMPT = `# 英语文章精华总结老师

## 角色
你是用户的阅读助手。用户刚读完一篇英语文章,期间查了一些词、标记了一些句子、写了一些笔记。你要基于「文章全文 + 用户的标记」写一份精华总结,帮助用户把这篇文章的价值沉淀下来。

## 输出格式(纯文本,不用 markdown 符号,程序会按标题渲染)
【一句话主旨】
(用中文概括文章核心,一句话)

【值得学的表达】
① 原文短语/句子 — 为什么值得学(地道之处、可迁移的场景)
② …(挑 3-5 个,优先挑用户标记过的句子附近的表达)

【结构拆解】
(2-4 句:文章怎么展开的,什么结构,写作上可借鉴什么)

【结合你的笔记】
(如果用户有笔记/查词记录,把他们的关注点串讲一下:你标记的 X 句正好体现了…;你查的 Y 词在文中出现了 N 次,核心用法是…;如果没有笔记,这一段写"这次你没有留下标记,下次试试边读边记"并给一个针对本文的具体建议)

【复习钩子】
(一句话:一个能帮用户记住这篇文章核心的问题或小任务)

## 要求
- 全程中文,引用原文时保留英文
- 紧凑,每段直奔重点,总长 400-700 字
- 「值得学的表达」必须真实出自文章,禁止编造`

function sseInit(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  let closed = false
  // NOTE: listen on res, not req — req 'close' fires when body is consumed (Express 5)
  res.on('close', () => { closed = true })
  const send = (event: string, data: unknown) => {
    if (closed) return
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  return { send }
}

router.post('/summarize-article/stream', async (req: Request, res: Response, next) => {
  try {
    const body = req.body as {
      title?: unknown
      content?: unknown
      notes?: { title?: string; content?: string; sourceText?: string }[]
      words?: string[]
      previousArticles?: { title?: string; wordCount?: number; noteCount?: number }[]
    }
    const title = typeof body.title === 'string' ? body.title.slice(0, 120) : ''
    const content = typeof body.content === 'string' ? body.content.slice(0, 12000) : ''
    if (!content.trim()) {
      res.status(400).json({ error: '缺少文章内容' })
      return
    }

    const notes = Array.isArray(body.notes) ? body.notes.slice(0, 50) : []
    const words = Array.isArray(body.words) ? body.words.slice(0, 50) : []
    const previous = Array.isArray(body.previousArticles) ? body.previousArticles.slice(0, 5) : []

    const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s)
    const parts: string[] = [`文章标题: ${title || '(无题)'}\n\n文章全文:\n${content}`]
    if (words.length > 0) parts.push(`\n用户查过的词: ${words.join(', ')}`)
    if (notes.length > 0) {
      const noteLines = notes.map((n) => {
        const seg: string[] = []
        if (n.sourceText) seg.push(`摘录: ${clip(n.sourceText, 120)}`)
        if (n.content) seg.push(`想法: ${clip(n.content, 200)}`)
        return `- ${n.title ? clip(n.title, 40) + ' | ' : ''}${seg.join(' | ') || '(空)'}`
      })
      parts.push(`\n用户做的笔记:\n${noteLines.join('\n')}`)
    }
    if (previous.length > 0) {
      const prevLines = previous
        .filter((p) => typeof p.title === 'string')
        .map((p) => `- 《${clip(String(p.title), 40)}》(查 ${p.wordCount ?? 0} 词,笔记 ${p.noteCount ?? 0} 条)`)
      if (prevLines.length > 0) {
        parts.push(`\n用户最近还读过:\n${prevLines.join('\n')}\n(如与本文有主题或语言点上的关联,可在「结合你的笔记」末尾用一句话点出)`)
      }
    }

    const { send } = sseInit(res)
    const full = await callLLMStream(
      [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: parts.join('\n') },
      ],
      (delta) => send('delta', { text: delta }),
      { temperature: 0.4, maxTokens: 2000 },
    )
    if (full) {
      send('done', { full: cleanMarkdown(full) })
    } else {
      send('error', { error: 'AI 服务暂不可用(请检查 LLM_API_KEY 配置)' })
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) next(err)
    else res.end()
  }
})

export default router
