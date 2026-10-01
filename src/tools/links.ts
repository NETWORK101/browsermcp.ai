import { BrowserManager } from '../browser/manager.js';
import { extractLinks } from '../distill/structured.js';
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
      const { links, total } = await extractLinks(pageWrapper.page, {
        sameOrigin: args.sameOrigin,
        match: args.match,
        limit: Math.min(Math.max(1, args.limit ?? 200), 1000),
      });
      const url = pageWrapper.page.url();
      const body = links.map((l) => `- [${l.text || l.href}](${l.href})`).join('\n') || '(no links matched)';
      const shown = links.length < total ? `${links.length} of ${total}` : `${total}`;
      const text = [`# Links on ${url}`, `${shown} unique link(s)`, '', fenceUntrusted(body, url)].join('\n');
      return { content: [{ type: 'text', text }], structuredContent: { url, total, links } };
    } finally {
      await pageWrapper.close();
    }
  } catch (err) {
    return errorResult(`Error collecting links from ${args.url}: ${errorMessage(err)}`);
  }
}
