import { Router } from 'express'
import multer from 'multer'

const router = Router()
// Vercel serverless:文件暂存内存(不写磁盘),解析后返回文本
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/* ── POST /api/upload ── */

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file
    if (!file) { res.status(400).json({ error: '请选择文件' }); return }

    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? ''
    let text = ''

    if (ext === 'txt') {
      text = file.buffer.toString('utf-8')
    } else if (ext === 'pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(file.buffer)
        text = data.text
      } catch {
        text = '(PDF 解析失败，请尝试 TXT 格式)'
      }
    } else if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        text = result.value
      } catch {
        text = '(DOCX 解析失败，请尝试 TXT 格式)'
      }
    } else {
      res.status(400).json({ error: '不支持的文件格式，请上传 TXT、PDF 或 DOCX 文件' })
      return
    }

    if (!text.trim()) {
      res.json({ text: '(文档为空或无法解析)', filename: file.originalname, id: 0 })
      return
    }

    // Vercel 模式:不写数据库,直接返回解析文本
    res.json({ id: 0, text, filename: file.originalname })
  } catch (err) {
    next(err)
  }
})

export default router