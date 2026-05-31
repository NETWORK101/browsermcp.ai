import { chromium, Browser, BrowserContext } from "playwright";
import { PageWrapper } from "./page.js";

export interface BrowserManagerConfig {
  timeout: number;
  headless: boolean;
}

const DEFAULT_BROWSER_CONFIG: BrowserManagerConfig = { timeout: 30_000, headless: true };

export class BrowserManager {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private config: BrowserManagerConfig;

  constructor(config?: Partial<BrowserManagerConfig>) {
    this.config = { ...DEFAULT_BROWSER_CONFIG, ...config };
    const cleanup = () => {
      this.cleanup().finally(() => process.exit(0));
    };
    process.once("SIGINT", cleanup);
    process.once("SIGTERM", cleanup);
  }

  getBrowserInstance(): Browser | null {
    return this.browser;
  }

  async getPage(url: string, opts?: { timeout?: number }): Promise<PageWrapper> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: this.config.headless });
    }

    const timeout = opts?.timeout ?? this.config.timeout;
    const context = await this.browser.newContext();
    const contextId = `ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.contexts.set(contextId, context);

    const page = await context.newPage();
    await page.goto(url, { timeout });

    // Remove context from map when it's closed externally
    context.once("close", () => {
      this.contexts.delete(contextId);
    });

    return new PageWrapper(page, context, timeout);
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
