import { Router } from 'express'
import { listArticles, listBooks, getArticle } from '../dataStore.js'

const router = Router()

/* ── GET /api/articles — list by book ──────────────────────── */

router.get('/', (_req, res, next) => {
  try {
    const book = (_req.query.book as string | undefined)?.trim() ?? ''
    const rows = listArticles(book || undefined)
    res.json(rows)
  } catch (err) { next(err) }
})

/* ── GET /api/articles/books — list distinct books ─────────── */

router.get('/books', (_req, res, next) => {
  try {
    res.json(listBooks())
  } catch (err) { next(err) }
})

/* ── GET /api/articles/:id — single article ────────────────── */

router.get('/:id', (_req, res, next) => {
  try {
    const id = Number(_req.params.id)
    if (Number.isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return }
    const row = getArticle(id)
    if (!row) { res.status(404).json({ error: 'Article not found' }); return }
    res.json(row)
  } catch (err) { next(err) }
})

export default router