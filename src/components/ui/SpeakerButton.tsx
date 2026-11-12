import { useState, useRef, useEffect } from 'react'
import { microLabel } from '../../styles/typography'
import { fetchAudioUrl } from '../../api/words'

/* ── SpeakerIcon ────────────────────────────────────────────── */

function SpeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

/* ── playAudio ──────────────────────────────────────────────── */

async function playAudio(word: string, accent: 'uk' | 'us') {
  try {
    const audioUrl = await fetchAudioUrl(word, accent)
    const audio = new Audio(audioUrl)
    await audio.play()
  } catch {
    // fallback to browser TTS
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }
}

/* ── speakerBtnBase ─────────────────────────────────────────── */

export const speakerBtnBase: React.CSSProperties = {
  ...microLabel,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  height: 28,
  padding: '0 var(--space-sm)',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xs)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  outline: 'none',
}

/* ── SpeakerButton ──────────────────────────────────────────── */

interface SpeakerButtonProps {
  word: string
}

export default function SpeakerButton({ word }: SpeakerButtonProps) {
  const [accent, setAccent] = useState<'uk' | 'us'>('uk')
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = accent === 'uk' ? '英式' : '美式'
  const borderColor = focus || open ? 'var(--color-text)' : 'var(--color-border)'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(!open)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ ...speakerBtnBase, borderColor, position: 'relative', zIndex: 1 }}
      >
        <SpeakerIcon /> {label}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 4,
          boxShadow: 'var(--shadow-raised)',
          overflow: 'hidden', zIndex: 100, minWidth: 80,
        }}>
          {(['uk', 'us'] as const).map((a) => (
            <button
              key={a}
              onClick={() => { setAccent(a); playAudio(word, a); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', padding: 'var(--space-xs) var(--space-sm)',
                ...microLabel,
                color: accent === a ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
                background: accent === a ? 'var(--color-text)' : 'transparent',
                border: 'none', cursor: 'pointer',
                borderBottom: a === 'uk' ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <SpeakerIcon /> {a === 'uk' ? '英式' : '美式'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
