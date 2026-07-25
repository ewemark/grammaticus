import { request } from './client'

export interface GenerateResult {
  article: string
  title: string
}

/** 调用 DeepSeek 根据单词列表生成语境文章 */
export async function generateArticle(words: string[]): Promise<GenerateResult> {
  return request<GenerateResult>('/context/generate', {
    method: 'POST',
    body: JSON.stringify({ words }),
  })
}
