/**
 * Shared typography style objects — eliminate inline style duplication.
 * Import from here instead of writing inline `fontFamily: 'var(--font-display)'` etc.
 */

import type React from 'react'

/* ── font stacks ── */
const display: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
}

const body: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
}

/* ── common type presets ── */

/** Section micro-label: READING, WORDS, etc. */
export const microLabel: React.CSSProperties = {
  ...display,
  fontSize: 'var(--text-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

/** Page title — large display heading */
export const pageTitle: React.CSSProperties = {
  ...display,
  fontSize: 'var(--text-display-xl)',
  lineHeight: 'var(--leading-heading)',
  letterSpacing: 'var(--tracking-heading)',
  textTransform: 'uppercase',
  color: 'var(--color-text)',
}

/** Section heading inside a page */
export const sectionTitle: React.CSSProperties = {
  ...display,
  fontSize: 'var(--text-micro)',
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

/** Card heading */
export const cardHeading: React.CSSProperties = {
  ...display,
  fontSize: 'var(--text-heading-sm)',
  letterSpacing: 'var(--tracking-heading)',
  textTransform: 'uppercase',
  color: 'var(--color-text)',
}

/** Body text */
export const bodyText: React.CSSProperties = {
  ...body,
  fontSize: 'var(--text-body)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-secondary)',
}

/** Small body text */
export const bodySmall: React.CSSProperties = {
  ...body,
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--leading-body)',
  color: 'var(--color-text-secondary)',
}

/** Inline display font (for word text, etc.) */
export const displayText: React.CSSProperties = {
  ...display,
  color: 'var(--color-text)',
}

/** Pill tab button */
export const tabPill = (active: boolean): React.CSSProperties => ({
  ...display,
  fontSize: 'var(--text-micro)',
  textTransform: 'uppercase',
  padding: 'var(--space-xs) var(--space-md)',
  borderRadius: 'var(--radius-pill)',
  border: active ? '1px solid var(--color-text)' : '1px solid var(--color-border)',
  background: active ? 'var(--color-text)' : 'transparent',
  color: active ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  whiteSpace: 'nowrap',
})

/** Ghost text link/button */
export const ghostLink: React.CSSProperties = {
  ...display,
  fontSize: 11,
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}
