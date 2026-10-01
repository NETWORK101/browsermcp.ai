import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';
import { diffMarkdown } from '../distill/differ.js';
import { estimateTokens } from '../distill/token-counter.js';
import { defaultContext, errorMessage, errorResult, landedOutsidePolicy, renderPage, type ToolContext, type ToolResult } from './common.js';

export interface BrowseArgs {
  url: string;
  focus?: string;
  /** @deprecated alias of `focus` from 0.1.x */
  instruction?: string;
  maxTokens?: number;
  diff?: boolean;
  elements?: boolean;
  waitFor?: string;
}

export async function handleBrowse(
  args: BrowseArgs,
  browserManager: BrowserManager,
  ctx: ToolContext = defaultContext()
): Promise<ToolResult> {
  const focus = args.focus ?? args.instruction;
  const total = 3;
  try {
    await ctx.progress(0, total, `Opening ${args.url}`);
    const pageWrapper = await browserManager.getPage(args.url, { waitFor: args.waitFor });
    try {
      const redirected = landedOutsidePolicy(args.url, pageWrapper.page.url(), ctx.config);
      if (redirected) return errorResult(`${args.url} redirected to a URL blocked by policy: ${redirected}`);
      await ctx.progress(1, total, 'Distilling content');
      const result = await distill(pageWrapper.page, {
        focus: args.diff ? undefined : focus,
        maxTokens: args.diff ? undefined : (args.maxTokens ?? ctx.config.distill.maxTokens),
        elements: args.elements ?? false,
        includeLinks: ctx.config.distill.includeLinks,
        publisherMarkdown: ctx.config.distill.publisherMarkdown,
        includeImages: ctx.config.distill.includeImages,
      });
      await ctx.progress(2, total, 'Formatting');
      const notices = browserManager.drainNotices();

      if (args.diff) {
        return diffResult(args.url, result, ctx, notices);
      }

      const lead = focus ? [`> Focus: ${focus}`] : [];
      return {
        content: [{ type: 'text', text: renderPage(result, result.markdown, { lead, notices }) }],
        structuredContent: {
          url: result.url,
          title: result.title,
          tokens: result.tokenCount,
          rawTokens: result.rawTokenCount,
          truncated: result.truncated,
          omittedSections: result.omittedSections,
          source: result.source,
          card: result.meta,
        },
      };
    } finally {
      await pageWrapper.close();
    }
  } catch (err) {
    return errorResult(`Error browsing ${args.url}: ${errorMessage(err)}`);
  }
}

/** Diff mode (formerly the `watch` tool): return only what changed since the last read. */
function diffResult(
  url: string,
  result: Awaited<ReturnType<typeof distill>>,
  ctx: ToolContext,
  notices: string[]
): ToolResult {
  if (!ctx.tracker) {
    return errorResult('Diff mode needs the usage store (not available in this context).');
  }
  const previous = ctx.tracker.getSnapshot(url);
  ctx.tracker.saveSnapshot(url, result.fullMarkdown, estimateTokens(result.fullMarkdown));

  if (!previous) {
    const text = renderPage(result, result.markdown, {
      lead: ['> Diff mode: first read — baseline snapshot saved. Next call returns only changes.'],
      notices,
    });
    return {
      content: [{ type: 'text', text }],
      structuredContent: { url, title: result.title, tokens: result.tokenCount, changed: true, firstRead: true },
    };
  }

  const diff = diffMarkdown(previous.markdown, result.fullMarkdown);
  const changed = diff.addedCount > 0 || diff.removedCount > 0;
  const header = [`# ${result.title || url}`, `${url} · last read ${previous.updatedAt} UTC`];

  if (!changed) {
    header.push('', `No changes since last read. (A full re-read would have cost ${diff.fullPageTokens.toLocaleString('en-US')} tokens.)`);
    return {
      content: [{ type: 'text', text: header.join('\n') }],
      structuredContent: { url, title: result.title, tokens: 0, changed: false, firstRead: false },
    };
  }

  const body = diff.lines
    .map((l) => (l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ') + l.text)
    .join('\n');
  const saved = Math.max(0, Math.round((1 - diff.diffTokens / Math.max(1, diff.fullPageTokens)) * 100));
  header.push(
    `${diff.changedSections} section${diff.changedSections === 1 ? '' : 's'} changed · +${diff.addedCount} / -${diff.removedCount} lines · ${saved}% fewer tokens than a re-read`,
    '',
    '<untrusted-page-content source="' + url.replaceAll('"', '%22') + '">',
    '```diff',
    body.replaceAll('</untrusted-page-content', '<\\/untrusted-page-content'),
    '```',
    '</untrusted-page-content>'
  );
  for (const n of notices) header.push(`\n_Note: ${n}_`);

  return {
    content: [{ type: 'text', text: header.join('\n') }],
    structuredContent: {
      url,
      title: result.title,
      tokens: diff.diffTokens,
      changed: true,
      firstRead: false,
      added: diff.addedCount,
      removed: diff.removedCount,
    },
  };
}
