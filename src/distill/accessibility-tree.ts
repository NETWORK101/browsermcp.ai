import { Page } from 'playwright';

export interface InteractiveElement {
  role: string;       // e.g., "button", "link", "input:email"
  name: string;       // accessible name or text content
  selector: string;   // CSS selector that uniquely matches this element at capture time
  value?: string;     // current value for inputs, href for links
}

/** Elements beyond this are summarised as a count — huge nav menus shouldn't eat the budget. */
export const MAX_ELEMENTS = 80;

/**
 * Extract visible interactive elements from a live Playwright page.
 * Selectors are verified unique in the live DOM, preferring stable hooks
 * (id, data-testid, name, aria-label) before falling back to a structural path.
 */
export async function extractInteractiveElements(
  page: Page,
  limit: number = MAX_ELEMENTS
): Promise<InteractiveElement[]> {
  return page.evaluate((limit) => {
    const esc = (s: string) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'));
    const unique = (sel: string) => {
      try {
        return document.querySelectorAll(sel).length === 1;
      } catch {
        return false;
      }
    };

    const structuralPath = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        if (node.id && unique(`#${esc(node.id)}`)) {
          parts.unshift(`#${esc(node.id)}`);
          break;
        }
        const tag = node.tagName.toLowerCase();
        const parent: Element | null = node.parentElement;
        if (parent) {
          const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
          parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag);
        } else {
          parts.unshift(tag);
        }
        node = parent;
      }
      return parts.join(' > ');
    };

    const selectorFor = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      if (el.id && unique(`#${esc(el.id)}`)) return `#${esc(el.id)}`;
      for (const attr of ['data-testid', 'data-test', 'name', 'aria-label']) {
        const v = el.getAttribute(attr);
        if (v) {
          const sel = `${tag}[${attr}="${esc(v)}"]`;
          if (unique(sel)) return sel;
        }
      }
      return structuralPath(el);
    };

    const visible = (el: Element) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    };

    const labelFor = (el: Element): string => {
      const id = el.getAttribute('id');
      if (id) {
        const l = document.querySelector(`label[for="${esc(id)}"]`);
        if (l?.textContent?.trim()) return l.textContent.trim();
      }
      const wrap = el.closest('label');
      if (wrap?.textContent?.trim()) return wrap.textContent.trim();
      return el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.getAttribute('title') ?? '';
    };

    const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 80);

    const results: Array<{ role: string; name: string; selector: string; value?: string }> = [];
    const nodes = document.querySelectorAll(
      'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [contenteditable=""], [contenteditable=true]'
    );

    for (const el of Array.from(nodes)) {
      if (results.length >= limit) break;
      if (!visible(el)) continue;
      const tag = el.tagName.toLowerCase();

      if (tag === 'a') {
        const href = el.getAttribute('href') ?? '';
        if (href.startsWith('javascript:')) continue;
        results.push({
          role: 'link',
          name: clean(el.textContent ?? '') || el.getAttribute('aria-label') || href,
          selector: selectorFor(el),
          value: (el as HTMLAnchorElement).href || href,
        });
      } else if (tag === 'input') {
        const inp = el as HTMLInputElement;
        results.push({
          role: `input:${inp.type || 'text'}`,
          name: clean(labelFor(el)) || inp.name || 'input',
          selector: selectorFor(el),
          // Never echo secrets back into the model's context.
          value: inp.type === 'password' ? undefined : inp.value || undefined,
        });
      } else if (tag === 'select' || tag === 'textarea') {
        const v = (el as HTMLSelectElement | HTMLTextAreaElement).value;
        results.push({ role: tag, name: clean(labelFor(el)) || tag, selector: selectorFor(el), value: v || undefined });
      } else {
        const role = el.getAttribute('role') ?? (tag === 'button' ? 'button' : 'editable');
        results.push({
          role,
          name: clean(el.textContent ?? '') || el.getAttribute('aria-label') || role,
          selector: selectorFor(el),
        });
      }
    }
    return results;
  }, limit);
}
