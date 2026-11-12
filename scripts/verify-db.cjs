// Quick DB verification script
const db = require('better-sqlite3')('data/grammaticus.db', { readonly: true })
for (const w of ['abolish', 'transmit', 'transplant', 'ubiquitous', 'apparatus', 'submit']) {
  const row = db.prepare('SELECT word, meaning, pos FROM words WHERE word = ?').get(w)
  if (row) console.log(`${row.word} [${row.pos}]: ${(row.meaning || '(EMPTY)').slice(0, 50)}`)
  else console.log(`${w}: NOT FOUND`)
}
const emptyCount = db.prepare("SELECT COUNT(*) as c FROM words WHERE meaning = '' OR meaning IS NULL").get()
const otherCount = db.prepare("SELECT COUNT(*) as c FROM words WHERE pos = 'OTHER' OR pos = ''").get()
const total = db.prepare('SELECT COUNT(*) as c FROM words').get()
const richTotal = db.prepare('SELECT COUNT(*) as c FROM rich_words').get()
console.log('--- totals ---')
console.log('words total:', total.c, '| empty meaning:', emptyCount.c, '| bad pos:', otherCount.c, '| rich:', richTotal.c)
