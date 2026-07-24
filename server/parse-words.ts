/**
 * Parse all .txt files from 英语学习认知 folder into words-rich.json format.
 * Run: npx tsx server/parse-words.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_DIR = path.resolve('C:/Users/ASUS/Desktop/英语学习认知')
const OUT_SIMPLE = path.resolve(__dirname, '..', 'data', 'words-parsed.json')
const OUT_RICH = path.resolve(__dirname, '..', 'data', 'words-rich-parsed.json')

interface ParsedWord {
  word: string
  pronunciation: string
  pos: string
  posNote: string
  forms: { form: string; pos: string; note: string }[]
  coreImage: string
  atomicCore: string
  semanticRadii: { label: string; structure: string; meaning: string; example: string }[]
  grammarRules: { title: string; items: string[] }[]
  exampleDiagnoses: { example: string; diagnosis: string }[]
  synonymComparisons: { word: string; difference: string; example: string }[]
  oneLinePenetration: string
}

function parseFile(content: string, filename: string): ParsedWord | null {
  try {
    const lines = content.split(/\r?\n/).map((l) => l.trim())

    // Line 1: word / pronunciation /
    const titleLine = lines[0]
    const titleMatch = titleLine.match(/^(.+?)\s*\/\s*(.+?)\s*\/?\s*$/)
    if (!titleMatch) { console.warn(`[skip] ${filename}: bad title line`); return null }
    const word = titleMatch[1].trim()
    const pronunciation = `/${titleMatch[2].trim()}/`

    // Detect POS from section 1 table
    let pos = ''
    let posNote = ''
    const forms: ParsedWord['forms'] = []
    let coreImage = ''
    let atomicCore = ''
    const semanticRadii: ParsedWord['semanticRadii'] = []
    const grammarRules: ParsedWord['grammarRules'] = []
    const exampleDiagnoses: ParsedWord['exampleDiagnoses'] = []
    const synonymComparisons: ParsedWord['synonymComparisons'] = []
    let oneLinePenetration = ''

    let section = 0 // 0=header, 1=forms, 2=coreImage, 3=semantic, 4=grammar, 5=examples, 6=synonyms

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Detect section headers
      if (line.includes('1. 形态与词性')) { section = 1; i += 1; continue }
      if (line.includes('2. 核心意象')) { section = 2; continue }
      if (line.includes('3. 语义辐射')) { section = 3; i += 1; continue }
      if (line.includes('4. 语法与强制搭配')) { section = 4; continue }
      if (line.includes('5. 深度例句诊断')) { section = 5; i += 1; continue }
      if (line.includes('6. 认知陷阱与近义词边界')) { section = 6; i += 1; continue }
      if (line.startsWith('一句话穿透')) {
        oneLinePenetration = line.replace(/^一句话穿透[：:]?\s*/, '').trim()
        continue
      }

      if (!line) continue

      /* ── Section 1: 形态与词性 table ─── */
      if (section === 1) {
        // Skip table header
        if (line.startsWith('词形') || line.includes('\t词形')) { i += 1; continue }
        // Table row: form \t pos \t note
        const cols = line.split('\t')
        if (cols.length >= 3) {
          const form = cols[0].trim()
          const p = cols[1].trim()
          const note = cols.slice(2).join(' ').trim()
          forms.push({ form, pos: p, note })
          // First row is the primary POS
          if (!pos) {
            pos = inferPOS(p)
            posNote = note
          }
        } else {
          // May be a note line like "（拼读陷阱...）"
          section = 2 // move on
        }
        continue
      }

      /* ── Section 2: 核心意象 ─── */
      if (section === 2) {
        coreImage += (coreImage ? '\n\n' : '') + line
        // Next section detected by content
        if (line.includes('原子核心义')) {
          section = 3
          // Extract atomic core from same line
          const ac = line.replace(/^原子核心义[：:]\s*/, '').trim()
          if (ac) atomicCore = ac
          // If next line exists and isn't table header, might continue
          continue
        }
        continue
      }

      /* ── Section 3: 语义辐射 ─── */
      if (section === 3) {
        if (line.startsWith('原子核心义')) {
          atomicCore = line.replace(/^原子核心义[：:]\s*/, '').trim()
          continue
        }
        if (line.startsWith('辐射半径') || line.includes('\t辐射半径')) { i += 1; continue }
        const cols = line.split('\t')
        if (cols.length >= 4) {
          semanticRadii.push({
            label: cols[0].trim(),
            structure: cols[1].trim(),
            meaning: cols[2].trim(),
            example: cols[3].trim(),
          })
        }
        continue
      }

      /* ── Section 4: 语法与强制搭配 ─── */
      if (section === 4) {
        // The grammar section is one or more paragraphs. We split into:
        // - First paragraph: general rules
        // - Detect patterns for sub-rules
        const text = line.trim()
        if (text) {
          // Try to detect titled sub-sections
          if (text.includes('与') && (text.includes('的区别') || text.includes('的差异'))) {
            grammarRules.push({ title: '近义词辨析', items: [text] })
          } else if (text.includes('不能') || text.includes('不可') || text.includes('绝对不') || text.includes('典型错误') || text.includes('必须')) {
            grammarRules.push({ title: '用法规则', items: [text] })
          } else if (text.includes('被动') || text.includes('及物') || text.includes('宾语') || text.includes('搭配') || text.includes('结构') || text.includes('后接')) {
            grammarRules.push({ title: '语法结构', items: [text] })
          } else if (text.includes('短语') || text.includes('搭配') || text.includes('组合')) {
            grammarRules.push({ title: '必背搭配', items: [text] })
          } else {
            // Merge with last rule or create new
            if (grammarRules.length > 0 && grammarRules[grammarRules.length - 1].title === '用法说明') {
              grammarRules[grammarRules.length - 1].items.push(text)
            } else {
              grammarRules.push({ title: '用法说明', items: [text] })
            }
          }
        }
        continue
      }

      /* ── Section 5: 深度例句诊断 ─── */
      if (section === 5) {
        if (line.startsWith('例句') || line.includes('\t例句')) { i += 1; continue }
        const cols = line.split('\t')
        if (cols.length >= 2) {
          exampleDiagnoses.push({
            example: cols[0].trim(),
            diagnosis: cols.slice(1).join(' ').trim(),
          })
        }
        continue
      }

      /* ── Section 6: 认知陷阱 ─── */
      if (section === 6) {
        if (line.startsWith('词汇') || line.includes('\t词汇')) { i += 1; continue }
        const cols = line.split('\t')
        if (cols.length >= 3) {
          synonymComparisons.push({
            word: cols[0].trim(),
            difference: cols[1].trim(),
            example: cols[2].trim(),
          })
        }
        continue
      }
    }

    return {
      word, pronunciation, pos, posNote, forms, coreImage, atomicCore,
      semanticRadii, grammarRules, exampleDiagnoses, synonymComparisons, oneLinePenetration,
    }
  } catch (err) {
    console.error(`[error] ${filename}:`, err)
    return null
  }
}

