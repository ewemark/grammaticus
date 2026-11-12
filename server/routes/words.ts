import { Router } from 'express'
import { callLLM } from '../llm.js'
import { isTrustedAudioUrl } from '../utils/text.js'
import { lemmatize, editDistance } from '../utils/lemmatize.js'
import {
  getSimpleWord, getRichWord, getSimpleList, cacheWord, type SimpleRow,
} from '../dataStore.js'
import type { RichWordData } from '../../src/types/word.js'

const router = Router()

/* ── Search helpers ──────────────────────────────────────────── */

interface Row { word: string; meaning: string; pos: string; example: string }

const MAX_FUZZY_CANDIDATES = 8

/* ── AI 词库补全:内存词库未收录时由 DeepSeek 生成释义(JSON → 解析 → 缓存) ── */

const WORD_AI_PROMPT = `你是专业英语词典编辑。给定一个英语单词,返回严格 JSON(不要 markdown fence,不要额外解释):
{
  "pos": "词性(全大写:NOUN/VERB/ADJECTIVE/ADVERB/PREPOSITION/CONJUNCTION/PRONOUN/INTERJECTION)",
  "meaning": "中文释义(简明准确,20字以内)",
  "example": "一句自然英文例句(展示典型用法,含中文翻译)",
  "pronunciation": "IPA音标(如 /ˈtrɪpl/)"
}

示例:
word: "tripled"
{"pos":"VERB","meaning":"triple的过去式,变成三倍;使增至三倍","example":"Profits tripled in the first year. 利润第一年就增长了两倍。","pronunciation":"/ˈtrɪpld/"}

word: "meticulous"
{"pos":"ADJECTIVE","meaning":"极仔细的,一丝不苟的","example":"She is meticulous about her work. 她对工作一丝不苟。","pronunciation":"/mɪˈtɪkjʊləs/"}`

