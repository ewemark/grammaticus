/** 词形变化 */
export interface WordForm {
  form: string
  pos: string
  note: string
}

/** 语义辐射半径 */
export interface SemanticRadius {
  label: string
  structure: string
  meaning: string
  example: string
}

/** 深度例句诊断 */
export interface ExampleDiagnosis {
  example: string
  diagnosis: string
}

/** 近义词对比 */
export interface SynonymComparison {
  word: string
  difference: string
  example: string
}

/** 富文本单词数据结构 */
export interface RichWordData {
  word: string
  pronunciation: string
  pos: string
  posNote: string
  forms: WordForm[]
  coreImage: string
  atomicCore: string
  semanticRadii: SemanticRadius[]
  grammarRules: string
  exampleDiagnoses: ExampleDiagnosis[]
  synonymComparisons: SynonymComparison[]
  oneLinePenetration: string
}
