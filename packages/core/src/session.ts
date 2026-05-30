import { chromium, Browser, BrowserContext, Page } from "playwright";

const DEFAULT_TIMEOUT_MS = 30_000;

interface PageHandle {
  page: Page;
  context: BrowserContext;
  close: () => Promise<void>;
}

/**
 * Manages a shared browser instance with context isolation.
 * Each getPage() call creates a fresh BrowserContext (works like incognito).
 */
class BrowserManager {
  private browser: Browser | null = null;
  private contexts = new Map<string, BrowserContext>();

  async getPage(url: string, opts?: { timeout?: number }): Promise<PageHandle> {
    if (!this.browser) {
      this.browser = await chromium.launch();
    }

    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT_MS;
    const context = await this.browser.newContext();
    const contextId = `ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.contexts.set(contextId, context);

    const page = await context.newPage();
    await page.goto(url, { timeout });

    // Remove context from map when closed externally
    context.once("close", () => {
      this.contexts.delete(contextId);
    });

    const close = async () => {
      await context.close().catch(() => {});
    };

    return { page, context, close };
  }

  async cleanup(): Promise<void> {
    for (const context of this.contexts.values()) {
      await context.close().catch(() => {});
    }
    this.contexts.clear();

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

// ── Session management ──────────────────────────────────────────────

const sessions = new Map<string, BrowserManager>();
const DEFAULT_PROFILE = "__default__";

/**
 * Get a BrowserManager for the given profile.
 * The default profile uses fresh contexts (current behavior).
 * Future: named profiles can reuse browser contexts for auth persistence.
 */
export function getSession(profile?: string): BrowserManager {
  const key = profile ?? DEFAULT_PROFILE;
  let manager = sessions.get(key);
  if (!manager) {
    manager = new BrowserManager();
    sessions.set(key, manager);
  }
  return manager;
}

/**
 * Shut down a specific session or all sessions.
 */
export async function closeSession(profile?: string): Promise<void> {
  if (profile) {
    const manager = sessions.get(profile);
    if (manager) {
      await manager.cleanup();
      sessions.delete(profile);
    }
  } else {
    for (const manager of sessions.values()) {
      await manager.cleanup();
    }
    sessions.clear();
  }
}

// Cleanup on process exit
const cleanup = () => {
  closeSession().finally(() => process.exit(0));
};
process.once("SIGINT", cleanup);
process.once("SIGTERM", cleanup);

export type { PageHandle, BrowserManager };
