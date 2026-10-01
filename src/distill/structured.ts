import { Page } from 'playwright';

export interface TableData {
  caption?: string;
  headers: string[];
  rows: Array<Record<string, string>>;
  truncated?: boolean;
}

export interface StructuredPage {
  url: string;
  title: string;
  description?: string;
  lang?: string;
  canonical?: string;
  /** OpenGraph / Twitter card / other named meta tags. */
  meta: Record<string, string>;
  /** Parsed schema.org JSON-LD blocks — often the richest structured data on a page. */
  jsonLd: unknown[];
  tables: TableData[];
  headings: Array<{ level: number; text: string }>;
}

const MAX_TABLES = 20;
const MAX_ROWS = 100;
const MAX_HEADINGS = 60;

/**
 * Pull machine-readable data straight from the DOM — no model required.
 * Tables become arrays of row objects keyed by header text.
 */
export async function extractStructured(page: Page): Promise<StructuredPage> {
  return page.evaluate(
    ({ MAX_TABLES, MAX_ROWS, MAX_HEADINGS }) => {
      const text = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

      const meta: Record<string, string> = {};
      for (const m of Array.from(document.querySelectorAll('meta[property], meta[name]'))) {
        const key = m.getAttribute('property') ?? m.getAttribute('name');
        const content = m.getAttribute('content');
        if (!key || !content) continue;
        if (/^(og|twitter|article|product|author|keywords|description)/i.test(key)) meta[key] = content.slice(0, 500);
      }

      const jsonLd: unknown[] = [];
      for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        try {
          const parsed = JSON.parse(s.textContent ?? '');
          if (Array.isArray(parsed)) jsonLd.push(...parsed);
          else jsonLd.push(parsed);
        } catch {
          /* malformed JSON-LD is common in the wild; skip it */
        }
      }

      const tables = Array.from(document.querySelectorAll('table'))
        .slice(0, MAX_TABLES)
        .map((table) => {
          const allRows = Array.from(table.querySelectorAll('tr'));
          const headRow =
            table.querySelector('thead tr') ?? allRows.find((r) => r.querySelector('th')) ?? null;
          let headers = headRow ? Array.from(headRow.children).map((c) => text(c)) : [];
          const bodyRows = allRows.filter((r) => r !== headRow);
          const width = Math.max(headers.length, ...bodyRows.map((r) => r.children.length), 0);
          headers = Array.from({ length: width }, (_, i) => headers[i] || `col${i + 1}`);
          // Disambiguate duplicate header labels so no column gets silently overwritten.
          const seen = new Map<string, number>();
          headers = headers.map((h) => {
            const n = (seen.get(h) ?? 0) + 1;
            seen.set(h, n);
            return n > 1 ? `${h}_${n}` : h;
          });
          const rows = bodyRows.slice(0, MAX_ROWS).map((r) => {
            const cells = Array.from(r.children).map((c) => text(c));
            return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
          });
          const caption = text(table.querySelector('caption')) || undefined;
          return { caption, headers, rows, truncated: bodyRows.length > MAX_ROWS || undefined };
        })
        .filter((t) => t.rows.length > 0);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .slice(0, MAX_HEADINGS)
        .map((h) => ({ level: Number(h.tagName[1]), text: text(h).slice(0, 160) }))
        .filter((h) => h.text);

      return {
        url: location.href,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? undefined,
        lang: document.documentElement.lang || undefined,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? undefined,
        meta,
        jsonLd,
        tables,
        headings,
      };
    },
    { MAX_TABLES, MAX_ROWS, MAX_HEADINGS }
  );
}

export interface LinkEntry {
  href: string;
  text: string;
  sameOrigin: boolean;
}

/** Collect a de-duplicated link map. Fragment-only and javascript: links are ignored. */
export async function extractLinks(
  page: Page,
  opts: { sameOrigin?: boolean; match?: string; limit?: number } = {}
): Promise<{ links: LinkEntry[]; total: number }> {
  const all = await page.evaluate(() => {
    const out: Array<{ href: string; text: string; sameOrigin: boolean }> = [];
    const seen = new Set<string>();
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      const raw = a.getAttribute('href') ?? '';
      if (!raw || raw.startsWith('#') || /^(javascript|mailto|tel):/i.test(raw)) continue;
      let u: URL;
      try {
        u = new URL(raw, location.href);
      } catch {
        continue;
      }
      u.hash = '';
      const href = u.toString();
      if (seen.has(href)) continue;
      seen.add(href);
      const label = (a.textContent ?? '').replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label') || '';
      out.push({ href, text: label.slice(0, 120), sameOrigin: u.origin === location.origin });
    }
    return out;
  });

  const needle = opts.match?.toLowerCase();
  const filtered = all.filter(
    (l) =>
      (!opts.sameOrigin || l.sameOrigin) &&
      (!needle || l.href.toLowerCase().includes(needle) || l.text.toLowerCase().includes(needle))
  );
  const limit = opts.limit ?? 200;
  return { links: filtered.slice(0, limit), total: filtered.length };
}
