import { Router } from 'express'
import db from '../db.js'
import { callLLM } from '../llm.js'
import { isTrustedAudioUrl } from '../utils/text.js'
import { lemmatize, editDistance } from '../utils/lemmatize.js'
import type { RichWordData } from '../../src/types/word.js'

const router = Router()

/* ── Search helpers ──────────────────────────────────────────── */

interface Row { word: string; meaning: string; pos: string; example: string }

const MAX_FUZZY_CANDIDATES = 8
const FUZZY_SCAN_LIMIT = 5000

/* ── AI 词库补全:词库未收录时由 DeepSeek 生成释义(JSON → 解析 → 缓存) ── */

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
    // 去除可能的 markdown fence
    const clean = result.replace(/```(?:json)?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(clean) as { pos?: string; meaning?: string; example?: string; pronunciation?: string }
    const pos = typeof parsed.pos === 'string' ? parsed.pos.toUpperCase().trim() : ''
    const meaning = typeof parsed.meaning === 'string' ? parsed.meaning.trim() : ''
    const example = typeof parsed.example === 'string' ? parsed.example.trim() : ''
    if (!meaning) return null

    // 缓存到本地词库(幂等:INSERT OR REPLACE)
    db.prepare(
      'INSERT OR REPLACE INTO words (word, meaning, pos, example) VALUES (?, ?, ?, ?)',
    ).run(word, meaning, pos, example)

    return { word, meaning, pos, example }
  } catch {
    // JSON 解析失败:尝试正则提取
    const meaningMatch = result.match(/"meaning"\s*:\s*"([^"]+)"/)
    if (meaningMatch) {
      const meaning = meaningMatch[1].trim()
      const posMatch = result.match(/"pos"\s*:\s*"([^"]+)"/)
      const pos = posMatch ? posMatch[1].toUpperCase().trim() : ''
      const exMatch = result.match(/"example"\s*:\s*"([^"]+)"/)
      const example = exMatch ? exMatch[1].trim() : ''
      db.prepare(
        'INSERT OR REPLACE INTO words (word, meaning, pos, example) VALUES (?, ?, ?, ?)',
      ).run(word, meaning, pos, example)
      return { word, meaning, pos, example }
    }
    return null
  }
}

/**
 * Tiered word search — each tier only runs when the previous found nothing:
 *   1. prefix    "tran"    → tranquil, transfer…   (index-friendly, original behaviour)
 *   2. lemma     "children"→ child; "stopped" → stop
 *   3. contains  "port"    → transport, important…
 *   4. fuzzy     "resilent"→ resilient             (edit distance, returned as suggestions)
 */
export function searchWordsTiered(rawQuery: string, posFilter: string, limit: number, offset: number) {
  const q = rawQuery.trim()
  if (!q) {
    return { ...listAll(posFilter, limit, offset), tier: 'list' as const, suggestions: [] as Row[] }
  }

  const lower = q.toLowerCase()

  // Tier 1 — prefix
  const prefix = queryWhere('word LIKE ?', [lower], posFilter, limit, offset)
  if (prefix.total > 0) return { ...prefix, tier: 'prefix' as const, suggestions: [] as Row[] }

  // Tier 2 — lemma (irregular forms + suffix stripping)
  const candidates = lemmatize(lower).filter((c) => c !== lower)
  for (const c of candidates) {
    const exact = queryWhere('word = ?', [c], posFilter, limit, offset)
    if (exact.total > 0) return { ...exact, tier: 'lemma' as const, suggestions: [] as Row[] }
  }
  for (const c of candidates) {
    const prefixed = queryWhere('word LIKE ?', [`${c}%`], posFilter, limit, offset)
    if (prefixed.total > 0) return { ...prefixed, tier: 'lemma' as const, suggestions: [] as Row[] }
  }

  // Tier 3 — contains
  const contains = queryWhere('word LIKE ?', [`%${lower}%`], posFilter, limit, offset)
  if (contains.total > 0) return { ...contains, tier: 'contains' as const, suggestions: [] as Row[] }

  // Tier 4 — fuzzy suggestions (never paginated; it is a "did you mean" list)
  return {
    words: [] as Row[],
    total: 0,
    tier: 'none' as const,
    suggestions: fuzzySuggest(lower, MAX_FUZZY_CANDIDATES),
  }
}

function queryWhere(clause: string, values: string[], posFilter: string, limit: number, offset: number) {
  const conditions = [clause]
  const params: (string | number)[] = [...values]
  if (posFilter) {
    conditions.push('pos = ?')
    params.push(posFilter.toUpperCase())
  }
  const where = conditions.join(' AND ')
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM words WHERE ${where}`).get(...params) as { total: number }
  const words = db
    .prepare(`SELECT word, meaning, pos, example FROM words WHERE ${where} ORDER BY word ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Row[]
  return { words, total }
}

function listAll(posFilter: string, limit: number, offset: number) {
  const conditions = ['1=1']
  const params: (string | number)[] = []
  if (posFilter) {
    conditions.push('pos = ?')
    params.push(posFilter.toUpperCase())
  }
  const where = conditions.join(' AND ')
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM words WHERE ${where}`).get(...params) as { total: number }
  const words = db
    .prepare(`SELECT word, meaning, pos, example FROM words WHERE ${where} ORDER BY word ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Row[]
  return { words, total }
}

/** Rank dictionary entries by edit distance; only surfaces close matches */
export function fuzzySuggest(lower: string, max: number): Row[] {
  if (lower.length < 4) return []
  const tolerance = lower.length >= 7 ? 2 : 1
  const pool = db.prepare('SELECT word, meaning, pos, example FROM words ORDER BY word ASC LIMIT ?').all(FUZZY_SCAN_LIMIT) as Row[]

  return pool
    .map((r) => ({ r, d: editDistance(lower, r.word.toLowerCase()) }))
    .filter((x) => x.d > 0 && x.d <= tolerance)
    .sort((a, b) => a.d - b.d || a.r.word.localeCompare(b.r.word))
    .slice(0, max)
    .map((x) => x.r)
}

/* ── GET /api/words — list / search ────────────────────────── */

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

/* ── GET /api/words/autocomplete — quick suggestions ────────── */

router.get('/autocomplete', (_req, res, next) => {
  try {
    const q = (_req.query.q as string | undefined)?.trim() ?? ''
    if (!q) {
      res.json([])
      return
    }
    const { words, suggestions } = searchWordsTiered(q, '', 8, 0)
    const rows = (words.length > 0 ? words : suggestions).map((w) => ({ word: w.word, meaning: w.meaning }))
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/:word/audio — pronunciation audio ──────── */

interface PhoneticEntry {
  text?: string
  audio?: string
}

router.get('/:word/audio', async (_req, res, next) => {
  try {
    const { word } = _req.params
    const accent = (_req.query.accent as string) || 'uk'

    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    const resp = await fetch(apiUrl)

    if (!resp.ok) {
      res.status(404).json({ error: 'Audio not available' })
      return
    }

    const data = (await resp.json()) as { phonetics?: PhoneticEntry[] }[]
    const phonetics = data[0]?.phonetics ?? []

    // Find one with audio: prefer matching accent, else any
    const withAudio = phonetics.filter((p) => p.audio && p.audio.trim())
    if (withAudio.length === 0) {
      res.status(404).json({ error: 'No audio available' })
      return
    }

    const preferred = accent === 'us'
      ? withAudio.find((p) => (p.audio ?? '').includes('-us'))
      : withAudio.find((p) => (p.audio ?? '').includes('-uk'))

    const chosen = preferred ?? withAudio[0]

    // Validate the upstream audio URL before handing it to the client
    // (the dictionary API may return arbitrary URLs; only allow https on trusted hosts)
    if (!isTrustedAudioUrl(chosen.audio)) {
      res.status(404).json({ error: 'No trusted audio available' })
      return
    }
    res.json({ audioUrl: chosen.audio })
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/:word — single word detail ─────────────── */

router.get('/:word', async (_req, res, next) => {
  try {
    const { word } = _req.params

    const simple = db.prepare(
      'SELECT word, meaning, pos, example FROM words WHERE word = ?'
    ).get(word) as { word: string; meaning: string; pos: string; example: string } | undefined

    const richRow = db.prepare(
      'SELECT * FROM rich_words WHERE word = ?'
    ).get(word) as Record<string, unknown> | undefined

    if (!simple && !richRow) {
      // AI 补全:词库未收录,实时用 DeepSeek 生成释义并缓存
      const aiRow = await aiGenerateWord(word)
      if (aiRow) {
        res.json({
          simple: { word: aiRow.word, meaning: aiRow.meaning, pos: aiRow.pos, example: aiRow.example },
          rich: null,
          aiGenerated: true,
        })
        return
      }

      // 连 AI 都失败,才返回 404 + 建议
      const lower = word.toLowerCase()
      const suggestions: Row[] = []
      for (const c of lemmatize(lower).filter((x) => x !== lower)) {
        const hit = db.prepare(
          'SELECT word, meaning, pos, example FROM words WHERE word = ?'
        ).get(c) as Row | undefined
        if (hit) { suggestions.push(hit); break }
      }
      if (suggestions.length === 0) suggestions.push(...fuzzySuggest(lower, 5))
      res.status(404).json({ error: `Word "${word}" not found`, suggestions })
      return
    }

    let rich: RichWordData | undefined
    if (richRow) {
      rich = {
        word: richRow.word as string,
        pronunciation: richRow.pronunciation as string,
        pos: richRow.pos as string,
        posNote: richRow.pos_note as string,
        coreImage: richRow.core_image as string,
        atomicCore: richRow.atomic_core as string,
        oneLinePenetration: richRow.one_line_penetration as string,
        forms: JSON.parse(richRow.forms as string),
        semanticRadii: JSON.parse(richRow.semantic_radii as string),
        grammarRules: richRow.grammar_rules as string,
        exampleDiagnoses: JSON.parse(richRow.example_diagnoses as string),
        synonymComparisons: JSON.parse(richRow.synonym_comparisons as string),
      }
    }

    res.json({ simple, rich })
  } catch (err) {
    next(err)
  }
})

export default router
