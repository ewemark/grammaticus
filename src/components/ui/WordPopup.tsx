/**
 * WordPopup — 阅读点词即查的迷你词卡弹层
 * 定位在触发元素(anchorRect)下方,空间不足时智能翻转;点外部 / Esc 关闭。
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import { toast } from './Toast'
import { microLabel } from '../../styles/typography'
import type { WordDetailResponse } from '../../api/words'
import { fetchAudioUrl, fetchWord } from '../../api/words'
import { addToDictionary, getDictionaryWord, isInDictionary } from '../../utils/dictionary'
import { getNotes } from '../../utils/notes'
import type { Note } from '../../types/learning'
import { addLookedUpWord, getActiveSession } from '../../utils/readingSession'

interface WordPopupProps {
  word: string
  /** 触发元素位置,用于定位 */
  anchorRect: DOMRect
  onClose: () => void
}

/* 词性 → Badge 颜色(与 DictionaryView.tsx 同款映射) */
const POS_COLORS: Record<string, 'purple' | 'green' | 'pink' | 'orange' | 'blue' | 'yellow' | 'gray'> = {
  NOUN: 'purple',
  VERB: 'green',
  ADJECTIVE: 'pink',
  ADVERB: 'orange',
  PREPOSITION: 'blue',
  CONJUNCTION: 'yellow',
  PRONOUN: 'gray',
}

const POPUP_WIDTH = 300
/** 预估卡高,用于判断是否需要向上翻转(含"我的积累"区) */
const POPUP_EST_HEIGHT = 300
const GAP = 8
const EDGE = 8

/** 找出与某单词相关的笔记(词典同词/标签含词/标题即词),排除诊断报告 */
function findRelatedNotes(w: string): Note[] {
  const lower = w.toLowerCase()
  return getNotes().filter((n) => {
    if (n.type === 'diagnosis') return false
    if (n.sourceWord && n.sourceWord.toLowerCase() === lower) return true
    if ((n.tags ?? []).some((t) => t.toLowerCase() === lower)) return true
    if (n.title.trim().toLowerCase() === lower) return true
    return false
  }).slice(0, 5)
}

/* 两行截断 */
const clamp2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
}

