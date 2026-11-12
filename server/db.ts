import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '..', 'data', 'grammaticus.db')

const db = new Database(DB_PATH)

// Performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL COLLATE NOCASE,
    meaning TEXT NOT NULL,
    pos TEXT NOT NULL,
    example TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_words_pos ON words(pos);

  CREATE TABLE IF NOT EXISTS rich_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL COLLATE NOCASE,
    pronunciation TEXT NOT NULL DEFAULT '',
    pos TEXT NOT NULL,
    pos_note TEXT NOT NULL DEFAULT '',
    core_image TEXT NOT NULL DEFAULT '',
    atomic_core TEXT NOT NULL DEFAULT '',
    one_line_penetration TEXT NOT NULL DEFAULT '',
    forms TEXT NOT NULL DEFAULT '[]',
    semantic_radii TEXT NOT NULL DEFAULT '[]',
    grammar_rules TEXT NOT NULL DEFAULT '[]',
    example_diagnoses TEXT NOT NULL DEFAULT '[]',
    synonym_comparisons TEXT NOT NULL DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS idx_rich_words_word ON rich_words(word COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT NOT NULL,
    lesson INTEGER NOT NULL,
    title TEXT NOT NULL,
    title_cn TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'BEGINNER',
    UNIQUE(book, lesson)
  );

  CREATE INDEX IF NOT EXISTS idx_articles_book ON articles(book, lesson);

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    meaning TEXT NOT NULL DEFAULT '',
    pos TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, word),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reading_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, article_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    words TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, article_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    analysis TEXT NOT NULL DEFAULT '',
    source_word TEXT NOT NULL DEFAULT '',
    source_text TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, note_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, updated_at);

  CREATE TABLE IF NOT EXISTS dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word TEXT NOT NULL COLLATE NOCASE,
    meaning TEXT NOT NULL DEFAULT '',
    pos TEXT NOT NULL DEFAULT '',
    my_understanding TEXT NOT NULL DEFAULT '',
    ai_feedback TEXT NOT NULL DEFAULT '',
    my_example TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, word),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

/* ── Migrations ─────────────────────────────────────────────── */

// documents.user_id: per-user upload ownership (added after initial release)
const docCols = db.prepare(`PRAGMA table_info(documents)`).all() as { name: string }[]
if (!docCols.some((c) => c.name === 'user_id')) {
  db.exec(`ALTER TABLE documents ADD COLUMN user_id INTEGER REFERENCES users(id)`)
}

// notes.tags: topic tags for note discovery (added after initial release)
const noteCols = db.prepare(`PRAGMA table_info(notes)`).all() as { name: string }[]
if (!noteCols.some((c) => c.name === 'tags')) {
  db.exec(`ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'`)
}
if (!noteCols.some((c) => c.name === 'starred')) {
  db.exec(`ALTER TABLE notes ADD COLUMN starred INTEGER NOT NULL DEFAULT 0`)
}

export default db