/**
 * Parse grammar HTML files using cheerio → structured content blocks.
 * Run: npx tsx server/parse-grammar-html.ts <HTML 源文件夹>
 *   or set GRAMMAR_HTML_SRC_DIR=<HTML 源文件夹>
 */
import fs from 'node:fs'
import path from 'node:path'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'

const srcArg = process.argv[2] || process.env.GRAMMAR_HTML_SRC_DIR
if (!srcArg) {
  console.error('用法: npx tsx server/parse-grammar-html.ts <HTML 源文件夹路径>')
  console.error('      或设置环境变量 GRAMMAR_HTML_SRC_DIR=<HTML 源文件夹路径>')
  process.exit(1)
}
const SRC = path.resolve(srcArg)
const DST = path.resolve('src', 'data', 'grammarDocs.ts')

type Block =
  | { type: 'h2' | 'h3' | 'h4'; text: string }
  | { type: 'p'; text: string }
  | { type: 'larry'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'warn'; text: string }
  | { type: 'point'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'exercise'; text: string }
  | { type: 'example'; en: string; cn: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

function cleanText(el: cheerio.Cheerio<AnyNode>): string {
  return el.text()
    .replace(/\s+/g, ' ')
    .replace(/[-。，！？：；""''（）【】《》…—]{2,}/g, (m) => m[0]) // collapse repeated punctuation
    .replace(/\s+([。，！？：；)）】》])/g, '$1') // remove space before Chinese punct
    .trim()
}

function htmlText(el: cheerio.Cheerio<AnyNode>): string {
  let html = el.html() || ''
  html = html.replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<a[^>]*>/gi, '')
    .replace(/<\/a>/gi, '')
    .replace(/<code[^>]*>/gi, '')
    .replace(/<\/code>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\*\*/g, '')  // remove bold markers
    .replace(/([-。，！？：；""''（）【】《》…—])\1+/g, '$1')  // collapse only SAME repeated punctuation
    .replace(/\s+([。，！？：；)）】》])/g, '$1')
    .replace(/[ \t]+/g, ' ')   // collapse horizontal whitespace only
    .replace(/\n{3,}/g, '\n\n') // preserve line breaks, just limit to 2 max
    .trim()
  return html
}

