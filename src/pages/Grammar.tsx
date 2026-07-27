import { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { tabPill, microLabel, pageTitle } from '../styles/typography'
import { fetchVideos, getVideoUrl, type VideoItem } from '../api/video'

const TABS = ['视频', '文档解释'] as const
type Tab = (typeof TABS)[number]

export default function Grammar() {
  const [tab, setTab] = useState<Tab>('视频')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [playing, setPlaying] = useState<VideoItem | null>(null)

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
    return { cat: parts.length > 1 ? parts[0] : '其他', title: parts.length > 1 ? parts.slice(1).join(' - ') : parts[0] }
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
                  // Parse category from filename (not displayName, which has dash replaced with space)
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
          <p
            style={{
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-xxl)',
              maxWidth: 520,
            }}
          >
            英语语法知识点的文字版讲解，涵盖时态、从句、非谓语、虚拟语气等核心语法专题。
          </p>
          <Card>
            <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                语法文档正在编写中，敬请期待。
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Video player overlay */}
      {playing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {playing.displayName.includes(' - ') ? playing.displayName.split(' - ').slice(1).join(' - ') : playing.displayName}
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
