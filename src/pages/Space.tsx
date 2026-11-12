import { useState, lazy, Suspense } from 'react'
import { microLabel, pageTitle, tabPill } from '../styles/typography'
import NotesView from './space/NotesView'

const DictionaryView = lazy(() => import('./space/DictionaryView'))
const ArticleShelfView = lazy(() => import('./space/ArticleShelfView'))
const TeacherView = lazy(() => import('./space/TeacherView'))

/** 学习空间 — 板块直接平铺,无二级筛选(词卡已并入词典) */
const TABS = [
  { key: 'text', label: '手写笔记' },
  { key: 'reading', label: '阅读笔记' },
  { key: 'sentences', label: '句子库' },
  { key: 'dictionary', label: '我的词典' },
  { key: 'shelf', label: '收藏文章' },
  { key: 'teacher', label: 'AI 老师' },
] as const

type TabKey = (typeof TABS)[number]['key']

function ViewFallback() {
  return (
    <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
      加载中…
    </div>
  )
}

export default function Space() {
  const [tab, setTab] = useState<TabKey>('text')

  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>SPACE</p>
      <h2 style={{ ...pageTitle, margin: '0 0 var(--space-md)' }}>学习空间</h2>
      <p style={{
        fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)',
        color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)', maxWidth: 560,
      }}>
        你的笔记、句子、词典、书架都沉淀在这里。记录越多,AI 老师越懂你。
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xxl)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} style={tabPill(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'text' && <NotesView fixedType="text" />}
      {tab === 'reading' && <NotesView fixedType="reading" />}
      {tab === 'sentences' && <NotesView filter="sentence" />}
      {tab === 'dictionary' && (
        <Suspense fallback={<ViewFallback />}><DictionaryView /></Suspense>
      )}
      {tab === 'shelf' && (
        <Suspense fallback={<ViewFallback />}><ArticleShelfView /></Suspense>
      )}
      {tab === 'teacher' && (
        <Suspense fallback={<ViewFallback />}><TeacherView /></Suspense>
      )}
    </div>
  )
}