function extractBlocks(html: string): { blocks: Block[]; title: string; subtitle: string } {
  const $ = cheerio.load(html)
  const blocks: Block[] = []

  // Extract title from h2
  const h2Text = $('h2').first().text().trim()
  let title = h2Text.replace(/^第[一二三四五六七]章\s*/, '').trim()
  title = title.replace(/\s*[-–—]\s*英语语法体系完全指南.*$/, '').trim()

  const orderMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 }
  const orderMatch = h2Text.match(/第([一二三四五六七])章/)
  const order = orderMatch ? (orderMap[orderMatch[1]] || 0) : 0
  const subtitleMap: Record<number, string> = {
    1: 'Parts of Speech Reimagined', 2: 'Simple Sentences',
    3: 'Clauses', 4: 'Non-finite Verbs', 5: 'Tense & Aspect',
    6: 'Subjunctive Mood', 7: 'Advanced Lexical Grammar',
  }
  const subtitle = subtitleMap[order] || ''

  // Remove <style>, <script>, navigation
  $('style, script').remove()
  $('h1').remove()
  $('h2').first().remove()

  // Remove footer links
  $('a[href*="完整版"]').parent().remove()
  $('p:contains("返回")').remove()
  $('hr').remove()

  // Process body > * elements in order
  const body = $('body')

  body.children().each((_, el) => {
    const $el = $(el)
    const tag = el.tagName?.toLowerCase() || ''
    const cls = ($el.attr('class') || '').toLowerCase()

    // h3, h4
    if (tag === 'h3') {
      const text = cleanText($el)
      if (text) blocks.push({ type: 'h3', text })
      return
    }
    if (tag === 'h4') {
      const text = cleanText($el)
      if (text) blocks.push({ type: 'h4', text })
      return
    }

    // div — check classes
    if (tag === 'div') {
      // Larry quote
      if (cls.includes('larry')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'larry', text })
        return
      }
      // Tip
      if (cls.includes('tip')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'tip', text })
        return
      }
      // Warning
      if (cls.includes('warn')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'warn', text })
        return
      }
      // Point
      if (cls.includes('point')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'point', text })
        return
      }
      // Summary
      if (cls.includes('summary')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'summary', text })
        return
      }
      // Exercise
      if (cls.includes('exercise')) {
        const text = htmlText($el)
        if (text) blocks.push({ type: 'exercise', text })
        return
      }
      // Example box
      if (cls.includes('ex-box')) {
        const enEl = $el.find('.en')
        const cnEl = $el.find('.cn')
        const analysisEl = $el.find('.analysis')
        const en = enEl.length ? htmlText(enEl) : ''
        const cn = cnEl.length ? htmlText(cnEl) : (analysisEl.length ? htmlText(analysisEl) : '')
        if (!cn && !en) {
          // Just a plain text example
          const text = htmlText($el)
          if (text) blocks.push({ type: 'example', en: text, cn: '' })
        } else if (en) {
          blocks.push({ type: 'example', en, cn })
        }
        return
      }
      // Card — generic container, process children
      if (cls.includes('card')) {
        $el.children().each((_, child) => {
          const $c = $(child)
          const ctag = child.tagName?.toLowerCase() || ''
          if (ctag === 'p') {
            const text = htmlText($c)
            if (text) blocks.push({ type: 'p', text })
          } else if (ctag === 'h3') {
            const text = cleanText($c)
            if (text) blocks.push({ type: 'h3', text })
          } else if (ctag === 'h4') {
            const text = cleanText($c)
            if (text) blocks.push({ type: 'h4', text })
          }
        })
        return
      }
    }

    // p — detect step lists and inline lists
    if (tag === 'p') {
      const text = htmlText($el)
      if (!text) return

      // Pattern 1: explicit step markers like 第①步, 第1步, 第一步
      const stepSplit = text.split(/(?=第[①②③④⑤⑥⑦⑧⑨⑩\d]+步|第[一二三四五六七八九十]+步|\d+[.、])/g)
      if (stepSplit.length > 1 && stepSplit.every(s => /^(第[①②③④⑤⑥⑦⑧⑨⑩\d]+步|第[一二三四五六七八九十]+步|\d+[.、])/.test(s.trim()))) {
        blocks.push({ type: 'list', items: stepSplit.map(s => s.trim()) })
        return
      }

      // Pattern 2: semicolons separating 3+ substantial items (>20 chars each)
      const semiParts = text.split(/[；;]/g).filter(s => s.trim().length > 15)
      if (semiParts.length >= 3 && text.length > 80) {
        blocks.push({ type: 'list', items: semiParts.map(s => s.trim()) })
        return
      }

      // Pattern 3: question-answer chain (multiple ？ in one paragraph)
      const qaCount = (text.match(/[？?]/g) || []).length
      if (qaCount >= 3) {
        const qaParts = text.split(/(?<=[？?])/g).filter(s => s.trim())
        if (qaParts.length >= 3) {
          blocks.push({ type: 'list', items: qaParts.map(s => s.trim()) })
          return
        }
      }

      blocks.push({ type: 'p', text })
      return
    }

    // table
    if (tag === 'table') {
      const headers: string[] = []
      const rows: string[][] = []

      $el.find('thead th').each((_, th) => {
        headers.push(cleanText($(th)))
      })

      // If no thead, check first tr for th
      if (headers.length === 0) {
        $el.find('tr').first().find('th').each((_, th) => {
          headers.push(cleanText($(th)))
        })
      }

      $el.find('tbody tr, tr').each((_, tr) => {
        const $tr = $(tr)
        const tds: string[] = []
        $tr.find('td').each((_, td) => {
          tds.push(htmlText($(td)))
        })
        if (tds.length > 0) rows.push(tds)
      })

      if (headers.length > 0 || rows.length > 0) {
        blocks.push({ type: 'table', headers, rows })
      }
      return
    }

    // ol/ul list
    if (tag === 'ol' || tag === 'ul') {
      const items: string[] = []
      $el.find('li').each((_, li) => {
        items.push(htmlText($(li)))
      })
      if (items.length > 0) blocks.push({ type: 'list', items })
      return
    }
  })

  return { blocks, title, subtitle }
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source folder not found:', SRC)
    process.exit(1)
  }

  const files = fs.readdirSync(SRC)
    .filter(f => f.endsWith('.html') && f.startsWith('ch'))
    .sort()

  const chapters: { id: string; order: number; title: string; subtitle: string; intro: string; blocks: Block[] }[] = []

  for (const file of files) {
    const orderMatch = file.match(/ch(\d)/)
    const order = orderMatch ? parseInt(orderMatch[1]) : 0
    const html = fs.readFileSync(path.join(SRC, file), 'utf-8')
    const { blocks, title, subtitle } = extractBlocks(html)

    const idMap: Record<number, string> = {
      1: 'parts-of-speech', 2: 'simple-sentences', 3: 'clauses',
      4: 'nonfinite-verbs', 5: 'tense', 6: 'subjunctive', 7: 'lexical-grammar',
    }

    const firstP = blocks.find(b => b.type === 'p')
    const intro = firstP && firstP.type === 'p' ? firstP.text.slice(0, 120) + '…' : ''

    chapters.push({ id: idMap[order] || `ch${order}`, order, title, subtitle, intro, blocks })
    console.log(`  Ch${order}: ${title} — ${blocks.length} blocks`)
  }

  chapters.sort((a, b) => a.order - b.order)

  const ts = `// Auto-generated from HTML grammar chapters
// Generated: ${new Date().toISOString()}

export interface GrammarBlock {
  type: 'h2' | 'h3' | 'h4' | 'p' | 'larry' | 'tip' | 'warn' | 'point' | 'summary' | 'exercise' | 'example' | 'list' | 'table'
  text?: string
  en?: string
  cn?: string
  items?: string[]
  headers?: string[]
  rows?: string[][]
}

export interface GrammarChapter {
  id: string
  order: number
  title: string
  subtitle: string
  intro: string
  blocks: GrammarBlock[]
}

export const GRAMMAR_CHAPTERS: GrammarChapter[] = ${JSON.stringify(chapters, null, 2)};
`

  fs.mkdirSync(path.dirname(DST), { recursive: true })
  fs.writeFileSync(DST, ts, 'utf-8')
  console.log(`\n✓ ${chapters.length} chapters → ${DST}`)
}

main()
