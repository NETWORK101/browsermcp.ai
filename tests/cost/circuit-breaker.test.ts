import { describe, it, expect, afterEach } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { UsageTracker } from '../../src/cost/tracker.js';
import { CircuitBreaker } from '../../src/cost/circuit-breaker.js';

let dbPath: string;
let tracker: UsageTracker;

function tmpDb(): string {
  return `/tmp/browsermcp-test-${Date.now()}-${randomBytes(4).toString('hex')}.db`;
}

afterEach(() => {
  tracker?.close();
  if (dbPath && existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  delete process.env.HEADLESSDEV_NO_LIMIT;
});

describe('CircuitBreaker', () => {
  it('under limits → allowed: true', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);
    const breaker = new CircuitBreaker(tracker, { maxSessionsPerDay: 100, maxTokensPerDay: 1_000_000 });

    tracker.record('browse', 100, 500);

    const result = breaker.check();
    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('over session limit → allowed: false with message', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);
    const breaker = new CircuitBreaker(tracker, { maxSessionsPerDay: 2, maxTokensPerDay: 1_000_000 });

    tracker.record('browse', 100, 500);
    tracker.record('browse', 100, 500);

    const result = breaker.check();
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Daily session limit reached');
    expect(result.message).toContain('2/2');
    expect(result.message).toContain('HEADLESSDEV_NO_LIMIT=1');
  });

  it('over token limit → allowed: false with message', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);
    const breaker = new CircuitBreaker(tracker, { maxSessionsPerDay: 100, maxTokensPerDay: 500 });

    tracker.record('browse', 600, 500);

    const result = breaker.check();
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Daily token limit reached');
    expect(result.message).toContain('600/500');
    expect(result.message).toContain('HEADLESSDEV_NO_LIMIT=1');
  });

  it('HEADLESSDEV_NO_LIMIT=1 → allowed: true even when over limit', () => {
    dbPath = tmpDb();
    tracker = new UsageTracker(dbPath);
    const breaker = new CircuitBreaker(tracker, { maxSessionsPerDay: 1, maxTokensPerDay: 10 });

    // Exceed both limits
    tracker.record('browse', 1000, 500);
    tracker.record('browse', 1000, 500);

    process.env.HEADLESSDEV_NO_LIMIT = '1';

    const result = breaker.check();
    expect(result.allowed).toBe(true);
  });
});