const popupBtn: React.CSSProperties = {
  ...microLabel,
  padding: '5px var(--space-sm)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xs)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  outline: 'none',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}

/* 发音:优先词库音频,失败 fallback 到浏览器 TTS(参考 SpeakerButton 的 playAudio) */
async function playAudio(w: string): Promise<void> {
  try {
    const audioUrl = await fetchAudioUrl(w, 'uk')
    const audio = new Audio(audioUrl)
    await audio.play()
  } catch {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(w)
    u.lang = 'en-GB'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }
}

export default function WordPopup({ word, anchorRect, onClose }: WordPopupProps) {
  /* result 带上所属 word,词切换后旧数据自动作废 → 显示加载态 */
  const [result, setResult] = useState<{ word: string; detail: WordDetailResponse } | null>(null)
  const [failedFor, setFailedFor] = useState<string | null>(null)
  const [inDict, setInDict] = useState(() => isInDictionary(word))
  /* 我的积累:AI 点评展开态 / 相关笔记展开态(就地展开,一次一条) */
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchWord(word)
      .then((detail) => {
        if (cancelled) return
        setResult({ word, detail })
        setFailedFor(null)
        setInDict(isInDictionary(word))
        // 通知当前阅读会话(若在阅读器中)
        const s = getActiveSession()
        if (s) {
          const meaning = detail.rich?.posNote ?? detail.simple?.meaning ?? ''
          addLookedUpWord(s.articleId, word, meaning)
        }
      })
      .catch(() => {
        if (!cancelled) setFailedFor(word)
      })
    return () => { cancelled = true }
  }, [word])

  /* 点外部关闭 + Esc 关闭 */
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const detail = result?.word === word ? result.detail : null
  const failed = failedFor === word
  const loading = detail === null && !failed

  /* ── 定位:默认锚点下方 8px 左对齐;底部/右侧空间不足则翻转 ── */
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  let left = anchorRect.left
  if (left + POPUP_WIDTH > vw - EDGE) {
    left = Math.max(EDGE, anchorRect.right - POPUP_WIDTH)
  }
  const fitsBelow = vh - anchorRect.bottom >= POPUP_EST_HEIGHT + GAP
  const placeAbove = !fitsBelow && anchorRect.top >= POPUP_EST_HEIGHT + GAP
  const top = placeAbove ? undefined : anchorRect.bottom + GAP
  const bottom = placeAbove ? vh - anchorRect.top + GAP : undefined

  const simple = detail?.simple ?? null
  const rich = detail?.rich ?? null
  const known = simple !== null || rich !== null
  const pos = rich?.pos ?? simple?.pos ?? ''
  const meaning = rich?.posNote ?? simple?.meaning ?? ''

  /* ── 我的积累:词典条目 + 相关笔记 ── */
  const dictEntry = getDictionaryWord(word)
  const relatedNotes = findRelatedNotes(word)
  const hasLearning = !!(dictEntry?.myUnderstanding?.trim() || dictEntry?.aiFeedback || relatedNotes.length > 0)

  const handleAdd = () => {
    addToDictionary({ word })
    setInDict(true)
    toast.success('已加入我的词典')
  }

  const sectionLabel: React.CSSProperties = {
    ...microLabel,
    fontSize: 9,
    margin: 0,
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top,
        bottom,
        width: POPUP_WIDTH,
        zIndex: 1200,
        boxSizing: 'border-box',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-raised)',
        padding: 'var(--space-md)',
      }}
    >
      {loading ? (
        <p style={{ ...microLabel, margin: 'var(--space-md) 0', textAlign: 'center' }}>查询中…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '62vh' }}>
        <div style={{ display: 'grid', gap: 'var(--space-xs)', overflowY: 'auto', minHeight: 0 }}>
          {/* 单词 + 发音 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-heading-sm)',
              letterSpacing: 'var(--tracking-heading)', color: 'var(--color-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {word}
            </span>
            <button
              onClick={() => { void playAudio(word) }}
              title="发音(英式)"
              style={{ ...popupBtn, padding: '3px 8px', marginLeft: 'auto', flexShrink: 0 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </button>
          </div>

          {/* 音标 + 词性 */}
          {(rich?.pronunciation || pos) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
              {rich?.pronunciation && (
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                  {rich.pronunciation}
                </span>
              )}
              {pos && <Badge color={POS_COLORS[pos.toUpperCase()] ?? 'gray'}>{pos}</Badge>}
            </div>
          )}

          {known ? (
            <>
              {/* 释义(截 2 行) */}
              <p style={{
                fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)',
                color: 'var(--color-text-soft)', margin: 0, ...clamp2,
              }}>
                {meaning || '—'}
              </p>
              {/* 例句(斜体小字,截 2 行) */}
              {simple?.example && (
                <p style={{
                  fontSize: 'var(--text-micro)', lineHeight: 'var(--leading-body)',
                  color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0, ...clamp2,
                }}>
                  "{simple.example}"
                </p>
              )}
            </>
          ) : (
            <div>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-xxs)' }}>
                {failed ? '查询失败,请检查网络后重试' : '词库暂未收录'}
              </p>
            </div>
          )}

          {/* ═══ 我的积累:词典理解 + AI 点评 + 相关笔记(就地展开) ═══ */}
          {hasLearning && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-xs)', display: 'grid', gap: 6 }}>
              <p style={sectionLabel}>我的积累</p>

              {/* 我的理解 */}
              {dictEntry?.myUnderstanding?.trim() && (
                <div>
                  <p style={{ ...sectionLabel, color: 'var(--color-text-secondary)', marginBottom: 2 }}>我的理解</p>
                  <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 1.55, color: 'var(--color-text-soft)', margin: 0, whiteSpace: 'pre-line' }}>
                    {dictEntry.myUnderstanding}
                  </p>
                </div>
              )}

              {/* AI 点评(默认收起) */}
              {dictEntry?.aiFeedback && (
                <div>
                  <button
                    onClick={() => setFeedbackOpen((v) => !v)}
                    style={{ ...popupBtn, padding: '2px 8px', fontSize: 9 }}
                  >
                    {feedbackOpen ? '▾ 收起 AI 点评' : '▸ AI 点评'}
                  </button>
                  {feedbackOpen && (
                    <p style={{
                      fontSize: 'var(--text-micro)', lineHeight: 1.6, color: 'var(--color-text-soft)',
                      background: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
                      border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
                      padding: '6px 10px', margin: '4px 0 0', whiteSpace: 'pre-line',
                    }}>
                      {dictEntry.aiFeedback}
                    </p>
                  )}
                </div>
              )}

              {/* 相关笔记(就地展开) */}
              {relatedNotes.length > 0 && (
                <div>
                  <p style={{ ...sectionLabel, color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>
                    相关笔记 ({relatedNotes.length})
                  </p>
                  {relatedNotes.map((n) => (
                    <div key={n.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => setExpandedNoteId(expandedNoteId === n.id ? null : n.id)}
                        aria-expanded={expandedNoteId === n.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px 0', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 9, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                          {expandedNoteId === n.id ? '▾' : '▸'}
                        </span>
                        <span style={{
                          flex: 1, minWidth: 0, fontSize: 'var(--text-micro)',
                          color: 'var(--color-text-soft)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {n.title}
                        </span>
                      </button>
                      {expandedNoteId === n.id && (
                        <div style={{ padding: '2px 0 8px 15px' }}>
                          {n.sourceText && (
                            <p style={{
                              fontSize: 'var(--text-micro)', fontStyle: 'italic', lineHeight: 1.55,
                              color: 'var(--color-text-secondary)', margin: '0 0 4px',
                              borderLeft: '2px solid var(--color-border)', paddingLeft: 8,
                            }}>
                              {n.sourceText}
                            </p>
                          )}
                          {n.content && (
                            <p style={{ fontSize: 'var(--text-micro)', lineHeight: 1.6, color: 'var(--color-text-soft)', margin: 0, whiteSpace: 'pre-line' }}>
                              {n.content}
                            </p>
                          )}
                          {n.analysis && !n.content && (
                            <p style={{ fontSize: 'var(--text-micro)', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-line', maxHeight: 120, overflowY: 'auto' }}>
                              {n.analysis.slice(0, 600)}{n.analysis.length > 600 ? '…' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          {/* 操作行(固定在滚动区外) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap',
            marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)',
            borderTop: '1px solid var(--color-border)', flexShrink: 0,
          }}>
            <button
              onClick={handleAdd}
              disabled={inDict}
              style={{
                ...popupBtn,
                ...(inDict ? { color: 'var(--color-success)', borderColor: 'var(--color-success)', cursor: 'default' } : null),
              }}
            >
              {inDict ? '✓ 在词典中' : '加入词典'}
            </button>
            {known && (
              <Link
                to={`/words/${encodeURIComponent(word)}`}
                onClick={onClose}
                style={{ ...popupBtn, marginLeft: 'auto' }}
              >
                完整词卡 →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
