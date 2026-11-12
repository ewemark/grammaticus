/**
 * 视频文件 API — 从 data/videos/ 目录读取已导入的视频
 * 将 .mp4 文件放入 data/videos/ 即可在前端 Grammar 页面查看和下载
 */
import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VIDEO_DIR = path.resolve(__dirname, '..', '..', 'data', 'videos')
const router = Router()

// 确保目录存在
fs.mkdirSync(VIDEO_DIR, { recursive: true })

export interface VideoItem {
  filename: string
  displayName: string
  size: number
}

/** GET /api/video/list — 列出所有已导入的视频 */
router.get('/list', (_req, res) => {
  try {
    if (!fs.existsSync(VIDEO_DIR)) {
      res.json({ videos: [] })
      return
    }

    const files = fs.readdirSync(VIDEO_DIR).sort((a, b) => a.localeCompare(b, 'zh'))
    const videos: VideoItem[] = []

    for (const file of files) {
      if (!file.endsWith('.mp4')) continue
      const filePath = path.join(VIDEO_DIR, file)
      const stat = fs.statSync(filePath)
      if (stat.isFile()) {
        // Derive display name from filename (remove extension, replace _/- with space)
        const displayName = file
          .replace(/\.mp4$/i, '')
          .replace(/[_-]/g, ' ')
          .replace(/\b\d{2}\s+/g, '')  // strip leading order numbers like "01 "
          .replace(/\b\w/g, (c) => c.toUpperCase())
        videos.push({ filename: file, displayName, size: stat.size })
      }
    }

    res.json({ videos })
  } catch (err) {
    console.error('[Video] List error:', err)
    res.status(500).json({ error: '读取视频列表失败' })
  }
})

/** GET /api/video/:filename — 下载/播放视频文件 */
router.get('/:filename', (req, res) => {
  const { filename } = req.params

  // 安全检查：只允许 .mp4，且防路径穿越
  const safeName = path.basename(filename)
  if (!safeName.endsWith('.mp4')) {
    res.status(400).json({ error: '仅支持 mp4 文件' })
    return
  }

  const filePath = path.join(VIDEO_DIR, safeName)

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '视频未找到' })
    return
  }

  res.sendFile(filePath)
})

export default router
