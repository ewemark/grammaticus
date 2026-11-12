import { request } from './client'
import type { Note } from '../types/learning'
import { readSSE, type StreamHandle } from '../utils/analyze'

/** AI 老师诊断(输入全部学习资产,输出诊断报告文本) */
export function diagnoseLearning(data: {
  notes: { type: string; title: string; content: string; analysis?: string; sourceText?: string }[]
  dictionary: { word: string; meaning: string; myUnderstanding: string }[]
  recentWords: string[]
}): Promise<{ result: string }> {
  return request<{ result: string }>('/notes/diagnose', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 文章精华总结(流式)— 原料:全文 + 用户查词/笔记标记 + 历史阅读对比 */
export function summarizeArticleStream(
  data: {
    title: string
    content: string
    notes: { title: string; content: string; sourceText?: string }[]
    words: string[]
    previousArticles?: { title: string; wordCount: number; noteCount: number; topWords?: string[] }[]
  },
  onDelta: (t: string) => void,
): StreamHandle {
  const ctrl = new AbortController()
  return {
    abort: () => ctrl.abort(),
    done: readSSE('/notes/summarize-article/stream', data, onDelta, ctrl.signal),
  }
}

/* ── 云端备份(需登录) ─────────────────────────────── */

export function fetchCloudNotes(): Promise<{ notes: Note[] }> {
  return request<{ notes: Note[] }>('/user/notes')
}

export function syncCloudNotes(notes: Note[]): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/user/notes/sync', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  })
}

export function deleteCloudNote(noteId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/user/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' })
}
