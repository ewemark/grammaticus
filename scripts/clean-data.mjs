/**
 * 数据清洗脚本 — 修复 data/words.json 与 data/words-rich.json 的质量问题
 *
 * 1. 去除释义中的「核心词性：」前缀噪音
 * 2. 去除释义中误混入的英文词条(如 "transplants")——当 m 字段只含 ASCII 且与单词同根时
 * 3. 修复错误的词性:pos 为 OTHER/空时,用后缀启发式推断(仅当无法从其他来源获得时)
 * 4. 统计仍缺失释义的词条,输出到 data/missing-meanings.json 供后续 AI 补全
 *
 * 运行: node scripts/clean-data.mjs
 * 原文件会被备份为 *.json.bak(仅第一次)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '..', 'data')

const wordsPath = path.join(dataDir, 'words.json')
const richPath = path.join(dataDir, 'words-rich.json')

// Backup once
for (const p of [wordsPath, richPath]) {
  const bak = p + '.bak'
  if (!fs.existsSync(bak)) fs.copyFileSync(p, bak)
}

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'))
const rich = JSON.parse(fs.readFileSync(richPath, 'utf-8'))

// Curated glosses for words whose meanings were junk/empty (generated once, committed to repo)
const fillPath = path.join(dataDir, 'fill-meanings.json')
const fill = fs.existsSync(fillPath) ? JSON.parse(fs.readFileSync(fillPath, 'utf-8')) : []
const fillMap = new Map(fill.map((f) => [f.w.toLowerCase(), f]))

const PREFIX = /^核心词性[:：]\s*/

/** Strip the 核心词性 prefix noise */
function stripPrefix(s) {
  return (s || '').replace(PREFIX, '').trim()
}

/**
 * Detect meanings that are actually word forms / English junk rather than Chinese glosses.
 * e.g. "transplants", "traps trapped trapping", "treatment n. 对待 治疗" (has Chinese → keep)
 */
function isJunkMeaning(m, word) {
  if (!m) return true
  const hasCJK = /[\u4e00-\u9fff]/.test(m)
  if (hasCJK) return false
  // Pure ASCII meaning: junk if it looks like forms of the headword
  const tokens = m.toLowerCase().split(/[\s,;]+/).filter(Boolean)
  if (tokens.length === 0) return true
  const base = word.toLowerCase()
  const allRelated = tokens.every((t) => {
    const clean = t.replace(/[^a-z]/g, '')
    if (!clean) return true
    return (
      clean.startsWith(base.slice(0, Math.max(4, base.length - 4))) ||
      base.startsWith(clean.slice(0, Math.max(4, clean.length - 4)))
    )
  })
  return allRelated
}

/** Heuristic POS inference from suffix (fallback for OTHER/empty) */
function inferPos(word, meaning, example) {
  const w = word.toLowerCase()
  if (/(tion|sion|ment|ness|ity|ance|ence|ship|hood|ism|ist|er|or|ar|ist)$/.test(w)) return 'NOUN'
  if (/(ful|less|ous|ive|able|ible|al|ial|ic|ish|y)$/.test(w)) return 'ADJECTIVE'
  if (/ly$/.test(w)) return 'ADVERB'
  if (/(ize|ise|ify|ate|en)$/.test(w)) return 'VERB'
  // From Chinese gloss hints
  const m = meaning || ''
  if (m.includes('的；') || m.includes('的,') || m.endsWith('的')) return 'ADJECTIVE'
  if (m.startsWith('使') || m.includes('；做') || m.includes('…')) return 'VERB'
  return null
}

let stats = { prefixStripped: 0, junkCleared: 0, posFixed: 0, filled: 0, stillMissing: [] }

// ── Clean rich first (it feeds words) ──────────────────────
const richMap = new Map()
for (const r of rich) {
  const before = r.posNote || ''
  r.posNote = stripPrefix(before)
  if (before !== r.posNote) stats.prefixStripped++
  // Junk posNote (english word-forms or leftover label) → clear and fill from curated glosses
  if (isJunkMeaning(r.posNote, r.word) || r.posNote === '核心词性') {
    r.posNote = ''
    stats.junkCleared++
    const f = fillMap.get(r.word.toLowerCase())
    if (f) r.posNote = f.m
  }
  richMap.set(r.word.toLowerCase(), r)
}

