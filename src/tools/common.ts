import type { BrowserManager } from '../browser/manager.js';
import type { UsageTracker } from '../cost/tracker.js';
import { DEFAULT_CONFIG, type LocalMcpConfig } from '../config/schema.js';
import type { DistillResult } from '../distill/pipeline.js';
import { formatPageCard } from '../distill/metadata.js';
import { checkUrl, fenceUntrusted } from '../security/policy.js';

export type TextBlock = { type: 'text'; text: string };
export type ImageBlock = { type: 'image'; data: string; mimeType: string };

export interface ToolResult {
  content: Array<TextBlock | ImageBlock>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  [key: string]: unknown;
}

export interface ToolContext {
  config: LocalMcpConfig;
  tracker?: UsageTracker;
  /** Report coarse progress to clients that sent a progressToken. No-op otherwise. */
  progress: (progress: number, total: number, message: string) => Promise<void>;
  /**
   * Ask the *client's* model to complete a prompt via MCP sampling.
   * Undefined when the client doesn't advertise the sampling capability.
   */
  sample?: (prompt: string, opts: { system?: string; maxTokens: number }) => Promise<string | null>;
}

export function defaultContext(partial: Partial<ToolContext> = {}): ToolContext {
  return {
    config: DEFAULT_CONFIG,
    progress: async () => {},
    ...partial,
  };
}

export function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

export function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Playwright errors include a multi-line call log that's noise to an agent.
  return msg.split('\n=========================== logs')[0].split('\nCall log:')[0].trim();
}

/** Standard header + fenced body used by every text-returning tool. */
export function renderPage(
  d: Pick<DistillResult, 'title' | 'url' | 'tokenCount' | 'reductionRatio' | 'truncated' | 'omittedSections'> &
    Partial<Pick<DistillResult, 'meta' | 'source'>>,
  body: string,
  extras: { lead?: string[]; notices?: string[] } = {}
): string {
  const reduction = Math.max(0, Math.round((1 - d.reductionRatio) * 100));
  const stats = [`${d.tokenCount.toLocaleString('en-US')} tokens`, `${reduction}% smaller than raw HTML`];
  if (d.truncated) stats.push('truncated to budget');

  const out: string[] = [];
  out.push(`# ${d.title || d.url}`);
  out.push(`${d.url} · ${stats.join(' · ')}`);
  if (d.meta && d.source) out.push(formatPageCard(d.meta, d.url, d.source));
  for (const l of extras.lead ?? []) out.push(l);
  out.push('');
  out.push(fenceUntrusted(body, d.url));
  if (d.omittedSections.length > 0) {
    const list = d.omittedSections.slice(0, 25).join(' · ');
    const more = d.omittedSections.length > 25 ? ` (+${d.omittedSections.length - 25} more)` : '';
    out.push('');
    out.push(`_Omitted sections — call again with \`focus\` or a larger \`maxTokens\` to read them: ${list}${more}_`);
  }
  for (const n of extras.notices ?? []) out.push(`\n_Note: ${n}_`);
  return out.join('\n');
}

/**
 * The requested URL was already approved by the server's policy check, but redirects or
 * clicks can land somewhere else. Return a reason string if the page left the approved
 * origin for one the policy refuses.
 */
export function landedOutsidePolicy(requested: string, landedUrl: string, config: LocalMcpConfig): string | null {
  let from: URL;
  let to: URL;
  try {
    from = new URL(requested);
    to = new URL(landedUrl);
  } catch {
    return null;
  }
  if (to.protocol === 'about:' || from.origin === to.origin) return null;
  const decision = checkUrl(landedUrl, config.policy);
  return decision.ok ? null : decision.reason;
}
