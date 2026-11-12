import { describe, it, expect } from 'vitest'
import { analyzeGrammar, analyzePreposition } from './analyze'

describe('analyzeGrammar (local fallback)', () => {
  it('counts words and echoes the sentence', () => {
    const out = analyzeGrammar('The cat sat')
    expect(out).toContain('句子: "The cat sat"')
    expect(out).toContain('单词数: 3')
  })

  it('detects articles, prepositions and pronouns', () => {
    const out = analyzeGrammar('She sat on the mat')
    expect(out).toContain('She: 代词')
    expect(out).toContain('on: 介词')
    expect(out).toContain('the: 冠词')
  })

  it('detects suffix patterns (-ing, -ed, -ly, -tion)', () => {
    const out = analyzeGrammar('running walked quickly education')
    expect(out).toContain('running: 可能为动词进行时/动名词 (ing 结尾)')
    expect(out).toContain('walked: 可能为动词过去式/过去分词 (ed 结尾)')
    expect(out).toContain('quickly: 可能为副词 (ly 结尾)')
    expect(out).toContain('education: 可能为名词 (tion/sion 结尾)')
  })

  it('does not flag "eed" words as past tense', () => {
    const out = analyzeGrammar('agreed')
    expect(out).not.toContain('ed 结尾')
  })

  it('strips punctuation before matching', () => {
    const out = analyzeGrammar('Wow! Really?')
    // analysis lines use the cleaned token, not the punctuated one
    expect(out).toContain('Wow: ')
    expect(out).not.toContain('Wow!: ')
    expect(out).toContain('Really: 可能为副词 (ly 结尾)')
  })

  it('marks unknown words', () => {
    const out = analyzeGrammar('flibbertigibbet')
    expect(out).toContain('未知词性')
  })
})

describe('analyzePreposition (local fallback)', () => {
  it('finds prepositions with meanings', () => {
    const out = analyzePreposition('The book on the table in the room')
    expect(out).toContain('检测到 2 个介词')
    expect(out).toContain('on: 在…上面')
    expect(out).toContain('in: 在…里面')
  })

  it('reports when no preposition found', () => {
    const out = analyzePreposition('Dogs run fast')
    expect(out).toContain('未检测到介词')
  })

  it('handles punctuation attached to prepositions', () => {
    const out = analyzePreposition('Where are you from?')
    expect(out).toContain('from: 从')
  })
})
