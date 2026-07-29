import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import wordsRouter from './routes/words.js'
import articlesRouter from './routes/articles.js'
import analyzeRouter from './routes/analyze.js'
import uploadRouter from './routes/upload.js'
import messagesRouter from './routes/messages.js'
import contextRouter from './routes/context.js'
import videoRouter from './routes/video.js'
import authRouter from './routes/auth.js'
import userDataRouter from './routes/userData.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const isDev = process.env.NODE_ENV !== 'production'

const ALLOWED_ORIGINS = isDev
  ? ['http://localhost:5173', 'http://localhost:3000']
  : (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'])

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
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

// Apply rate limiting to AI endpoints
const aiRateLimiter: express.RequestHandler = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  if (!rateLimit(ip, 20, 60_000)) {
    res.status(429).json({ error: '请求过于频繁，请稍后再试' })
    return
  }
  next()
}

// Clean up expired rate limit entries every 5 minutes
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
app.use('/api/messages', aiRateLimiter, messagesRouter)
app.use('/api/context', aiRateLimiter, contextRouter)
app.use('/api/video', videoRouter)
app.use('/api/auth', authRouter)
app.use('/api/user', userDataRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message)
  res.status(500).json({ error: isDev ? err.message : 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[Grammaticus API] http://localhost:${PORT}`)
})