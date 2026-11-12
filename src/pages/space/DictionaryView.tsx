/**
 * 学习空间 — 我的词典
 * 生词 + 词库释义 + 我的理解 + AI 点评 + 自造例句(契约见 PRODUCT.md)
 */
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { speakerBtnBase } from '../../components/ui/SpeakerButton'
import { bodySmall, bodyText, microLabel, sectionTitle, tabPill } from '../../styles/typography'
import ContextLearning from './ContextLearning'
import type { DictionaryWord } from '../../types/learning'
import { reviewUnderstanding } from '../../api/dictionary'
import { fetchWord } from '../../api/words'
import {
  addToDictionary,
  getDictionary,
  removeFromDictionary,
  searchDictionary,
  setAiFeedback,
  updateUnderstanding,
} from '../../utils/dictionary'
import { deleteNote, getNotesByType } from '../../utils/notes'
import type { Note } from '../../types/learning'

/* 词性 → Badge 颜色(与 Words.tsx 同款映射) */
const POS_COLORS: Record<string, 'purple' | 'green' | 'pink' | 'orange' | 'blue' | 'yellow' | 'gray'> = {
  NOUN: 'purple',
  VERB: 'green',
  ADJECTIVE: 'pink',
  ADVERB: 'orange',
  PREPOSITION: 'blue',
  CONJUNCTION: 'yellow',
  PRONOUN: 'gray',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--space-sm) var(--space-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text)',
  background: 'var(--color-canvas-soft)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xs)',
  outline: 'none',
  resize: 'vertical',
}

const wordTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 'var(--text-heading)',
  letterSpacing: 'var(--tracking-heading)',
  color: 'var(--color-text)',
}

const disabledBtnOverlay: React.CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
}

