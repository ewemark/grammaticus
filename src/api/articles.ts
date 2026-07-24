import { request } from './client'

export interface ArticleListItem {
  id: number
  book: string
  lesson: number
  title: string
  title_cn: string
  level: string
}

export interface ArticleFull extends ArticleListItem {
  content: string
}

/** 获取文章列表（可按 book 筛选） */
export async function fetchArticles(book?: string): Promise<ArticleListItem[]> {
  const qs = book ? `?book=${encodeURIComponent(book)}` : ''
  return request<ArticleListItem[]>(`/articles${qs}`)
}

/** 获取单篇文章（含正文） */
export async function fetchArticle(id: number): Promise<ArticleFull> {
  return request<ArticleFull>(`/articles/${id}`)
}

/** 获取所有 book 名称 */
export async function fetchBooks(): Promise<string[]> {
  return request<string[]>('/articles/books')
}
