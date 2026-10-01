import { chromium, firefox, webkit, Browser, BrowserContext, BrowserType, Page } from "playwright";
import { existsSync } from "fs";
import { PageWrapper } from "./page.js";
import type { BrowserEngine, ProfileMode } from "../config/schema.js";

export interface BrowserManagerConfig {
  timeout: number;
  headless: boolean;
  /** Defaults to "ephemeral" when constructed directly (tests, library use). */
  profile: ProfileMode;
  engine?: BrowserEngine;
  /** Chromium only — an installed branded build such as "chrome" or "msedge". */
  channel?: string;
  /** Abort any request (navigation, subresource, iframe, fetch) for which this returns true. */
  blockRequest?: (url: string) => boolean;
  profileDir?: string;
  cdpEndpoint?: string;
}

export interface GetPageOptions {
  timeout?: number;
  /** CSS selector to wait for after load — useful for SPAs that render late. */
  waitFor?: string;
}

const DEFAULT_BROWSER_CONFIG: BrowserManagerConfig = { timeout: 30_000, headless: true, profile: "ephemeral" };

/** Upper bound on how long we wait for the network to settle after DOMContentLoaded. */
const SETTLE_MS = 2_500;

export type SessionKind = "ephemeral" | "persistent" | "cdp";

const ENGINE_TYPES: Record<BrowserEngine, BrowserType> = { chromium, firefox, webkit };

export function browserTypeFor(engine: BrowserEngine = "chromium"): BrowserType {
  const t = ENGINE_TYPES[engine];
  if (!t) throw new Error(`Unknown browser engine "${engine}". Use one of: chromium, firefox, webkit.`);
  return t;
}

/**
 * Engines can't share a profile directory (Chromium, Gecko and WebKit store state differently),
 * so non-Chromium engines get a sibling directory: ~/.browsermcp/profile-firefox, …-webkit.
 */
export function profileDirFor(engine: BrowserEngine = "chromium", profileDir: string): string {
  return engine === "chromium" ? profileDir : `${profileDir}-${engine}`;
}

/** Launch options shared by the server and `browsermcp login`. */
export function launchOptions(engine: BrowserEngine = "chromium", channel?: string): { channel?: string } {
  if (channel && engine !== "chromium") {
    throw new Error(`browser.channel "${channel}" only applies to the chromium engine (got "${engine}").`);
  }
  return channel ? { channel } : {};
}

let signalHandlersInstalled = false;
const liveManagers = new Set<BrowserManager>();

export class BrowserManager {
  private browser: Browser | null = null;
  /** Shared, long-lived context for persistent-profile and CDP modes. */
  private sharedContext: BrowserContext | null = null;
  private contexts: Set<BrowserContext> = new Set();
  private config: BrowserManagerConfig;
  private launching: Promise<void> | null = null;
  private kind: SessionKind | null = null;
  private notices: string[] = [];

  constructor(config?: Partial<BrowserManagerConfig>) {
    this.config = { ...DEFAULT_BROWSER_CONFIG, ...config };
    liveManagers.add(this);
    if (!signalHandlersInstalled) {
      signalHandlersInstalled = true;
      const cleanupAll = () => {
        Promise.allSettled([...liveManagers].map((m) => m.cleanup())).finally(() => process.exit(0));
      };
      process.once("SIGINT", cleanupAll);
      process.once("SIGTERM", cleanupAll);
    }
  }

  getBrowserInstance(): Browser | null {
    return this.browser;
  }

  /** Which session mode is active (null until the first page is opened). */
  get sessionKind(): SessionKind | null {
    return this.kind;
  }

  /** One-time notices (e.g. "profile locked, fell back to ephemeral") for surfacing to the agent. */
  drainNotices(): string[] {
    const n = this.notices;
    this.notices = [];
    return n;
  }

  private get profilePath(): string | undefined {
    return this.config.profileDir ? profileDirFor(this.config.engine, this.config.profileDir) : undefined;
  }

