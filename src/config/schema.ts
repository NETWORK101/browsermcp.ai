import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * How the browser keeps (or doesn't keep) session state between calls.
 * - "auto":       use the persistent profile if `browsermcp login` has created one, else ephemeral
 * - "persistent": always use the persistent profile at `profileDir`
 * - "ephemeral":  fresh incognito-style context per call (no cookies survive)
 */
export type ProfileMode = 'auto' | 'persistent' | 'ephemeral';

export interface BrowserMcpConfig {
  browser: {
    timeout: number;
    headless: boolean;
    profile: ProfileMode;
    profileDir: string;
    /** Attach to an already-running Chrome (e.g. http://localhost:9222) instead of launching one. */
    cdpEndpoint?: string;
  };
  distill: {
    maxTokens: number;
    includeLinks: boolean;
    includeImages: boolean;
  };
  policy: {
    /** Host globs the agent may visit. Empty = any host. e.g. ["*.stripe.com", "localhost:*"] */
    allow: string[];
    /** Host globs that are always refused, checked before `allow`. */
    deny: string[];
    /** Set false to disable the `interact` tool entirely (read-only mode). */
    allowInteract: boolean;
    /** Allow file:// URLs. Off by default — local files are rarely what an agent should read via a browser. */
    allowFileUrls: boolean;
  };
  limits: {
    maxSessionsPerDay: number;
    maxTokensPerDay: number;
  };
}

/** @deprecated kept for API compatibility with <=0.1.x imports */
export type HeadlessDevConfig = BrowserMcpConfig;

export const STATE_DIR = join(homedir(), '.browsermcp');

export const DEFAULT_CONFIG: BrowserMcpConfig = {
  browser: {
    timeout: 30000,
    headless: true,
    profile: 'auto',
    profileDir: join(STATE_DIR, 'profile'),
  },
  distill: { maxTokens: 4000, includeLinks: true, includeImages: false },
  policy: { allow: [], deny: [], allowInteract: true, allowFileUrls: false },
  limits: { maxSessionsPerDay: 100, maxTokensPerDay: 1_000_000 },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

function deepMerge(base: BrowserMcpConfig, override: DeepPartial<BrowserMcpConfig>): BrowserMcpConfig {
  return {
    browser: { ...base.browser, ...override.browser },
    distill: { ...base.distill, ...override.distill },
    policy: { ...base.policy, ...override.policy },
    limits: { ...base.limits, ...override.limits },
  };
}

function tryLoad(filePath: string): DeepPartial<BrowserMcpConfig> | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as DeepPartial<BrowserMcpConfig>;
  } catch (err) {
    // A broken config should be loud, not silently ignored — but must not crash the stdio server.
    console.error(`[browsermcp] Ignoring invalid JSON in ${filePath}: ${(err as Error).message}`);
    return null;
  }
}

export function loadConfig(): BrowserMcpConfig {
  // Resolution order: defaults ← ~/.config/browsermcp/config.json ← .browsermcp.json in CWD
  const globalPath = join(homedir(), '.config', 'browsermcp', 'config.json');
  const localPath = join(process.cwd(), '.browsermcp.json');

  let config = deepMerge(DEFAULT_CONFIG, {});

  const global = tryLoad(globalPath);
  if (global) config = deepMerge(config, global);

  const local = tryLoad(localPath);
  if (local) config = deepMerge(config, local);

  return config;
}
