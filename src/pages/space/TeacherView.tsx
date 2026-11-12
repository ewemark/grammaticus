/**
 * 学习空间 — AI 老师(诊断)
 * 输入全部学习资产(笔记/句子库/词典/最近查词),输出证据式薄弱点诊断报告(契约见 PRODUCT.md)
 */
import { useCallback, useState } from 'react'
import AnalysisText from '../../components/ui/AnalysisText'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { microLabel, sectionTitle } from '../../styles/typography'
import type { Note } from '../../types/learning'
import { diagnoseLearning } from '../../api/notes'
import { getDictionary } from '../../utils/dictionary'
import { getNotes, getNotesByType, saveNote } from '../../utils/notes'
import { getRecent } from '../../utils/recent'

interface AssetStats {
  notes: number
  sentences: number
  words: number
}

/** 诊断至少需要的资产数(句子库是笔记子集,不重复计数) */
const MIN_ASSETS = 3

function readStats(): AssetStats {
  return {
    notes: getNotes().length,
    sentences: getNotesByType('sentence').length,
    words: getDictionary().length,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const historyToggleStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 'var(--space-md)',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

export default function TeacherView() {
  const [stats, setStats] = useState<AssetStats>(readStats)
  const [history, setHistory] = useState<Note[]>(() => getNotesByType('diagnosis'))
  const [diagnosing, setDiagnosing] = useState(false)
  const [result, setResult] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalAssets = stats.notes + stats.words
  const enoughAssets = totalAssets >= MIN_ASSETS

  const refresh = useCallback(() => {
    setStats(readStats())
    setHistory(getNotesByType('diagnosis'))
  }, [])

  const handleDiagnose = useCallback(async () => {
    setDiagnosing(true)
    setError('')
    setResult('')
    setSaved(false)
    try {
      const { result: text } = await diagnoseLearning({
        notes: getNotes(),
        dictionary: getDictionary().map((d) => ({
          word: d.word,
          meaning: d.meaning,
          myUnderstanding: d.myUnderstanding,
        })),
        recentWords: getRecent().slice(0, 20).map((r) => r.word),
      })
      setResult(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : '诊断失败,请稍后再试')
    } finally {
      setDiagnosing(false)
    }
  }, [])

  const handleSave = useCallback(() => {
    if (!result) return
    const d = new Date()
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    saveNote({ type: 'diagnosis', title: `AI 学习诊断 · ${dateStr}`, content: result })
    setSaved(true)
    refresh()
  }, [result, refresh])

  return (
    <div>
      {/* ═══ 顶部说明卡片 ═══ */}
      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <p style={{ ...microLabel, margin: '0 0 var(--space-sm)' }}>AI TEACHER</p>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)',
          lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: 0,
        }}>
          AI 老师会通读你的全部学习资产 — 笔记、句子库、词典词条(含你写的「我的理解」)和最近查词记录 —
          输出一份证据式的诊断报告:学习画像概览、薄弱点诊断(每条引用你的具体记录)、跨资产的深层模式、
          结合软件功能的行动建议,以及老师寄语。
        </p>
      </Card>

      {/* ═══ 资产统计行 ═══ */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)',
        flexWrap: 'wrap', marginBottom: 'var(--space-xl)',
      }}>
        <p style={{ ...sectionTitle, margin: 0 }}>笔记 {stats.notes} 条</p>
        <span style={{ ...sectionTitle, margin: 0 }} aria-hidden="true">·</span>
        <p style={{ ...sectionTitle, margin: 0 }}>句子 {stats.sentences} 句</p>
        <span style={{ ...sectionTitle, margin: 0 }} aria-hidden="true">·</span>
        <p style={{ ...sectionTitle, margin: 0 }}>词典 {stats.words} 词</p>
      </div>

      {/* ═══ 开始诊断 ═══ */}
      <div style={{ marginBottom: 'var(--space-xxl)' }}>
        <Button
          variant="filled"
          onClick={handleDiagnose}
          disabled={!enoughAssets || diagnosing}
          style={{ fontSize: 'var(--text-body-lg)', padding: 'var(--space-md) var(--space-xxl)' }}
        >
          {diagnosing ? '诊断中…' : '开始诊断'}
        </Button>
        {!enoughAssets && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-secondary)', margin: 'var(--space-sm) 0 0',
          }}>
            再多记录一些,老师才有材料(当前学习资产 {totalAssets} 条,至少需要 {MIN_ASSETS} 条)。
          </p>
        )}
      </div>

      {/* ═══ 诊断进行中 ═══ */}
      {diagnosing && (
        <Card style={{ marginBottom: 'var(--space-xl)', textAlign: 'center', padding: 'var(--space-huge) var(--space-xxl)' }}>
          <p style={{ ...microLabel, margin: '0 0 var(--space-sm)' }}>DIAGNOSING</p>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-body)',
            color: 'var(--color-text-secondary)', margin: 0,
          }}>
            老师正在仔细阅读你的学习记录…(约 20-40 秒)
          </p>
        </Card>
      )}

      {error && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)',
          color: 'var(--color-error)', margin: '0 0 var(--space-md)',
        }}>
          {error}
        </p>
      )}

      {/* ═══ 诊断结果 ═══ */}
      {result && !diagnosing && (
        <Card style={{ marginBottom: 'var(--space-xxl)' }}>
          <p style={{ ...sectionTitle, margin: '0 0 var(--space-md)' }}>诊断报告</p>
          <AnalysisText text={result} fontSize={15} />
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)', flexWrap: 'wrap' }}>
            <Button variant="filled" onClick={handleSave} disabled={saved}>
              {saved ? '已保存 ✓' : '保存为诊断笔记'}
            </Button>
            <Button variant="ghost" onClick={handleDiagnose}>再诊断一次</Button>
          </div>
        </Card>
      )}

      {/* ═══ 历史诊断 ═══ */}
      <div>
        <p style={{ ...sectionTitle, margin: '0 0 var(--space-md)' }}>历史诊断({history.length})</p>
        {history.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-secondary)', margin: 0,
          }}>
            还没有保存过诊断报告。完成一次诊断后点「保存为诊断笔记」即可留档,方便日后对照进步。
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {history.map((note) => {
              const expanded = expandedId === note.id
              return (
                <Card key={note.id} style={{ padding: 'var(--space-md) var(--space-xl)' }}>
                  <button
                    style={historyToggleStyle}
                    onClick={() => setExpandedId(expanded ? null : note.id)}
                    aria-expanded={expanded}
                  >
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 'var(--text-body-sm)', letterSpacing: 'var(--tracking-micro)',
                      color: 'var(--color-text)',
                    }}>
                      {note.title}
                    </span>
                    <span style={{ ...microLabel, whiteSpace: 'nowrap' }}>
                      {formatDateTime(note.createdAt)} {expanded ? '▴' : '▾'}
                    </span>
                  </button>
                  {expanded && (
                    <div style={{
                      marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)',
                      borderTop: '1px solid var(--color-border)',
                    }}>
                      <AnalysisText text={note.content} fontSize={15} />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
