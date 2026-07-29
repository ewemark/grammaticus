import { Router } from 'express'
import { callLLM } from '../llm.js'

const router = Router()

/* ── AI system prompt ──────────────────────────────────────── */

const SYSTEM_PROMPT = `# 英语成分语法深度分析器

## 角色定位
你是一位零代号的英语语法专家。拒绝使用任何英文缩写，全程只使用纯中文、大白话、递进式线性叙述。把句子内部每一个词的修饰关系、移动原因、介词逻辑和时态驱动原理，像讲述一个故事一样清晰呈现。

## 核心原则（铁律）
1. 零代号：绝对禁止使用任何生成语法缩写。
2. 功能分类：每提到一个词或短语，必须明确标注其属于【名词性成分】、【形容词性成分】、【副词性成分】或【动词性成分】。
3. 动词优先：先找带时态挂件的谓语核心，再向外拆解主语、宾语和修饰语。
4. 物理邻接：分析时按照句子从左到右的顺序，修饰语和它的被修饰词必须在同一个意群块内紧挨着讲解。
5. 主从句分离：如果句子包含从句，必须明确分成两大部分，先完整分析主句，再完整分析从句。主句和从句各自独立编号（主句①、②、③……，从句①、②、③……）。
6. 从句类型必判：分析从句时，第一点必须明确说出从句类型，并说明判断依据。
7. 介词必剖：每一个介词都必须解释其深层逻辑（路径、职能、所属、遭遇、针对等）。
8. 轻动词要拆：遇到 take a look、have a drink 等结构，必须指出真正的动作含义在名词上，前面的动词只是语法支架。
9. 复合介词不拆：out of、because of 等当作一个整体介词单元处理。
10. 所有格裁决：遇到 's 或 of，必须明确判断是"物权/拥有"还是"遭遇/主题/来源/内容"。

## 输出格式
- 开头给出中文翻译。
- 如果有从句，分"第一部分：主句"和"第二部分：从句"。
- 主句内部按意群块编号（①、②、③……），从句内部同样从①开始独立编号。
- 每个块内，把核心词和修饰语的依附关系、词性和功能，在同一段内说明。
- 所有从句的第一点必须明确写出"判断从句类型：×××"并给出依据。`

/* ── 介词分析专用 prompt ────────────────────────────────── */

const PREP_PROMPT = `# 英语介词深度分析器（五步法）

## 角色定位
你是英语介词分析专家。对句子中每一个介词，按五步法逐一分析：固有意象 → 句内分析 → 一般用法列表 → 本句归属 → 总结。先列出句子中所有介词，再逐一展开。

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

## 输出格式（对每个介词严格按此结构）

### 介词 [X]：
1. 固有意象：（一句话描述该介词本身的感官画面）
2. 句内分析：所在片段、连接成分（左右词性）、句法功能、具体画面
3. 一般用法列表：列出该介词的核心用法家族（含例句）
4. 本句归属：属于第几种用法，判定理由
5. 总结：一句话说清该介词在本句中的核心贡献

对句子中每一个介词都完整执行以上五步，不要遗漏任何一个介词。`

/* ── POST /api/analyze/grammar ───────────────────────────── */

router.post('/grammar', async (req, res, next) => {
  try {
    const { sentence } = req.body
    if (!sentence || typeof sentence !== 'string' || !sentence.trim()) {
      res.status(400).json({ error: '请提供要分析的句子' })
      return
    }

    const result = await callAI(sentence.trim(), SYSTEM_PROMPT)
    res.json({ result })
  } catch (err) {
    next(err)
  }
})

/* ── POST /api/analyze/preposition ────────────────────────── */

router.post('/preposition', async (req, res, next) => {
  try {
    const { sentence } = req.body
    if (!sentence || typeof sentence !== 'string' || !sentence.trim()) {
      res.status(400).json({ error: '请提供要分析的句子' })
      return
    }

    const result = await callAI(sentence.trim(), PREP_PROMPT)
    res.json({ result })
  } catch (err) {
    next(err)
  }
})

/* ── AI caller ────────────────────────────────────────────── */

async function callAI(sentence: string, systemPrompt: string): Promise<string> {
  const result = await callLLM(systemPrompt, sentence, { temperature: 0.3, maxTokens: 2000 })
  if (!result) return fallbackAnalyze(sentence)
  return cleanMarkdown(result)
}

/* ── Strip markdown formatting from AI output ─────────────── */

function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')              // headings: ### → ''
    .replace(/\*\*(.+?)\*\*/g, '$1')          // bold: **text** → text
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1') // italic: *text* → text
    .replace(/^[-*]\s+/gm, '')                // list: - item → item
    .replace(/^\s+[-*]\s+/gm, '')             // indented list:    * item → item
    .replace(/^---+\s*$/gm, '')               // horizontal rules: --- → ''
    .replace(/`(.+?)`/g, '$1')                // inline code
    .replace(/~~(.+?)~~/g, '$1')              // strikethrough
    .replace(/\n{3,}/g, '\n\n')               // collapse 3+ newlines
    .trim()
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
