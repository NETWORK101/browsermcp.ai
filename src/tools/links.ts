import { BrowserManager } from '../browser/manager.js';
import { extractLinks } from '../distill/structured.js';
import { fetchText } from '../distill/metadata.js';
import { fenceUntrusted } from '../security/policy.js';
import { defaultContext, errorMessage, errorResult, landedOutsidePolicy, type ToolContext, type ToolResult } from './common.js';

export interface LinksArgs {
  url: string;
  sameOrigin?: boolean;
  match?: string;
  limit?: number;
}

export async function handleLinks(
  args: LinksArgs,
  browserManager: BrowserManager,
  ctx: ToolContext = defaultContext()
): Promise<ToolResult> {
  try {
    await ctx.progress(0, 2, `Opening ${args.url}`);
    const pageWrapper = await browserManager.getPage(args.url);
    try {
      const redirected = landedOutsidePolicy(args.url, pageWrapper.page.url(), ctx.config);
      if (redirected) return errorResult(`${args.url} redirected to a URL blocked by policy: ${redirected}`);
      await ctx.progress(1, 2, 'Collecting links');
      const url = pageWrapper.page.url();
      // Sites increasingly publish /llms.txt: a curated, model-oriented index of their content.
      const llmsTxtP = findLlmsTxt(pageWrapper.page.context().request, url);
      const { links, total } = await extractLinks(pageWrapper.page, {
        sameOrigin: args.sameOrigin,
        match: args.match,
        limit: Math.min(Math.max(1, args.limit ?? 200), 1000),
      });
      const llmsTxt = await llmsTxtP;
      const body = links.map((l) => `- [${l.text || l.href}](${l.href})`).join('\n') || '(no links matched)';
      const shown = links.length < total ? `${links.length} of ${total}` : `${total}`;
      const head = [`# Links on ${url}`, `${shown} unique link(s)`];
      if (llmsTxt) head.push(`> This site publishes ${llmsTxt} — a curated index for models. Read it with browse before crawling.`);
      const text = [...head, '', fenceUntrusted(body, url)].join('\n');
      return {
        content: [{ type: 'text', text }],
        structuredContent: { url, total, links, ...(llmsTxt ? { llmsTxt } : {}) },
      };
    } finally {
      await pageWrapper.close();
    }
  } catch (err) {
    return errorResult(`Error collecting links from ${args.url}: ${errorMessage(err)}`);
  }
}

async function findLlmsTxt(request: import('playwright').APIRequestContext, pageUrl: string): Promise<string | null> {
  let origin: string;
  try {
    const u = new URL(pageUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    origin = u.origin;
  } catch {
    return null;
  }
  const url = `${origin}/llms.txt`;
  const text = await fetchText(request, url, { accept: /text\/(plain|markdown)/i, timeout: 3_000 });
  // Real llms.txt files are markdown with an H1 and links; guard against soft-404 pages.
  return text && /^\s*#\s/m.test(text) ? url : null;
}
