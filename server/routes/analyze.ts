import { Router, type Request, type Response } from 'express'
import { callLLM, callLLMStream, type ChatMessage } from '../llm.js'
import { cleanMarkdown } from '../utils/text.js'

const router = Router()

/* ── AI system prompt(紧凑版:为折叠块渲染优化) ──────────── */

const SYSTEM_PROMPT = `# 英语成分语法深度分析器

## 角色定位
你是一位零代号的英语语法专家。拒绝使用任何英文缩写，全程只使用纯中文、大白话、递进式线性叙述。把句子内部每一个词的修饰关系、移动原因、介词逻辑和时态驱动原理讲清楚。

## 核心原则（铁律）
1. 零代号：绝对禁止使用任何生成语法缩写。
2. 功能分类：每提到一个词或短语，必须明确标注其属于【名词性成分】、【形容词性成分】、【副词性成分】或【动词性成分】。
3. 动词优先：先找带时态挂件的谓语核心，再向外拆解主语、宾语和修饰语。
4. 物理邻接：按照句子从左到右的顺序，修饰语和它的被修饰词必须在同一个意群块内紧挨着讲解。
5. 主从句分离：如果句子包含从句，分成两大部分，先完整分析主句，再完整分析从句。主句和从句各自独立编号（①、②、③……）。
6. 从句类型必判：分析从句时，第一点必须明确说出从句类型，并说明判断依据。
7. 介词必剖：每一个介词都必须一句话点破其深层逻辑（路径、职能、所属、遭遇、针对等）。
8. 轻动词要拆：遇到 take a look、have a drink 等结构，指出真正的动作含义在名词上。
9. 复合介词不拆：out of、because of 等当作一个整体介词单元处理。
10. 所有格裁决：遇到 's 或 of，明确判断是"物权/拥有"还是"遭遇/主题/来源/内容"。

## 输出格式（程序会按此结构渲染折叠面板，严格遵守）
- 第一行固定为：中文翻译：×××
- 有从句时，用独立一行写"第一部分：主句"、"第二部分：从句（类型）"分隔
- 每个意群块独占一行，以 ①②③ 编号开头，格式：① 核心词 — 成分名：讲解
- 每个块最多 2-3 行文字，先给结论再给理由，禁止空话套话，禁止复述原句
- 从句块的讲解开头必须先写"判断从句类型：×××，依据是…"
- 不使用任何 markdown 符号（#、*、-），纯文本换行`

/* ── 介词分析专用 prompt（紧凑五步法） ───────────────────── */

const PREP_PROMPT = `# 英语介词深度分析器（五步法）

## 角色定位
你是英语介词分析专家。对句子中每一个介词，按五步法分析：固有意象 → 句内分析 → 用法家族 → 本句归属 → 总结。

## 核心介词意象库（内置参考）
- into：弹弓石子穿门而入（空间进入/状态转变/时间纵深/抽象探究）
- of：无形橡皮筋连接A与B（所属/部分整体/数量/方位参照/同位/语法黏合）
- with：工具箱随身携带附件（伴随携带/工具手段/方式状态/关系对抗/因果）
- down：手推车沿长廊滑行（沿路径向前/静态低于/顺流/时间纵深）
- at：激光红点瞄准坐标点（空间点/时间点/目标方向/状态指向）
- on：平面接触附着支撑（表面接触/日期/关于主题/状态运行中/依靠凭据）
- for：拉满的弓指向靶心（目的意图/受益者/持续时间/交换代价/原因）
- from：箭脱离弓弦飞远（空间起点/时间起点/来源出处/分离脱离/阻止避免）
- by：火车紧贴铁轨旁经过（施动者/方式手段/空间旁侧/时间截止/差异量）

## 输出格式（程序会按此结构渲染折叠面板，严格遵守）
- 第一行固定为：中文翻译：×××
- 第二行：本句介词清单：××、××
- 每个介词一个块，块标题独占一行，格式：介词 [X]：
- 块内五步各占一行，以"1. 固有意像："这样的编号标签开头：
  1. 固有意象：一句话感官画面
  2. 句内分析：所在片段+连接成分+句法功能，一句话
  3. 用法家族：逗号分隔列出核心用法（最多4个），只给短语不给整句
  4. 本句归属：属于第几种用法+一句话理由
  5. 总结：一句话说清核心贡献
- 每一步都紧凑，禁止空话，不使用任何 markdown 符号（#、*、-），纯文本换行`

/* ── SSE helpers ──────────────────────────────────────────── */

function sseInit(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable proxy buffering (nginx etc.)
  res.flushHeaders()
  let closed = false
  // NOTE: listen on res, not req — req 'close' fires as soon as the request
  // body is consumed (Express 5), which would kill the stream immediately.
  res.on('close', () => { closed = true })
  const send = (event: string, data: unknown) => {
    if (closed) return
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }
  return { send, isClosed: () => closed }
}

function validSentence(body: unknown): string | null {
  const s = (body as { sentence?: unknown })?.sentence
  if (!s || typeof s !== 'string' || !s.trim()) return null
  return s.trim().slice(0, 2000)
}

/* ── POST /api/analyze/grammar ───────────────────────────── */

router.post('/grammar', async (req, res, next) => {
  try {
    const sentence = validSentence(req.body)
    if (!sentence) { res.status(400).json({ error: '请提供要分析的句子' }); return }
    const result = await callAI(sentence, SYSTEM_PROMPT)
    res.json({ result })
  } catch (err) {
    next(err)
  }
})

/* ── POST /api/analyze/preposition ────────────────────────── */

