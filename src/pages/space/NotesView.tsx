/**
 * 学习空间 — 笔记视图
 * filter='all'      → 全部笔记:搜索 + 类型/标签筛选 + 星标置顶 + 时间分组时间线
 *                     卡片主体点开进入阅读态(全文/原句/AI 分析/相关笔记),编辑走内联表单
 * filter='sentence' → 句子库:原句为主体,展开看 AI 分析与我的想法,可补想法
 * 数据层:src/utils/notes.ts(localStorage 优先,登录后双写云端)
 * 契约见 PRODUCT.md「统一模块:学习空间」
 */
import { useState, type CSSProperties } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import AnalysisText from '../../components/ui/AnalysisText'
import { backfillTags, deleteNote, getNotes, getNotesByType, saveNote, searchNotes, toggleStar } from '../../utils/notes'
import { NOTE_TYPE_LABELS, type Note, type NoteType } from '../../types/learning'
import { ghostLink, microLabel, sectionTitle, tabPill } from '../../styles/typography'

/* ── 常量 ── */

const NOTE_TYPE_ORDER: NoteType[] = ['text', 'analysis', 'word', 'reading', 'sentence', 'diagnosis']

type BadgeColor = 'purple' | 'green' | 'pink' | 'blue' | 'yellow' | 'orange' | 'gray' | 'violet' | 'sky'

const TYPE_BADGE_COLORS: Record<NoteType, BadgeColor> = {
  text: 'sky',
  analysis: 'violet',
  word: 'yellow',
  reading: 'green',
  sentence: 'blue',
  diagnosis: 'pink',
}

/* ── 时间:相对时间 + 分组 ── */

