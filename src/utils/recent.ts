/** 最近搜索单词记录 */

export interface RecentWord {
  word: string
  meaning: string
  timestamp: number
}

const STORAGE_KEY = 'grammaticus_recent'
const MAX_ITEMS = 30

/** 读取全部最近搜索 */
export function getRecent(): RecentWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentWord[]
  } catch {
    return []
  }
}

/** 添加一个单词到最近搜索（去重，最新的排最前） */
export function addRecent(word: string, meaning: string): RecentWord[] {
  const list = getRecent().filter((w) => w.word.toLowerCase() !== word.toLowerCase())
  list.unshift({ word, meaning, timestamp: Date.now() })
  const trimmed = list.slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return trimmed
}

/** 删除单个单词 */
export function removeRecent(word: string): RecentWord[] {
  const list = getRecent().filter((w) => w.word.toLowerCase() !== word.toLowerCase())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  return list
}

/** 清空 */
export function clearRecent(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/** 时间格式化 */
export function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}
