/**
 * Shared LLM caller — used by analyze and context routes.
 */

interface LLMOptions {
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Read LLM config from environment */
export function getLLMConfig(): LLMConfig | null {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  }
}

/** Call the LLM and return the response text. Returns null if config missing or call fails. */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options?: LLMOptions,
): Promise<string | null> {
  return callLLMMessages(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    options,
  )
}

/** Multi-message variant (used by streaming chat) */
export async function callLLMMessages(
  messages: ChatMessage[],
  options?: LLMOptions,
): Promise<string | null> {
  const config = getLLMConfig()
  if (!config) return null

  const { temperature = 0.3, maxTokens = 2000, timeout = 30000 } = options || {}

  try {
    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(timeout),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
      console.error(`[LLM] HTTP ${resp.status}: ${errText.slice(0, 200)}`)
      return null
    }

    const data = await resp.json() as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[LLM] Request failed:', (err as Error).message)
    return null
  }
}

/**
 * Streaming call — invokes onChunk for each text delta.
 * Returns the full accumulated text, or null if unavailable/failed.
 */
export async function callLLMStream(
  messages: ChatMessage[],
  onChunk: (delta: string) => void,
  options?: LLMOptions,
): Promise<string | null> {
  const config = getLLMConfig()
  if (!config) return null

  const { temperature = 0.3, maxTokens = 2000, timeout = 120000 } = options || {}

  try {
    const resp = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(timeout),
    })

    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => '')
      console.error(`[LLM stream] HTTP ${resp.status}: ${errText.slice(0, 200)}`)
      return null
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            full += delta
            onChunk(delta)
          }
        } catch {
          // incomplete JSON line — skip
        }
      }
    }
    return full || null
  } catch (err) {
    console.error('[LLM stream] Request failed:', (err as Error).message)
    return null
  }
}
