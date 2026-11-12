import { describe, it, expect } from 'vitest'
import { lemmatize, editDistance } from './lemmatize.js'

describe('lemmatize', () => {
  it('maps irregular verb forms to base', () => {
    expect(lemmatize('ran')).toContain('run')
    expect(lemmatize('went')).toContain('go')
    expect(lemmatize('children')).toContain('child')
    expect(lemmatize('better')).toContain('good')
    expect(lemmatize('mice')).toContain('mouse')
  })

  it('strips regular -s/-es plurals', () => {
    expect(lemmatize('cats')).toContain('cat')
    expect(lemmatize('boxes')).toContain('box')
    expect(lemmatize('watches')).toContain('watch')
  })

  it('handles -ies → -y', () => {
    expect(lemmatize('studies')).toContain('study')
    expect(lemmatize('carried')).toContain('carry')
    expect(lemmatize('happier')).toContain('happy')
  })

  it('strips -ed with e-restoration', () => {
    expect(lemmatize('loved')).toContain('love')
    expect(lemmatize('stopped')).toContain('stop')
  })

  it('strips -ing with base forms', () => {
    expect(lemmatize('making')).toContain('make')
    expect(lemmatize('running')).toContain('run')
    expect(lemmatize('falling')).toContain('fall')
  })

  it('always includes the original word first', () => {
    expect(lemmatize('love')[0]).toBe('love')
    expect(lemmatize('ran')[0]).toBe('ran')
  })

  it('is case-insensitive', () => {
    expect(lemmatize('RAN')).toContain('run')
  })

  it('returns empty for empty input', () => {
    expect(lemmatize('')).toEqual([])
  })

  it('does not strip -ss or -us words', () => {
    const c = lemmatize('class')
    expect(c).not.toContain('clas')
    expect(lemmatize('campus')).not.toContain('campu')
  })
})

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('love', 'love')).toBe(0)
  })

  it('computes single-character edits', () => {
    expect(editDistance('love', 'lov')).toBe(1)
    expect(editDistance('love', 'lovd')).toBe(1)
    expect(editDistance('love', 'loave')).toBe(1)
  })

  it('computes multi-character edits', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('flaw', 'lawn')).toBe(2)
  })

  it('early-exits for very different lengths', () => {
    expect(editDistance('a', 'abcdefgh')).toBeGreaterThan(2)
  })

  it('is symmetric', () => {
    expect(editDistance('abc', 'abd')).toBe(editDistance('abd', 'abc'))
  })
})
