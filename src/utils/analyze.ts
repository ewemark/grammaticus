import { request, BASE_URL } from '../api/client'

/* ── API-based grammar analysis ───────────────────────────── */

export async function analyzeGrammarAPI(sentence: string): Promise<string> {
  const { result } = await request<{ result: string }>('/analyze/grammar', {
    method: 'POST',
    body: JSON.stringify({ sentence }),
    headers: { 'Content-Type': 'application/json' },
  })
  return result
}

export async function analyzePrepositionAPI(sentence: string): Promise<string> {
  const { result } = await request<{ result: string }>('/analyze/preposition', {
    method: 'POST',
    body: JSON.stringify({ sentence }),
    headers: { 'Content-Type': 'application/json' },
  })
  return result
}

/* ── Streaming (SSE) analysis ─────────────────────────────── */

export interface StreamHandle {
  /** 终止本次流式请求 */
  abort: () => void
  /** 等待完成,返回最终文本 */
  done: Promise<string>
}

/** 读取 SSE 流,每收到一段调用 onDelta;返回最终完整文本(通用,供各流式接口复用) */
export async function readSSE(
  endpoint: string,
  body: unknown,
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const token = localStorage.getItem('grammaticus_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let finalText = ''
  let streamError = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''
    for (const evt of events) {
      let name = 'message'
      let data = ''
      for (const line of evt.split('\n')) {
        if (line.startsWith('event:')) name = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue
      let parsed: { text?: string; full?: string; error?: string }
      try { parsed = JSON.parse(data) } catch { continue }
      if (name === 'delta' && parsed.text) {
        full += parsed.text
        onDelta(parsed.text)
      } else if (name === 'done' && parsed.full) {
        finalText = parsed.full
      } else if (name === 'fallback' && parsed.text) {
        finalText = parsed.text
      } else if (name === 'error') {
        streamError = parsed.error || 'AI 分析失败'
      }
    }
  }

  if (streamError) throw new Error(streamError)
  return finalText || full
}

/** 流式语法分析 */
export function analyzeGrammarStream(sentence: string, onDelta: (t: string) => void): StreamHandle {
  const ctrl = new AbortController()
  return {
    abort: () => ctrl.abort(),
    done: readSSE('/analyze/grammar/stream', { sentence }, onDelta, ctrl.signal),
  }
}

/** 流式介词分析 */
export function analyzePrepositionStream(sentence: string, onDelta: (t: string) => void): StreamHandle {
  const ctrl = new AbortController()
  return {
    abort: () => ctrl.abort(),
    done: readSSE('/analyze/preposition/stream', { sentence }, onDelta, ctrl.signal),
  }
}

/** 追问对话(流式) — AI 带着原句+此前分析+对话历史回答 */
export function chatAboutSentenceStream(
  data: {
    sentence: string
    analysis: string
    question: string
    mode: 'grammar' | 'preposition'
    history: { role: 'user' | 'assistant'; content: string }[]
  },
  onDelta: (t: string) => void,
): StreamHandle {
  const ctrl = new AbortController()
  return {
    abort: () => ctrl.abort(),
    done: readSSE('/analyze/chat/stream', data, onDelta, ctrl.signal),
  }
}

/* ── Local fallback analyzers ─────────────────────────────── */

export function analyzeGrammar(text: string): string {
  const words = text.split(/\s+/).filter(Boolean)
  const result: string[] = [`句子: "${text}"`, `单词数: ${words.length}`, '']
  for (const w of words) {
    const clean = w.replace(/[.,;:!?"']/g, '')
    const lower = clean.toLowerCase()
    const patterns: string[] = []
    if (/ly$/.test(clean)) patterns.push('可能为副词 (ly 结尾)')
    if (/ing$/.test(clean)) patterns.push('可能为动词进行时/动名词 (ing 结尾)')
    if (/ed$/.test(clean) && !/eed$/.test(clean)) patterns.push('可能为动词过去式/过去分词 (ed 结尾)')
    if (/tion$/.test(clean) || /sion$/.test(clean)) patterns.push('可能为名词 (tion/sion 结尾)')
    if (/ment$/.test(clean)) patterns.push('可能为名词 (ment 结尾)')
    if (/ness$/.test(clean)) patterns.push('可能为名词 (ness 结尾)')
    if (/ous$/.test(clean)) patterns.push('可能为形容词 (ous 结尾)')
    if (/ful$/.test(clean)) patterns.push('可能为形容词 (ful 结尾)')
    if (/able$/.test(clean) || /ible$/.test(clean)) patterns.push('可能为形容词 (able/ible 结尾)')
    if (/^un/.test(clean) && clean.length > 3) patterns.push('可能带否定前缀 un-')
    if (/^re/.test(clean) && clean.length > 3) patterns.push('可能带重复前缀 re-')
    if (['the', 'a', 'an'].includes(lower)) patterns.push('冠词')
    if (['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'of', 'about'].includes(lower)) patterns.push('介词')
    if (['and', 'but', 'or', 'so', 'because', 'although', 'if', 'when', 'while'].includes(lower)) patterns.push('连词')
    if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'].includes(lower)) patterns.push('代词')
    if (patterns.length > 0) {
      result.push(`${clean}: ${patterns.join('、')}`)
    } else {
      result.push(`${clean}: 未知词性，可在词库中查找`)
    }
  }
  return result.join('\n')
}

export function analyzePreposition(text: string): string {
  const preps: Record<string, string> = {
    in: '在…里面 / 在…期间 / 以…方式', on: '在…上面 / 关于 / 在…时候',
    at: '在（具体地点/时间点）/ 向 / 以', to: '向、到、对 / 不定式标记',
    for: '为了 / 因为 / 对于 / 支持', with: '和、跟 / 用 / 带有 / 由于',
    from: '从 / 来自 / 由于 / 防止', by: '被 / 通过 / 在…旁边 / 不迟于',
    of: '…的 / 关于 / 来自', about: '关于 / 大约 / 在…周围',
    into: '进入…里面 / 变成', through: '穿过 / 通过 / 由于',
    during: '在…期间', before: '在…之前', after: '在…之后',
    above: '在…上方 / 超过', below: '在…下方 / 低于',
    between: '在…之间（两者）', among: '在…之中（三者以上）',
    against: '反对 / 靠着 / 以…为背景', within: '在…之内',
    without: '没有 / 在…外面', under: '在…下面 / 少于 / 根据',
    over: '在…上方 / 超过 / 关于', behind: '在…后面 / 落后于',
    beyond: '超出 / 在…另一边', toward: '朝向 / 对于',
    upon: '在…之上（正式）/ 一…就',
  }
  const words = text.split(/\s+/).filter(Boolean)
  const found: string[] = []
  for (const w of words) {
    const clean = w.replace(/[.,;:!?"']/g, '').toLowerCase()
    if (preps[clean]) found.push(`${clean}: ${preps[clean]}`)
  }
  if (found.length === 0) return `句子中未检测到介词。\n\n常见介词: in, on, at, to, for, with, from, by, of, about 等。`
  return `检测到 ${found.length} 个介词:\n\n${found.join('\n\n')}`
}
