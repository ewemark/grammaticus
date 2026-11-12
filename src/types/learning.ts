/**
 * 学习空间 — 共享类型契约
 * 详见 PRODUCT.md
 */

export type NoteType = 'text' | 'analysis' | 'word' | 'diagnosis' | 'reading' | 'sentence'

export interface Note {
  /** 前端生成的 uuid,云端同步去重用 */
  id: string
  type: NoteType
  title: string
  /** 我的想法 / 手写内容 */
  content: string
  /** sentence 类型:AI 分析结果 */
  analysis?: string
  /** 关联单词(word 类型) */
  sourceWord?: string
  /** sentence:原句;reading:摘录原文 */
  sourceText?: string
  /** 主题标签(自动提取 + 手动),用于资料归类查找 */
  tags?: string[]
  /** 星标 — 置顶显示 */
  starred?: boolean
  createdAt: number
  updatedAt: number
}

export interface DictionaryWord {
  word: string
  /** 词库释义(自动带出,可手动填) */
  meaning: string
  pos: string
  /** 我的理解 — 核心字段 */
  myUnderstanding: string
  /** AI 对"我的理解"的点评 */
  aiFeedback?: string
  /** 自造例句 */
  myExample?: string
  addedAt: number
  updatedAt: number
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  text: '手写笔记',
  analysis: 'AI 分析',
  word: '词卡摘录',
  reading: '阅读笔记',
  sentence: '句子库',
  diagnosis: '诊断报告',
}
