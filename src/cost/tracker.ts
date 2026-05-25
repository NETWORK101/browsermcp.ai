import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class UsageTracker {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const dir = join(homedir(), '.headlessdev');
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

  close(): void {
    this.db.close();
  }
}
