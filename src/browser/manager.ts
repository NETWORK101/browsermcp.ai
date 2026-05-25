import { chromium, Browser, BrowserContext } from "playwright";
import { PageWrapper } from "./page.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export class BrowserManager {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();

  constructor() {
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
      this.browser = await chromium.launch();
    }

    const timeout = opts?.timeout ?? DEFAULT_TIMEOUT_MS;
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
