import { type ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  content: string
  /** Custom rendered content (e.g. with highlights) — overrides plain text */
  contentElement?: ReactNode
  fontSize: number
  onFontSizeChange: (size: number) => void
  onClose: () => void
  actions?: ReactNode
  zIndex?: number
  editing?: boolean
  editValue?: string
  onEditChange?: (val: string) => void
  editActions?: ReactNode
}

export default function FullscreenReader({
  title, subtitle, content, contentElement, fontSize, onFontSizeChange, onClose,
  actions, zIndex = 999, editing, editValue, onEditChange, editActions,
}: Props) {
  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--color-text-secondary)',
    background: 'none', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xs)', padding: '6px 16px', cursor: 'pointer',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, background: '#000000', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
          {subtitle && (
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 12, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-micro)' }}>{subtitle}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editing && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                <button onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))} style={{ ...btnStyle, padding: '6px 10px', borderRadius: 0, border: 'none', borderRight: '1px solid var(--color-border)' }}>A⁻</button>
                <button onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))} style={{ ...btnStyle, padding: '6px 10px', borderRadius: 0, border: 'none' }}>A⁺</button>
              </div>
              {actions}
            </>
          )}
          {editing && editActions}
          <button onClick={onClose} style={btnStyle}>✕ 关闭</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xxl)', maxWidth: 800, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {editing ? (
          <textarea
            value={editValue}
            onChange={e => onEditChange?.(e.target.value)}
            style={{
              width: '100%', height: '100%', minHeight: 300,
              fontSize, lineHeight: 1.9, color: '#d8d8d8', background: '#0a0a0a',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)',
              padding: 'var(--space-lg)',
              fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif',
              letterSpacing: '0.3px', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
        ) : contentElement ? (
          <div style={{ fontSize, lineHeight: 1.9, color: '#d8d8d8', fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px' }}>
            {contentElement}
          </div>
        ) : (
          <p style={{ fontSize, lineHeight: 1.9, color: '#d8d8d8', whiteSpace: 'pre-line', margin: 0, fontFamily: 'Georgia, "Noto Serif", "Times New Roman", serif', letterSpacing: '0.3px' }}>
            {content}
          </p>
        )}
      </div>
    </div>
  )
}