async function aiGenerateWord(word: string): Promise<Row | null> {
  const result = await callLLM(
    WORD_AI_PROMPT,
    `word: "${word}"`,
    { temperature: 0.1, maxTokens: 300, timeout: 20000 },
  )
  if (!result) return null
  try {
    const clean = result.replace(/```(?:json)?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(clean) as { pos?: string; meaning?: string; example?: string; pronunciation?: string }
    const pos = typeof parsed.pos === 'string' ? parsed.pos.toUpperCase().trim() : ''
    const meaning = typeof parsed.meaning === 'string' ? parsed.meaning.trim() : ''
    const example = typeof parsed.example === 'string' ? parsed.example.trim() : ''
    if (!meaning) return null

    const row: SimpleRow = { word, meaning, pos, example }
    cacheWord(row)
    return row
  } catch {
    const meaningMatch = result.match(/"meaning"\s*:\s*"([^"]+)"/)
    if (meaningMatch) {
      const meaning = meaningMatch[1].trim()
      const posMatch = result.match(/"pos"\s*:\s*"([^"]+)"/)
      const pos = posMatch ? posMatch[1].toUpperCase().trim() : ''
      const exMatch = result.match(/"example"\s*:\s*"([^"]+)"/)
      const example = exMatch ? exMatch[1].trim() : ''
      const row: SimpleRow = { word, meaning, pos, example }
      cacheWord(row)
      return row
    }
    return null
  }
}

/* ── 纯函数搜索(基于内存列表) ────────────────────────── */

function searchWordsTiered(rawQuery: string, posFilter: string, limit: number, offset: number) {
  const q = rawQuery.trim()
  const all = getSimpleList()

  if (!q) {
    const filtered = posFilter ? all.filter((r) => r.pos === posFilter.toUpperCase()) : all
    const total = filtered.length
    const words = [...filtered].sort((a, b) => a.word.localeCompare(b.word)).slice(offset, offset + limit)
    return { words, total, tier: 'list' as const, suggestions: [] as Row[] }
  }

  const lower = q.toLowerCase()

  // Tier 1 — prefix
  const prefixed = all.filter((r) => r.word.toLowerCase().startsWith(lower))
  if (prefixed.length > 0) {
    const sorted = prefixed.sort((a, b) => a.word.localeCompare(b.word))
    return { words: sorted.slice(offset, offset + limit), total: sorted.length, tier: 'prefix' as const, suggestions: [] as Row[] }
  }

  // Tier 2 — lemma
  const candidates = lemmatize(lower).filter((c) => c !== lower)
  for (const c of candidates) {
    const exact = all.filter((r) => r.word.toLowerCase() === c)
    if (exact.length > 0) return { words: exact.slice(0, limit), total: exact.length, tier: 'lemma' as const, suggestions: [] as Row[] }
  }
  for (const c of candidates) {
    const prefixed2 = all.filter((r) => r.word.toLowerCase().startsWith(c))
    if (prefixed2.length > 0) {
      const sorted = prefixed2.sort((a, b) => a.word.localeCompare(b.word))
      return { words: sorted.slice(offset, offset + limit), total: sorted.length, tier: 'lemma' as const, suggestions: [] as Row[] }
    }
  }

  // Tier 3 — contains
  const contains = all.filter((r) => r.word.toLowerCase().includes(lower))
  if (contains.length > 0) {
    const sorted = contains.sort((a, b) => a.word.localeCompare(b.word))
    return { words: sorted.slice(offset, offset + limit), total: sorted.length, tier: 'contains' as const, suggestions: [] as Row[] }
  }

  // Tier 4 — fuzzy
  const suggestions = fuzzySuggest(lower, all, MAX_FUZZY_CANDIDATES)
  return { words: [] as Row[], total: 0, tier: 'none' as const, suggestions }
}

function fuzzySuggest(lower: string, pool: readonly SimpleRow[], max: number): Row[] {
  if (lower.length < 4) return []
  const tolerance = lower.length >= 7 ? 2 : 1
  return pool
    .map((r) => ({ r, d: editDistance(lower, r.word.toLowerCase()) }))
    .filter((x) => x.d > 0 && x.d <= tolerance)
    .sort((a, b) => a.d - b.d || a.r.word.localeCompare(b.r.word))
    .slice(0, max)
    .map((x) => x.r)
}

/* ── GET /api/words ── */

router.get('/', (_req, res, next) => {
  try {
    const q = (_req.query.q as string | undefined)?.trim() ?? ''
    const pos = (_req.query.pos as string | undefined)?.trim() ?? ''
    const limit = Math.min(Number(_req.query.limit) || 20, 200)
    const offset = Math.max(Number(_req.query.offset) || 0, 0)
    res.json(searchWordsTiered(q, pos, limit, offset))
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/autocomplete ── */

router.get('/autocomplete', (_req, res, next) => {
  try {
    const q = (_req.query.q as string | undefined)?.trim() ?? ''
    if (!q) { res.json([]); return }
    const { words, suggestions } = searchWordsTiered(q, '', 8, 0)
    const rows = (words.length > 0 ? words : suggestions).map((w: Row) => ({ word: w.word, meaning: w.meaning }))
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/:word/audio ── */

interface PhoneticEntry { text?: string; audio?: string }

router.get('/:word/audio', async (_req, res, next) => {
  try {
    const { word } = _req.params
    const accent = (_req.query.accent as string) || 'uk'
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    const resp = await fetch(apiUrl)
    if (!resp.ok) { res.status(404).json({ error: 'Audio not available' }); return }
    const data = (await resp.json()) as { phonetics?: PhoneticEntry[] }[]
    const phonetics = data[0]?.phonetics ?? []
    const withAudio = phonetics.filter((p) => p.audio && p.audio.trim())
    if (withAudio.length === 0) { res.status(404).json({ error: 'No audio available' }); return }
    const preferred = accent === 'us'
      ? withAudio.find((p) => (p.audio ?? '').includes('-us'))
      : withAudio.find((p) => (p.audio ?? '').includes('-uk'))
    const chosen = preferred ?? withAudio[0]
    if (!isTrustedAudioUrl(chosen.audio)) { res.status(404).json({ error: 'No trusted audio available' }); return }
    res.json({ audioUrl: chosen.audio })
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/:word ── */

router.get('/:word', async (_req, res, next) => {
  try {
    const { word } = _req.params

    const simple = getSimpleWord(word) ?? null
    const richRow = getRichWord(word) ?? null

    if (!simple && !richRow) {
      const aiRow = await aiGenerateWord(word)
      if (aiRow) {
        res.json({
          simple: { word: aiRow.word, meaning: aiRow.meaning, pos: aiRow.pos, example: aiRow.example },
          rich: null,
          aiGenerated: true,
        })
        return
      }

      const lower = word.toLowerCase()
      const suggestions: Row[] = []
      for (const c of lemmatize(lower).filter((x) => x !== lower)) {
        const hit = getSimpleWord(c)
        if (hit) { suggestions.push(hit); break }
      }
      if (suggestions.length === 0) suggestions.push(...fuzzySuggest(lower, getSimpleList(), 5))
      res.status(404).json({ error: `Word "${word}" not found`, suggestions })
      return
    }

    let rich: RichWordData | undefined
    if (richRow) {
      rich = {
        word: richRow.word,
        pronunciation: richRow.pronunciation as string,
        pos: richRow.pos as string,
        posNote: richRow.posNote as string,
        coreImage: richRow.coreImage as string,
        atomicCore: richRow.atomicCore as string,
        oneLinePenetration: richRow.oneLinePenetration as string,
        forms: JSON.parse(richRow.forms as string),
        semanticRadii: JSON.parse(richRow.semanticRadii as string),
        grammarRules: richRow.grammarRules as string,
        exampleDiagnoses: JSON.parse(richRow.exampleDiagnoses as string),
        synonymComparisons: JSON.parse(richRow.synonymComparisons as string),
      }
    }

    res.json({ simple, rich })
  } catch (err) {
    next(err)
  }
})

export default router