/**
 * 收藏文章 — 本地存储层
 *
 * 与 savedArticles(OCR/上传/语境生成文章的保存)不同,
 * 这里收藏的是词库中已有的文章(新概念课文/经典篇目),
 * 连正文一起存,保证离线也能从收藏架直接打开阅读。
 */

export interface FavoriteArticle {
  /** 文章标识(NCE 的文章 id 或经典文章的固定 id) */
  id: string
  title: string
  subtitle?: string
  /** 全文(几 KB 级,换取收藏架完全离线可用) */
  content: string
  addedAt: number
}

const STORAGE_KEY = 'grammaticus_article_favorites'

function readAll(): FavoriteArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FavoriteArticle[]
  } catch {
    return []
  }
}

function writeAll(list: FavoriteArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch { /* storage unavailable */ }
}

/** 全部收藏,新→旧 */
export function getFavoriteArticles(): FavoriteArticle[] {
  return readAll().sort((a, b) => b.addedAt - a.addedAt)
}

export function isArticleFavorited(id: string): boolean {
  return readAll().some((f) => f.id === id)
}

/** 收藏/取消收藏,返回操作后的收藏状态 */
export function toggleFavoriteArticle(entry: Omit<FavoriteArticle, 'addedAt'>): boolean {
  const list = readAll()
  const idx = list.findIndex((f) => f.id === entry.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    writeAll(list)
    return false
  }
  list.unshift({ ...entry, addedAt: Date.now() })
  writeAll(list)
  return true
}

export function removeFavoriteArticle(id: string): void {
  writeAll(readAll().filter((f) => f.id !== id))
}
