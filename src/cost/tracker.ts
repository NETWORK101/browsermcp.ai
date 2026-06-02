import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class UsageTracker {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const dir = join(homedir(), '.browsermcp');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const path = dbPath ?? join(dir, 'usage.db');
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (datetime('now')),
        tool TEXT NOT NULL,
        url TEXT,
        tokens_in INTEGER DEFAULT 0,
        tokens_out INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        url TEXT PRIMARY KEY,
        markdown TEXT NOT NULL,
        token_count INTEGER NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }

  record(tool: string, tokensOut: number, durationMs: number, url?: string): void {
    this.db.prepare(
      'INSERT INTO usage (tool, url, tokens_out, duration_ms) VALUES (?, ?, ?, ?)'
    ).run(tool, url ?? null, tokensOut, durationMs);
  }

  todayUsage(): { sessions: number; tokens: number; estimatedCost: string } {
    const row = this.db.prepare(
      "SELECT COUNT(*) as sessions, COALESCE(SUM(tokens_out), 0) as tokens FROM usage WHERE date(timestamp) = date('now')"
    ).get() as any;
    // Estimate cost at ~$3 per 1M output tokens (Claude Sonnet ballpark)
    const cost = (row.tokens / 1_000_000) * 3;
    return {
      sessions: row.sessions,
      tokens: row.tokens,
      estimatedCost: `$${cost.toFixed(4)}`
    };
  }

  usage(days: number = 7): { sessions: number; tokens: number; estimatedCost: string } {
    const row = this.db.prepare(
      `SELECT COUNT(*) as sessions, COALESCE(SUM(tokens_out), 0) as tokens FROM usage WHERE timestamp >= datetime('now', '-${days} days')`
    ).get() as any;
    const cost = (row.tokens / 1_000_000) * 3;
    return {
      sessions: row.sessions,
      tokens: row.tokens,
      estimatedCost: `$${cost.toFixed(4)}`
    };
  }

  getSnapshot(url: string): { markdown: string; tokenCount: number; updatedAt: string } | null {
    const row = this.db.prepare(
      'SELECT markdown, token_count as tokenCount, updated_at as updatedAt FROM snapshots WHERE url = ?'
    ).get(url) as any;
    return row ?? null;
  }

  saveSnapshot(url: string, markdown: string, tokenCount: number): void {
    this.db.prepare(
      'INSERT INTO snapshots (url, markdown, token_count, updated_at) VALUES (?, ?, ?, datetime(\'now\')) ON CONFLICT(url) DO UPDATE SET markdown = excluded.markdown, token_count = excluded.token_count, updated_at = datetime(\'now\')'
    ).run(url, markdown, tokenCount);
  }

  close(): void {
    this.db.close();
  }
}
