import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Guestbook() {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!content.trim()) return
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), content: content.trim() }),
    })
    setName(''); setContent(''); setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const s = {
    label: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' } as React.CSSProperties,
  }

  return (
    <div>
      <p style={s.label}>GUESTBOOK</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display-xl)', fontWeight: 700, lineHeight: 'var(--leading-heading)', letterSpacing: 'var(--tracking-heading)', textTransform: 'uppercase', color: 'var(--color-text)', margin: '0 0 var(--space-md)' }}>留言板</h2>
      <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)', maxWidth: 520 }}>
        有问题、反馈，或者只是打个招呼。
      </p>

      {/* Form */}
      <Card>
        <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: 520 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字（选填）"
            style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', outline: 'none', boxSizing: 'border-box' }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="你的留言…"
            rows={4}
            style={{ width: '100%', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <Button onClick={submit} disabled={!content.trim()}>
            {sent ? '已发送 ✓' : '发送留言'}
          </Button>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>留言会通过邮件通知作者。</p>
        </div>
      </Card>

      {/* Author welcome */}
      <div style={{ marginTop: 'var(--space-xxl)' }}>
        <p style={s.label}>ABOUT THE AUTHOR</p>
        <Card>
          <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>Welcome to Grammaticus. This tool is built to help you master English — one word at a time.</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>留言会通过邮件私密发送给作者。</p>
        </Card>
      </div>
    </div>
  )
}
