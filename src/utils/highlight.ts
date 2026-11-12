/**
 * 原文高亮定位 — 把用户选中的文字精确定位回 content 的字符区间
 *
 * 选区 toString 与原文可能存在空白差异(渲染时 <br>/段落边界),
 * 因此先尝试直接 indexOf,失败后用"空白归一化 + 索引映射"匹配。
 */

export type HighlightRange = [start: number, end: number]

/**
 * 在 content 中定位 selection,返回 [start, end) 字符区间;找不到返回 null。
 */
export function findHighlightRange(content: string, selection: string): HighlightRange | null {
  const sel = selection.trim()
  if (!content || !sel) return null

  // 快速路径:原文直接命中
  const direct = content.indexOf(sel)
  if (direct >= 0) return [direct, direct + sel.length]

  // 归一化匹配:把连续空白折叠为单个空格,同时记录每个归一化字符对应的原文索引
  const normChars: string[] = []
  const indexMap: number[] = []
  let lastWasSpace = false
  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (/\s/.test(c)) {
      if (!lastWasSpace && normChars.length > 0) {
        normChars.push(' ')
        indexMap.push(i)
        lastWasSpace = true
      }
    } else {
      normChars.push(c)
      indexMap.push(i)
      lastWasSpace = false
    }
  }
  const normContent = normChars.join('')
  const normSel = sel.replace(/\s+/g, ' ')
  const idx = normContent.indexOf(normSel)
  if (idx < 0) return null

  const start = indexMap[idx]
  const endIdx = idx + normSel.length - 1
  const end = (indexMap[endIdx] ?? start) + 1
  return [start, end]
}

/** 区间 [tokStart, tokEnd) 与高亮区间是否有交集 */
export function overlaps(tokStart: number, tokEnd: number, hl: HighlightRange): boolean {
  return tokStart < hl[1] && tokEnd > hl[0]
}
