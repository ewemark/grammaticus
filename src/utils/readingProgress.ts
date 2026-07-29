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
  const nowRead: boolean = !set.has(key)
  if (nowRead) {
    set.add(key)
    import('../api/userData').then(m => m.markRead(key).catch(() => {}))
  } else {
    set.delete(key)
    import('../api/userData').then(m => m.unmarkRead(key).catch(() => {}))
  }
  localStorage.setItem(KEY, JSON.stringify([...set]))
  return nowRead
}
