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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
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
