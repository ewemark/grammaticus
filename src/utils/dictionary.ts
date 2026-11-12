/**
 * 我的词典本地存储层(localStorage 优先,登录后双写云端)
 * 契约见 PRODUCT.md
 */
import type { DictionaryWord } from '../types/learning'

const STORAGE_KEY = 'grammaticus_dictionary'

function readAll(): DictionaryWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DictionaryWord[]
  } catch {
    return []
  }
}

function writeAll(words: DictionaryWord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  } catch { /* storage unavailable */ }
}

/** 全部词条,新→旧 */
export function getDictionary(): DictionaryWord[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function isInDictionary(word: string): boolean {
  const w = word.toLowerCase()
  return readAll().some((d) => d.word.toLowerCase() === w)
}

export function getDictionaryWord(word: string): DictionaryWord | undefined {
  const w = word.toLowerCase()
  return readAll().find((d) => d.word.toLowerCase() === w)
}

export interface DictionaryDraft {
  word: string
  meaning?: string
  pos?: string
  myUnderstanding?: string
  myExample?: string
}

/** 收录单词(已存在则不覆盖用户数据,仅补齐缺失字段) */
export function addToDictionary(draft: DictionaryDraft): DictionaryWord {
  const words = readAll()
  const now = Date.now()
  const key = draft.word.trim().toLowerCase()
  const existing = words.find((d) => d.word.toLowerCase() === key)
  if (existing) {
    existing.meaning = existing.meaning || draft.meaning || ''
    existing.pos = existing.pos || draft.pos || ''
    existing.updatedAt = now
    writeAll(words)
    syncToCloud([existing])
    return existing
  }
  const entry: DictionaryWord = {
    word: draft.word.trim(),
    meaning: draft.meaning || '',
    pos: draft.pos || '',
    myUnderstanding: draft.myUnderstanding || '',
    myExample: draft.myExample || '',
    addedAt: now,
    updatedAt: now,
  }
  words.unshift(entry)
  writeAll(words)
  syncToCloud([entry])
  return entry
}

/** 更新"我的理解"/自造例句 */
export function updateUnderstanding(word: string, myUnderstanding: string, myExample?: string): void {
  const words = readAll()
  const entry = words.find((d) => d.word.toLowerCase() === word.toLowerCase())
  if (!entry) return
  entry.myUnderstanding = myUnderstanding
  if (myExample !== undefined) entry.myExample = myExample
  entry.updatedAt = Date.now()
  writeAll(words)
  syncToCloud([entry])
}

/** 保存 AI 点评 */
export function setAiFeedback(word: string, feedback: string): void {
  const words = readAll()
  const entry = words.find((d) => d.word.toLowerCase() === word.toLowerCase())
  if (!entry) return
  entry.aiFeedback = feedback
  entry.updatedAt = Date.now()
  writeAll(words)
  syncToCloud([entry])
}

export function removeFromDictionary(word: string): void {
  writeAll(readAll().filter((d) => d.word.toLowerCase() !== word.toLowerCase()))
  import('../api/dictionary').then((m) => m.deleteCloudWord(word).catch(() => {})).catch(() => {})
}

/** 搜索(词+释义+我的理解) */
export function searchDictionary(query: string): DictionaryWord[] {
  const q = query.trim().toLowerCase()
  if (!q) return getDictionary()
  return getDictionary().filter((d) =>
    [d.word, d.meaning, d.myUnderstanding, d.aiFeedback ?? ''].some((s) => s.toLowerCase().includes(q))
  )
}

function syncToCloud(words: DictionaryWord[]) {
  import('../api/auth').then((auth) => {
    if (!auth.isLoggedIn()) return
    return import('../api/dictionary').then((m) => m.syncCloudDictionary(words).catch(() => {}))
  }).catch(() => {})
}

/** 首次登录时全量同步 */
export function syncAllDictionaryToCloud(): Promise<void> {
  const all = readAll()
  if (all.length === 0) return Promise.resolve()
  return import('../api/dictionary').then((m) => m.syncCloudDictionary(all).then(() => undefined)).catch(() => undefined)
}
