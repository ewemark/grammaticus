import { Router } from 'express'
import db from '../db.js'
import type { RichWordData } from '../../src/types/word.js'

const router = Router()

/* ── GET /api/words — list / search ────────────────────────── */

router.get('/', (_req, res, next) => {
  try {
    const q = (_req.query.q as string | undefined)?.trim() ?? ''
    const pos = (_req.query.pos as string | undefined)?.trim() ?? ''
    const limit = Math.min(Number(_req.query.limit) || 20, 200)
    const offset = Math.max(Number(_req.query.offset) || 0, 0)

    let sql = 'SELECT word, meaning, pos, example FROM words WHERE 1=1'
    const params: (string | number)[] = []

    if (q) {
      sql += ' AND word LIKE ?'
      params.push(`${q}%`)
    }
    if (pos) {
      sql += ' AND pos = ?'
      params.push(pos.toUpperCase())
    }

    // Get total count first (before adding limit/offset params)
    const countSql = sql.replace(/SELECT .+ FROM words/, 'SELECT COUNT(*) as total FROM words')
    const { total } = db.prepare(countSql).get(...params) as { total: number }

    sql += ' ORDER BY word ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const words = db.prepare(sql).all(...params)
    res.json({ words, total })
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
    const rows = db.prepare(
      'SELECT word, meaning FROM words WHERE word LIKE ? ORDER BY word ASC LIMIT 8'
    ).all(`${q}%`)
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
    res.json({ audioUrl: chosen.audio })
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/words/:word — single word detail ─────────────── */

router.get('/:word', (_req, res, next) => {
  try {
    const { word } = _req.params

    const simple = db.prepare(
      'SELECT word, meaning, pos, example FROM words WHERE word = ?'
    ).get(word) as { word: string; meaning: string; pos: string; example: string } | undefined

    const richRow = db.prepare(
      'SELECT * FROM rich_words WHERE word = ?'
    ).get(word) as Record<string, unknown> | undefined

    if (!simple && !richRow) {
      res.status(404).json({ error: `Word "${word}" not found` })
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
