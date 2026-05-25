import { Page, BrowserContext, Locator } from "playwright";

export class PageWrapper {
  readonly page: Page;
  private context: BrowserContext;
  private timeout: number;

  constructor(page: Page, context: BrowserContext, timeout: number) {
    this.page = page;
    this.context = context;
    this.timeout = timeout;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { timeout: this.timeout });
  }

  async content(): Promise<string> {
    return this.page.content();
  }

  async screenshot(opts?: { selector?: string; fullPage?: boolean }): Promise<Buffer> {
    if (opts?.selector) {
      const element = this.page.locator(opts.selector);
      return element.screenshot() as Promise<Buffer>;
    }
    return this.page.screenshot({ fullPage: opts?.fullPage ?? false }) as Promise<Buffer>;
  }

  async evaluate<T>(fn: () => T): Promise<T> {
    return this.page.evaluate(fn);
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async close(): Promise<void> {
    await this.context.close();
  }
}
