import { request } from './client'
import type { DictionaryWord } from '../types/learning'

/** AI 点评"我的理解" */
export function reviewUnderstanding(data: {
  word: string
  meaning: string
  myUnderstanding: string
}): Promise<{ feedback: string }> {
  return request<{ feedback: string }>('/dictionary/review', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/* ── 云端备份(需登录) ─────────────────────────────── */

export function fetchCloudDictionary(): Promise<{ words: DictionaryWord[] }> {
  return request<{ words: DictionaryWord[] }>('/user/dictionary')
}

export function syncCloudDictionary(words: DictionaryWord[]): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/user/dictionary/sync', {
    method: 'POST',
    body: JSON.stringify({ words }),
  })
}

export function deleteCloudWord(word: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/user/dictionary/${encodeURIComponent(word)}`, { method: 'DELETE' })
}
