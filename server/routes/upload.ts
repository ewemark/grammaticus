import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import db from '../db.js'

const router = Router()
const upload = multer({ dest: path.resolve('data', 'uploads'), limits: { fileSize: 10 * 1024 * 1024 } })

/* ── POST /api/upload — upload + save to DB ───────────────── */

router.post('/', upload.single('file'), async (req, res, next) => {
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
        const req = createRequire(import.meta.url)
        const pdfParse = req('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
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
      text = fs.readFileSync(file.path, 'utf-8')
    }

    fs.unlink(file.path, () => {})

    if (!text.trim()) {
      res.json({ text: '(文档为空或无法解析)', filename: file.originalname, id: 0 })
      return
    }

    // Save to DB
    const result = db.prepare('INSERT INTO documents (filename, content) VALUES (?, ?)').run(file.originalname, text)
    res.json({ id: result.lastInsertRowid, text, filename: file.originalname })
  } catch (err) {
    next(err)
  }
})

/* ── GET /api/upload/list — past uploads ──────────────────── */

router.get('/list', (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT id, filename, created_at FROM documents ORDER BY created_at DESC LIMIT 20').all()
    res.json(rows)
  } catch (err) { next(err) }
})

/* ── GET /api/upload/:id — get single document ────────────── */

router.get('/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
    if (!row) { res.status(404).json({ error: '文档未找到' }); return }
    res.json(row)
  } catch (err) { next(err) }
})

/* ── DELETE /api/upload/:id — delete document ─────────────── */

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
