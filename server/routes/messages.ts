import { Router } from 'express'
import nodemailer from 'nodemailer'
import db from '../db.js'

const router = Router()

// Email transporter — lazy init
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.qq.com'
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const to = process.env.SMTP_TO
  if (!user || !pass || !to) return null
  return { transporter: nodemailer.createTransport({ host, port, secure: false, auth: { user, pass } }), to }
}

/* ── POST /api/messages — submit message ─────────────────── */

router.post('/', (req, res, next) => {
  try {
    const name = String(req.body.name || '').slice(0, 100)
    const email = String(req.body.email || '').slice(0, 200)
    const content = String(req.body.content || '').slice(0, 3000)
    if (!content.trim()) { res.status(400).json({ error: '请输入留言内容' }); return }

    db.prepare('INSERT INTO messages (name, email, content) VALUES (?, ?, ?)').run(name, email, content.trim())

    // Try email notification
    const mail = getTransporter()
    if (mail) {
      mail.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: mail.to,
        subject: `[Grammaticus] 新留言 from ${name || '匿名'}`,
        text: `来自: ${name || '匿名'} (${email || '未留邮箱'})\n\n${content.trim()}\n\n---\nGrammaticus 留言板`,
      }).catch((e) => console.error('[Mail] send failed:', e.message))
    }

    res.json({ ok: true })
  } catch (err) { next(err) }
})

/* ── GET /api/messages — list recent messages ─────────────── */

router.get('/', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT id, name, content, created_at FROM messages ORDER BY created_at DESC LIMIT 50').all()
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
