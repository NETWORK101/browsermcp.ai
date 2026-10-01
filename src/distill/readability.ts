import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';

// jsdom can't parse some modern CSS (@layer, nesting) and logs an error per stylesheet.
// We never use styles, so route those nowhere — keeps MCP stderr and the CLI quiet.
const quietConsole = new VirtualConsole();
quietConsole.on('jsdomError', () => {});

/**
 * Strips noisy tags from an HTML string in-place on a JSDOM document.
 */
function stripNoiseTags(document: Document, tags: string[]): void {
  for (const tag of tags) {
    for (const el of Array.from(document.querySelectorAll(tag))) {
      el.remove();
    }
  }
}

function absolutizeUrls(document: Document): void {
  for (const a of Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[]) {
    const raw = a.getAttribute('href')!;
    if (raw.startsWith('#') || /^(javascript|mailto|tel):/i.test(raw)) continue;
    try {
      a.setAttribute('href', a.href);
    } catch {
      /* leave malformed hrefs as-is */
    }
  }
  for (const img of Array.from(document.querySelectorAll('img[src]')) as HTMLImageElement[]) {
    if (!img.getAttribute('src')!.startsWith('data:')) img.setAttribute('src', img.src);
  }
}

const NOISE_TAGS = [
  'script', 'style', 'svg', 'noscript', 'nav', 'footer', 'header', 'aside', 'iframe', 'template',
  '[role=navigation]', '[role=banner]', '[role=contentinfo]', '[role=complementary]', '[role=search]',
  '[aria-hidden=true]', '[hidden]',
];

const HEADINGS = 'h1, h2, h3, h4';

/** Find the element most likely to hold the page's primary content. */
function primaryRoot(document: Document): Element | null {
  return document.querySelector('main, [role=main], article') ?? document.body;
}

/**
 * Extract article-quality HTML from a raw HTML string.
 * Falls back to the de-chromed <main>/<article>/<body> when Readability fails
 * or throws away the document's heading structure.
 */
export function extractContent(rawHtml: string, baseUrl?: string): string {
  // Giving JSDOM the page URL makes relative links/images resolve to absolute ones.
  const hasBase = !!baseUrl && /^(https?|file):/.test(baseUrl);
  const dom = new JSDOM(rawHtml, { virtualConsole: quietConsole, ...(hasBase ? { url: baseUrl } : {}) });
  const document = dom.window.document;
  if (hasBase) absolutizeUrls(document);

  // Try Readability first — works well for article-style content
  const reader = new Readability(document.cloneNode(true) as Document);
  const article = reader.parse();

  // Fallback path: strip chrome but keep the page's own structure.
  stripNoiseTags(document, NOISE_TAGS);
  const root = primaryRoot(document);

  if (article?.content) {
    // Readability sometimes discards section headings (e.g. MediaWiki wraps every <h2> in a
    // div it scores as boilerplate). Headings are what `focus` ranks on, so if it lost most
    // of them, prefer the structure-preserving fallback.
    const sourceHeadings = root?.querySelectorAll(HEADINGS).length ?? 0;
    const keptHeadings = new JSDOM(article.content, { virtualConsole: quietConsole }).window.document.querySelectorAll(HEADINGS).length;
    if (sourceHeadings < 3 || keptHeadings >= sourceHeadings / 2) {
      return article.content;
    }
  }

  return root?.innerHTML ?? rawHtml;
}
