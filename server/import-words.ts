/**
 * Batch import word analysis files from a source folder into rich_words table.
 * Usage: npx tsx server/import-words.ts <单词分析文件夹>
 *    or: WORDS_SRC_DIR=<单词分析文件夹> npx tsx server/import-words.ts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import db from './db.js'

const srcArg = process.argv[2] || process.env.WORDS_SRC_DIR
if (!srcArg) {
  console.error('用法: npx tsx server/import-words.ts <单词分析文件夹路径>')
  console.error('      或设置环境变量 WORDS_SRC_DIR=<单词分析文件夹路径>')
  process.exit(1)
}
const SOURCE_DIR = path.resolve(srcArg)

/* ── Parse a single word file ──────────────────────────────── */

interface WordAnalysis {
  word: string
  pronunciation: string
  pos: string
  posNote: string
  forms: { form: string; pos: string; note: string }[]
  coreImage: string
  atomicCore: string
  semanticRadii: { label: string; structure: string; meaning: string; example: string }[]
  grammarRules: string
  exampleDiagnoses: { example: string; diagnosis: string }[]
  synonymComparisons: { word: string; difference: string; example: string }[]
  oneLinePenetration: string
}

function parseWordFile(content: string, filename: string): WordAnalysis | null {
  try {
    const lines = content.split('\n')
    if (lines.length < 5) return null

    // ── Line 1: word /pronunciation/ ──
    const headerLine = lines[0].trim()
    let word = ''
    let pronunciation = ''

    // Try full format: "word /pronunciation/ — pos info"
    const headerMatch = headerLine.match(/^(.+?)\s*\/\s*(.+?)\s*\/\s*(.*)$/)
    if (headerMatch) {
      word = headerMatch[1].trim()
      pronunciation = `/${headerMatch[2].trim()}/`
    } else {
      // Try format without pronunciation: just the word
      const singleWordMatch = headerLine.match(/^([a-zA-Z-]+)$/)
      if (singleWordMatch) {
        word = singleWordMatch[1].trim()
        pronunciation = ''
      } else {
        // Try word with /pronunciation/ on same line (no extra info)
        const altMatch = headerLine.match(/^(.+?)\s*\/\s*(.+?)\s*\/\s*$/)
        if (altMatch) {
          word = altMatch[1].trim()
          pronunciation = `/${altMatch[2].trim()}/`
        } else {
          // No valid header — the file likely starts with section 1 directly.
          // Derive word from filename
          word = filename.replace(/\.txt$/i, '').trim()
          pronunciation = ''
        }
      }
    }

    // ── Split into sections ──
    const text = content

    // Extract sections using regex
    function section(startMarker: string, endMarkers: string[]): string {
      const startIdx = text.indexOf(startMarker)
      if (startIdx === -1) return ''
      const fromStart = text.slice(startIdx + startMarker.length)
      let endIdx = Infinity
      for (const m of endMarkers) {
        const i = fromStart.indexOf(m)
        if (i !== -1 && i < endIdx) endIdx = i
      }
      return endIdx === Infinity ? fromStart.trim() : fromStart.slice(0, endIdx).trim()
    }

    const markers: [string, string[]][] = [
      ['1. 形态与词性', ['2. 核心意象']],
      ['2. 核心意象', ['3. 语义辐射']],
      ['3. 语义辐射', ['4. 语法与强制搭配']],
      ['4. 语法与强制搭配', ['5. 深度例句诊断']],
      ['5. 深度例句诊断', ['6. 认知陷阱与近义词边界']],
      ['6. 认知陷阱与近义词边界', []],
    ]

    const sections = markers.map(([start, ends]) => section(start, ends))

    // ── Section 1: 形态与词性 ──
    const forms: { form: string; pos: string; note: string }[] = []
    const morphLines = sections[0].split('\n').filter(Boolean)
    // First line is the header: 词形\t词性\t说明
    for (let i = 1; i < morphLines.length; i++) {
      const parts = morphLines[i].split('\t')
      if (parts.length >= 3) {
        forms.push({ form: parts[0].trim(), pos: parts[1].trim(), note: parts[2].trim() })
      }
    }
    // Determine primary pos from first form row
    const pos = forms.length > 0 ? forms[0].pos : ''
    const posNote = forms.length > 0 ? forms[0].note : ''

    // ── Section 2: 核心意象 ──
    // Remove the "2. 核心意象（微型叙事）" line that might be included
    let coreImage = sections[1]
    const coreLines = coreImage.split('\n')
    if (coreLines[0]?.includes('核心意象') || coreLines[0]?.includes('微型叙事')) {
      coreImage = coreLines.slice(1).join('\n').trim()
    }

    // ── Section 3: 语义辐射 ──
    let atomicCore = ''
    const semanticRadii: { label: string; structure: string; meaning: string; example: string }[] = []
    const semLines = sections[2].split('\n')
    let i = 0
    // Skip section title line if present
    if (semLines[0]?.includes('语义辐射')) i++
    // Extract atomic core
    for (; i < semLines.length; i++) {
      const line = semLines[i].trim()
      if (line.startsWith('原子核心义')) {
        atomicCore = line.replace(/^原子核心义[：:]\s*/, '').trim()
        i++
        break
      }
    }
    // Skip to table (skip blank lines and find header row)
    while (i < semLines.length && !semLines[i].includes('辐射半径') && !semLines[i].includes('词性+结构')) {
      i++
    }
    if (i < semLines.length) i++ // skip header row
    // Parse table rows
    for (; i < semLines.length; i++) {
      const line = semLines[i].trim()
      if (!line || line === '') continue
      const parts = line.split('\t')
      if (parts.length >= 4) {
        semanticRadii.push({
          label: parts[0].trim(),
          structure: parts[1].trim(),
          meaning: parts[2].trim(),
          example: parts[3].trim(),
        })
      }
    }

    // ── Section 4: 语法与强制搭配 ──
    let grammarRules = sections[3]
    const grammarLines = grammarRules.split('\n')
    // Remove section title
    if (grammarLines[0]?.includes('语法与强制搭配')) {
      grammarRules = grammarLines.slice(1).join('\n').trim()
    }

    // ── Section 5: 深度例句诊断 ──
    const exampleDiagnoses: { example: string; diagnosis: string }[] = []
    const exLines = sections[4].split('\n')
    let j = 0
    // Skip section title
    if (exLines[0]?.includes('深度例句诊断')) j++
    // Skip header row
    while (j < exLines.length && !exLines[j].includes('\t')) j++
    if (j < exLines.length) j++ // skip header
    for (; j < exLines.length; j++) {
      const line = exLines[j].trim()
      if (!line) continue
      const parts = line.split('\t')
      if (parts.length >= 2) {
        exampleDiagnoses.push({
          example: parts[0].trim(),
          diagnosis: parts[1].trim(),
        })
      }
    }

    // ── Section 6: 认知陷阱与近义词边界 ──
    const synonymComparisons: { word: string; difference: string; example: string }[] = []
    let oneLinePenetration = ''
    const synLines = sections[5].split('\n')
    let k = 0
    // Skip section title
    if (synLines[0]?.includes('认知陷阱') || synLines[0]?.includes('近义词边界')) k++
    // Skip header row (词汇\t核心区别\t对比例句)
    while (k < synLines.length && !synLines[k].includes('\t')) k++
    if (k < synLines.length) k++ // skip header
    for (; k < synLines.length; k++) {
      const line = synLines[k].trim()
      if (!line) continue
      // Check for 一句话穿透
      if (line.startsWith('一句话穿透')) {
        oneLinePenetration = line.replace(/^一句话穿透[：:]\s*/, '').trim()
        break
      }
      const parts = line.split('\t')
      if (parts.length >= 3) {
        synonymComparisons.push({
          word: parts[0].trim(),
          difference: parts[1].trim(),
          example: parts[2].trim(),
        })
      }
    }
    // Also check for 一句话穿透 as separate line
    if (!oneLinePenetration) {
      for (const line of synLines) {
        if (line.trim().startsWith('一句话穿透')) {
          oneLinePenetration = line.trim().replace(/^一句话穿透[：:]\s*/, '')
          break
        }
      }
    }

    return {
      word,
      pronunciation,
      pos,
      posNote,
      forms,
      coreImage,
      atomicCore,
      semanticRadii,
      grammarRules,
      exampleDiagnoses,
      synonymComparisons,
      oneLinePenetration,
    }
  } catch (err) {
    console.error(`Error parsing ${filename}:`, (err as Error).message)
    return null
  }
}

