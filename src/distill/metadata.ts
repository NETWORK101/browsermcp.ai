import type { Page, APIRequestContext } from 'playwright';
import { evaluateFn } from '../browser/evaluate.js';

/**
 * Metadata-first reading.
 *
 * Before distilling a rendered page, look at what the page says about itself:
 *  - the publisher's own markdown, if offered — via <link rel="alternate" type="text/markdown">
 *    or HTTP content negotiation (Accept: text/markdown), which many docs platforms now serve;
 *  - provenance and freshness from JSON-LD, OpenGraph, <meta>, canonical links, and
 *    markdown front matter — condensed into a one-line "page card".
 */

export interface PageMeta {
  title?: string;
  description?: string;
  type?: string;
  author?: string;
  siteName?: string;
  published?: string;
  modified?: string;
  canonical?: string;
  lang?: string;
  /** Same-page markdown declared by the publisher (absolute URL). */
  markdownAlternate?: string;
}

export type ContentSource = 'rendered' | 'publisher-alternate' | 'publisher-negotiated';

export const SOURCE_LABEL: Record<ContentSource, string> = {
  rendered: 'rendered page, distilled',
  'publisher-alternate': 'publisher markdown (declared text/markdown alternate)',
  'publisher-negotiated': 'publisher markdown (Accept: text/markdown)',
};

/** Read provenance metadata from the live DOM in one round trip. */
export async function readPageMeta(page: Page): Promise<PageMeta> {
  return evaluateFn(page, () => {
    const meta = (sel: string) => document.querySelector(sel)?.getAttribute('content')?.trim() || undefined;
    const pick = (...vals: Array<unknown>) => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return undefined;
    };

    // Flatten JSON-LD (arrays and @graph) and prefer the node that describes this page.
    const nodes: Array<Record<string, any>> = [];
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const data = JSON.parse(s.textContent ?? '');
        const queue = Array.isArray(data) ? [...data] : [data];
        while (queue.length) {
          const n = queue.shift();
          if (!n || typeof n !== 'object') continue;
          if (Array.isArray(n['@graph'])) queue.push(...n['@graph']);
          nodes.push(n);
        }
      } catch {
        /* malformed JSON-LD is common; ignore it */
      }
    }
    const typeOf = (n: Record<string, any>) => ([] as unknown[]).concat(n['@type'] ?? []).join(', ');
    const main =
      nodes.find((n) => /Article|Posting|Report|TechArticle|BlogPosting|NewsArticle|WebPage|Product|Event|Recipe|SoftwareApplication|FAQPage|HowTo/i.test(typeOf(n)) && !/WebSite|Organization|BreadcrumbList/i.test(typeOf(n))) ??
      nodes[0];
    const authorOf = (a: any): string | undefined => {
      if (!a) return undefined;
      if (typeof a === 'string') return a;
      if (Array.isArray(a)) return a.map(authorOf).filter(Boolean).slice(0, 3).join(', ') || undefined;
      return typeof a.name === 'string' ? a.name : undefined;
    };

    const alt = Array.from(document.querySelectorAll('link[rel~="alternate"]')).find((l) =>
      /^text\/(x-)?markdown\b/i.test(l.getAttribute('type') ?? '')
    ) as HTMLLinkElement | undefined;

    return {
      title: pick(main?.headline, main?.name, meta('meta[property="og:title"]'), document.title),
      description: pick(main?.description, meta('meta[name="description"]'), meta('meta[property="og:description"]'))?.slice(0, 300),
      type: pick(main ? typeOf(main) : undefined, meta('meta[property="og:type"]')),
      author: pick(authorOf(main?.author), meta('meta[name="author"]'), meta('meta[property="article:author"]')),
      siteName: pick(meta('meta[property="og:site_name"]'), authorOf(main?.publisher)),
      published: pick(main?.datePublished, meta('meta[property="article:published_time"]')),
      modified: pick(main?.dateModified, meta('meta[property="article:modified_time"]'), meta('meta[property="og:updated_time"]')),
      canonical: (document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null)?.href || undefined,
      lang: document.documentElement.lang || undefined,
      markdownAlternate: alt?.href || undefined,
    };
  }, undefined);
}

const MAX_MARKDOWN_BYTES = 5_000_000;

/** GET a URL through the browser context (sharing its cookies) and return the body if it's markdown. */
export async function fetchText(
  request: APIRequestContext,
  url: string,
  opts: { headers?: Record<string, string>; accept: RegExp; timeout?: number }
): Promise<string | null> {
  try {
    const res = await request.get(url, {
      headers: opts.headers,
      timeout: opts.timeout ?? 4_000,
      failOnStatusCode: false,
      maxRedirects: 3,
    });
    if (!res.ok()) return null;
    // A redirect to another origin is not "this page's" markdown.
    if (new URL(res.url()).origin !== new URL(url).origin) return null;
    const type = res.headers()['content-type'] ?? '';
    if (!opts.accept.test(type)) return null;
    const body = await res.body();
    if (body.byteLength === 0 || body.byteLength > MAX_MARKDOWN_BYTES) return null;
    const text = body.toString('utf-8');
    if (/^\s*<(!doctype|html|head|body)\b/i.test(text)) return null; // mislabelled HTML
    return text;
  } catch {
    return null;
  }
}

