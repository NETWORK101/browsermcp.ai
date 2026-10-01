import TurndownService from 'turndown';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { gfm } from 'turndown-plugin-gfm';

export interface MarkdownOptions {
  /** Keep `[text](href)` links. When false, links collapse to their text. */
  includeLinks?: boolean;
  /** Keep `![alt](src)` images. When false, images are dropped (they rarely help a text model). */
  includeImages?: boolean;
}

function buildTurndown(opts: Required<MarkdownOptions>): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  // GFM plugin adds proper table support
  td.use(gfm);

  // GFM only converts tables with a header row and *keeps* the rest as raw HTML
  // (infoboxes, layout tables) — often thousands of tokens of markup. Emit them as rows.
  td.addRule('headerless-tables', {
    filter: (node) => node.nodeName === 'TABLE' && !(node as HTMLTableElement).rows[0]?.querySelector('th'),
    replacement: (content) => `\n\n${content.replace(/\n{2,}/g, '\n').trim()}\n\n`,
  });

  // Strip remaining noise tags outright
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td.remove(['script', 'style', 'svg', 'noscript', 'iframe', 'canvas'] as any);

  td.addRule('images', {
    filter: 'img',
    replacement(_content, node) {
      if (!opts.includeImages) return '';
      const el = node as HTMLImageElement;
      const alt = el.getAttribute('alt') ?? '';
      let src = el.getAttribute('src') ?? '';
      if (src.startsWith('data:')) {
        // Preserve the MIME type prefix only — inline base64 can be 100k+ tokens
        const mimeEnd = src.indexOf(';');
        src = mimeEnd !== -1 ? src.slice(0, mimeEnd) + '...' : 'data:image/...';
      }
      return `![${alt}](${src})`;
    },
  });

  if (!opts.includeLinks) {
    td.addRule('links-as-text', {
      filter: 'a',
      replacement: (content) => content,
    });
  }

  return td;
}

const cache = new Map<string, TurndownService>();

/**
 * Convert an HTML string to clean GFM markdown.
 */
export function htmlToMarkdown(html: string, options: MarkdownOptions = {}): string {
  const opts = { includeLinks: options.includeLinks ?? true, includeImages: options.includeImages ?? false };
  const key = `${opts.includeLinks}:${opts.includeImages}`;
  let td = cache.get(key);
  if (!td) {
    td = buildTurndown(opts);
    cache.set(key, td);
  }
  return td
    .turndown(html)
    .replace(/\n{3,}/g, '\n\n') // collapse whitespace left by removed nodes
    .trim();
}
