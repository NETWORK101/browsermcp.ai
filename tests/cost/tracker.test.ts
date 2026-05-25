import { describe, it, expect, afterEach } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { UsageTracker } from '../../src/cost/tracker.js';
import { randomBytes } from 'crypto';

let dbPath: string;
let tracker: UsageTracker;

function tmpDb(): string {
  return `/tmp/headlessdev-test-${Date.now()}-${randomBytes(4).toString('hex')}.db`;
}

afterEach(() => {
  tracker?.close();
  if (dbPath && existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
});

describe('UsageTracker', () => {
  it('record() persists data — todayUsage shows sessions=1', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);

    tracker.record('browse', 100, 500, 'https://example.com');

    const result = tracker.todayUsage();
    expect(result.sessions).toBe(1);
    expect(result.tokens).toBe(100);
  });

  it('todayUsage() returns correct counts after multiple records', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);

    tracker.record('browse', 200, 300, 'https://example.com');
    tracker.record('extract', 400, 600, 'https://other.com');
    tracker.record('screenshot', 50, 100);

    const result = tracker.todayUsage();
    expect(result.sessions).toBe(3);
    expect(result.tokens).toBe(650);
    // 650/1_000_000 * 3 = 0.00195, toFixed(4) rounds to $0.0019 or $0.0020 depending on JS engine
    expect(result.estimatedCost).toMatch(/^\$0\.001[59]|^\$0\.0020/);
  });

  it('usage(7) returns weekly summary', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);

    tracker.record('browse', 1000, 500);
    tracker.record('extract', 2000, 800);

    const result = tracker.usage(7);
    expect(result.sessions).toBe(2);
    expect(result.tokens).toBe(3000);
    expect(result.estimatedCost).toMatch(/^\$/);
  });

  it('DB auto-creates on first use and starts with empty usage', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);

    expect(existsSync(dbPath)).toBe(true);

    const result = tracker.todayUsage();
    expect(result.sessions).toBe(0);
    expect(result.tokens).toBe(0);
    expect(result.estimatedCost).toBe('$0.0000');
  });

  it('estimatedCost is correctly calculated', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);

    // 1,000,000 tokens => $3.0000
    tracker.record('browse', 1_000_000, 1000);

    const result = tracker.todayUsage();
    expect(result.estimatedCost).toBe('$3.0000');
  });
});
