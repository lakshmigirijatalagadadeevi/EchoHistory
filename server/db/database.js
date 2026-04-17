import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "echohistory.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS saved_articles (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    source TEXT,
    published_at TEXT,
    news_url TEXT,
    ai_event TEXT,
    ai_year TEXT,
    ai_category TEXT,
    ai_explanation TEXT,
    saved_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_saved_device
    ON saved_articles(device_id);

  CREATE TABLE IF NOT EXISTS ai_cache (
    headline_hash TEXT PRIMARY KEY,
    event TEXT,
    year TEXT,
    category TEXT,
    explanation TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
