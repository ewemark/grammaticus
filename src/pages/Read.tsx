import { useState } from 'react'
import { tabPill, microLabel, pageTitle } from '../styles/typography'
import ContextLearning from './read/ContextLearning'
import ArticleLibrary from './read/ArticleLibrary'

/* ── main page ──────────────────────────────────────────────── */

export default function Read() {
  const [tab, setTab] = useState<'context' | 'library'>('context')

  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>READING</p>
      <h2 style={{ ...pageTitle, margin: '0 0 var(--space-xxl)' }}>阅读</h2>
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xxl)', flexWrap: 'wrap' }}>
        <button style={tabPill(tab === 'context')} onClick={() => setTab('context')}>语境记忆</button>
        <button style={tabPill(tab === 'library')} onClick={() => setTab('library')}>文章阅读</button>
      </div>
      {tab === 'context' && <ContextLearning />}
      {tab === 'library' && <ArticleLibrary />}
    </div>
  )
}
