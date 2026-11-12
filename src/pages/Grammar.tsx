import { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { tabPill, microLabel, pageTitle } from '../styles/typography'
import { fetchVideos, getVideoUrl, type VideoItem } from '../api/video'
import { GRAMMAR_CHAPTERS, type GrammarChapter } from '../data/grammarDocs'

const TABS = ['视频', '文档解释'] as const
type Tab = (typeof TABS)[number]

export default function Grammar() {
  const [tab, setTab] = useState<Tab>('视频')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [playing, setPlaying] = useState<VideoItem | null>(null)
  const [docTopic, setDocTopic] = useState<GrammarChapter | null>(null)

  useEffect(() => {
    refreshVideos()
  }, [])

  const refreshVideos = () => {
    fetchVideos()
      .then((d) => setVideos(d.videos))
      .catch((e) => console.error('[Grammar]', e))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Parse category and title from filename (e.g. "词性 - 名词 形容词 副词.mp4")
  const parseVideo = (v: VideoItem) => {
    const parts = v.filename.replace(/\.mp4$/i, '').split(' - ')
    return {
      cat: parts.length > 1 ? parts[0] : '其他',
      title: (parts.length > 1 ? parts.slice(1).join(' - ') : parts[0]).replace(/^\d{2}\s+/, ''),
    }
  }

  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>GRAMMAR</p>
      <h2 style={{ ...pageTitle, margin: '0 0 var(--space-xxl)' }}>语法参考</h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xxl)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} style={tabPill(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 1: 视频 */}
      {tab === '视频' && (
        <div>
          <p
            style={{
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-xxl)',
              maxWidth: 520,
            }}
          >
            这些视频是 Larry 老师在 Bilibili 发布的视频，快去给 Larry 老师点点关注。假如你还有宝藏视频、宝藏博主，留言给我哦。
          </p>

          {videos.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: 'var(--space-huge) 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', marginBottom: 0 }}>
                  暂无语法讲解视频，敬请期待。
                </p>
              </div>
            </Card>
          ) : (
            <>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)' }}>
                共 {videos.length} 个视频
              </p>
              {(() => {
                const CAT_ORDER = ['导学', '词性', '简单句', '从句', '非谓语动词', '时态', '虚拟语气', '词法']
                const groups: Record<string, VideoItem[]> = {}
                for (const v of videos) {
                  const cat = v.filename.includes(' - ') ? v.filename.split(' - ')[0] : '其他'
                  if (!groups[cat]) groups[cat] = []
                  groups[cat].push(v)
                }
                const ordered = CAT_ORDER.filter(c => groups[c]).map(c => [c, groups[c]] as const)
                return ordered.map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 'var(--space-xxl)' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-micro)',
                      fontWeight: 700,
                      letterSpacing: 'var(--tracking-micro)',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      margin: '0 0 var(--space-md)',
                      paddingBottom: 'var(--space-sm)',
                      borderBottom: '1px solid var(--color-border)',
                    }}>
                      {cat} <span style={{ opacity: 0.4 }}>· {items.length}</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 'var(--space-md)' }}>
                      {items.map((v) => (
                        <Card key={v.filename}>
                          <h4 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-heading-sm)',
                            fontWeight: 700,
                            letterSpacing: 'var(--tracking-heading)',
                            color: 'var(--color-text)',
                            margin: '0 0 var(--space-sm)',
                          }}>
                            {parseVideo(v).title}
                          </h4>
                          <p style={{
                            fontSize: 'var(--text-micro)',
                            color: 'var(--color-text-secondary)',
                            fontFamily: 'var(--font-display)',
                            textTransform: 'uppercase',
                            letterSpacing: 'var(--tracking-micro)',
                            marginBottom: 'var(--space-md)',
                          }}>
                            {formatSize(v.size)}
                          </p>
                          <Button variant="ghost" onClick={() => setPlaying(v)}>
                            观看视频
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </>
          )}
        </div>
      )}

      {/* Tab 2: 文档解释 */}
      {tab === '文档解释' && (
        <div>
          {docTopic ? (
            <div>
              <button
                onClick={() => setDocTopic(null)}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-micro)',
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-micro)',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: 'var(--space-lg)',
                }}
              >
                ← 返回列表
              </button>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-display-lg)',
                  fontWeight: 700,
                  lineHeight: 'var(--leading-heading)',
                  letterSpacing: 'var(--tracking-heading)',
                  color: 'var(--color-text)',
                  margin: '0 0 var(--space-xs)',
                }}
              >
                {docTopic.title}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-micro)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-micro)',
                  color: 'var(--color-text-secondary)',
                  margin: '0 0 var(--space-xxl)',
                }}
              >
                {docTopic.subtitle}
              </p>
              <div style={{ maxWidth: 720 }}>
                {docTopic.blocks.map((block, i) => {
                  switch (block.type) {
                    case 'h3':
                      return (
                        <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-doc-accent)', margin: 'var(--space-xxl) 0 var(--space-md)', paddingLeft: 12, borderLeft: '3px solid var(--color-doc-accent)' }}>
                          {block.text}
                        </h3>
                      )
                    case 'h4':
                      return (
                        <h4 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 'var(--space-xl) 0 var(--space-sm)' }}>
                          {block.text}
                        </h4>
                      )
                    case 'p':
                      return (
                        <p key={i} style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)', whiteSpace: 'pre-line' }}>
                          {block.text!}
                        </p>
                      )
                    case 'larry':
                      return (
                        <div key={i} style={{ borderLeft: '3px solid var(--color-doc-accent)', padding: '12px 18px', margin: 'var(--space-md) 0', background: 'color-mix(in srgb, var(--color-doc-accent) 8%, transparent)', borderRadius: '0 8px 8px 0' }}>
                          <span style={{ color: 'var(--color-doc-accent)', fontWeight: 700, fontSize: 13 }}>Larry：</span>
                          <span style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-doc-quote)', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                            {block.text}
                          </span>
                        </div>
                      )
                    case 'tip':
                      return (
                        <div key={i} style={{ borderLeft: '3px solid var(--color-doc-accent)', padding: '12px 16px', margin: 'var(--space-md) 0', background: 'color-mix(in srgb, var(--color-doc-accent) 8%, transparent)', borderRadius: '0 6px 6px 0' }}>
                          <span style={{ color: 'var(--color-doc-accent)', fontWeight: 700, fontSize: 13 }}>关键理解：</span>
                          <span style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                            {block.text}
                          </span>
                        </div>
                      )
                    case 'warn':
                      return (
                        <div key={i} style={{ borderLeft: '3px solid var(--color-doc-warn)', padding: '12px 16px', margin: 'var(--space-md) 0', background: 'color-mix(in srgb, var(--color-doc-warn) 8%, transparent)', borderRadius: '0 6px 6px 0' }}>
                          <span style={{ color: 'var(--color-doc-warn)', fontWeight: 700, fontSize: 13 }}>常见错误：</span>
                          <span style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                            {block.text}
                          </span>
                        </div>
                      )
                    case 'point':
                      return (
                        <div key={i} style={{ background: 'var(--color-canvas-soft)', borderRadius: 8, padding: '14px 18px', margin: 'var(--space-md) 0', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                            {block.text!}
                          </span>
                        </div>
                      )
                    case 'summary':
                      return (
                        <div key={i} style={{ background: 'color-mix(in srgb, var(--color-doc-success) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--color-doc-success) 30%, transparent)', borderRadius: 10, padding: 18, margin: 'var(--space-lg) 0' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-doc-success)', margin: '0 0 8px' }}>总结</h4>
                          <span style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                            {block.text!}
                          </span>
                        </div>
                      )
                    case 'exercise':
                      return (
                        <div key={i} style={{ border: '1px dashed var(--color-border)', borderRadius: 10, padding: 18, margin: 'var(--space-lg) 0' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-doc-success)', margin: '0 0 8px' }}>练习</h4>
                          <span style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                            {block.text}
                          </span>
                        </div>
                      )
                    case 'example':
                      return (
                        <div key={i} style={{ padding: '10px 16px', margin: 'var(--space-sm) 0 var(--space-sm) 16px', background: 'color-mix(in srgb, var(--color-doc-info) 8%, transparent)', borderRadius: 6 }}>
                          <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-doc-success)', fontFamily: 'Georgia, serif', margin: '0 0 4px' }}>
                            {block.en}
                          </p>
                          {block.cn && (
                            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                              {block.cn}
                            </p>
                          )}
                        </div>
                      )
                    case 'table':
                      return (
                        <div key={i} style={{ overflowX: 'auto', margin: 'var(--space-md) 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-body-sm)' }}>
                            {block.headers!.length > 0 && (
                              <thead>
                                <tr>
                                  {block.headers!.map((h, j) => (
                                    <th key={j} style={{ border: '1px solid var(--color-border)', padding: '8px 12px', textAlign: 'left', background: 'var(--color-canvas-soft)', color: 'var(--color-doc-info)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {block.rows!.map((row, j) => (
                                <tr key={j}>
                                  {row.map((cell, k) => (
                                    <td key={k} style={{ border: '1px solid var(--color-border)', padding: '8px 12px', verticalAlign: 'top', color: 'var(--color-text-secondary)' }}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    case 'list':
                      return (
                        <ol key={i} style={{ margin: 'var(--space-sm) 0 var(--space-md) 20px', padding: 0 }}>
                          {block.items!.map((item, j) => (
                            <li key={j} style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                              {item}
                            </li>
                          ))}
                        </ol>
                      )
                    default:
                      return null
                  }
                })}
              </div>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize: 'var(--text-body)',
                  lineHeight: 'var(--leading-body)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-xxl)',
                  maxWidth: 520,
                }}
              >
                英语语法体系完全指南，共 7 章，配套 Larry 老师视频课程。从词性理解到从句、非谓语、时态、虚拟语气，逐章深入。
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                  gap: 'var(--space-md)',
                }}
              >
                {GRAMMAR_CHAPTERS.map((ch) => (
                  <Card key={ch.id}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-heading-sm)',
                        fontWeight: 700,
                        letterSpacing: 'var(--tracking-heading)',
                        color: 'var(--color-text)',
                        margin: '0 0 var(--space-xs)',
                      }}
                    >
                      第{ch.order}章 {ch.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-micro)',
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--tracking-micro)',
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 var(--space-md)',
                      }}
                    >
                      {ch.subtitle}
                    </p>
                    <Button variant="ghost" onClick={() => setDocTopic(ch)}>
                      阅读全文
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video player overlay */}
      {playing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--color-canvas)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {parseVideo(playing).title}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a
                href={getVideoUrl(playing.filename)}
                download
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 16px', cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                下载
              </a>
              <button
                onClick={() => setPlaying(null)}
                style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}
              >
                ✕ 关闭
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
            <video
              src={getVideoUrl(playing.filename)}
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
