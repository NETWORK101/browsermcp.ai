// ── Browse ──────────────────────────────────────────────────────────

export interface BrowseOptions {
  url: string;
  /** Truncate markdown to fit within this token budget. */
  tokenBudget?: number;
  /** Use Readability to extract only main article content (default true). */
  mainContentOnly?: boolean;
  /** Prepended instruction / context note for the consumer. */
  instruction?: string;
  /** URL was previously browsed; return a diff instead of full content. */
  since?: boolean;
  /** Skip cache and force a fresh fetch. */
  fresh?: boolean;
  /** Navigation timeout in ms. */
  timeout?: number;
}

export interface BrowseResult {
  url: string;
  markdown: string;
  tokens: number;
  reductionRatio: number;
  /** Present when `since` was true and a previous snapshot existed. */
  diff?: DiffOutput;
}

// ── Extract ─────────────────────────────────────────────────────────

export interface ExtractOptions {
  url: string;
  /** Optional JSON schema hint prepended to the output so the consumer can parse it. */
  schema?: Record<string, unknown>;
  /** Navigation timeout in ms. */
  timeout?: number;
}

export interface ExtractResult {
  url: string;
  markdown: string;
  tokens: number;
  reductionRatio: number;
  /** The schema that was passed in, echoed back for convenience. */
  schema?: Record<string, unknown>;
}

// ── Links ───────────────────────────────────────────────────────────

export interface LinksOptions {
  url: string;
  /** Regex or substring to filter hrefs. */
  filter?: string;
  /** CSS selector to scope link extraction (e.g. "nav", "#sidebar"). */
  selector?: string;
  /** Navigation timeout in ms. */
  timeout?: number;
}

export interface LinkEntry {
  text: string;
  href: string;
  selector: string;
}

export interface LinksResult {
  url: string;
  links: LinkEntry[];
  count: number;
}

// ── Screenshot ──────────────────────────────────────────────────────

export interface ScreenshotOptions {
  url: string;
  /** Capture a specific element instead of the viewport. */
  selector?: string;
  /** Capture the full scrollable page. */
  fullPage?: boolean;
  /** Navigation timeout in ms. */
  timeout?: number;
}

export interface ScreenshotResult {
  url: string;
  data: Buffer;
  mimeType: "image/png";
}

// ── Diff (internal, surfaced in BrowseResult) ───────────────────────

export interface DiffLine {
  type: "added" | "removed" | "context";
  text: string;
}

export interface DiffOutput {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
  changedSections: number;
  diffTokens: number;
  fullPageTokens: number;
}
