import { request, ApiError } from './client'
import type { RichWordData } from '../types/word'

/** 基础单词 */
export interface EnglishWord {
  word: string
  meaning: string
  pos: string
  example: string
}

/** 单词详情（GET /api/words/:word 返回） */
export interface WordDetailResponse {
  simple: EnglishWord | null
  rich: RichWordData | null
  /** 未收录时的建议词（词形还原/相近拼写） */
  suggestions?: EnglishWord[]
}

/** 单词列表（GET /api/words 返回） */
export interface WordListResponse {
  words: EnglishWord[]
  total: number
  /** 命中的搜索层级: prefix / lemma / contains / none / list */
  tier?: string
  /** tier=none 时的"你是不是要找"建议 */
  suggestions?: EnglishWord[]
}

/**
 * 获取单词列表（支持搜索 & 筛选）
 */
export async function fetchWords(opts?: {
  q?: string
  pos?: string
  limit?: number
  offset?: number
}): Promise<WordListResponse> {
  const params = new URLSearchParams()
  if (opts?.q) params.set('q', opts.q)
  if (opts?.pos) params.set('pos', opts.pos)
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.offset) params.set('offset', String(opts.offset))
  const qs = params.toString()
  return request<WordListResponse>(`/words${qs ? `?${qs}` : ''}`)
}

/** 按词性筛选 */
export async function fetchWordsByPOS(pos: string): Promise<EnglishWord[]> {
  const { words } = await fetchWords({ pos, limit: 200 })
  return words
}

/** 获取单个单词详情（含 rich 数据）；404 时返回建议词而非抛错 */
export async function fetchWord(word: string): Promise<WordDetailResponse> {
  try {
    return await request<WordDetailResponse>(`/words/${encodeURIComponent(word)}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      let suggestions: EnglishWord[] = []
      try {
        const body = JSON.parse(e.message) as { suggestions?: EnglishWord[] }
        suggestions = body.suggestions ?? []
      } catch { /* body may not be JSON */ }
      return { simple: null, rich: null, suggestions }
    }
    throw e
  }
}

/** 获取富文本单词数据（从 fetchWord 中提取） */
export async function fetchRichWord(word: string): Promise<RichWordData | null> {
  const { rich } = await fetchWord(word)
  return rich ?? null
}

/** 搜索建议（自动补全） */
export async function searchWords(query: string): Promise<EnglishWord[]> {
  if (!query.trim()) return []
  return request<EnglishWord[]>(`/words/autocomplete?q=${encodeURIComponent(query.trim())}`)
}

/** 获取单词发音音频 URL（服务端已验证域名可信） */
export async function fetchAudioUrl(word: string, accent: 'uk' | 'us'): Promise<string> {
  const { audioUrl } = await request<{ audioUrl: string }>(
    `/words/${encodeURIComponent(word)}/audio?accent=${accent}`
  )
  return audioUrl
}
