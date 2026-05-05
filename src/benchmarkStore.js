/**
 * Benchmark Store
 * Persists request metadata (model, latency, tok/s) to SQLite.
 */

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'data', 'benchmarks.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id TEXT NOT NULL,
        provider TEXT,
        task_type TEXT,
        latency_ms INTEGER,
        tokens INTEGER,
        toks_per_sec REAL,
        timestamp TEXT
      );
    `);
  }
  return db;
}

/**
 * Record a completed request's benchmark data.
 * @param {object} meta
 */
function record(meta) {
  try {
    const toks_per_sec = meta.tokens && meta.latency_ms
      ? parseFloat(((meta.tokens / meta.latency_ms) * 1000).toFixed(2))
      : null;

    getDb().prepare(`
      INSERT INTO requests (model_id, provider, task_type, latency_ms, tokens, toks_per_sec, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      meta.model_id, meta.provider, meta.task_type,
      meta.latency_ms, meta.tokens, toks_per_sec, meta.timestamp
    );
  } catch (err) {
    console.warn('[benchmarkStore] Failed to record:', err.message);
  }
}

/**
 * Retrieve recent requests.
 * @param {number} limit
 */
function recent(limit = 20) {
  try {
    return getDb().prepare(
      'SELECT * FROM requests ORDER BY id DESC LIMIT ?'
    ).all(limit);
  } catch {
    return [];
  }
}

/**
 * Average tok/s per model
 */
function averagesByModel() {
  try {
    return getDb().prepare(`
      SELECT model_id, AVG(toks_per_sec) as avg_toks_sec, COUNT(*) as request_count
      FROM requests WHERE toks_per_sec IS NOT NULL
      GROUP BY model_id ORDER BY avg_toks_sec DESC
    `).all();
  } catch {
    return [];
  }
}

module.exports = { record, recent, averagesByModel };
