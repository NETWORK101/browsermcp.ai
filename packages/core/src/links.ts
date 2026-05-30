import { getSession } from "./session.js";
import type { LinksOptions, LinkEntry, LinksResult } from "./types.js";

/**
 * Extract links from a page without full distillation (cheap operation).
 *
 * Supports:
 * - CSS selector scoping (e.g. "nav", "#sidebar")
 * - Regex or substring filtering on hrefs
 */
export async function links(opts: LinksOptions): Promise<LinksResult> {
  const { url, filter, selector, timeout } = opts;

  const session = getSession();
  const handle = await session.getPage(url, { timeout });

  try {
    // Extract links directly from the page DOM
    const rawLinks = await handle.page.evaluate(
      ({ scope }: { scope?: string }) => {
        const container = scope
          ? document.querySelector(scope) ?? document
          : document;

        const anchors = Array.from(container.querySelectorAll("a[href]"));

        return anchors.map((a, i) => {
          const el = a as HTMLAnchorElement;
          // Build a selector for this element
          let sel: string;
          if (el.id) {
            sel = `#${el.id}`;
          } else {
            const name = el.getAttribute("name");
            if (name) {
              sel = `a[name="${name}"]`;
            } else {
              sel = `a:nth-of-type(${i + 1})`;
            }
          }

          return {
            text: (el.textContent ?? "").trim(),
            href: el.href, // fully resolved URL
            selector: sel,
          };
        });
      },
      { scope: selector },
    );

    // Apply filter if provided
    let filtered: LinkEntry[] = rawLinks;
    if (filter) {
      try {
        const regex = new RegExp(filter);
        filtered = rawLinks.filter((link) => regex.test(link.href));
      } catch {
        // If the filter isn't valid regex, use substring match
        filtered = rawLinks.filter((link) => link.href.includes(filter));
      }
    }

    return {
      url,
      links: filtered,
      count: filtered.length,
    };
  } finally {
    await handle.close();
  }
}
