import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All routes require auth — req.userId is guaranteed after the middleware
router.use(requireAuth)

function uid(req: Express.Request): number {
  return req.userId!
}

/* ── Bookmarks ────────────────────────────────────────────── */

// GET /api/user/bookmarks
router.get('/bookmarks', (req, res) => {
  const rows = db.prepare('SELECT word, meaning, pos, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(uid(req))
  res.json({ bookmarks: rows })
})

// POST /api/user/bookmarks — add one or sync many
router.post('/bookmarks', (req, res) => {
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
router.delete('/bookmarks/:word', (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND word = ?').run(uid(req), req.params.word)
  res.json({ ok: true })
})

/* ── Reading Progress ─────────────────────────────────────── */

// GET /api/user/progress
router.get('/progress', (req, res) => {
  const rows = db.prepare('SELECT article_id FROM reading_progress WHERE user_id = ?').all(uid(req)) as { article_id: string }[]
  res.json({ articleIds: rows.map(r => r.article_id) })
})

// POST /api/user/progress
router.post('/progress', (req, res) => {
  const { articleId } = req.body as { articleId?: string }
  if (!articleId) {
    res.status(400).json({ error: 'articleId required' })
    return
  }
  db.prepare('INSERT OR IGNORE INTO reading_progress (user_id, article_id) VALUES (?, ?)').run(uid(req), String(articleId))
  res.json({ ok: true })
})

// DELETE /api/user/progress/:articleId
router.delete('/progress/:articleId', (req, res) => {
  db.prepare('DELETE FROM reading_progress WHERE user_id = ? AND article_id = ?').run(uid(req), req.params.articleId)
  res.json({ ok: true })
})

/* ── Saved Articles ───────────────────────────────────────── */

// GET /api/user/saved-articles
router.get('/saved-articles', (req, res) => {
  const rows = db.prepare('SELECT article_id, title, content, words, created_at FROM saved_articles WHERE user_id = ? ORDER BY created_at DESC').all(uid(req))
  res.json({ articles: rows })
})

// POST /api/user/saved-articles — save one
router.post('/saved-articles', (req, res) => {
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
router.delete('/saved-articles/:articleId', (req, res) => {
  db.prepare('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?').run(uid(req), req.params.articleId)
  res.json({ ok: true })
})

/* ── Sync — bulk upload all local data on first login ────── */

// POST /api/user/sync
router.post('/sync', (req, res) => {
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

/* ── Notes (learning space) ───────────────────────────────── */

interface NoteRow {
  id?: string
  type?: string
  title?: string
  content?: string
  analysis?: string
  sourceWord?: string
  sourceText?: string
  tags?: string[]
  starred?: boolean
  createdAt?: number
  updatedAt?: number
}

// GET /api/user/notes
router.get('/notes', (req, res) => {
  const rows = db.prepare(
    'SELECT note_id, type, title, content, analysis, source_word, source_text, tags, starred, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(uid(req)) as Record<string, string | number>[]
  res.json({
    notes: rows.map((r) => {
      let tags: string[] = []
      try { tags = JSON.parse(String(r.tags ?? '[]')) as string[] } catch { /* ignore */ }
      return {
        id: r.note_id,
        type: r.type,
        title: r.title,
        content: r.content,
        analysis: r.analysis || undefined,
        sourceWord: r.source_word || undefined,
        sourceText: r.source_text || undefined,
        tags: tags.length > 0 ? tags : undefined,
        starred: Number(r.starred) === 1 || undefined,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
      }
    }),
  })
})

// POST /api/user/notes/sync — upsert by note_id
router.post('/notes/sync', (req, res) => {
  const { notes } = req.body as { notes?: NoteRow[] }
  if (!notes || !Array.isArray(notes)) {
    res.status(400).json({ error: 'notes array required' })
    return
  }
  const upsert = db.prepare(`
    INSERT INTO notes (user_id, note_id, type, title, content, analysis, source_word, source_text, tags, starred, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, note_id) DO UPDATE SET
      type = excluded.type, title = excluded.title, content = excluded.content,
      analysis = excluded.analysis, source_word = excluded.source_word, source_text = excluded.source_text,
      tags = excluded.tags, starred = excluded.starred, updated_at = excluded.updated_at
  `)
  const now = Date.now()
  const tx = db.transaction(() => {
    for (const n of notes.slice(0, 500)) {
      if (!n.id) continue
      upsert.run(
        uid(req), String(n.id), n.type || 'text', n.title || '', n.content || '',
        n.analysis || '', n.sourceWord || '', n.sourceText || '',
        JSON.stringify(n.tags ?? []), n.starred ? 1 : 0,
        Number(n.createdAt) || now, Number(n.updatedAt) || now,
      )
    }
  })
  tx()
  res.json({ ok: true })
})

// DELETE /api/user/notes/:noteId
router.delete('/notes/:noteId', (req, res) => {
  db.prepare('DELETE FROM notes WHERE user_id = ? AND note_id = ?').run(uid(req), req.params.noteId)
  res.json({ ok: true })
})

/* ── Dictionary (learning space) ──────────────────────────── */

interface DictRow {
  word?: string
  meaning?: string
  pos?: string
  myUnderstanding?: string
  aiFeedback?: string
  myExample?: string
  addedAt?: number
  updatedAt?: number
}

// GET /api/user/dictionary
router.get('/dictionary', (req, res) => {
  const rows = db.prepare(
    'SELECT word, meaning, pos, my_understanding, ai_feedback, my_example, created_at, updated_at FROM dictionary WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(uid(req)) as Record<string, string | number>[]
  res.json({
    words: rows.map((r) => ({
      word: r.word,
      meaning: r.meaning,
      pos: r.pos,
      myUnderstanding: r.my_understanding,
      aiFeedback: r.ai_feedback || undefined,
      myExample: r.my_example || undefined,
      addedAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    })),
  })
})

// POST /api/user/dictionary/sync — upsert by word
router.post('/dictionary/sync', (req, res) => {
  const { words } = req.body as { words?: DictRow[] }
  if (!words || !Array.isArray(words)) {
    res.status(400).json({ error: 'words array required' })
    return
  }
  const upsert = db.prepare(`
    INSERT INTO dictionary (user_id, word, meaning, pos, my_understanding, ai_feedback, my_example, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, word) DO UPDATE SET
      meaning = excluded.meaning, pos = excluded.pos,
      my_understanding = excluded.my_understanding, ai_feedback = excluded.ai_feedback,
      my_example = excluded.my_example, updated_at = excluded.updated_at
  `)
  const now = Date.now()
  const tx = db.transaction(() => {
    for (const w of words.slice(0, 500)) {
      if (!w.word) continue
      upsert.run(
        uid(req), String(w.word).slice(0, 60), w.meaning || '', w.pos || '',
        w.myUnderstanding || '', w.aiFeedback || '', w.myExample || '',
        Number(w.addedAt) || now, Number(w.updatedAt) || now,
      )
    }
  })
  tx()
  res.json({ ok: true })
})

// DELETE /api/user/dictionary/:word
router.delete('/dictionary/:word', (req, res) => {
  db.prepare('DELETE FROM dictionary WHERE user_id = ? AND word = ?').run(uid(req), req.params.word)
  res.json({ ok: true })
})

export default router
