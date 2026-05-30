// Public API -- pure functions, no MCP formatting
export { browse } from "./browse.js";
export { extract } from "./extract.js";
export { links } from "./links.js";
export { screenshot } from "./screenshot.js";

// Types
export type {
  BrowseOptions,
  BrowseResult,
  ExtractOptions,
  ExtractResult,
  LinksOptions,
  LinkEntry,
  LinksResult,
  ScreenshotOptions,
  ScreenshotResult,
  DiffLine,
  DiffOutput,
} from "./types.js";

// Utilities (for advanced usage / adapter layer)
export { getSession, closeSession } from "./session.js";
export type { PageHandle, BrowserManager } from "./session.js";
export { estimateTokens, applyBudget } from "./tokens.js";
export { diffMarkdown } from "./diff.js";
export { BrowseCache } from "./cache.js";

// Distillation internals (for adapters that need lower-level access)
export { distill } from "./distill/pipeline.js";
export type { DistillResult, InteractiveElement } from "./distill/pipeline.js";
export { extractContent } from "./distill/readability.js";
export { htmlToMarkdown } from "./distill/markdown.js";
export { extractInteractiveElements } from "./distill/accessibility-tree.js";

// Storage
export { UsageTracker } from "./storage/tracker.js";
export { CircuitBreaker } from "./storage/circuit-breaker.js";
export type { CircuitBreakerConfig } from "./storage/circuit-breaker.js";
