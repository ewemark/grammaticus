import { Router, type RequestHandler } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All routes require auth
router.use(requireAuth as RequestHandler)

function uid(req: any): number {
  return req.userId as number
}

/* ── Bookmarks ────────────────────────────────────────────── */

// GET /api/user/bookmarks
router.get('/bookmarks', (req: any, res) => {
  const rows = db.prepare('SELECT word, meaning, pos, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(uid(req))
  res.json({ bookmarks: rows })
})

// POST /api/user/bookmarks — add one or sync many
router.post('/bookmarks', (req: any, res) => {
  const { words } = req.body as { words?: { word: string; meaning: string; pos: string }[] }
  if (!words || !Array.isArray(words)) {
    res.status(400).json({ error: 'words array required' })
    return
  }
  const insert = db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, word, meaning, pos) VALUES (?, ?, ?, ?)')
  const tx = db.transaction(() => {
    for (const w of words) {
      insert.run(uid(req), w.word, w.meaning || '', w.pos || '')
    }
  })
  tx()
  res.json({ ok: true })
})

// DELETE /api/user/bookmarks/:word
router.delete('/bookmarks/:word', (req: any, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND word = ?').run(uid(req), req.params.word)
  res.json({ ok: true })
})

/* ── Reading Progress ─────────────────────────────────────── */

// GET /api/user/progress
router.get('/progress', (req: any, res) => {
  const rows = db.prepare('SELECT article_id FROM reading_progress WHERE user_id = ?').all(uid(req)) as { article_id: string }[]
  res.json({ articleIds: rows.map(r => r.article_id) })
})

// POST /api/user/progress
router.post('/progress', (req: any, res) => {
  const { articleId } = req.body as { articleId?: string }
  if (!articleId) {
    res.status(400).json({ error: 'articleId required' })
    return
  }
  db.prepare('INSERT OR IGNORE INTO reading_progress (user_id, article_id) VALUES (?, ?)').run(uid(req), String(articleId))
  res.json({ ok: true })
})

// DELETE /api/user/progress/:articleId
router.delete('/progress/:articleId', (req: any, res) => {
  db.prepare('DELETE FROM reading_progress WHERE user_id = ? AND article_id = ?').run(uid(req), req.params.articleId)
  res.json({ ok: true })
})

/* ── Saved Articles ───────────────────────────────────────── */

// GET /api/user/saved-articles
router.get('/saved-articles', (req: any, res) => {
  const rows = db.prepare('SELECT article_id, title, content, words, created_at FROM saved_articles WHERE user_id = ? ORDER BY created_at DESC').all(uid(req))
  res.json({ articles: rows })
})

// POST /api/user/saved-articles — save one
router.post('/saved-articles', (req: any, res) => {
  const { article_id, title, content, words } = req.body as { article_id?: string; title?: string; content?: string; words?: string[] }
  if (!article_id) {
    res.status(400).json({ error: 'article_id required' })
    return
  }
  db.prepare('INSERT OR REPLACE INTO saved_articles (user_id, article_id, title, content, words) VALUES (?, ?, ?, ?, ?)').run(
    uid(req), String(article_id), title || '', content || '', JSON.stringify(words || [])
  )
  res.json({ ok: true })
})

// DELETE /api/user/saved-articles/:articleId
router.delete('/saved-articles/:articleId', (req: any, res) => {
  db.prepare('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?').run(uid(req), req.params.articleId)
  res.json({ ok: true })
})

/* ── Sync — bulk upload all local data on first login ────── */

// POST /api/user/sync
router.post('/sync', (req: any, res) => {
  const body = req.body as {
    bookmarks?: { word: string; meaning: string; pos: string }[]
    progress?: string[]
    saved?: { id?: string; article_id: string; title: string; content: string; words: string[] }[]
  }

  const tx = db.transaction(() => {
    if (body.bookmarks?.length) {
      const insert = db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, word, meaning, pos) VALUES (?, ?, ?, ?)')
      for (const b of body.bookmarks) insert.run(uid(req), b.word, b.meaning || '', b.pos || '')
    }
    if (body.progress?.length) {
      const insert = db.prepare('INSERT OR IGNORE INTO reading_progress (user_id, article_id) VALUES (?, ?)')
      for (const id of body.progress) insert.run(uid(req), String(id))
    }
    if (body.saved?.length) {
      const insert = db.prepare('INSERT OR IGNORE INTO saved_articles (user_id, article_id, title, content, words) VALUES (?, ?, ?, ?, ?)')
      for (const s of body.saved) insert.run(uid(req), String(s.article_id), s.title || '', s.content || '', JSON.stringify(s.words || []))
    }
  })
  tx()
  res.json({ ok: true })
})

export default router
