import { Page, BrowserContext, Locator } from "playwright";

export interface ScreenshotOptions {
  selector?: string;
  fullPage?: boolean;
  format?: "png" | "jpeg";
  quality?: number;
}

export class PageWrapper {
  readonly page: Page;
  /** Set only when this wrapper owns a throwaway context (ephemeral mode). */
  private context: BrowserContext | null;
  private timeout: number;

  constructor(page: Page, context: BrowserContext | null, timeout: number) {
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

  async screenshot(opts?: ScreenshotOptions): Promise<Buffer> {
    const type = opts?.format ?? "png";
    const quality = type === "jpeg" ? (opts?.quality ?? 70) : undefined;
    if (opts?.selector) {
      return this.page.locator(opts.selector).screenshot({ type, quality, timeout: this.timeout }) as Promise<Buffer>;
    }
    return this.page.screenshot({ fullPage: opts?.fullPage ?? false, type, quality }) as Promise<Buffer>;
  }

  async evaluate<T>(fn: () => T): Promise<T> {
    return this.page.evaluate(fn);
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async close(): Promise<void> {
    // Persistent/CDP sessions share one context: close just our tab so cookies survive.
    if (this.context) {
      await this.context.close();
    } else {
      await this.page.close();
    }
  }
}
