/**
 * Seed NCE articles — reads JSON data files and inserts into DB.
 * Run: npx tsx server/seed-nce.ts
 */
import db from './db.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(__dirname, '..', 'data')

interface NCELesson { lesson: number; title: string; title_cn: string; content: string }

const insert = db.prepare(`
  INSERT OR REPLACE INTO articles (book, lesson, title, title_cn, content, level)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const tx = db.transaction(() => {
  const files = [
    { file: 'nce-book1.json', book: 'Book 1', level: 'BEGINNER' },
    { file: 'nce-book2.json', book: 'Book 2', level: 'INTERMEDIATE' },
    { file: 'nce-book3.json', book: 'Book 3', level: 'ADVANCED' },
    { file: 'nce-book4.json', book: 'Book 4', level: 'ADVANCED' },
  ]
  for (const { file, book, level } of files) {
    const fp = path.join(DATA, file)
    if (!fs.existsSync(fp)) { console.log(`  SKIP ${file} (not found)`); continue }
    const lessons: NCELesson[] = JSON.parse(fs.readFileSync(fp, 'utf-8'))
    for (const a of lessons) insert.run(book, a.lesson, a.title, a.title_cn, a.content, level)
    console.log(`  ${book}: ${lessons.length} lessons`)
  }
})

tx()
console.log('[seed-nce] Done.')
