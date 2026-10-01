import { BrowserManager } from './browser/manager.js';
import { handleBrowse } from './tools/browse.js';
import { handleExtract } from './tools/extract.js';
import { handleLinks } from './tools/links.js';
import { handleScreenshot } from './tools/screenshot.js';
import { handleInteract } from './tools/interact.js';
import { errorResult, type ToolContext, type ToolResult } from './tools/common.js';
import { UsageTracker } from './cost/tracker.js';
import { CircuitBreaker } from './cost/circuit-breaker.js';
import type { BrowserMcpConfig } from './config/schema.js';
import { checkUrl, interactDecision, isDeniedRequest, type InteractDecision } from './security/policy.js';

export const TOOL_NAMES = ['browse', 'extract', 'links', 'screenshot', 'interact'] as const;

/**
 * Everything a tool call needs, shared by the MCP server and the CLI so both enforce the same
 * policy, limits, fencing and usage tracking.
 */
export interface Runtime {
  config: BrowserMcpConfig;
  tracker: UsageTracker;
  browserManager: BrowserManager;
  breaker: CircuitBreaker;
  /** Resolved once: the session mode doesn't change while a server or CLI command runs. */
  interact: InteractDecision;
}

export function createRuntime(config: BrowserMcpConfig, tracker: UsageTracker = new UsageTracker()): Runtime {
  return {
    config,
    tracker,
    browserManager: new BrowserManager({
      ...config.browser,
      blockRequest: config.policy.deny.length ? (url) => isDeniedRequest(url, config.policy) : undefined,
    }),
    breaker: new CircuitBreaker(tracker, config.limits),
    interact: interactDecision(config),
  };
}

function estimateTokensFromResult(result: ToolResult): number {
  let chars = 0;
  for (const item of result.content) {
    if (item.type === 'text') chars += item.text.length;
  }
  return Math.ceil(chars / 4);
}

/** Validate, police, dispatch and record one tool call. */
export async function runTool(
  rt: Runtime,
  name: string,
  rawArgs: Record<string, unknown> | undefined,
  hooks: Pick<ToolContext, 'sample'> & { progress?: ToolContext['progress'] } = {}
): Promise<ToolResult> {
  const args = { ...(rawArgs ?? {}) } as Record<string, any>;

  // `watch` was folded into `browse({ diff: true })` in 0.2 — keep old prompts working.
  const tool = name === 'watch' ? 'browse' : name;
  if (name === 'watch') args.diff = true;

  if (!(TOOL_NAMES as readonly string[]).includes(tool)) {
    return errorResult(`Unknown tool: ${name}`);
  }
  if (tool === 'interact' && !rt.interact.allowed) {
    return errorResult(rt.interact.reason);
  }
  if (typeof args.url !== 'string') {
    return errorResult(`"${tool}" requires a "url" string.`);
  }
  const decision = checkUrl(args.url, rt.config.policy);
  if (!decision.ok) {
    return errorResult(`Blocked by browsermcp policy: ${decision.reason}`);
  }
  const check = rt.breaker.check();
  if (!check.allowed) {
    return errorResult(check.message!);
  }

  const ctx: ToolContext = {
    config: rt.config,
    tracker: rt.tracker,
    progress: hooks.progress ?? (async () => {}),
    sample: hooks.sample,
  };

  const startTime = Date.now();
  let result: ToolResult;
  switch (tool) {
    case 'browse':
      result = await handleBrowse(args as any, rt.browserManager, ctx);
      break;
    case 'extract':
      result = await handleExtract(args as any, rt.browserManager, ctx);
      break;
    case 'links':
      result = await handleLinks(args as any, rt.browserManager, ctx);
      break;
    case 'screenshot':
      result = await handleScreenshot(args as any, rt.browserManager, ctx);
      break;
    default:
      result = await handleInteract(args as any, rt.browserManager, ctx);
  }

  rt.tracker.record(name, estimateTokensFromResult(result), Date.now() - startTime, args.url);
  return result;
}
