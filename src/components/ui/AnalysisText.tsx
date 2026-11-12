import { useState, type ReactNode } from 'react'

/**
 * AnalysisText — 把 AI 语法/介词分析的纯文本输出渲染成结构化排版
 *
 * 两种模式:
 * 1. 线性模式(默认):逐行结构化渲染 — 用于笔记/诊断报告等静态展示
 * 2. 折叠模式(collapsible):解析成"意群块",默认收起为一行骨架,点击展开 —
 *    用于句子研习窗。流式生成时(streaming)自动展开最后一个块跟随阅读,
 *    结束后全部收起呈现目录。
 *
 * 识别的行模式:
 * - "中文翻译…"           → 翻译强调块
 * - "第X部分:…"          → 区块大标题(分隔线)
 * - "①②③…"开头的行       → 意群编号块
 * - "介词 X:"             → 介词块标题
 * - "1. 2. 3. …"         → 步骤行(标签加粗)
 * - "判断从句类型…"        → 高亮提示块
 * - 其余                  → 普通段落
 */

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮']

type LineKind = 'section' | 'translation' | 'numbered' | 'prepHeading' | 'step' | 'clauseType' | 'plain' | 'blank'

interface LineStyle {
  kind: LineKind
  content: string
  /** for step lines: bold label before ":" */
  label?: string
}

