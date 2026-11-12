import { useState, useRef } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { createWorker } from 'tesseract.js'
import { saveArticle } from '../utils/savedArticles'
import FullscreenReader from '../components/ui/FullscreenReader'

export default function Scan() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    setImage(url)
    setText('')
    setScanning(true)
    setSaved(false)

    try {
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(file)
      setText(data.text.trim())
      await worker.terminate()
    } catch (err) {
      console.error('[Scan] OCR error:', err)
      setText('OCR 识别失败，请重试或手动输入文本。')
    }
    setScanning(false)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSave = () => {
    if (saved) return
    const id = `scan-${Date.now()}`
    saveArticle({
      id,
      title: `拍照识别 · ${new Date().toLocaleDateString('zh-CN')}`,
      content: text,
      words: [],
      createdAt: Date.now(),
    })
    setSaved(true)
  }

  const startEdit = () => {
    setEditDraft(text)
    setEditing(true)
  }

  const confirmEdit = () => {
    if (window.confirm('确定要保存修改吗？')) {
      setText(editDraft)
      setSaved(false)
      setEditing(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditDraft('')
  }

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-micro)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-micro)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--space-md)',
        }}
      >
        SCAN
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display-xl)',
          fontWeight: 700,
          lineHeight: 'var(--leading-heading)',
          letterSpacing: 'var(--tracking-heading)',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          margin: '0 0 var(--space-md)',
        }}
      >
        拍照翻译
      </h2>
      <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)', maxWidth: 520 }}>
        拍摄或上传英语文本照片，自动识别并提取文字。识别后可搭配悬浮窗进行语法分析。
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onSelect}
        style={{ display: 'none' }}
      />

      {/* Camera / upload zone */}
      {!image && (
        <Card>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed var(--color-border)`,
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-huge) var(--space-xxl)',
              textAlign: 'center',
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-micro)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-micro)',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--space-md)',
              }}
            >
              点击拍摄或选择图片
            </p>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
              支持摄像头拍摄或从相册选取
            </p>
            <Button variant="ghost">选择图片</Button>
          </div>
        </Card>
      )}

      {/* Image preview + scanning / result */}
      {image && (
        <>
          <Card>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
              <Button variant="ghost" onClick={() => { setImage(null); setText(''); setSaved(false) }}>
                ← 重新拍摄
              </Button>
            </div>
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: scanning ? 'var(--space-md)' : 0 }}>
              <img
                src={image}
                alt="Captured"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#000' }}
              />
            </div>
            {scanning && (
              <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-text)', borderRadius: '50%', margin: '0 auto var(--space-sm)', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                  OCR 识别中…
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </Card>

          {/* Result */}
          {!scanning && text && (
            <div style={{ marginTop: 'var(--space-xxl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-micro)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  识别结果
                </h4>
                <button
                  onClick={() => setFullscreen(true)}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                    letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)', background: 'none',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
                    padding: '4px 12px', cursor: 'pointer',
                  }}
                >
                  放大阅读
                </button>
              </div>
              <Card>
                <p style={{
                  fontSize: 'var(--text-body)',
                  lineHeight: 'var(--leading-body)',
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}>
                  {text}
                </p>
              </Card>
            </div>
          )}

          {!scanning && !text && (
            <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                未能识别到文字，请尝试重新拍摄。
              </p>
            </div>
          )}
        </>
      )}

      {/* Fullscreen reading overlay */}
      {fullscreen && text && (
        <FullscreenReader
          title="拍照识别"
          subtitle="OCR 提取"
          content={text}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onClose={() => { setFullscreen(false); setEditing(false) }}
          zIndex={1000}
          editing={editing}
          editValue={editDraft}
          onEditChange={setEditDraft}
          actions={
            <>
              <button onClick={startEdit} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}>编辑</button>
              <button onClick={handleSave} disabled={saved} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: saved ? 'var(--color-success)' : 'var(--color-text-secondary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: saved ? 'default' : 'pointer' }}>{saved ? '已收藏 ✓' : '☆ 收藏'}</button>
            </>
          }
          editActions={
            <>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)' }}>编辑模式</span>
              <button onClick={confirmEdit} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-success)', background: 'none', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}>确认修改</button>
              <button onClick={cancelEdit} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-error)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer' }}>取消</button>
            </>
          }
        />
      )}
    </div>
  )
}
