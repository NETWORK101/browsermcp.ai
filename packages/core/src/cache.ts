import type { BrowseResult } from "./types.js";

interface CacheEntry {
  result: BrowseResult;
  cachedAt: number;
}

/**
 * Cache key derived from URL and relevant options.
 */
function cacheKey(url: string, mainContentOnly?: boolean): string {
  return `${url}::${mainContentOnly ?? true}`;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 50;

/**
 * Simple in-memory LRU cache for browse results.
 * TTL-based expiry with a max entry cap.
 */
export class BrowseCache {
  private entries = new Map<string, CacheEntry>();
  private ttlMs: number;
  private maxSize: number;

  constructor(opts?: { ttlMs?: number; maxSize?: number }) {
    this.ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
    this.maxSize = opts?.maxSize ?? DEFAULT_MAX_SIZE;
  }

  get(url: string, mainContentOnly?: boolean): BrowseResult | null {
    const key = cacheKey(url, mainContentOnly);
    const entry = this.entries.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.entries.delete(key);
      return null;
    }

    // Move to end for LRU ordering (Map iteration order = insertion order)
    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.result;
  }

  set(url: string, mainContentOnly: boolean | undefined, result: BrowseResult): void {
    const key = cacheKey(url, mainContentOnly);

    // Evict oldest if at capacity
    if (this.entries.size >= this.maxSize && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }

    this.entries.set(key, { result, cachedAt: Date.now() });
  }

  clear(): void {
    this.entries.clear();
  }
}
