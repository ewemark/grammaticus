/**
 * 笔记本地存储层(localStorage 优先,登录后双写云端)
 * 契约见 PRODUCT.md
 */
import type { Note, NoteType } from '../types/learning'

const STORAGE_KEY = 'grammaticus_notes'

function readAll(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Note[]
  } catch {
    return []
  }
}

function writeAll(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // storage full / unavailable — keep in-memory behavior degraded gracefully
  }
}

/** 生成唯一 id(时间戳 + 随机段,无需 crypto) */
function genId(): string {
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 全部笔记:星标置顶,其余新→旧 */
export function getNotes(): Note[] {
  return readAll().sort((a, b) => {
    const sa = a.starred ? 1 : 0
    const sb = b.starred ? 1 : 0
    if (sa !== sb) return sb - sa
    return b.updatedAt - a.updatedAt
  })
}

/** 切换星标,返回新状态 */
export function toggleStar(id: string): boolean {
  const notes = readAll()
  const n = notes.find((x) => x.id === id)
  if (!n) return false
  n.starred = !n.starred
  n.updatedAt = Date.now()
  writeAll(notes)
  syncToCloud([n])
  return !!n.starred
}

/** 按类型筛选 */
export function getNotesByType(type: NoteType): Note[] {
  return getNotes().filter((n) => n.type === type)
}

export function getNote(id: string): Note | undefined {
  return readAll().find((n) => n.id === id)
}

export interface NoteDraft {
  type: NoteType
  title?: string
  content: string
  analysis?: string
  sourceWord?: string
  sourceText?: string
  tags?: string[]
  starred?: boolean
}

/* ── 自动标签:从内容识别语法主题 ─────────────────────── */

const TOPIC_PATTERNS: { tag: string; triggers: RegExp }[] = [
  { tag: '从句', triggers: /从句|定语从句|名词性从句|同位语|状语从句|关系代词|关系副词|引导词/i },
  { tag: '虚拟语气', triggers: /虚拟语气|subjunctive|if i were|would have|与事实相反|主将从现/i },
  { tag: '时态', triggers: /时态|过去式|过去分词|完成时|进行时|将来时|tense/i },
  { tag: '非谓语', triggers: /非谓语|不定式|动名词|现在分词|过去分词作|infinitive|gerund|participle/i },
  { tag: '介词', triggers: /介词|preposition|五步法/i },
  { tag: '词义辨析', triggers: /辨析|同义词|近义词|易混|区别.{0,6}是|synonym/i },
  { tag: '句子成分', triggers: /长难句|主语|谓语|宾语|定语|状语|补语|句子成分/i },
  { tag: '搭配', triggers: /搭配|固定短语|固定用法|collocation/i },
]

/** 从笔记内容自动提取主题标签(最多 3 个,按命中强度) */
export function extractTags(draft: { title?: string; content?: string; analysis?: string; sourceText?: string; sourceWord?: string }): string[] {
  const text = [draft.title, draft.content, draft.analysis, draft.sourceText].filter(Boolean).join('\n')
  if (!text.trim()) return draft.sourceWord ? [draft.sourceWord.toLowerCase()] : []

  const hits: { tag: string; count: number }[] = []
  for (const { tag, triggers } of TOPIC_PATTERNS) {
    const m = text.match(new RegExp(triggers.source, 'gi'))
    if (m && m.length > 0) hits.push({ tag, count: m.length })
  }
  hits.sort((a, b) => b.count - a.count)
  const tags = hits.slice(0, 3).map((h) => h.tag)
  if (draft.sourceWord) tags.unshift(draft.sourceWord.toLowerCase())
  return [...new Set(tags)].slice(0, 4)
}

/** 新建或更新笔记(传 id 则更新),返回保存后的笔记 */
export function saveNote(draft: NoteDraft & { id?: string }): Note {
  const notes = readAll()
  const now = Date.now()
  if (draft.id) {
    const idx = notes.findIndex((n) => n.id === draft.id)
    if (idx >= 0) {
      const old = notes[idx]
      // tags: 用户显式传入则用之,否则保留旧标签并补充新提取的
      const mergedTags = draft.tags
        ?? [...new Set([...(old.tags ?? []), ...extractTags(draft)])]
      const updated: Note = {
        ...old,
        type: draft.type ?? old.type,
        title: draft.title ?? old.title,
        content: draft.content,
        analysis: draft.analysis ?? old.analysis,
        sourceWord: draft.sourceWord ?? old.sourceWord,
        sourceText: draft.sourceText ?? old.sourceText,
        tags: mergedTags,
        starred: draft.starred ?? old.starred,
        updatedAt: now,
      }
      notes[idx] = updated
      writeAll(notes)
      syncToCloud([updated])
      return updated
    }
  }
  const created: Note = {
    id: genId(),
    type: draft.type,
    title: draft.title?.trim() || defaultTitle(draft),
    content: draft.content,
    analysis: draft.analysis,
    sourceWord: draft.sourceWord,
    sourceText: draft.sourceText,
    tags: draft.tags ?? extractTags(draft),
    starred: draft.starred,
    createdAt: now,
    updatedAt: now,
  }
  notes.unshift(created)
  writeAll(notes)
  syncToCloud([created])
  return created
}

function defaultTitle(draft: NoteDraft): string {
  if (draft.sourceWord) return draft.sourceWord
  // 句子笔记:取原句前 6 个词
  if (draft.type === 'sentence' && draft.sourceText) {
    const ws = draft.sourceText.trim().split(/\s+/)
    return ws.slice(0, 6).join(' ') + (ws.length > 6 ? '…' : '')
  }
  // 其他:取内容第一句/第一行
  const base = (draft.content || draft.sourceText || '').trim()
  const first = base.split(/[\n。!！?？]/)[0].replace(/\s+/g, ' ').trim()
  return (first || base.replace(/\s+/g, ' ')).slice(0, 24) || '未命名笔记'
}

export function deleteNote(id: string): void {
  writeAll(readAll().filter((n) => n.id !== id))
  // fire-and-forget cloud delete
  import('../api/notes').then((m) => m.deleteCloudNote(id).catch(() => {})).catch(() => {})
}

/** 搜索(标题+内容+原句+标签) */
export function searchNotes(query: string): Note[] {
  const q = query.trim().toLowerCase()
  if (!q) return getNotes()
  return getNotes().filter((n) =>
    [n.title, n.content, n.sourceText ?? '', n.analysis ?? '', ...(n.tags ?? [])].some((s) => s.toLowerCase().includes(q))
  )
}

/** 全部标签及计数(按出现次数降序) */
export function getAllTags(): { tag: string; count: number }[] {
  const counter = new Map<string, number>()
  for (const n of readAll()) {
    for (const t of n.tags ?? []) counter.set(t, (counter.get(t) ?? 0) + 1)
  }
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/** 按标签筛选 */
export function getNotesByTag(tag: string): Note[] {
  return getNotes().filter((n) => (n.tags ?? []).includes(tag))
}

/** 一次性:为没有标签的存量笔记自动补主题标签(幂等) */
export function backfillTags(): number {
  const notes = readAll()
  const touched: Note[] = []
  for (const n of notes) {
    if (!n.tags || n.tags.length === 0) {
      const t = extractTags(n)
      if (t.length > 0) {
        n.tags = t
        touched.push(n)
      }
    }
  }
  if (touched.length > 0) {
    writeAll(notes)
    syncToCloud(touched)
  }
  return touched.length
}

/** 登录后把本地笔记同步到云端(异步,静默失败) */
function syncToCloud(notes: Note[]) {
  import('../api/auth').then((auth) => {
    if (!auth.isLoggedIn()) return
    return import('../api/notes').then((m) => m.syncCloudNotes(notes).catch(() => {}))
  }).catch(() => {})
}

/** 首次登录时全量同步 */
export function syncAllNotesToCloud(): Promise<void> {
  const all = readAll()
  if (all.length === 0) return Promise.resolve()
  return import('../api/notes').then((m) => m.syncCloudNotes(all).then(() => undefined)).catch(() => undefined)
}
