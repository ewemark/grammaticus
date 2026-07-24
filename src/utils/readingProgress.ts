const KEY = 'grammaticus-read-articles'

export function getReadArticles(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]')
    return new Set(arr)
  } catch { return new Set() }
}

export function isRead(id: number | string): boolean {
  return getReadArticles().has(String(id))
}

export function toggleRead(id: number | string): boolean {
  const set = getReadArticles()
  const key = String(id)
  if (set.has(key)) set.delete(key)
  else set.add(key)
  localStorage.setItem(KEY, JSON.stringify([...set]))
  return set.has(key)
}