function inferPOS(posStr: string): string {
  const s = posStr.toLowerCase()
  if (s.startsWith('v.') || s.startsWith('verb')) return 'VERB'
  if (s.startsWith('n.') || s.startsWith('noun')) return 'NOUN'
  if (s.startsWith('adj.') || s.startsWith('adjective')) return 'ADJECTIVE'
  if (s.startsWith('adv.') || s.startsWith('adverb')) return 'ADVERB'
  if (s.startsWith('prep')) return 'PREPOSITION'
  if (s.startsWith('conj')) return 'CONJUNCTION'
  if (s.startsWith('pron')) return 'PRONOUN'
  return 'OTHER'
}

/* ── main ───────────────────────────────────────────────────── */

const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.txt'))
console.log(`Found ${files.length} files`)

const richWords: ParsedWord[] = []
const simpleWords: { word: string; meaning: string; pos: string; example: string }[] = []

for (const file of files) {
  const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8')
  const parsed = parseFile(content, file)
  if (!parsed) continue

  richWords.push(parsed)

  // Also create a simple entry for the words table
  simpleWords.push({
    word: parsed.word,
    meaning: parsed.posNote || parsed.atomicCore || '',
    pos: parsed.pos,
    example: parsed.exampleDiagnoses[0]?.example || '',
  })
}

fs.writeFileSync(OUT_RICH, JSON.stringify(richWords, null, 2), 'utf-8')
fs.writeFileSync(OUT_SIMPLE, JSON.stringify(simpleWords, null, 2), 'utf-8')
console.log(`Parsed: ${richWords.length} rich, ${simpleWords.length} simple`)
console.log(`Output: ${OUT_SIMPLE}`)
console.log(`Output: ${OUT_RICH}`)