export default function DictionaryView() {
  const [entries, setEntries] = useState<DictionaryWord[]>(() => getDictionary())
  const [query, setQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [draftWord, setDraftWord] = useState('')
  const [draftMeaning, setDraftMeaning] = useState('')
  const [draftPos, setDraftPos] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [editingWord, setEditingWord] = useState<string | null>(null)
  const [editUnderstanding, setEditUnderstanding] = useState('')
  const [editExample, setEditExample] = useState('')
  const [reviewingWord, setReviewingWord] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Compact list: only one entry expanded at a time
  const [expandedWord, setExpandedWord] = useState<string | null>(null)
  // 子板块:词条 / 语境记忆
  const [subTab, setSubTab] = useState<'entries' | 'context'>('entries')

  const refresh = useCallback(() => {
    setEntries(getDictionary())
  }, [])

  const visible = useMemo(
    () => (query.trim() ? searchDictionary(query) : entries),
    [query, entries],
  )

  /* 单词失焦:自动尝试从词库带出释义与词性(404/失败则留空手填) */
  const handleWordBlur = useCallback(() => {
    const w = draftWord.trim()
    if (!w) return
    setLookingUp(true)
    fetchWord(w)
      .then((res) => {
        const meaning = res.rich?.posNote ?? res.simple?.meaning ?? ''
        const pos = res.rich?.pos ?? res.simple?.pos ?? ''
        setDraftMeaning((prev) => (prev.trim() ? prev : meaning))
        setDraftPos((prev) => (prev.trim() ? prev : pos))
      })
      .catch(() => { /* 词库不可达 — 留空让用户手填 */ })
      .finally(() => setLookingUp(false))
  }, [draftWord])

  const handleAdd = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const w = draftWord.trim()
    if (!w) return
    addToDictionary({ word: w, meaning: draftMeaning.trim(), pos: draftPos.trim().toUpperCase() })
    setDraftWord('')
    setDraftMeaning('')
    setDraftPos('')
    setShowAddForm(false)
    refresh()
  }, [draftWord, draftMeaning, draftPos, refresh])

  const startEdit = (entry: DictionaryWord) => {
    setEditingWord(entry.word)
    setEditUnderstanding(entry.myUnderstanding)
    setEditExample(entry.myExample ?? '')
    setError('')
  }

  const handleSaveEdit = () => {
    if (editingWord === null) return
    updateUnderstanding(editingWord, editUnderstanding.trim(), editExample.trim())
    setEditingWord(null)
    refresh()
  }

  const handleReview = useCallback(async (entry: DictionaryWord) => {
    if (!entry.myUnderstanding.trim()) return
    setReviewingWord(entry.word)
    setError('')
    try {
      const { feedback } = await reviewUnderstanding({
        word: entry.word,
        meaning: entry.meaning,
        myUnderstanding: entry.myUnderstanding,
      })
      setAiFeedback(entry.word, feedback)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 点评失败,请稍后再试')
    } finally {
      setReviewingWord(null)
    }
  }, [refresh])

  const handleDelete = useCallback((entry: DictionaryWord) => {
    if (!window.confirm(`确定把「${entry.word}」从我的词典删除吗?`)) return
    removeFromDictionary(entry.word)
    if (editingWord === entry.word) setEditingWord(null)
    refresh()
  }, [refresh, editingWord])

  return (
    <div>
      {/* ═══ 子板块切换:词条 / 语境记忆 ═══ */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)' }}>
        <button style={tabPill(subTab === 'entries')} onClick={() => setSubTab('entries')}>词条</button>
        <button style={tabPill(subTab === 'context')} onClick={() => setSubTab('context')}>语境记忆</button>
      </div>

      {subTab === 'context' ? (
        <ContextLearning />
      ) : (
        <>
      {/* ═══ 顶栏:统计 + 搜索 + 手动添加 ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)',
      }}>
        <p style={{ ...microLabel, margin: 0 }}>
          MY DICTIONARY · 共 {entries.length} 词{query.trim() ? ` · 匹配 ${visible.length}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索单词 / 释义 / 我的理解…"
            aria-label="搜索词典"
            style={{ width: 240 }}
          />
          <Button variant="ghost" onClick={() => setShowAddForm((v) => !v)}>
            {showAddForm ? '收起' : '+ 手动添加'}
          </Button>
        </div>
      </div>

      {error && (
        <p style={{ ...bodySmall, color: 'var(--color-error)', margin: '0 0 var(--space-md)' }}>{error}</p>
      )}

      {/* ═══ 手动添加表单 ═══ */}
      {showAddForm && (
        <Card style={{ marginBottom: 'var(--space-xl)' }}>
          <form onSubmit={handleAdd}>
            <p style={{ ...sectionTitle, margin: '0 0 var(--space-md)' }}>手动添加词条</p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <Input
                  value={draftWord}
                  onChange={(e) => setDraftWord(e.target.value)}
                  onBlur={handleWordBlur}
                  placeholder="单词(必填)"
                  aria-label="单词"
                  required
                />
                {lookingUp && (
                  <p style={{ ...bodySmall, fontSize: 'var(--text-micro)', margin: 'var(--space-xxs) 0 0' }}>
                    正在从词库带释义…
                  </p>
                )}
              </div>
              <div style={{ flex: '2 1 220px', minWidth: 180 }}>
                <Input
                  value={draftMeaning}
                  onChange={(e) => setDraftMeaning(e.target.value)}
                  placeholder="释义(失焦自动带出,可手填)"
                  aria-label="释义"
                />
              </div>
              <div style={{ flex: '0 1 130px', minWidth: 110 }}>
                <Input
                  value={draftPos}
                  onChange={(e) => setDraftPos(e.target.value)}
                  placeholder="词性 如 NOUN"
                  aria-label="词性"
                />
              </div>
              <Button type="submit" variant="filled" disabled={!draftWord.trim()}>添加</Button>
            </div>
            <p style={{ ...bodySmall, margin: 'var(--space-sm) 0 0' }}>
              单词输入框失焦时会自动尝试从词库带出释义与词性;词库没有的词留空手填即可收录。
            </p>
          </form>
        </Card>
      )}

      {/* ═══ 词条列表 / 空状态 ═══ */}
      {entries.length === 0 ? (
        <div style={{
          padding: 'var(--space-huge) var(--space-xl)', textAlign: 'center',
          border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
        }}>
          <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>MY DICTIONARY · EMPTY</p>
          <p style={{ ...bodyText, maxWidth: 480, margin: '0 auto var(--space-xl)' }}>
            词典还是空的。去阅读或查词时,在单词详情页点「加入词典」(或学习助手的「加入词典」)把生词收进来;
            写下你自己的理解,再让 AI 老师点评修正。
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/read"><Button variant="ghost">去阅读</Button></Link>
            <Link to="/words"><Button variant="ghost">浏览词库</Button></Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p style={{ ...bodyText, padding: 'var(--space-huge) 0', textAlign: 'center', margin: 0 }}>
          没有匹配「{query}」的词条。
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
          {visible.map((entry) => {
            const canReview = entry.myUnderstanding.trim().length > 0
            const isEditing = editingWord === entry.word
            const isReviewing = reviewingWord === entry.word
            const expanded = expandedWord === entry.word || isEditing || isReviewing
            return (
              <Card key={entry.word} style={{ padding: expanded ? 'var(--space-xl)' : 'var(--space-sm) var(--space-lg)' }}>
                {/* 紧凑头行 — 点击展开/收起 */}
                <button
                  onClick={() => setExpandedWord(expanded && !isEditing && !isReviewing ? null : entry.word)}
                  aria-expanded={expanded}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                    width: '100%', padding: 0, background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-micro)',
                    color: 'var(--color-text)', minWidth: 110, flexShrink: 0,
                  }}>
                    {entry.word}
                  </span>
                  {entry.pos && <Badge color={POS_COLORS[entry.pos.toUpperCase()] ?? 'gray'}>{entry.pos}</Badge>}
                  <span style={{
                    flex: 1, minWidth: 0, fontSize: 'var(--text-body-sm)',
                    color: 'var(--color-text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.meaning || '—'}
                  </span>
                  {/* 状态点:有理解 / 有点评 */}
                  <span style={{ display: 'flex', gap: 4, flexShrink: 0 }} title={
                    [entry.myUnderstanding.trim() ? '已写我的理解' : '', entry.aiFeedback ? '有 AI 点评' : ''].filter(Boolean).join(' · ') || '还没有笔记'
                  }>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: entry.myUnderstanding.trim() ? 'var(--color-success)' : 'var(--color-border)' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: entry.aiFeedback ? 'var(--color-noun)' : 'var(--color-border)' }} />
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--color-text-secondary)',
                    flexShrink: 0,
                  }}>{expanded ? '▾' : '▸'}</span>
                </button>

                {expanded && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                {/* 单词 + 词库页链接 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  flexWrap: 'wrap', marginBottom: 'var(--space-lg)',
                }}>
                  <Link to={`/words/${encodeURIComponent(entry.word)}`} style={{ textDecoration: 'none' }}>
                    <span style={wordTitleStyle}>{entry.word}</span>
                  </Link>
                  {entry.pos && <Badge color={POS_COLORS[entry.pos.toUpperCase()] ?? 'gray'}>{entry.pos}</Badge>}
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  {/* 词库释义 */}
                  <div>
                    <p style={{ ...sectionTitle, margin: '0 0 var(--space-xxs)' }}>词库释义</p>
                    <p style={{ ...bodySmall, margin: 0 }}>{entry.meaning || '—'}</p>
                  </div>

                  {/* 我的理解 */}
                  <div>
                    <p style={{ ...sectionTitle, margin: '0 0 var(--space-xxs)' }}>我的理解</p>
                    {isEditing ? (
                      <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                        <textarea
                          value={editUnderstanding}
                          onChange={(e) => setEditUnderstanding(e.target.value)}
                          rows={3}
                          placeholder="用你自己的话解释这个词…"
                          aria-label="我的理解"
                          style={textareaStyle}
                        />
                        <textarea
                          value={editExample}
                          onChange={(e) => setEditExample(e.target.value)}
                          rows={2}
                          placeholder="自造例句(可选)"
                          aria-label="自造例句"
                          style={textareaStyle}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          <button style={speakerBtnBase} onClick={handleSaveEdit}>保存</button>
                          <button
                            style={{ ...speakerBtnBase, borderColor: 'transparent' }}
                            onClick={() => setEditingWord(null)}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : entry.myUnderstanding ? (
                      <p style={{ ...bodySmall, margin: 0, color: 'var(--color-text-soft)', whiteSpace: 'pre-line' }}>
                        {entry.myUnderstanding}
                      </p>
                    ) : (
                      <p style={{ ...bodySmall, margin: 0, opacity: 0.65 }}>还没写自己的理解…</p>
                    )}
                  </div>

                  {/* AI 点评 */}
                  {entry.aiFeedback && (
                    <div style={{
                      background: 'color-mix(in srgb, var(--color-text) 6%, transparent)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: 'var(--space-sm) var(--space-md)',
                    }}>
                      <p style={{ ...sectionTitle, margin: '0 0 var(--space-xxs)' }}>AI 点评</p>
                      <p style={{ ...bodySmall, margin: 0, color: 'var(--color-text-soft)', whiteSpace: 'pre-line' }}>
                        {entry.aiFeedback}
                      </p>
                    </div>
                  )}

                  {/* 自造例句 */}
                  {entry.myExample && !isEditing && (
                    <div>
                      <p style={{ ...sectionTitle, margin: '0 0 var(--space-xxs)' }}>自造例句</p>
                      <p style={{ ...bodySmall, margin: 0, fontStyle: 'italic' }}>"{entry.myExample}"</p>
                    </div>
                  )}
                </div>

                {/* 操作行 */}
                <div style={{
                  display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap',
                  marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  {!isEditing && (
                    <button style={speakerBtnBase} onClick={() => startEdit(entry)}>编辑理解</button>
                  )}
                  <button
                    style={{
                      ...speakerBtnBase,
                      ...(!canReview || reviewingWord !== null ? disabledBtnOverlay : null),
                    }}
                    onClick={() => { handleReview(entry) }}
                    disabled={!canReview || reviewingWord !== null}
                    title={canReview ? '让 AI 老师点评你的理解' : '先写下你的理解,才能让 AI 老师点评'}
                  >
                    {isReviewing ? 'AI 老师正在阅读…' : '让 AI 看看我的理解'}
                  </button>
                  <button style={speakerBtnBase} onClick={() => handleDelete(entry)}>删除</button>
                </div>
                </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ═══ 历史归档:旧版"存词卡/AI分析"笔记(词卡已并入词典) ═══ */}
      <ArchiveSection />
        </>
      )}
    </div>
  )
}

/* ── 历史归档区 ───────────────────────────────────────────── */

function ArchiveSection() {
  const [items, setItems] = useState<Note[]>(() => [
    ...getNotesByType('word'),
    ...getNotesByType('analysis'),
  ])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (items.length === 0) return null

  const handleDelete = (n: Note) => {
    if (!window.confirm(`确定删除归档「${n.title}」吗?此操作不可恢复。`)) return
    deleteNote(n.id)
    setItems([...getNotesByType('word'), ...getNotesByType('analysis')])
    if (expandedId === n.id) setExpandedId(null)
  }

  return (
    <div style={{ marginTop: 'var(--space-xxl)' }}>
      <p style={{ ...sectionTitle, margin: '0 0 var(--space-sm)' }}>
        历史归档 · 词卡摘录与旧分析({items.length})
      </p>
      <p style={{ ...bodySmall, margin: '0 0 var(--space-md)' }}>
        这些是旧版「存词卡」和「AI 分析收藏」产生的记录,现已并入词典与句子库。可展开查看或删除。
      </p>
      <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
        {items.map((n) => {
          const expanded = expandedId === n.id
          return (
            <Card key={n.id} style={{ padding: 'var(--space-sm) var(--space-lg)' }}>
              <button
                onClick={() => setExpandedId(expanded ? null : n.id)}
                aria-expanded={expanded}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  width: '100%', padding: 0, background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                  {expanded ? '▾' : '▸'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 'var(--text-body-sm)', color: 'var(--color-text)',
                  minWidth: 100, flexShrink: 0,
                }}>
                  {n.title}
                </span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 'var(--text-micro)',
                  color: 'var(--color-text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.type === 'word' ? '词卡摘录' : 'AI 分析'}
                </span>
              </button>
              {expanded && (
                <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)' }}>
                  {n.sourceText && (
                    <p style={{
                      ...bodySmall, fontStyle: 'italic', margin: '0 0 var(--space-xs)',
                      borderLeft: '2px solid var(--color-border)', paddingLeft: 'var(--space-sm)',
                    }}>
                      {n.sourceText}
                    </p>
                  )}
                  <p style={{ ...bodySmall, margin: '0 0 var(--space-sm)', whiteSpace: 'pre-line', color: 'var(--color-text-soft)' }}>
                    {n.content || n.analysis || '(无内容)'}
                  </p>
                  <button
                    style={{ ...speakerBtnBase, color: 'var(--color-error)' }}
                    onClick={() => handleDelete(n)}
                  >
                    删除
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