/* ── Main import ────────────────────────────────────────────── */

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.txt'))
  console.log(`Found ${files.length} word files`)

  // Drop and recreate rich_words table
  db.exec(`DROP TABLE IF EXISTS rich_words`)
  db.exec(`
    CREATE TABLE rich_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT UNIQUE NOT NULL COLLATE NOCASE,
      pronunciation TEXT NOT NULL DEFAULT '',
      pos TEXT NOT NULL,
      pos_note TEXT NOT NULL DEFAULT '',
      core_image TEXT NOT NULL DEFAULT '',
      atomic_core TEXT NOT NULL DEFAULT '',
      one_line_penetration TEXT NOT NULL DEFAULT '',
      forms TEXT NOT NULL DEFAULT '[]',
      semantic_radii TEXT NOT NULL DEFAULT '[]',
      grammar_rules TEXT NOT NULL DEFAULT '',
      example_diagnoses TEXT NOT NULL DEFAULT '[]',
      synonym_comparisons TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_rich_words_word ON rich_words(word COLLATE NOCASE);
  `)

  // Also ensure words table has entries for search
  const insertRich = db.prepare(`
    INSERT OR REPLACE INTO rich_words
      (word, pronunciation, pos, pos_note, core_image, atomic_core, one_line_penetration,
       forms, semantic_radii, grammar_rules, example_diagnoses, synonym_comparisons)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const upsertWord = db.prepare(`
    INSERT INTO words (word, meaning, pos, example)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(word) DO UPDATE SET meaning = excluded.meaning, pos = excluded.pos, example = excluded.example
  `)

  const insertAll = db.transaction(() => {
    let richCount = 0
    let wordCount = 0

    for (const file of files) {
      const filePath = path.join(SOURCE_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = parseWordFile(content, file)

      if (!parsed) {
        console.warn(`  ⚠ Skipped: ${file}`)
        continue
      }

      // Insert into rich_words
      insertRich.run(
        parsed.word,
        parsed.pronunciation,
        parsed.pos,
        parsed.posNote,
        parsed.coreImage,
        parsed.atomicCore,
        parsed.oneLinePenetration,
        JSON.stringify(parsed.forms),
        JSON.stringify(parsed.semanticRadii),
        parsed.grammarRules,
        JSON.stringify(parsed.exampleDiagnoses),
        JSON.stringify(parsed.synonymComparisons),
      )
      richCount++

      // Upsert into words (simple table for search)
      const meaning = parsed.atomicCore || parsed.posNote
      const firstExample = parsed.exampleDiagnoses[0]?.example || ''
      upsertWord.run(parsed.word, meaning, parsed.pos, firstExample)
      wordCount++

      if (richCount % 500 === 0) {
        console.log(`  Imported ${richCount}/${files.length}...`)
      }
    }

    return { richCount, wordCount }
  })

  const { richCount } = insertAll()

  console.log(`\n✓ Import complete:`)
  console.log(`  rich_words: ${richCount} entries`)
  console.log(`  words (search): updated`)

  // Verify
  const { total } = db.prepare('SELECT COUNT(*) as total FROM rich_words').get() as { total: number }
  console.log(`  DB verification: ${total} rich words in database`)
}

main()