  private wantsPersistent(): boolean {
    const { profile } = this.config;
    if (profile === "persistent") return true;
    if (profile === "auto") return !!this.profilePath && existsSync(this.profilePath);
    return false;
  }

  private async launch(): Promise<void> {
    const engine = this.config.engine ?? "chromium";
    const type = browserTypeFor(engine);
    const extra = launchOptions(engine, this.config.channel);

    if (this.config.cdpEndpoint) {
      if (engine !== "chromium") {
        throw new Error(`cdpEndpoint attaches to Chromium-based browsers only; browser.engine is "${engine}".`);
      }
      // Attach to the user's own Chrome: real cookies, real extensions, real sessions.
      this.browser = await chromium.connectOverCDP(this.config.cdpEndpoint);
      this.sharedContext = this.browser.contexts()[0] ?? (await this.browser.newContext());
      this.kind = "cdp";
      return;
    }

    if (this.wantsPersistent() && this.profilePath) {
      try {
        this.sharedContext = await type.launchPersistentContext(this.profilePath, {
          headless: this.config.headless,
          ...extra,
        });
        this.kind = "persistent";
        return;
      } catch (err) {
        // Chromium locks a profile to one process. If another browsermcp (or `browsermcp login`)
        // holds it, degrade to ephemeral rather than failing every call.
        this.notices.push(
          `Persistent profile unavailable (${(err as Error).message.split("\n")[0]}). ` +
            `Using an ephemeral session — authenticated pages may show a login screen.`
        );
      }
    }

    this.browser = await type.launch({ headless: this.config.headless, ...extra });
    this.kind = "ephemeral";
  }

  private async ensureLaunched(): Promise<void> {
    if (this.browser || this.sharedContext) return;
    // Concurrent tool calls must not race to launch two browsers.
    this.launching ??= this.launch().finally(() => {
      this.launching = null;
    });
    await this.launching;
  }

  async getPage(url: string, opts?: GetPageOptions): Promise<PageWrapper> {
    await this.ensureLaunched();
    const timeout = opts?.timeout ?? this.config.timeout;

    let page: Page;
    let ownedContext: BrowserContext | null = null;
    if (this.sharedContext) {
      page = await this.sharedContext.newPage();
    } else {
      ownedContext = await this.browser!.newContext();
      this.contexts.add(ownedContext);
      ownedContext.once("close", () => this.contexts.delete(ownedContext!));
      page = await ownedContext.newPage();
    }

    try {
      if (this.config.blockRequest) {
        // Page-level (not context-level) routing: in CDP mode the context is the user's own
        // browser, and their other tabs must not be intercepted.
        const block = this.config.blockRequest;
        await page.route('**/*', (route) =>
          block(route.request().url()) ? route.abort('blockedbyclient') : route.continue()
        );
      }
      await navigate(page, url, timeout, opts?.waitFor);
    } catch (err) {
      await (ownedContext ? ownedContext.close() : page.close()).catch(() => {});
      throw err;
    }

    return new PageWrapper(page, ownedContext, timeout);
  }

  async cleanup(): Promise<void> {
    for (const context of this.contexts) {
      await context.close().catch(() => {});
    }
    this.contexts.clear();

    // In CDP mode the browser belongs to the user — disconnect, never close their context.
    if (this.sharedContext && this.kind !== "cdp") {
      await this.sharedContext.close().catch(() => {});
    }
    this.sharedContext = null;

    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.kind = null;
    liveManagers.delete(this);
  }
}

/**
 * Navigate and give client-rendered apps a bounded chance to finish rendering.
 * `load` alone fires before most SPAs fetch their data; full `networkidle` can hang forever
 * on pages with analytics beacons or websockets. So: DOMContentLoaded, then a capped settle.
 */
export async function navigate(page: Page, url: string, timeout: number, waitFor?: string): Promise<void> {
  await page.goto(url, { timeout, waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: Math.min(SETTLE_MS, timeout) }).catch(() => {});
  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: Math.min(10_000, timeout) });
  }
}
