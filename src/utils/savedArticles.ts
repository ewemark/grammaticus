/** 语境记忆中收藏的文章 */

export interface SavedArticle {
  id: string
  title: string
  content: string
  words: string[]
  createdAt: number
}

const STORAGE_KEY = 'grammaticus_saved_articles'

/** 读取所有已收藏的语境文章 */
export function getSavedArticles(): SavedArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedArticle[]
  } catch {
    return []
  }
}

/** 保存一篇文章（已存在则更新） */
export function saveArticle(article: SavedArticle): void {
  const list = getSavedArticles().filter((a) => a.id !== article.id)
  list.unshift(article)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** 删除一篇已收藏的文章 */
export function removeSavedArticle(id: string): void {
  const list = getSavedArticles().filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** 判断是否已收藏 */
export function isArticleSaved(id: string): boolean {
  return getSavedArticles().some((a) => a.id === id)
}
