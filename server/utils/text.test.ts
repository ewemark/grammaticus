import { describe, it, expect } from 'vitest'
import { cleanMarkdown, isTrustedAudioUrl, sanitizeHeader } from './text.js'

describe('cleanMarkdown', () => {
  it('strips headings', () => {
    expect(cleanMarkdown('### 标题\n内容')).toBe('标题\n内容')
  })

  it('strips bold and italic markers', () => {
    expect(cleanMarkdown('这是**加粗**和*斜体*')).toBe('这是加粗和斜体')
  })

  it('strips list bullets', () => {
    expect(cleanMarkdown('- 第一项\n- 第二项')).toBe('第一项\n第二项')
  })

  it('strips horizontal rules and collapses blank lines', () => {
    expect(cleanMarkdown('a\n\n---\n\n\nb')).toBe('a\n\nb')
  })

  it('strips inline code and strikethrough', () => {
    expect(cleanMarkdown('用 `code` 和 ~~删除~~')).toBe('用 code 和 删除')
  })

  it('keeps plain text unchanged', () => {
    expect(cleanMarkdown('纯文本没有格式')).toBe('纯文本没有格式')
  })
})

describe('isTrustedAudioUrl', () => {
  it('accepts https URLs on trusted hosts', () => {
    expect(isTrustedAudioUrl('https://audio.oxforddictionaries.com/en/mp3/love_us_1.mp3')).toBe(true)
    expect(isTrustedAudioUrl('https://api.dictionaryapi.dev/media/pronunciations/en/love-us.mp3')).toBe(true)
  })

  it('accepts the bare trusted domain', () => {
    expect(isTrustedAudioUrl('https://dictionaryapi.dev/x.mp3')).toBe(true)
  })

  it('rejects http (non-TLS)', () => {
    expect(isTrustedAudioUrl('http://audio.oxforddictionaries.com/x.mp3')).toBe(false)
  })

  it('rejects untrusted hosts', () => {
    expect(isTrustedAudioUrl('https://evil.example.com/x.mp3')).toBe(false)
  })

  it('rejects lookalike domains (suffix spoofing)', () => {
    expect(isTrustedAudioUrl('https://notdictionaryapi.dev.evil.com/x.mp3')).toBe(false)
    expect(isTrustedAudioUrl('https://evildictionaryapi.dev/x.mp3')).toBe(false)
  })

  it('rejects malformed URLs and empty input', () => {
    expect(isTrustedAudioUrl('not a url')).toBe(false)
    expect(isTrustedAudioUrl('')).toBe(false)
    expect(isTrustedAudioUrl(undefined)).toBe(false)
  })

  it('rejects javascript: URLs', () => {
    expect(isTrustedAudioUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('sanitizeHeader', () => {
  it('removes CRLF injection sequences', () => {
    expect(sanitizeHeader('evil\r\nBcc: victim@x.com')).toBe('evil Bcc: victim@x.com')
  })

  it('collapses multiple newlines into one space', () => {
    expect(sanitizeHeader('a\r\n\n\nb')).toBe('a b')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeHeader('  hello  ')).toBe('hello')
  })

  it('keeps normal text unchanged', () => {
    expect(sanitizeHeader('张三')).toBe('张三')
  })
})