router.post('/preposition', async (req, res, next) => {
  try {
    const sentence = validSentence(req.body)
    if (!sentence) { res.status(400).json({ error: '请提供要分析的句子' }); return }
    const result = await callAI(sentence, PREP_PROMPT)
    res.json({ result })
  } catch (err) {
    next(err)
  }
})

/* ── Streaming analysis (SSE) ─────────────────────────────── */

async function streamAnalyze(req: Request, res: Response, next: (e?: unknown) => void, systemPrompt: string) {
  try {
    const sentence = validSentence(req.body)
    if (!sentence) { res.status(400).json({ error: '请提供要分析的句子' }); return }

    const { send } = sseInit(res)
    const full = await callLLMStream(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: sentence }],
      (delta) => send('delta', { text: delta }),
      { temperature: 0.3, maxTokens: 2000 },
    )
    if (full) {
      send('done', { full: cleanMarkdown(full) })
    } else {
      send('fallback', { text: fallbackAnalyze(sentence) })
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) next(err)
    else res.end()
  }
}

router.post('/grammar/stream', (req, res, next) => streamAnalyze(req, res, next, SYSTEM_PROMPT))
router.post('/preposition/stream', (req, res, next) => streamAnalyze(req, res, next, PREP_PROMPT))

/* ── POST /api/analyze/chat/stream — 追问对话(SSE) ───────── */

const CHAT_RULES = `

## 当前会话模式
你已经按上述方法论分析过用户给出的句子,用户现在针对自己不懂的地方追问。回答规则:
1. 只回答用户问的那个点,禁止重新分析整个句子
2. 150 字以内,纯中文大白话,可以引用原句中的词
3. 如果用户的理解有偏差,先直接指出,再给出正确理解
4. 不使用任何 markdown 符号,纯文本`

router.post('/chat/stream', async (req, res, next) => {
  try {
    const body = req.body as {
      sentence?: unknown
      analysis?: unknown
      question?: unknown
      mode?: unknown
      history?: { role?: string; content?: string }[]
    }
    const sentence = validSentence({ sentence: body.sentence })
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : ''
    if (!sentence || !question) {
      res.status(400).json({ error: '缺少句子或问题' })
      return
    }
    const analysis = typeof body.analysis === 'string' ? body.analysis.slice(0, 4000) : ''
    const basePrompt = body.mode === 'preposition' ? PREP_PROMPT : SYSTEM_PROMPT

    // Sanitize history: only user/assistant, cap length
    const history: ChatMessage[] = (Array.isArray(body.history) ? body.history : [])
      .filter((m): m is { role: string; content: string } =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, 2000) }))

    const messages: ChatMessage[] = [
      { role: 'system', content: basePrompt + CHAT_RULES },
      { role: 'user', content: `句子: ${sentence}${analysis ? `\n\n你之前的分析:\n${analysis}` : ''}` },
      { role: 'assistant', content: '好的,我已分析完这个句子。你有什么不懂的地方,尽管问。' },
      ...history,
      { role: 'user', content: question },
    ]

    const { send } = sseInit(res)
    const full = await callLLMStream(
      messages,
      (delta) => send('delta', { text: delta }),
      { temperature: 0.4, maxTokens: 600 },
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

/* ── AI caller ────────────────────────────────────────────── */

async function callAI(sentence: string, systemPrompt: string): Promise<string> {
  const result = await callLLM(systemPrompt, sentence, { temperature: 0.3, maxTokens: 2000 })
  if (!result) return fallbackAnalyze(sentence)
  return cleanMarkdown(result)
}

/* ── Local fallback analyzer ──────────────────────────────── */

function fallbackAnalyze(text: string): string {
  const words = text.split(/\s+/).filter(Boolean)
  const result: string[] = [`⚠️ AI 未配置（设置 LLM_API_KEY 环境变量启用深度分析）\n`, `句子: "${text}"\n单词数: ${words.length}\n`]
  for (const w of words) {
    const clean = w.replace(/[.,;:!?"']/g, '')
    const lower = clean.toLowerCase()
    const patterns: string[] = []
    if (/ly$/.test(clean)) patterns.push('可能为副词（ly 结尾）')
    if (/ing$/.test(clean)) patterns.push('可能为进行时/动名词（ing 结尾）')
    if (/ed$/.test(clean) && !/eed$/.test(clean)) patterns.push('可能为过去式/过去分词（ed 结尾）')
    if (/tion$|sion$/.test(clean)) patterns.push('可能为名词（tion/sion 结尾）')
    if (/ment$/.test(clean)) patterns.push('可能为名词（ment 结尾）')
    if (/ness$/.test(clean)) patterns.push('可能为名词（ness 结尾）')
    if (/ous$|ful$|able$|ible$/.test(clean)) patterns.push('可能为形容词')
    if (['the','a','an'].includes(lower)) patterns.push('冠词')
    if (['in','on','at','to','for','with','from','by','of','about','into','through','during','before','after','above','below','between','among','against','within','without','under','over','behind','beyond','toward','upon'].includes(lower)) patterns.push('介词')
    if (['and','but','or','so','because','although','if','when','while'].includes(lower)) patterns.push('连词')
    if (['i','you','he','she','it','we','they','me','him','her','us','them'].includes(lower)) patterns.push('代词')
    if (patterns.length > 0) {
      const pos = patterns.includes('介词') ? '【介词】' : patterns.includes('连词') ? '【连词】' : patterns.includes('冠词') ? '【冠词】' : patterns.includes('代词') ? '【代词】' : ''
      result.push(`${pos} ${clean}: ${patterns.join('、')}`)
    } else {
      result.push(`${clean}: 未知词性，可在词库中查找`)
    }
  }
  return result.join('\n')
}

export default router
