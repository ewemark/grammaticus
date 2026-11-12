/**
 * 学习空间 — 收藏文章书架
 * 列表 + 直接打开全屏阅读(复用 FullscreenReader,含分析侧栏/记笔记)
 */
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FullscreenReader from '../../components/ui/FullscreenReader'
import {
  getFavoriteArticles,
  removeFavoriteArticle,
  type FavoriteArticle,
} from '../../utils/articleFavorites'
import { microLabel, sectionTitle } from '../../styles/typography'

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ArticleShelfView() {
  const [items, setItems] = useState<FavoriteArticle[]>(() => getFavoriteArticles())
  const [reading, setReading] = useState<FavoriteArticle | null>(null)
  const [fontSize, setFontSize] = useState(18)

  const refresh = useCallback(() => setItems(getFavoriteArticles()), [])

  const handleRemove = (id: string, title: string) => {
    if (!window.confirm(`把《${title}》移出收藏吗?`)) return
    removeFavoriteArticle(id)
    refresh()
  }

  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>
        MY SHELF · 共 {items.length} 篇
      </p>

      {items.length === 0 ? (
        <div style={{
          padding: 'var(--space-huge) var(--space-xl)', textAlign: 'center',
          border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
        }}>
          <p style={{ ...sectionTitle, marginBottom: 'var(--space-md)' }}>书架还是空的</p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', maxWidth: 420, margin: '0 auto var(--space-xl)', lineHeight: 'var(--leading-body)' }}>
            在阅读页打开任意文章,点顶部工具栏的「☆ 收藏」即可收进书架。收藏的文章带全文保存,随时点开继续读。
          </p>
          <Link to="/read"><Button variant="ghost">去阅读</Button></Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          {items.map((f) => (
            <Card key={f.id} style={{ padding: 'var(--space-md) var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setReading(f)}
                  style={{
                    flex: 1, minWidth: 200, textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                  title="打开阅读"
                >
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 'var(--text-body)',
                    fontWeight: 700, letterSpacing: 'var(--tracking-micro)',
                    color: 'var(--color-text)', display: 'block',
                  }}>
                    {f.title}
                  </span>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-secondary)' }}>
                    {f.subtitle ? `${f.subtitle} · ` : ''}收藏于 {formatDate(f.addedAt)}
                  </span>
                </button>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                  <Button variant="filled" onClick={() => setReading(f)}
                    style={{ padding: 'var(--space-xs) var(--space-lg)' }}>
                    阅读
                  </Button>
                  <Button variant="ghost" onClick={() => handleRemove(f.id, f.title)}
                    style={{ padding: 'var(--space-xs) var(--space-lg)', color: 'var(--color-error)', borderColor: 'var(--color-border)' }}>
                    移出
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {reading && (
        <FullscreenReader
          title={reading.title}
          subtitle={reading.subtitle ?? '收藏文章'}
          content={reading.content}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClose={() => setReading(null)}
          articleId={`fav-${reading.id}`}
        />
      )}
    </div>
  )
}