// ── Clean words ────────────────────────────────────────────
for (const w of words) {
  const before = w.m || ''
  w.m = stripPrefix(before)
  if (before !== w.m) stats.prefixStripped++

  // Curated fill list wins over junk/missing/label-leftover data
  const f0 = fillMap.get(w.w.toLowerCase())
  const isLabelLeftover = w.m === '核心词性'
  const isUsageNote = f0 && /^[a-zA-Z]/.test(w.m) && !/[\u4e00-\u9fff]/.test(w.m.slice(0, 3))
  if (f0 && (!w.m || !w.m.trim() || isLabelLeftover || isJunkMeaning(w.m, w.w) || isUsageNote)) {
    w.m = f0.m
    if (f0.p) w.p = f0.p
    stats.filled++
    continue
  }
  if (f0 && (!w.p || w.p === 'OTHER')) {
    w.p = f0.p
    stats.posFixed++
  }

  // Junk meaning (english word-forms) → clear, try rich
  if (isJunkMeaning(w.m, w.w)) {
    w.m = ''
    stats.junkCleared++
    const r = richMap.get(w.w.toLowerCase())
    if (r && r.posNote && !isJunkMeaning(r.posNote, w.w)) {
      w.m = r.posNote
    }
  }

  // Empty meaning → try rich posNote, then curated fill list
  if (!w.m || !w.m.trim()) {
    const r = richMap.get(w.w.toLowerCase())
    if (r && r.posNote && r.posNote.trim() && !isJunkMeaning(r.posNote, w.w)) {
      w.m = r.posNote.trim()
    } else {
      const f = fillMap.get(w.w.toLowerCase())
      if (f) {
        w.m = f.m
        stats.filled++
      }
    }
  }

  // Fix POS: OTHER/empty → fill list → rich pos → heuristic
  const badPos = !w.p || w.p === 'OTHER'
  if (badPos) {
    const f = fillMap.get(w.w.toLowerCase())
    const r = richMap.get(w.w.toLowerCase())
    let fixed = null
    if (f && f.p && f.p !== 'OTHER') {
      fixed = f.p
    } else if (r && r.pos && r.pos !== 'OTHER') {
      fixed = r.pos
    } else {
      fixed = inferPos(w.w, w.m, w.e)
    }
    if (fixed) {
      w.p = fixed
      stats.posFixed++
      if (r && (!r.pos || r.pos === 'OTHER')) r.pos = fixed
    }
  }

  if (!w.m || !w.m.trim()) {
    stats.stillMissing.push({ word: w.w, pos: w.p, example: w.e })
  }
}

// Also fix rich pos OTHER/empty using cleaned words data
const wordsMap = new Map(words.map((w) => [w.w.toLowerCase(), w]))
for (const r of rich) {
  if (!r.pos || r.pos === 'OTHER') {
    const w = wordsMap.get(r.word.toLowerCase())
    if (w && w.p && w.p !== 'OTHER') {
      r.pos = w.p
      stats.posFixed++
    } else {
      const inferred = inferPos(r.word, r.posNote, '')
      if (inferred) {
        r.pos = inferred
        stats.posFixed++
      }
    }
  }
}

fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), 'utf-8')
fs.writeFileSync(richPath, JSON.stringify(rich, null, 2), 'utf-8')

// Write missing list for AI fill (next step)
const missingPath = path.join(dataDir, 'missing-meanings.json')
fs.writeFileSync(missingPath, JSON.stringify(stats.stillMissing, null, 2), 'utf-8')

console.log('=== Clean done ===')
console.log('prefix stripped:', stats.prefixStripped)
console.log('junk meanings cleared:', stats.junkCleared)
console.log('filled from curated list:', stats.filled)
console.log('pos fixed:', stats.posFixed)
console.log('still missing meaning:', stats.stillMissing.length)
console.log('missing list →', missingPath)
