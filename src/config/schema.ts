import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface HeadlessDevConfig {
  browser: {
    timeout: number;
    headless: boolean;
  };
  distill: {
    maxTokens: number;
    includeLinks: boolean;
    includeImages: boolean;
  };
  limits: {
    maxSessionsPerDay: number;
    maxTokensPerDay: number;
  };
}

export const DEFAULT_CONFIG: HeadlessDevConfig = {
  browser: { timeout: 30000, headless: true },
  distill: { maxTokens: 4000, includeLinks: true, includeImages: false },
  limits: { maxSessionsPerDay: 100, maxTokensPerDay: 1_000_000 },
};

function deepMerge(base: HeadlessDevConfig, override: Partial<HeadlessDevConfig>): HeadlessDevConfig {
  return {
    browser: { ...base.browser, ...override.browser },
    distill: { ...base.distill, ...override.distill },
    limits: { ...base.limits, ...override.limits },
  };
}

function tryLoad(filePath: string): Partial<HeadlessDevConfig> | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<HeadlessDevConfig>;
  } catch {
    return null;
  }
}

export function loadConfig(): HeadlessDevConfig {
  // Resolution order: .headlessdev.json in CWD → ~/.config/headlessdev/config.json → defaults
  const globalPath = join(homedir(), '.config', 'headlessdev', 'config.json');
  const localPath = join(process.cwd(), '.headlessdev.json');

  let config = { ...DEFAULT_CONFIG };

  const global = tryLoad(globalPath);
  if (global) config = deepMerge(config, global);

  const local = tryLoad(localPath);
  if (local) config = deepMerge(config, local);

  return config;
}
