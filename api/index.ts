/**
 * Vercel serverless 入口 — 仅包含无状态路由(AI 代理 + 内存数据 + 上传解析)。
 *
 * 与 server/index.ts 的区别:
 * - 不启动 HTTP 监听(Vercel 处理)
 * - 不含 SQLite 路由(auth / userData / messages)
 * - 不含 seed 启动逻辑(数据在构建时已打包为 JSON)
 */
import express from 'express'
import cors from 'cors'

import wordsRouter from '../server/routes/words.js'
import articlesRouter from '../server/routes/articles.js'
import analyzeRouter from '../server/routes/analyze.js'
import uploadRouter from '../server/routes/upload.js'
import contextRouter from '../server/routes/context.js'
import videoRouter from '../server/routes/video.js'
import notesRouter from '../server/routes/notes.js'
import dictionaryRouter from '../server/routes/dictionary.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Simple in-memory rate limiter for AI endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}
const aiRateLimiter: express.RequestHandler = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  if (!rateLimit(ip, 20, 60_000)) {
    res.status(429).json({ error: '请求过于频繁，请稍后再试' })
    return
  }
  next()
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

// API routes
app.use('/api/words', wordsRouter)
app.use('/api/articles', articlesRouter)
app.use('/api/analyze', aiRateLimiter, analyzeRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/context', aiRateLimiter, contextRouter)
app.use('/api/video', videoRouter)
app.use('/api/notes', aiRateLimiter, notesRouter)
app.use('/api/dictionary', aiRateLimiter, dictionaryRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Unknown /api/* → JSON 404
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

export default app