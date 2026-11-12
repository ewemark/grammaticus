import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import db from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()
const upload = multer({ dest: path.resolve('data', 'uploads'), limits: { fileSize: 10 * 1024 * 1024 } })

/* ── POST /api/upload — upload + save to DB ───────────────── */
// optionalAuth: guests may upload (user_id NULL); logged-in users get ownership.

router.post('/', optionalAuth, upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file
    if (!file) { res.status(400).json({ error: '请选择文件' }); return }

    const ext = path.extname(file.originalname).toLowerCase()
    let text = ''

    if (ext === '.txt') {
      text = fs.readFileSync(file.path, 'utf-8')
    } else if (ext === '.pdf') {
      try {
        const { createRequire } = await import('node:module')
        const req2 = createRequire(import.meta.url)
        const pdfParse = req2('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
        const buf = fs.readFileSync(file.path)
        const data = await pdfParse(buf)
        text = data.text
      } catch {
        text = '(PDF 解析失败，请尝试 TXT 格式)'
      }
    } else if (ext === '.docx') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ path: file.path })
      text = result.value
    } else {
      fs.unlink(file.path, () => {})
      res.status(400).json({ error: '不支持的文件格式，请上传 TXT、PDF 或 DOCX 文件' })
      return
    }

    fs.unlink(file.path, (err) => {
      if (err) console.error('[Upload] Failed to clean up temp file:', err.message)
    })

    if (!text.trim()) {
      res.json({ text: '(文档为空或无法解析)', filename: file.originalname, id: 0 })
      return
    }

    // Save to DB with ownership (NULL for guests)
    const result = db.prepare(
      'INSERT INTO documents (filename, content, user_id) VALUES (?, ?, ?)'
    ).run(file.originalname, text, req.userId ?? null)
    res.json({ id: result.lastInsertRowid, text, filename: file.originalname })
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/upload/list — past uploads (own only) ───────── */

router.get('/list', requireAuth, (req, res, next) => {
  try {
    const rows = db.prepare(
      'SELECT id, filename, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.userId!)
    res.json(rows)
  } catch (err) { next(err) }
})

/* ── GET /api/upload/:id — get single document (owner only) ── */

router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const row = db.prepare(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.userId!)
    if (!row) { res.status(404).json({ error: '文档未找到' }); return }
    res.json(row)
  } catch (err) { next(err) }
})

/* ── DELETE /api/upload/:id — delete document (owner only) ─── */

router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
