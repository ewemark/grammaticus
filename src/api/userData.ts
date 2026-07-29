import { request } from './client'

/** Sync all local data to server (call once after login) */
export function syncToServer(data: {
  bookmarks?: { word: string; meaning: string; pos: string }[]
  progress?: string[]
  saved?: { article_id: string; title: string; content: string; words: string[] }[]
}) {
  return request('/user/sync', { method: 'POST', body: JSON.stringify(data) })
}

/** Fetch server bookmarks */
export function fetchBookmarks() {
  return request<{ bookmarks: { word: string; meaning: string; pos: string; created_at: string }[] }>('/user/bookmarks')
}

/** Add bookmarks to server */
export function addBookmarks(words: { word: string; meaning: string; pos: string }[]) {
  return request('/user/bookmarks', { method: 'POST', body: JSON.stringify({ words }) })
}

/** Delete a bookmark from server */
export function removeBookmark(word: string) {
  return request(`/user/bookmarks/${encodeURIComponent(word)}`, { method: 'DELETE' })
}

/** Fetch reading progress */
export function fetchProgress() {
  return request<{ articleIds: string[] }>('/user/progress')
}

/** Set article as read */
export function markRead(articleId: string) {
  return request('/user/progress', { method: 'POST', body: JSON.stringify({ articleId }) })
}

/** Unmark article as read */
export function unmarkRead(articleId: string) {
  return request(`/user/progress/${encodeURIComponent(articleId)}`, { method: 'DELETE' })
}

/** Fetch saved articles */
export function fetchSavedArticles() {
  return request<{ articles: { article_id: string; title: string; content: string; words: string; created_at: string }[] }>('/user/saved-articles')
}

/** Save an article to server */
export function saveArticle(data: { article_id: string; title: string; content: string; words: string[] }) {
  return request('/user/saved-articles', { method: 'POST', body: JSON.stringify(data) })
}

/** Delete a saved article */
export function deleteSavedArticle(articleId: string) {
  return request(`/user/saved-articles/${encodeURIComponent(articleId)}`, { method: 'DELETE' })
}
