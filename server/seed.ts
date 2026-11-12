/**
 * Seed script: imports data/words.json and data/words-rich.json into SQLite.
 * Run: npx tsx server/seed.ts
 */
import db from './db.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/* ── words.json (w/m/p/e → word/meaning/pos/example) ────────── */

interface RawSimpleWord {
  w: string
  m: string
  p: string
  e: string
}

const simplePath = path.resolve(__dirname, '..', 'data', 'words.json')
if (fs.existsSync(simplePath)) {
  const raw = JSON.parse(fs.readFileSync(simplePath, 'utf-8')) as RawSimpleWord[]
  const insert = db.prepare(
    'INSERT OR REPLACE INTO words (word, meaning, pos, example) VALUES (?, ?, ?, ?)'
  )
  const tx = db.transaction(() => {
    for (const r of raw) {
      insert.run(r.w, r.m, r.p, r.e)
    }
  })
  tx()
  console.log(`[seed] words: ${raw.length} rows`)
} else {
  console.log('[seed] words.json not found, skipping')
}

/* ── words-rich.json ─────────────────────────────────────────── */

interface RawRichWord {
  word: string
  pronunciation: string
  pos: string
  posNote: string
  forms: unknown
  coreImage: string
  atomicCore: string
  semanticRadii: unknown
  grammarRules: unknown
  exampleDiagnoses: unknown
  synonymComparisons: unknown
  oneLinePenetration: string
}

const richPath = path.resolve(__dirname, '..', 'data', 'words-rich.json')
if (fs.existsSync(richPath)) {
  const raw = JSON.parse(fs.readFileSync(richPath, 'utf-8')) as RawRichWord[]
  const insert = db.prepare(`
    INSERT OR REPLACE INTO rich_words
      (word, pronunciation, pos, pos_note, core_image, atomic_core,
       one_line_penetration, forms, semantic_radii, grammar_rules,
       example_diagnoses, synonym_comparisons)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Also insert basic info into words table for autocomplete / listing.
  // IMPORTANT: OR IGNORE so words.json (primary source) is never overwritten,
  // and only when posNote is a usable Chinese gloss.
  const insertWord = db.prepare(
    'INSERT OR IGNORE INTO words (word, meaning, pos, example) VALUES (?, ?, ?, ?)'
  )

  const hasCJK = (s: string) => /[\u4e00-\u9fff]/.test(s)

  const tx = db.transaction(() => {
    for (const r of raw) {
      insert.run(
        r.word, r.pronunciation, r.pos, r.posNote,
        r.coreImage, r.atomicCore, r.oneLinePenetration,
        JSON.stringify(r.forms),
        JSON.stringify(r.semanticRadii),
        JSON.stringify(r.grammarRules),
        JSON.stringify(r.exampleDiagnoses),
        JSON.stringify(r.synonymComparisons),
      )
      // Sync basic row into words table only if absent there and gloss is usable
      if (hasCJK(r.posNote)) {
        insertWord.run(r.word, r.posNote, r.pos, '')
      }
    }
  })
  tx()
  console.log(`[seed] rich_words: ${raw.length} rows`)
} else {
  console.log('[seed] words-rich.json not found, skipping')
}

console.log('[seed] Done.')
