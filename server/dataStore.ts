/**
 * 内存数据层 — 词库与文章直接从 data/*.json 打包加载,不再依赖 SQLite。
 *
 * 本地 dev 与 Vercel serverless 共用同一份代码:
 * Vercel 构建时这些 JSON 会被打进函数包(esbuild 内联),冷启动即用,无需 seed。
 * 数据语义与旧的 server/seed.ts + seed-nce.ts 完全一致。
 */
import simpleRaw from '../data/words.json' with { type: 'json' }
import richRaw from '../data/words-rich.json' with { type: 'json' }
import nce1 from '../data/nce-book1.json' with { type: 'json' }
import nce2 from '../data/nce-book2.json' with { type: 'json' }
import nce3 from '../data/nce-book3.json' with { type: 'json' }
import nce4 from '../data/nce-book4.json' with { type: 'json' }

/* ── 类型 ───────────────────────────────────────────────────── */

export interface SimpleRow {
  word: string
  meaning: string
  pos: string
  example: string
}

export interface RichRow {
  word: string
  pronunciation: string
  pos: string
  posNote: string
  forms: unknown
  coreImage: string
  atomicCore: string
  semanticRadii: unknown
  grammarRules: unknown
  exampleDiagnoses: unknown
  synonymComparisons: unknown
  oneLinePenetration: string
}

export interface ArticleRow {
  id: number
  book: string
  lesson: number
  title: string
  title_cn: string
  content: string
  level: string
}

interface RawSimple { w: string; m: string; p: string; e: string }
interface RawNce { lesson: number; title: string; title_cn?: string; content: string }

/* ── 构建(模块级一次性) ────────────────────────────────────── */

const hasCJK = (s: string) => /[\u4e00-\u9fff]/.test(s)

const simpleMap = new Map<string, SimpleRow>()
for (const r of simpleRaw as RawSimple[]) {
  if (!r.w) continue
  simpleMap.set(r.w.toLowerCase(), { word: r.w, meaning: r.m ?? '', pos: r.p ?? '', example: r.e ?? '' })
}

const richMap = new Map<string, RichRow>()
for (const r of richRaw as RichRow[]) {
  if (!r.word) continue
  richMap.set(r.word.toLowerCase(), r)
  // 与旧 seed 的 INSERT OR IGNORE 一致:words.json 优先,富词条仅在缺位且释义含中文时同步基础行
  const key = r.word.toLowerCase()
  if (!simpleMap.has(key) && hasCJK(r.posNote)) {
    simpleMap.set(key, { word: r.word, meaning: r.posNote, pos: r.pos, example: '' })
  }
}

const NCE_BOOKS: { book: string; level: string; data: RawNce[] }[] = [
  { book: 'Book 1', level: 'BEGINNER', data: nce1 as RawNce[] },
  { book: 'Book 2', level: 'INTERMEDIATE', data: nce2 as RawNce[] },
  { book: 'Book 3', level: 'ADVANCED', data: nce3 as RawNce[] },
  { book: 'Book 4', level: 'ADVANCED', data: nce4 as RawNce[] },
]

const articleStore: ArticleRow[] = []
let nextId = 1
for (const b of NCE_BOOKS) {
  for (const a of b.data) {
    articleStore.push({
      id: nextId++,
      book: b.book,
      lesson: a.lesson,
      title: a.title,
      title_cn: a.title_cn ?? '',
      content: a.content,
      level: b.level,
    })
  }
}

/** 基础词条列表快照(搜索/列表共用;AI 缓存词会追加,查询结果另行排序) */
const simpleList: SimpleRow[] = [...simpleMap.values()]

/* ── 访问器 ─────────────────────────────────────────────────── */

export function getSimpleWord(w: string): SimpleRow | undefined {
  return simpleMap.get(w.toLowerCase())
}

export function getRichWord(w: string): RichRow | undefined {
  return richMap.get(w.toLowerCase())
}

export function getSimpleList(): readonly SimpleRow[] {
  return simpleList
}

/** AI 实时生成的词条缓存到本实例(serverless 冷启动即清,无状态可接受) */
export function cacheWord(row: SimpleRow): void {
  const key = row.word.toLowerCase()
  if (simpleMap.has(key)) return
  simpleMap.set(key, row)
  simpleList.push(row)
}

export function listArticles(book?: string): ArticleRow[] {
  return book ? articleStore.filter((a) => a.book === book) : articleStore
}

export function listBooks(): string[] {
  return NCE_BOOKS.map((b) => b.book)
}

export function getArticle(id: number): ArticleRow | undefined {
  return articleStore.find((a) => a.id === id)
}