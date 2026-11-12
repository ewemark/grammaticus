import { Router } from 'express'
import { callLLM } from '../llm.js'
import { cleanMarkdown } from '../utils/text.js'

const router = Router()

/* ── AI 点评"我的理解" prompt ────────────────────────────── */

const REVIEW_PROMPT = `# 英语词义理解批改老师

## 角色
你是一位细致的英语老师。学生正在深入学习一个单词,写下了"自己的理解"(可能是意象、记忆法、用法总结或中文转述)。你要像批改作业一样点评这份理解。

## 点评原则
1. 先肯定:指出理解中对的部分、有创意的联想(具体说明为什么好)。
2. 纠偏差:如果有错误或偏差(词义不准、搭配错误、意象跑偏、词性混淆),明确指出并给出正确理解——用"意象画面"的方式讲,不要只给词典释义。
3. 补盲区:指出学生漏掉的重要义项、常见搭配或易混词(最多 2 个,挑最重要的)。
4. 给钩子:最后给一个能加深记忆的简短画面或口诀。

## 输出格式(纯文本,不用 markdown 符号,总长 150-250 字)
✓ 理解到位的地方:(1-2 句)
△ 需要修正:(如有;没有则写"没有发现偏差")
＋ 可以补充:(1-2 个最重要的盲区)
🎯 记忆钩子:(一句话画面/口诀)

## 特殊情况
- 学生的理解是空的或只有几个字敷衍:温和指出,并示范一个高质量的理解写法(用核心意象方式)。`

/* ── POST /api/dictionary/review ──────────────────────────── */

router.post('/review', async (req, res, next) => {
  try {
    const word = String(req.body.word || '').trim().slice(0, 60)
    const meaning = String(req.body.meaning || '').trim().slice(0, 300)
    const myUnderstanding = String(req.body.myUnderstanding || '').trim().slice(0, 1500)

    if (!word) {
      res.status(400).json({ error: '缺少单词' })
      return
    }
    if (!myUnderstanding) {
      res.status(400).json({ error: '请先写下你对这个词的理解' })
      return
    }

    const userMessage = `单词: ${word}\n词库释义: ${meaning || '(无)'}\n\n学生写的"我的理解":\n${myUnderstanding}`

    const result = await callLLM(REVIEW_PROMPT, userMessage, {
      temperature: 0.4,
      maxTokens: 800,
      timeout: 60_000,
    })

    if (!result) {
      res.status(503).json({ error: 'AI 服务暂不可用(请检查 LLM_API_KEY 配置)' })
      return
    }
    res.json({ feedback: cleanMarkdown(result) })
  } catch (err) {
    next(err)
  }
})

export default router