/** 相对时间:刚刚 / N分钟前 / N小时前 / N天前 / N个月前 / N年前 */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}个月前`
  return `${Math.floor(months / 12)}年前`
}

type TimeGroupKey = 'starred' | 'today' | 'yesterday' | 'week' | 'earlier'

interface NoteGroup {
  key: TimeGroupKey
  label: string
  notes: Note[]
}

const GROUP_ORDER: { key: TimeGroupKey; label: string }[] = [
  { key: 'starred', label: '★ 已星标' },
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '本周' },
  { key: 'earlier', label: '更早' },
]

function dayStart(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 星标单独一组置顶,其余按 updatedAt 分为 今天/昨天/本周(7天内)/更早 */
function groupNotes(list: Note[]): NoteGroup[] {
  const today0 = dayStart(Date.now())
  const buckets: Record<TimeGroupKey, Note[]> = {
    starred: [], today: [], yesterday: [], week: [], earlier: [],
  }
  for (const n of list) {
    if (n.starred) {
      buckets.starred.push(n)
      continue
    }
    const days = Math.round((today0 - dayStart(n.updatedAt)) / 86_400_000)
    if (days <= 0) buckets.today.push(n)
    else if (days === 1) buckets.yesterday.push(n)
    else if (days < 7) buckets.week.push(n)
    else buckets.earlier.push(n)
  }
  return GROUP_ORDER.flatMap((g) =>
    buckets[g.key].length > 0 ? [{ key: g.key, label: g.label, notes: buckets[g.key] }] : []
  )
}

/* ── 相关笔记:tags 任一重叠 / sourceWord 相同 / 标题互相包含 ── */

function findRelated(note: Note, all: Note[]): Note[] {
  const tags = note.tags ?? []
  const word = (note.sourceWord ?? '').trim().toLowerCase()
  const title = note.title.trim()
  return all
    .filter((o) => o.id !== note.id)
    .filter((o) => {
      if (tags.length > 0 && (o.tags ?? []).some((t) => tags.includes(t))) return true
      if (word && word === (o.sourceWord ?? '').trim().toLowerCase()) return true
      const otherTitle = o.title.trim()
      if (title.length >= 2 && otherTitle.length >= 2 && (title.includes(otherTitle) || otherTitle.includes(title))) return true
      return false
    })
    .slice(0, 3)
}

/* ── 共享样式(全部走 CSS 变量,双主题自适应) ── */

const fieldStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--color-canvas)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xs)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-ui)',
  padding: 'var(--space-xs) var(--space-sm)',
  outline: 'none',
}

const timeStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-micro)',
  letterSpacing: 'var(--tracking-micro)',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const noteTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-heading-sm)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-heading)',
  color: 'var(--color-text)',
  margin: '0 0 var(--space-xxs)',
  overflowWrap: 'break-word',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

/** 收起态内容预览 — 截断 2 行(紧凑) */
const previewStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-secondary)',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-line',
}

/** 展开态完整内容 — 不截断 */
const fullContentStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-soft)',
  whiteSpace: 'pre-line',
  overflowWrap: 'break-word',
}

/** 标签 pill(卡片上展示 / 顶部筛选) */
const tagPillStyle = (active: boolean): CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  padding: '2px 10px',
  borderRadius: 'var(--radius-pill)',
  border: active ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
  background: active ? 'var(--color-text)' : 'transparent',
  color: active ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all var(--transition-fast)',
})

/** 来源原句 — 引用样式(阅读态,完整) */
const quoteBlockStyle: CSSProperties = {
  borderLeft: '2px solid var(--color-border)',
  paddingLeft: 'var(--space-sm)',
  marginTop: 'var(--space-xs)',
}

const quoteTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-soft)',
  fontStyle: 'italic',
  overflowWrap: 'break-word',
}

/** 收起态原句 — 单行省略 */
const quoteLineStyle: CSSProperties = {
  margin: 'var(--space-xxs) 0 0',
  fontSize: 'var(--text-body-sm)',
  color: 'var(--color-text-secondary)',
  fontStyle: 'italic',
  borderLeft: '2px solid var(--color-border)',
  paddingLeft: 'var(--space-xs)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** 时间分组 sticky 横条 — 钉在应用 Header 之下 */
const groupHeaderStyle: CSSProperties = {
  position: 'sticky',
  top: 'var(--header-height)',
  zIndex: 5,
  background: 'var(--color-canvas)',
  borderBottom: '1px solid var(--color-border)',
  padding: 'var(--space-xs) 0',
  marginBottom: 'var(--space-xs)',
}

/** 紧凑卡片 padding */
const compactCardStyle: CSSProperties = {
  padding: 'var(--space-md)',
}

const starButtonStyle = (starred: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0 2px',
  fontSize: 14,
  lineHeight: 1,
  color: starred ? 'var(--color-adverb)' : 'var(--color-text-secondary)',
  transition: 'color var(--transition-fast)',
})

const relatedButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-xs)',
  width: '100%',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '3px 0',
  textAlign: 'left',
}

const relatedTypeStyle: CSSProperties = {
  ...microLabel,
  flexShrink: 0,
}

const relatedTitleStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 'var(--text-body-sm)',
  color: 'var(--color-text-soft)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** 句子库原句 — 衬线、较大字号 */
const sentenceStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif',
  fontSize: 'var(--text-heading-sm)',
  lineHeight: 1.6,
  letterSpacing: '0.2px',
  color: 'var(--color-text)',
  overflowWrap: 'break-word',
}

/** Button 默认胶囊太大,工具栏/表单里用紧凑版 */
const compactButtonStyle: CSSProperties = {
  padding: 'var(--space-xs) var(--space-lg)',
  flexShrink: 0,
}

const dangerLinkStyle: CSSProperties = {
  ...ghostLink,
  color: 'var(--color-error)',
}

/* ── 空状态 ── */

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
        {message}
      </p>
    </div>
  )
}

/* ── 内联新建/编辑表单(与阅读态互斥) ── */

function NoteForm({ note, defaultType, onDone }: { note?: Note; defaultType?: NoteType; onDone: () => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [tagsText, setTagsText] = useState((note?.tags ?? []).join(', '))
  const canSave = title.trim().length > 0 || content.trim().length > 0

  const save = () => {
    if (!canSave) return
    // 手动标签(逗号/空格分隔);留空则保留自动提取逻辑
    const manualTags = tagsText.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean).slice(0, 6)
    saveNote({
      id: note?.id,
      type: note?.type ?? defaultType ?? 'text',
      // 标题留空时:新建走 saveNote 的默认标题逻辑,编辑保留原标题
      title: title.trim() || undefined,
      content,
      tags: manualTags.length > 0 ? manualTags : undefined,
    })
    onDone()
  }

  return (
    <Card style={compactCardStyle}>
      <p style={{ ...sectionTitle, margin: '0 0 var(--space-md)' }}>
        {note ? 'EDIT NOTE · 编辑笔记' : 'NEW NOTE · 新建笔记'}
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题(可留空,自动取内容开头)"
        aria-label="笔记标题"
        autoFocus
        style={{ ...fieldStyle, marginBottom: 'var(--space-sm)' }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的想法…"
        aria-label="笔记内容"
        rows={5}
        style={{ ...fieldStyle, minHeight: 120, resize: 'vertical', lineHeight: 'var(--leading-body)' }}
      />
      <input
        type="text"
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
        placeholder="标签(逗号分隔,如: 从句, 时态 — 留空则自动识别主题)"
        aria-label="笔记标签"
        style={{ ...fieldStyle, marginTop: 'var(--space-sm)' }}
      />
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)' }}>
        <Button variant="filled" onClick={save} disabled={!canSave} style={compactButtonStyle}>
          保存
        </Button>
        <Button variant="ghost" onClick={onDone} style={compactButtonStyle}>
          取消
        </Button>
      </div>
    </Card>
  )
}

/* ── 笔记列表视图(fixedType:固定为某一板块类型) ── */

function AllNotesView({ fixedType }: { fixedType?: NoteType }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    backfillTags() // 存量笔记自动补标签(幂等)
    return getNotes()
  })
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const reload = () => setNotes(getNotes())

  // 实时过滤:关键词(标题+内容+原句+分析+标签)→ 类型 → 主题标签
  const found = query.trim() ? searchNotes(query) : notes
  const effectiveType = fixedType ?? (typeFilter === 'all' ? null : typeFilter)
  const byType = effectiveType ? found.filter((n) => n.type === effectiveType) : found
  const visible = tagFilter ? byType.filter((n) => (n.tags ?? []).includes(tagFilter)) : byType
  // 星标置顶 + 时间分组(今天/昨天/本周/更早)
  const groups = groupNotes(visible)

  // 标签汇总(基于当前类型的结果,不含标签过滤自身)
  const tagCounts = new Map<string, number>()
  for (const n of byType) {
    for (const t of n.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  }
  const tagList = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  // 编辑态与阅读态互斥
  const startEdit = (id: string) => {
    setEditingId(id)
    setCreating(false)
    setExpandedId(null)
  }

  const handleStar = (n: Note) => {
    toggleStar(n.id)
    reload()
  }

  const handleDelete = (n: Note) => {
    if (window.confirm(`确定删除「${n.title}」吗?此操作不可恢复。`)) {
      deleteNote(n.id)
      if (editingId === n.id) setEditingId(null)
      if (expandedId === n.id) setExpandedId(null)
      reload()
    }
  }

  /** 相关笔记跳转:收起当前卡、清掉筛选、目标卡边框高亮 2 秒并滚动过去 */
  const jumpToNote = (id: string) => {
    setExpandedId(null)
    setQuery('')
    setTypeFilter('all')
    setTagFilter(null)
    setHighlightId(id)
    window.setTimeout(() => {
      document.getElementById(`note-card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
    window.setTimeout(() => {
      setHighlightId((cur) => (cur === id ? null : cur))
    }, 2000)
  }

  return (
    <div>
      {/* 搜索 + 新建 */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题、内容、原句…"
          aria-label="搜索笔记"
          style={{ ...fieldStyle, flex: 1 }}
        />
        <Button
          variant="ghost"
          onClick={() => { setCreating(true); setEditingId(null); setExpandedId(null) }}
          style={compactButtonStyle}
        >
          新建笔记
        </Button>
      </div>

      {/* 类型筛选 pill 行 — 板块化后仅在无 fixedType 时显示 */}
      {!fixedType && (
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
          <button style={tabPill(typeFilter === 'all')} onClick={() => setTypeFilter('all')}>
            全部
          </button>
          {NOTE_TYPE_ORDER.map((t) => (
            <button key={t} style={tabPill(typeFilter === t)} onClick={() => setTypeFilter(t)}>
              {NOTE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {/* 主题标签行 — 找资料的快速通道 */}
      {tagList.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <span style={{ ...timeStyle, marginRight: 2 }}>主题</span>
          {tagList.map(([tag, count]) => (
            <button
              key={tag}
              style={tagPillStyle(tagFilter === tag)}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              title={tagFilter === tag ? '取消标签筛选' : `只看「${tag}」相关`}
            >
              {tag} {count}
            </button>
          ))}
          {tagFilter && (
            <button style={{ ...ghostLink, fontSize: 10 }} onClick={() => setTagFilter(null)}>
              清除筛选 ✕
            </button>
          )}
        </div>
      )}

      {/* 新建表单 */}
      {creating && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <NoteForm
            defaultType={fixedType}
            onDone={() => { setCreating(false); reload() }}
          />
        </div>
      )}

      {/* 分组时间线:★ 已星标置顶,其余 今天/昨天/本周/更早 */}
      {visible.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
          {groups.map((g) => (
            <section key={g.key}>
              <div style={groupHeaderStyle}>
                <span style={microLabel}>{g.label}</span>
              </div>
              <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
                {g.notes.map((n) => {
                  if (editingId === n.id) {
                    return (
                      <NoteForm
                        key={n.id}
                        note={n}
                        onDone={() => { setEditingId(null); reload() }}
                      />
                    )
                  }
                  const expanded = expandedId === n.id
                  const preview = n.content || n.analysis || ''
                  const tags = n.tags ?? []
                  const related = expanded ? findRelated(n, notes) : []
                  return (
                    <Card
                      key={n.id}
                      id={`note-card-${n.id}`}
                      style={{
                        ...compactCardStyle,
                        border: highlightId === n.id ? '2px solid var(--color-text)' : undefined,
                      }}
                    >
                      {/* 卡片主体:点击展开/收起阅读态 */}
                      <div
                        onClick={() => toggleExpand(n.id)}
                        title={expanded ? '点击收起' : '点击展开全文'}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xxs)' }}>
                          {fixedType ? <span /> : <Badge color={TYPE_BADGE_COLORS[n.type]}>{NOTE_TYPE_LABELS[n.type]}</Badge>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <span style={timeStyle}>{relativeTime(n.updatedAt)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStar(n) }}
                              aria-label={n.starred ? '取消星标' : '加星标'}
                              title={n.starred ? '取消星标' : '加星标'}
                              style={starButtonStyle(!!n.starred)}
                            >
                              {n.starred ? '★' : '☆'}
                            </button>
                          </div>
                        </div>
                        <h4 style={noteTitleStyle}>{n.title}</h4>
                        {!expanded && preview && <p style={previewStyle}>{preview}</p>}
                        {!expanded && n.sourceText && <p style={quoteLineStyle}>{n.sourceText}</p>}

                        {/* 阅读态:完整内容 + 原句引用 + AI 分析(区内点击不收起,便于选择文字) */}
                        {expanded && (
                          <div style={{ marginTop: 'var(--space-xs)', cursor: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            {n.content && <p style={fullContentStyle}>{n.content}</p>}
                            {n.sourceText && (
                              <div style={quoteBlockStyle}>
                                <p style={{ ...sectionTitle, margin: '0 0 2px' }}>原句</p>
                                <p style={quoteTextStyle}>{n.sourceText}</p>
                              </div>
                            )}
                            {n.analysis && (
                              <div style={{ marginTop: 'var(--space-sm)' }}>
                                <p style={{ ...sectionTitle, margin: '0 0 var(--space-xs)' }}>AI 分析</p>
                                <AnalysisText text={n.analysis} fontSize={13} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 标签行(收起/展开都显示;点击 = 按标签筛选) */}
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                            {tags.map((t) => (
                              <button
                                key={t}
                                style={tagPillStyle(tagFilter === t)}
                                onClick={(e) => { e.stopPropagation(); setTagFilter(tagFilter === t ? null : t) }}
                                title={`只看「${t}」相关笔记`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 相关笔记(阅读态底部) */}
                      {expanded && related.length > 0 && (
                        <div style={{ marginTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-xs)' }}>
                          <p style={{ ...sectionTitle, margin: '0 0 var(--space-xxs)' }}>相关笔记</p>
                          {related.map((r) => (
                            <button key={r.id} style={relatedButtonStyle} onClick={() => jumpToNote(r.id)} title={r.title}>
                              <span style={relatedTypeStyle}>{NOTE_TYPE_LABELS[r.type]}</span>
                              <span style={relatedTitleStyle}>{r.title}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* 操作行 */}
                      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                        <button style={ghostLink} onClick={() => startEdit(n.id)}>
                          编辑
                        </button>
                        <button style={dangerLinkStyle} onClick={() => handleDelete(n)}>
                          删除
                        </button>
                        {expanded && (
                          <button style={ghostLink} onClick={() => setExpandedId(null)}>
                            收起
                          </button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          message={
            byType.length === 0
              ? fixedType === 'text'
                ? '还没有手写笔记。点「新建笔记」写下第一条想法,学习助手的追问对话也可以存到这里。'
                : fixedType === 'reading'
                  ? '还没有阅读笔记。去阅读页选中文字点「记笔记」,或点「写心得」记录整篇感受。'
                  : '还没有任何笔记。点击「新建笔记」写下第一条想法,或在单词/阅读/学习助手中随手收藏。'
              : '没有符合条件的笔记。换个关键词或筛选试试。'
          }
        />
      )}
    </div>
  )
}

/* ── 句子库视图 ── */

function SentenceView() {
  const [sentences, setSentences] = useState<Note[]>(() => getNotesByType('sentence'))
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const reload = () => setSentences(getNotesByType('sentence'))

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const saveThought = (n: Note) => {
    saveNote({ id: n.id, type: 'sentence', content: draft })
    setEditingId(null)
    reload()
  }

  const handleDelete = (n: Note) => {
    if (window.confirm(`确定删除句子「${n.sourceText || n.title}」吗?此操作不可恢复。`)) {
      deleteNote(n.id)
      if (editingId === n.id) setEditingId(null)
      reload()
    }
  }

  return (
    <div>
      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>
        共 {sentences.length} 个句子
      </p>

      {sentences.length === 0 ? (
        <EmptyState message="句子库还是空的。在学习助手完成语法/介词分析后,点「存入句子库」即可收藏到这里。" />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          {sentences.map((n) => {
            const expanded = expandedIds.has(n.id)
            const editing = editingId === n.id
            const showDetail = expanded || editing
            return (
              <Card key={n.id} style={compactCardStyle}>
                {/* 原句主体 */}
                <p style={sentenceStyle}>{n.sourceText || n.title}</p>

                {/* 元信息 + 操作行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                  <span style={timeStyle}>{relativeTime(n.updatedAt)}</span>
                  {n.analysis && <span style={timeStyle}>已分析</span>}
                  {n.content && <span style={timeStyle}>有想法</span>}
                  <span style={{ flex: 1 }} />
                  {(n.analysis || n.content) && (
                    <button style={ghostLink} onClick={() => toggleExpand(n.id)}>
                      {expanded ? '收起' : '展开'}
                    </button>
                  )}
                  {!editing && (
                    <button
                      style={ghostLink}
                      onClick={() => { setEditingId(n.id); setDraft(n.content) }}
                    >
                      补想法
                    </button>
                  )}
                  <button style={dangerLinkStyle} onClick={() => handleDelete(n)} title="删除句子">
                    删除
                  </button>
                </div>

                {/* 展开区:AI 分析 + 我的想法 */}
                {showDetail && (
                  <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                    {n.analysis && (
                      <div style={{ marginBottom: 'var(--space-md)' }}>
                        <p style={{ ...sectionTitle, margin: '0 0 var(--space-xs)' }}>AI 分析</p>
                        <AnalysisText text={n.analysis} fontSize={13} />
                      </div>
                    )}
                    <p style={{ ...sectionTitle, margin: '0 0 var(--space-xs)' }}>我的想法</p>
                    {editing ? (
                      <div>
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="这句话让我想到…"
                          aria-label="我的想法"
                          rows={3}
                          autoFocus
                          style={{ ...fieldStyle, minHeight: 80, resize: 'vertical', lineHeight: 'var(--leading-body)' }}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
                          <Button variant="filled" onClick={() => saveThought(n)} style={compactButtonStyle}>
                            保存
                          </Button>
                          <Button variant="ghost" onClick={() => setEditingId(null)} style={compactButtonStyle}>
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : n.content ? (
                      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-soft)', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                        {n.content}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                        还没有想法 — 点「补想法」写下你的理解。
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 导出 ── */

export default function NotesView({ filter, fixedType }: { filter?: 'sentence'; fixedType?: NoteType }) {
  if (filter === 'sentence') return <SentenceView />
  return <AllNotesView fixedType={fixedType} />
}
