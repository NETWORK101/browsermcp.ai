import { UsageTracker } from './tracker.js';

export interface CircuitBreakerConfig {
  maxSessionsPerDay: number;  // default 100
  maxTokensPerDay: number;    // default 1_000_000
}

export class CircuitBreaker {
  constructor(
    private tracker: UsageTracker,
    private config: CircuitBreakerConfig = { maxSessionsPerDay: 100, maxTokensPerDay: 1_000_000 }
  ) {}

  check(): { allowed: boolean; message?: string } {
    if (process.env.LOCALMCP_NO_LIMIT === '1' || process.env.BROWSERMCP_NO_LIMIT === '1' || process.env.HEADLESSDEV_NO_LIMIT === '1') {
      return { allowed: true };
    }

    const usage = this.tracker.todayUsage();

    if (usage.sessions >= this.config.maxSessionsPerDay) {
      return {
        allowed: false,
        message: `Daily session limit reached (${usage.sessions}/${this.config.maxSessionsPerDay}). Raise limits in .localmcp.json or set LOCALMCP_NO_LIMIT=1 to override.`
      };
    }

    if (usage.tokens >= this.config.maxTokensPerDay) {
      return {
        allowed: false,
        message: `Daily token limit reached (${usage.tokens}/${this.config.maxTokensPerDay}). Raise limits in .localmcp.json or set LOCALMCP_NO_LIMIT=1 to override.`
      };
    }

    return { allowed: true };
  }
}