/**
 * Prefer the publisher's own markdown over our distillation:
 * 1. a declared <link rel="alternate" type="text/markdown"> on the same origin;
 * 2. otherwise, content negotiation on the page URL itself.
 * Cross-origin alternates are ignored: a page must not be able to point us at another host.
 */
export async function fetchPublisherMarkdown(
  page: Page,
  alternate?: string
): Promise<{ markdown: string; source: ContentSource; url: string } | null> {
  let pageUrl: URL;
  try {
    pageUrl = new URL(page.url());
  } catch {
    return null;
  }
  if (pageUrl.protocol !== 'http:' && pageUrl.protocol !== 'https:') return null;
  const request = page.context().request;

  if (alternate) {
    try {
      const alt = new URL(alternate, pageUrl);
      if (alt.origin === pageUrl.origin && alt.href !== pageUrl.href) {
        const md = await fetchText(request, alt.href, { accept: /markdown|text\/plain/i });
        if (md && md.trim().length > 40) return { markdown: md, source: 'publisher-alternate', url: alt.href };
      }
    } catch {
      /* malformed href */
    }
  }

  const md = await fetchText(request, pageUrl.href, {
    headers: { Accept: 'text/markdown, text/x-markdown;q=0.9' },
    accept: /markdown/i,
  });
  if (md && md.trim().length > 40) return { markdown: md, source: 'publisher-negotiated', url: pageUrl.href };
  return null;
}

/**
 * Split leading YAML front matter off publisher markdown. Only flat `key: value` scalars are
 * read — enough for title/description/dates/canonical without a YAML dependency.
 */
export function splitFrontMatter(markdown: string): { body: string; fields: Record<string, string> } {
  const m = markdown.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { body: markdown, fields: {} };
  const fields: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
    if (kv && !/^[[{|>]/.test(kv[2])) fields[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { body: markdown.slice(m[0].length), fields };
}

/** Fill gaps in DOM metadata from front-matter fields (DOM wins when both exist). */
export function mergeFrontMatter(meta: PageMeta, fields: Record<string, string>): PageMeta {
  const f = (...keys: string[]) => keys.map((k) => fields[k]).find(Boolean);
  return {
    ...meta,
    title: meta.title ?? f('title'),
    description: meta.description ?? f('description', 'summary'),
    type: meta.type ?? f('type', 'pagetype'),
    author: meta.author ?? f('author', 'authors'),
    published: meta.published ?? f('date', 'published', 'created'),
    modified: meta.modified ?? f('last_updated', 'lastupdated', 'updated', 'modified', 'date_modified', 'lastmod'),
    canonical: meta.canonical ?? f('canonical_url', 'canonical'),
  };
}

/** Normalise an ISO-ish timestamp to YYYY-MM-DD for the card; pass anything else through. */
function day(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : v.slice(0, 32);
}

const sameUrl = (a: string, b: string) => a.replace(/[#?].*$/, '').replace(/\/$/, '') === b.replace(/[#?].*$/, '').replace(/\/$/, '');

/**
 * One line of provenance an agent can reason about: what kind of page, who wrote it,
 * how fresh it is, the canonical source, and where the text came from.
 */
export function formatPageCard(meta: PageMeta, url: string, source: ContentSource): string {
  const parts: string[] = [];
  if (meta.type) parts.push(meta.type.split(',')[0].trim());
  if (meta.siteName) parts.push(meta.siteName);
  if (meta.author && meta.author !== meta.siteName) parts.push(`by ${meta.author}`);
  const published = day(meta.published);
  const modified = day(meta.modified);
  if (published) parts.push(`published ${published}`);
  if (modified && modified !== published) parts.push(`updated ${modified}`);
  if (meta.canonical && !sameUrl(meta.canonical, url)) parts.push(`canonical ${meta.canonical}`);
  parts.push(`source: ${SOURCE_LABEL[source]}`);
  return `> ${parts.join(' · ')}`;
}

/** Apply includeLinks/includeImages to markdown we didn't generate ourselves. */
export function trimMarkdown(markdown: string, opts: { includeLinks?: boolean; includeImages?: boolean }): string {
  let out = markdown;
  if (opts.includeImages === false) out = out.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  if (opts.includeLinks === false) out = out.replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, '$1');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const GENERIC_TITLE_WORDS = new Set([
  'docs', 'documentation', 'home', 'page', 'welcome', 'index', 'official', 'guide', 'reference', 'overview', 'site',
]);

/**
 * Cheap cloaking guard: publisher markdown should be about the page the browser rendered.
 * If the rendered title has at least two distinctive words and none of them appear near the
 * top of the markdown, treat the markdown as a different document and don't use it.
 */
export function markdownMatchesPage(markdown: string, renderedTitle: string): boolean {
  const words = [...new Set((renderedTitle.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{3,}/gu) ?? []))]
    .filter((w) => !GENERIC_TITLE_WORDS.has(w));
  if (words.length < 2) return true; // not enough signal to judge
  const head = markdown.slice(0, 6000).toLowerCase();
  return words.some((w) => head.includes(w));
}
