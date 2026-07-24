import { Router } from 'express'
import db from '../db.js'

const router = Router()

/* ── GET /api/learn/queue — 待复习队列 ───────────────────── */

router.get('/queue', (_req, res, next) => {
  try {
    const now = new Date().toISOString()

    // Words due for review
    const rows = db.prepare(`
      SELECT * FROM word_learning
      WHERE next_review_at IS NULL OR next_review_at <= ?
      ORDER BY
        CASE WHEN next_review_at IS NULL THEN 1 ELSE 0 END DESC,
        next_review_at ASC
      LIMIT 20
    `).all(now)
    res.json(rows)
  } catch (err) { next(err) }
})

/* ── POST /api/learn/sync — 同步收藏词到学习库 ────────────── */

router.post('/sync', (req, res, next) => {
  try {
    const { words } = req.body
    if (!Array.isArray(words) || words.length === 0) {
      res.json({ added: 0 }); return
    }
    const now = new Date().toISOString()
    const insert = db.prepare(`
      INSERT OR IGNORE INTO word_learning (word, next_review_at, state)
      VALUES (?, ?, 'learning')
    `)
    let added = 0
    const tx = db.transaction(() => {
      for (const w of words) {
        const result = insert.run(String(w), now)
        if (result.changes > 0) added++
      }
    })
    tx()
    res.json({ added })
  } catch (err) { next(err) }
})

/* ── GET /api/learn/stats ─────────────────────────────────── */

router.get('/stats', (_req, res, next) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as cnt FROM word_learning').get() as { cnt: number }
    const active = db.prepare("SELECT COUNT(*) as cnt FROM word_learning WHERE state = 'active'").get() as { cnt: number }
    const dormant = db.prepare("SELECT COUNT(*) as cnt FROM word_learning WHERE state = 'dormant'").get() as { cnt: number }
    const due = db.prepare('SELECT COUNT(*) as cnt FROM word_learning WHERE next_review_at <= ?').get(new Date().toISOString()) as { cnt: number }
    res.json({ total: total.cnt, active: active.cnt, dormant: dormant.cnt, due: due.cnt })
  } catch (err) { next(err) }
})

/* ── POST /api/learn/start — 首次录入 ────────────────────── */

router.post('/start', (req, res, next) => {
  try {
    const { word, meaning, anchor } = req.body
    if (!word) { res.status(400).json({ error: 'word required' }); return }

    const now = Date.now()
    const firstReview = new Date(now).toISOString()  // immediate first review
    const stability = anchor ? 0.6 : 0.3

    db.prepare(`
      INSERT OR REPLACE INTO word_learning (word, meaning, stability, interval_hours, next_review_at, memory_anchor, state)
      VALUES (?, ?, ?, 0.5, ?, ?, 'learning')
    `).run(word, meaning || '', stability, firstReview, anchor || '')

    res.json({ word, stability, next_review_at: firstReview, state: 'learning' })
  } catch (err) { next(err) }
})

/* ── POST /api/learn/review — 提交复习结果 ───────────────── */

router.post('/review', (req, res, next) => {
  try {
    const { word, correct, errors } = req.body
    if (!word) { res.status(400).json({ error: 'word required' }); return }

    const row = db.prepare('SELECT * FROM word_learning WHERE word = ?').get(word) as any
    if (!row) { res.status(404).json({ error: 'word not in learning system' }); return }

    const now = Date.now()
    const errCount = errors || 0
    const isCorrect = correct === true
    let interval = row.interval_hours || 0.5
    let stability = row.stability || 0.5

    if (isCorrect) {
      if (row.state === 'learning') {
        // First correct: schedule 30-min emergency test
        interval = 0.5
      } else {
        // Phase 3: Dynamic spacing
        interval = Math.min(interval * 1.8, 720)
      }
      stability = Math.min(stability + 0.05, 1.0)
    } else {
      // Phase 2: Emergency — wrong answer
      if (errCount >= 2) {
        interval = 12 // Reset to 12 hours
      } else {
        interval = Math.max(interval * 0.8, 0.5) // Shrink but min 30 min
      }
      stability = Math.max(stability - 0.1, 0.1)
      // 30-minute emergency loop if failed
      if (row.state === 'learning') {
        interval = 0.5 // 30 min retry
      }
    }

    const nextReview = new Date(now + interval * 60 * 60 * 1000).toISOString()
    const newState = interval >= 720 ? 'dormant' : 'active'

    db.prepare(`
      UPDATE word_learning SET
        stability = ?, interval_hours = ?, next_review_at = ?,
        error_count = error_count + ?, total_reviews = total_reviews + 1,
        state = ?, updated_at = datetime('now')
      WHERE word = ?
    `).run(stability, interval, nextReview, isCorrect ? 0 : 1, newState, word)

    res.json({
      word, stability, interval_hours: interval,
      next_review_at: nextReview, state: newState, correct: isCorrect,
    })
  } catch (err) { next(err) }
})

/* ── GET /api/learn/:word — 查询单个词的学习状态 ──────────── */

router.get('/:word', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM word_learning WHERE word = ?').get(req.params.word)
    res.json(row || null)
  } catch (err) { next(err) }
})

export default router
