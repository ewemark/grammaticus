import { Router, type RequestHandler } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

// Simple login lockout map (IP → { attempts, lockedUntil })
const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>()

/* ── POST /api/auth/register ────────────────────────────── */

router.post('/register', (async (req, res) => {
  const username = String(req.body.username || '').trim()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')

  // Validation
  if (!username || username.length < 2 || username.length > 30) {
    res.status(400).json({ error: '用户名需要 2-30 个字符' })
    return
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: '请输入有效的邮箱地址' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: '密码至少需要 6 位' })
    return
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    res.status(400).json({ error: '密码需要同时包含字母和数字' })
    return
  }

  // Check existing
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username)
  if (existing) {
    res.status(409).json({ error: '用户名或邮箱已被注册' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash)
  const userId = result.lastInsertRowid as number

  const token = signToken({ userId, username })
  res.json({ token, user: { id: userId, username, email } })
}) as RequestHandler)

/* ── POST /api/auth/login ───────────────────────────────── */

router.post('/login', (async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  // Check lockout
  const lock = loginAttempts.get(ip)
  if (lock && lock.lockedUntil > Date.now()) {
    const waitMin = Math.ceil((lock.lockedUntil - Date.now()) / 60000)
    res.status(429).json({ error: `登录尝试次数过多，请在 ${waitMin} 分钟后重试` })
    return
  }

  if (!email || !password) {
    res.status(400).json({ error: '请输入邮箱和密码' })
    return
  }

  const user = db.prepare('SELECT id, username, email, password_hash FROM users WHERE email = ?').get(email) as { id: number; username: string; email: string; password_hash: string } | undefined

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    // Record failed attempt
    const entry = loginAttempts.get(ip) || { attempts: 0, lockedUntil: 0 }
    entry.attempts++
    if (entry.attempts >= 5) {
      entry.lockedUntil = Date.now() + 15 * 60 * 1000
      loginAttempts.set(ip, entry)
      res.status(429).json({ error: '登录尝试次数过多，请在 15 分钟后重试' })
      return
    }
    loginAttempts.set(ip, entry)
    res.status(401).json({ error: '邮箱或密码错误' })
    return
  }

  // Success — clear attempts
  loginAttempts.delete(ip)

  const token = signToken({ userId: user.id, username: user.username })
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
}) as RequestHandler)

/* ── GET /api/auth/me ───────────────────────────────────── */

router.get('/me', requireAuth as RequestHandler, (_req, res) => {
  const userId = (_req as any).userId
  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(userId) as any
  if (!user) {
    res.status(404).json({ error: '用户不存在' })
    return
  }
  res.json({ user })
})

export default router
