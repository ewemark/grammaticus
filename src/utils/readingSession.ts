/**
 * 阅读会话管理 — 跨组件共享"当前文章"的阅读记录
 *
 * FullscreenReader 写入,悬浮球的 ReadingSummary 读取。
 * 文章关闭时自动清理,无需 Provider。
 */

export interface ReadingSession {
  articleId: string
  articleTitle: string
  /** 文章正文(AI 精华总结用,打开阅读器时写入) */
  content?: string
  lookedUpWords: { word: string; meaning: string; timestamp: number }[]
  notesCreated: { id: string; type: string; title: string; content: string; timestamp: number }[]
  sentencesSaved: { id: string; title: string; sourceText: string; timestamp: number }[]
  /** 分析侧栏是否打开,悬浮球互斥用 */
  analysisPanelOpen?: boolean
  /** 悬浮球笔记面板是否打开,分析侧栏互斥用 */
  summaryPanelOpen?: boolean
}

const sessions = new Map<string, ReadingSession>()

/** 当前活跃的阅读会话 id(只保留最后一个打开的阅读器) */
let activeSessionId: string | null = null

function createSession(articleId: string, articleTitle: string): ReadingSession {
  return {
    articleId,
    articleTitle,
    lookedUpWords: [],
    notesCreated: [],
    sentencesSaved: [],
  }
}

/** 阅读器打开时调用,返回/创建会话 */
export function openSession(articleId: string, articleTitle: string, content?: string): ReadingSession {
  activeSessionId = articleId
  if (!sessions.has(articleId)) {
    sessions.set(articleId, createSession(articleId, articleTitle))
  }
  const s = sessions.get(articleId)!
  if (content) s.content = content
  return s
}

/** 获取当前活跃的会话(悬浮球用) */
export function getActiveSession(): ReadingSession | null {
  if (!activeSessionId) return null
  return sessions.get(activeSessionId) ?? null
}

/** 关闭会话(阅读器关闭时调用) */
export function closeSession(articleId: string): void {
  sessions.delete(articleId)
  if (activeSessionId === articleId) activeSessionId = null
}

/** 更新会话字段 */
export function updateSession(articleId: string, update: Partial<ReadingSession>): void {
  const s = sessions.get(articleId)
  if (s) Object.assign(s, update)
}

/** 添加查词记录 */
export function addLookedUpWord(articleId: string, word: string, meaning: string): void {
  const s = sessions.get(articleId)
  if (!s) return
  s.lookedUpWords = s.lookedUpWords.filter((w) => w.word.toLowerCase() !== word.toLowerCase())
  s.lookedUpWords.push({ word, meaning, timestamp: Date.now() })
}

/** 添加笔记记录 */
export function addCreatedNote(articleId: string, note: { id: string; type: string; title: string; content: string }): void {
  const s = sessions.get(articleId)
  if (!s) return
  s.notesCreated = s.notesCreated.filter((n) => n.id !== note.id)
  s.notesCreated.push({ ...note, timestamp: Date.now() })
}

/** 添加存句记录 */
export function addSavedSentence(articleId: string, sentence: { id: string; title: string; sourceText: string }): void {
  const s = sessions.get(articleId)
  if (!s) return
  s.sentencesSaved = s.sentencesSaved.filter((n) => n.id !== sentence.id)
  s.sentencesSaved.push({ ...sentence, timestamp: Date.now() })
}

/** 获取"之前读过的文章"摘要(AI 历史对比用) */
export function getPreviousArticles(): { title: string; wordCount: number; noteCount: number; topWords: string[] }[] {
  return [...sessions.entries()]
    .filter(([id]) => id !== activeSessionId)
    .map(([, s]) => ({
      title: s.articleTitle,
      wordCount: s.lookedUpWords.length,
      noteCount: s.notesCreated.length,
      topWords: s.lookedUpWords.slice(0, 5).map((w) => w.word),
    }))
    .slice(-5) // 最多 5 篇历史
}