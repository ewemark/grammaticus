import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import wordsRouter from './routes/words.js'
import articlesRouter from './routes/articles.js'
import analyzeRouter from './routes/analyze.js'
import uploadRouter from './routes/upload.js'
import learnRouter from './routes/learn.js'
import messagesRouter from './routes/messages.js'
import contextRouter from './routes/context.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/words', wordsRouter)
app.use('/api/articles', articlesRouter)
app.use('/api/analyze', analyzeRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/learn', learnRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/context', contextRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`[Grammaticus API] http://localhost:${PORT}`)
})
