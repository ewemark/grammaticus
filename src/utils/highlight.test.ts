import { describe, it, expect } from 'vitest'
import { findHighlightRange, overlaps } from './highlight'

describe('findHighlightRange', () => {
  const content = 'The cat sat on the mat.\n\nShe has been reluctant to commit capital until the landscape becomes clearer.'

  it('finds an exact substring', () => {
    const r = findHighlightRange(content, 'The cat sat')
    expect(r).toEqual([0, 11])
    expect(content.slice(r![0], r![1])).toBe('The cat sat')
  })

  it('finds a sentence in the second paragraph', () => {
    const sel = 'She has been reluctant to commit capital'
    const r = findHighlightRange(content, sel)
    expect(r).not.toBeNull()
    expect(content.slice(r![0], r![1])).toBe(sel)
  })

  it('matches when selection has collapsed whitespace (rendered <br>/paragraph seams)', () => {
    // selection toString often normalizes newlines differently than source
    const sel = 'on the mat. She has been'
    const r = findHighlightRange(content, sel)
    expect(r).not.toBeNull()
    // normalized match maps back onto real source indices
    expect(r![0]).toBeLessThan(r![1])
    expect(content.slice(r![0], r![0] + 2)).toBe('on')
  })

  it('matches multi-space selections against single-space source', () => {
    const c2 = 'a b   c d'
    const r = findHighlightRange(c2, 'b c')
    expect(r).not.toBeNull()
    expect(c2.slice(r![0], r![1])).toBe('b   c')
  })

  it('trims the selection before matching', () => {
    const r = findHighlightRange(content, '  The cat  ')
    expect(r).toEqual([0, 7])
  })

  it('returns null when not found', () => {
    expect(findHighlightRange(content, 'zebra crossing')).toBeNull()
  })

  it('returns null for empty inputs', () => {
    expect(findHighlightRange('', 'x')).toBeNull()
    expect(findHighlightRange(content, '')).toBeNull()
    expect(findHighlightRange(content, '   ')).toBeNull()
  })
})

describe('overlaps', () => {
  it('detects intersection', () => {
    expect(overlaps(5, 10, [8, 12])).toBe(true)
    expect(overlaps(8, 12, [5, 10])).toBe(true)
  })

  it('treats containment as overlap', () => {
    expect(overlaps(6, 8, [5, 10])).toBe(true)
    expect(overlaps(4, 12, [5, 10])).toBe(true)
  })

  it('rejects adjacent ranges (touching edges)', () => {
    expect(overlaps(0, 5, [5, 10])).toBe(false)
    expect(overlaps(10, 15, [5, 10])).toBe(false)
  })

  it('rejects disjoint ranges', () => {
    expect(overlaps(0, 3, [10, 20])).toBe(false)
  })
})
