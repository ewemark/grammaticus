/**
 * Shared text utilities for server routes — pure functions, fully unit-tested.
 */

/** Strip markdown formatting from LLM output for plain-text display */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')              // headings: ### → ''
    .replace(/\*\*(.+?)\*\*/g, '$1')          // bold: **text** → text
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1') // italic: *text* → text
    .replace(/^[-*]\s+/gm, '')                // list: - item → item
    .replace(/^\s+[-*]\s+/gm, '')             // indented list:    * item → item
    .replace(/^---+\s*$/gm, '')               // horizontal rules: --- → ''
    .replace(/`(.+?)`/g, '$1')                // inline code
    .replace(/~~(.+?)~~/g, '$1')              // strikethrough
    .replace(/\n{3,}/g, '\n\n')               // collapse 3+ newlines
    .trim()
}

/** Allow only https URLs from known pronunciation CDNs (prevents media injection / open redirect) */
export function isTrustedAudioUrl(raw: string | undefined): raw is string {
  if (!raw) return false
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  const TRUSTED_HOST_SUFFIXES = [
    'dictionaryapi.dev',
    'oxforddictionaries.com',
    'oxfordlearnersdictionaries.com',
    'cambridge.org',
    'merriam-webster.com',
  ]
  return TRUSTED_HOST_SUFFIXES.some(
    (suffix) => u.hostname === suffix || u.hostname.endsWith('.' + suffix)
  )
}

/** Strip CR/LF from user-supplied strings used in email headers (prevents header injection) */
export function sanitizeHeader(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').trim()
}
