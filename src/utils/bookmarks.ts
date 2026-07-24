/** 收藏单词 */

export interface BookmarkedWord {
  word: string
  meaning: string
  pos: string
  timestamp: number
}

const STORAGE_KEY = 'grammaticus_bookmarks'

/** 读取所有收藏 */
export function getBookmarks(): BookmarkedWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BookmarkedWord[]
  } catch {
    return []
  }
}

/** 是否已收藏 */
export function isBookmarked(word: string): boolean {
  return getBookmarks().some((b) => b.word.toLowerCase() === word.toLowerCase())
}

/** 切换收藏状态，返回新状态 */
export function toggleBookmark(word: string, meaning: string, pos: string): boolean {
  const list = getBookmarks()
  const idx = list.findIndex((b) => b.word.toLowerCase() === word.toLowerCase())
  if (idx >= 0) {
    list.splice(idx, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return false
  } else {
    list.unshift({ word, meaning, pos, timestamp: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return true
  }
}

/** 移除收藏 */
export function removeBookmark(word: string): void {
  const list = getBookmarks().filter((b) => b.word.toLowerCase() !== word.toLowerCase())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