function classifyLine(raw: string): LineStyle {
  const line = raw.trim()
  if (!line) return { kind: 'blank', content: '' }
  if (/^第[一二三四五六七八九十1-9]+部分/.test(line)) return { kind: 'section', content: line }
  if (/^【[^】]{1,12}】/.test(line)) return { kind: 'section', content: line }
  if (/^中文翻译/.test(line)) return { kind: 'translation', content: line }
  if (/^判断从句类型/.test(line)) return { kind: 'clauseType', content: line }
  if (CIRCLED.some((c) => line.startsWith(c))) return { kind: 'numbered', content: line }
  if (/^(#{1,4}\s*)?介词\s*[a-zA-Z'’]+\s*[:：]/.test(line)) {
    return { kind: 'prepHeading', content: line.replace(/^#{1,4}\s*/, '') }
  }
  const stepMatch = line.match(/^(\d+)\.\s*([^:：]{1,12})[:：]\s*(.*)$/)
  if (stepMatch) return { kind: 'step', content: stepMatch[3], label: `${stepMatch[1]}. ${stepMatch[2]}` }
  return { kind: 'plain', content: line }
}

/* ── 块解析(折叠模式用) ────────────────────────────────── */

export interface AnalysisBlock {
  id: string
  heading: string
  body: LineStyle[]
  kind: 'numbered' | 'prep'
}

export interface ParsedAnalysis {
  /** 块之前的常显内容(翻译、介词清单、部分标题) */
  preamble: LineStyle[]
  blocks: AnalysisBlock[]
  /** 块之间穿插的 section 行(作为独立元素渲染) */
  sections: { afterBlockId: string | null; line: LineStyle }[]
}

export function parseAnalysisBlocks(text: string): ParsedAnalysis {
  const lines = text.split('\n').map(classifyLine)
  const preamble: LineStyle[] = []
  const blocks: AnalysisBlock[] = []
  const sections: ParsedAnalysis['sections'] = []
  let current: AnalysisBlock | null = null
  let blockSeq = 0

  for (const l of lines) {
    if (l.kind === 'numbered' || l.kind === 'prepHeading') {
      // heading = 编号行去掉长内容 / 介词标题行
      const heading = l.kind === 'prepHeading'
        ? l.content
        : (() => {
            const mark = l.content[0]
            const rest = l.content.slice(1).trim()
            const brief = rest.split(/[。;；\n]/)[0]
            return `${mark} ${brief.length > 22 ? brief.slice(0, 22) + '…' : brief}`
          })()
      current = { id: `blk-${blockSeq++}`, heading, body: [], kind: l.kind === 'prepHeading' ? 'prep' : 'numbered' }
      blocks.push(current)
      // numbered 行的完整内容作为 body 第一行
      if (l.kind === 'numbered') current.body.push(l)
    } else if (l.kind === 'section') {
      sections.push({ afterBlockId: current?.id ?? null, line: l })
      current = null
    } else if (l.kind === 'blank') {
      // ignore in block mode
    } else if (current) {
      current.body.push(l)
    } else {
      preamble.push(l)
    }
  }
  return { preamble, blocks, sections }
}

/** 块 DOM 锚点 id(快速跳转用) */
export function blockAnchorId(blockId: string): string {
  return `analysis-${blockId}`
}

/* ── 行渲染(两种模式共用) ──────────────────────────────── */

function renderLine(l: LineStyle, key: number, base: React.CSSProperties): ReactNode {
  switch (l.kind) {
    case 'blank':
      return <div key={key} style={{ height: base.fontSize ? Number(base.fontSize) * 0.4 : 6 }} />
    case 'section':
      return (
        <h4 key={key} style={{
          ...base, fontFamily: 'var(--font-display)', fontWeight: 700,
          letterSpacing: 'var(--tracking-micro)', color: 'var(--color-text)',
          margin: `${(base.fontSize as number) * 0.8}px 0 4px`, paddingBottom: 4,
          borderBottom: '1px solid var(--color-border)', fontSize: (base.fontSize as number) + 1,
        }}>
          {l.content}
        </h4>
      )
    case 'translation':
      return (
        <div key={key} style={{
          ...base, color: 'var(--color-text)', background: 'var(--color-canvas-soft)',
          borderLeft: '3px solid var(--color-text)', padding: '6px 12px',
          borderRadius: '0 var(--radius-xs) var(--radius-xs) 0', margin: '4px 0',
        }}>
          {l.content}
        </div>
      )
    case 'clauseType':
      return (
        <div key={key} style={{
          ...base, color: 'var(--color-doc-info)', fontWeight: 600,
          padding: '4px 8px', margin: '3px 0',
          background: 'color-mix(in srgb, var(--color-doc-info) 8%, transparent)',
          borderRadius: 'var(--radius-xs)',
        }}>
          {l.content}
        </div>
      )
    case 'numbered': {
      const mark = l.content[0]
      const rest = l.content.slice(1).trim()
      return (
        <div key={key} style={{ ...base, display: 'flex', gap: 8, margin: '4px 0' }}>
          <span style={{
            flexShrink: 0, width: (base.fontSize as number) + 6, height: (base.fontSize as number) + 6,
            borderRadius: '50%', border: '1px solid var(--color-border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: (base.fontSize as number) - 3, color: 'var(--color-text)', fontWeight: 700,
            marginTop: 2,
          }}>
            {mark}
          </span>
          <span style={{ color: 'var(--color-text-soft)', flex: 1 }}>{rest}</span>
        </div>
      )
    }
    case 'prepHeading':
      return (
        <h5 key={key} style={{
          ...base, fontFamily: 'var(--font-display)', fontWeight: 700,
          color: 'var(--color-doc-accent)', margin: '8px 0 3px',
          letterSpacing: 'var(--tracking-micro)',
        }}>
          {l.content}
        </h5>
      )
    case 'step':
      return (
        <div key={key} style={{ ...base, margin: '2px 0', color: 'var(--color-text-soft)', paddingLeft: 6 }}>
          <strong style={{ color: 'var(--color-text)', fontWeight: 700 }}>{l.label}: </strong>
          {l.content}
        </div>
      )
    default:
      return (
        <p key={key} style={{ ...base, margin: '2px 0', color: 'var(--color-text-soft)' }}>
          {l.content}
        </p>
      )
  }
}

/* ── 组件 ─────────────────────────────────────────────────── */

interface Props {
  text: string
  fontSize?: number
  /** 折叠块模式(句子研习窗) */
  collapsible?: boolean
  /** 流式生成中:自动展开最后一个块跟随阅读 */
  streaming?: boolean
}

export default function AnalysisText({ text, fontSize = 15, collapsible = false, streaming = false }: Props) {
  const base: React.CSSProperties = { fontSize, lineHeight: 1.65 }
  // 用户手动展开/收起的块(覆盖默认策略)
  const [manual, setManual] = useState<Map<string, boolean>>(() => new Map())

  if (!collapsible) {
    const lines = text.split('\n').map(classifyLine)
    return <div>{lines.map((l, i) => renderLine(l, i, base))}</div>
  }

  const { preamble, blocks, sections } = parseAnalysisBlocks(text)

  const isOpen = (b: AnalysisBlock, idx: number): boolean => {
    const m = manual.get(b.id)
    if (m !== undefined) return m
    // 默认策略:流式中展开最后一块;结束后全部收起
    return streaming && idx === blocks.length - 1
  }

  const toggle = (id: string, now: boolean) => {
    setManual((prev) => new Map(prev).set(id, !now))
  }

  const allOpen = blocks.length > 0 && blocks.every((b, i) => isOpen(b, i))
  const setAll = (open: boolean) => {
    setManual(new Map(blocks.map((b) => [b.id, open])))
  }

  // section 行按位置插回渲染流
  const sectionsBefore = sections.filter((s) => s.afterBlockId === null)
  const sectionsAfter = (id: string) => sections.filter((s) => s.afterBlockId === id)

  return (
    <div>
      {/* 常显区:翻译等 */}
      {preamble.map((l, i) => renderLine(l, i, base))}
      {sectionsBefore.map((s, i) => renderLine(s.line, 1000 + i, base))}

      {/* 控制行 */}
      {blocks.length > 1 && !streaming && (
        <div style={{ display: 'flex', gap: 8, margin: '6px 0' }}>
          <button
            onClick={() => setAll(true)}
            style={{ ...linkBtnStyle, opacity: allOpen ? 0.4 : 1 }}
            disabled={allOpen}
          >
            全部展开
          </button>
          <button
            onClick={() => setAll(false)}
            style={{ ...linkBtnStyle, opacity: allOpen ? 1 : 0.4 }}
            disabled={!allOpen}
          >
            全部收起
          </button>
        </div>
      )}

      {/* 折叠块 */}
      {blocks.map((b, idx) => {
        const open = isOpen(b, idx)
        return (
          <div key={b.id}>
            <div id={blockAnchorId(b.id)} style={{ scrollMarginTop: 8 }}>
              <button
                onClick={() => toggle(b.id, open)}
                aria-expanded={open}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 8, width: '100%',
                  padding: '5px 8px', margin: '2px 0', boxSizing: 'border-box',
                  background: open ? 'var(--color-canvas-soft)' : 'transparent',
                  border: '1px solid', 
                  borderColor: open ? 'var(--color-border)' : 'transparent',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: b.kind === 'prep' ? 'var(--font-display)' : 'var(--font-body)',
                  fontSize: b.kind === 'prep' ? fontSize - 1 : fontSize,
                  fontWeight: 700,
                  color: b.kind === 'prep' ? 'var(--color-doc-accent)' : 'var(--color-text)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: fontSize - 4, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                  {open ? '▾' : '▸'}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.heading}
                </span>
              </button>
              {open && (
                <div style={{ padding: '4px 8px 6px', borderLeft: '2px solid var(--color-border)', marginLeft: 10 }}>
                  {b.body.map((l, i) => renderLine(l, i, base))}
                </div>
              )}
            </div>
            {sectionsAfter(b.id).map((s, i) => renderLine(s.line, 2000 + idx * 10 + i, base))}
          </div>
        )
      })}
    </div>
  )
}

const linkBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-micro)',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 0',
}
