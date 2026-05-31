import { Page } from 'playwright';

export interface InteractiveElement {
  role: string;       // e.g., "button", "link", "input"
  name: string;       // accessible name or text content
  selector: string;   // CSS selector to target this element
  value?: string;     // current value for inputs
}

/**
 * Extract all interactive elements from a live Playwright page via page.evaluate().
 */
export async function extractInteractiveElements(page: Page): Promise<InteractiveElement[]> {
  return page.evaluate(() => {
    const results: Array<{
      role: string;
      name: string;
      selector: string;
      value?: string;
    }> = [];

    const getSelectorForElement = (el: Element, tag: string, index: number): string => {
      if (el.id) return `#${el.id}`;
      const name = el.getAttribute('name');
      if (name) return `${tag}[name="${name}"]`;
      return `${tag}:nth-of-type(${index + 1})`;
    };

    // Buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    buttons.forEach((btn, i) => {
      const text = (btn.textContent ?? '').trim();
      results.push({
        role: 'button',
        name: text || btn.getAttribute('aria-label') || 'button',
        selector: getSelectorForElement(btn, 'button', i),
      });
    });

    // Links with href
    const links = Array.from(document.querySelectorAll('a[href]'));
    links.forEach((a, i) => {
      const text = (a.textContent ?? '').trim();
      const href = a.getAttribute('href') ?? '';
      results.push({
        role: 'link',
        name: text || a.getAttribute('aria-label') || href,
        selector: getSelectorForElement(a, 'a', i),
        value: href,
      });
    });

    // Inputs
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach((inp, i) => {
      const type = inp.type || 'text';
      // Find associated label
      let label = '';
      if (inp.id) {
        const labelEl = document.querySelector(`label[for="${inp.id}"]`);
        if (labelEl) label = (labelEl.textContent ?? '').trim();
      }
      if (!label) label = inp.getAttribute('placeholder') ?? inp.getAttribute('aria-label') ?? '';
      results.push({
        role: `input:${type}`,
        name: label || `input-${i}`,
        selector: getSelectorForElement(inp, 'input', i),
        value: inp.value || undefined,
      });
    });

    // Selects
    const selects = Array.from(document.querySelectorAll('select'));
    selects.forEach((sel, i) => {
      let label = '';
      if (sel.id) {
        const labelEl = document.querySelector(`label[for="${sel.id}"]`);
        if (labelEl) label = (labelEl.textContent ?? '').trim();
      }
      if (!label) label = sel.getAttribute('aria-label') ?? '';
      results.push({
        role: 'select',
        name: label || `select-${i}`,
        selector: getSelectorForElement(sel, 'select', i),
        value: sel.value || undefined,
      });
    });

    // Textareas
    const textareas = Array.from(document.querySelectorAll('textarea'));
    textareas.forEach((ta, i) => {
      let label = '';
      if (ta.id) {
        const labelEl = document.querySelector(`label[for="${ta.id}"]`);
        if (labelEl) label = (labelEl.textContent ?? '').trim();
      }
      if (!label) label = ta.getAttribute('placeholder') ?? ta.getAttribute('aria-label') ?? '';
      results.push({
        role: 'textarea',
        name: label || `textarea-${i}`,
        selector: getSelectorForElement(ta, 'textarea', i),
        value: ta.value || undefined,
      });
    });

    return results;
  });
}
