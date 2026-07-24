import { Router } from 'express'
import db from '../db.js'

const router = Router()

/* ── GET /api/articles — list by book ──────────────────────── */

router.get('/', (_req, res, next) => {
  try {
    const book = (_req.query.book as string | undefined)?.trim() ?? ''
    let sql = 'SELECT id, book, lesson, title, title_cn, level FROM articles'
    const params: string[] = []
    if (book) { sql += ' WHERE book = ?'; params.push(book) }
    sql += ' ORDER BY book, lesson ASC'
    const rows = db.prepare(sql).all(...params)
    res.json(rows)
  } catch (err) { next(err) }
})

/* ── GET /api/articles/books — list distinct books ─────────── */

router.get('/books', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT DISTINCT book FROM articles ORDER BY book ASC').all() as { book: string }[]
    res.json(rows.map((r) => r.book))
  } catch (err) { next(err) }
})

/* ── GET /api/articles/:id — single article ────────────────── */

router.get('/:id', (_req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(_req.params.id)
    if (!row) { res.status(404).json({ error: 'Article not found' }); return }
    res.json(row)
  } catch (err) { next(err) }
})

export default router
