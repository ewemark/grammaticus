import { useState, useRef, useEffect } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { uploadFile, fetchPastDocs, fetchDoc, deleteDoc, type PastDoc } from '../api/upload'
import { isLoggedIn } from '../api/auth'
import FullscreenReader from '../components/ui/FullscreenReader'

export default function Upload() {
  const [dragOver, setDragOver] = useState(false)
  const [text, setText] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [pastDocs, setPastDocs] = useState<PastDoc[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refreshPast()
  }, [])

  const loadPastDoc = async (id: number) => {
    setLoading(true)
    try {
      const d = await fetchDoc(id)
      setFilename(d.filename)
      setText(d.content)
    } catch (e) {
      console.error('[Upload]', e)
    }
    setLoading(false)
  }

  // History is per-user, so only fetch it when logged in
  const refreshPast = () => {
    if (!isLoggedIn()) { setPastDocs([]); return }
    fetchPastDocs().then(setPastDocs).catch((e) => { console.error('[Upload]', e) })
  }

  const handleDeleteDoc = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteDoc(id)
      refreshPast()
    } catch (err) {
      console.error('[Upload]', err)
    }
  }

  const handleUpload = (file: File) => {
    setLoading(true)
    setFilename(file.name)
    uploadFile(file)
      .then((d) => { setText(d.text); setLoading(false); refreshPast() })
      .catch(() => setLoading(false))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>
        UPLOAD
      </p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-xl)', fontWeight: 700, lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0 0 var(--space-md)' }}>
        Document Upload
      </h2>
      <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)', maxWidth: 520 }}>
        上传你的文章对应的文档，我们提供单词的查找和语法分析。
      </p>

      {/* Drop zone */}
      <Card>
        <div
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-text)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-huge) var(--space-xxl)',
            textAlign: 'center',
            transition: 'border-color var(--transition-fast)',
            cursor: 'pointer',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.docx"
            style={{ display: 'none' }}
            onChange={onSelect}
          />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>
            {loading ? '解析中…' : '点击选择文件或拖拽到此处'}
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
            TXT, PDF, DOCX — 不超过 10 MB
          </p>
          <Button variant="ghost" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>选择文件</Button>
        </div>
      </Card>

      {/* Result */}
      {text && (
        <div style={{ marginTop: 'var(--space-xxl)' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: 0 }}>
                {filename}
              </h4>
              <button
                onClick={() => setFullscreen(true)}
                style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '4px 12px', cursor: 'pointer' }}
              >
                放大阅读
              </button>
            </div>
            <div
              onClick={() => setFullscreen(true)}
              style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line', maxHeight: 300, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            >
              {text}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, var(--color-canvas-soft))' }} />
            </div>
          </Card>
        </div>
      )}

      {/* Past uploads */}
      {pastDocs.length > 0 && (
        <div style={{ marginTop: 'var(--space-xxl)' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>历史记录</h4>
          <div style={{ display: 'grid', gap: 'var(--space-xs)' }}>
            {pastDocs.map((d) => (
              <div
                key={d.id}
                onClick={() => loadPastDoc(d.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-sm) var(--space-md)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text)' }}>{d.filename}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{d.created_at?.slice(0, 10)}</span>
                  <button
                    onClick={(e) => handleDeleteDoc(d.id, e)}
                    style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.4 }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-error)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen reading overlay */}
      {fullscreen && (
        <FullscreenReader
          title={filename}
          content={text}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  )
}