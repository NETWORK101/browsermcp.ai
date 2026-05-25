import { describe, it, expect, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';
import { BrowserManager } from '../../src/browser/manager.js';
import { distill } from '../../src/distill/pipeline.js';
import { estimateTokens } from '../../src/distill/token-counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../fixtures');

function fixtureUrl(name: string): string {
  return `file://${path.join(fixturesDir, name)}`;
}

describe('DOM Distillation Pipeline', () => {
  let manager: BrowserManager;

  afterEach(async () => {
    if (manager) await manager.cleanup();
  });

  // ── Test 1: Simple page distillation ─────────────────────────────────────
  it('simple page: returns non-empty markdown with positive token count < raw', async () => {
    manager = new BrowserManager();
    const pageWrapper = await manager.getPage(fixtureUrl('simple-page.html'));

    const result = await distill(pageWrapper.page);

    expect(typeof result.markdown).toBe('string');
    expect(result.markdown.length).toBeGreaterThan(0);
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.reductionRatio).toBeLessThan(1.0);

    await pageWrapper.close();
  });

  // ── Test 2: Table rendering ───────────────────────────────────────────────
  it('table-heavy: markdown contains heading and table data, no scripts/styles', async () => {
    manager = new BrowserManager();
    const pageWrapper = await manager.getPage(fixtureUrl('table-heavy.html'));

    const result = await distill(pageWrapper.page);

    // Main content preserved
    expect(result.markdown).toContain('Pricing Plans');

    // Table content is present — markdown tables use "|" OR at least the cell values
    const hasPipeChars = result.markdown.includes('|');
    const hasTableData =
      result.markdown.includes('Sessions/day') || result.markdown.includes('Unlimited');
    expect(hasPipeChars || hasTableData).toBe(true);

    // Scripts and styles must NOT leak through
    expect(result.markdown).not.toContain('console.log');
    expect(result.markdown).not.toContain('font-family');
    expect(result.markdown).not.toContain('border-collapse');

    await pageWrapper.close();
  });

  // ── Test 3: Interactive elements ──────────────────────────────────────────
  it('table-heavy: interactive elements include buttons, input, and links', async () => {
    manager = new BrowserManager();
    const pageWrapper = await manager.getPage(fixtureUrl('table-heavy.html'));

    const result = await distill(pageWrapper.page);

    expect(result.interactiveElements.length).toBeGreaterThan(0);

    // Verify buttons
    const buttons = result.interactiveElements.filter((el) => el.role === 'button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify input
    const inputs = result.interactiveElements.filter((el) => el.role.startsWith('input'));
    expect(inputs.length).toBeGreaterThan(0);
    const emailInput = inputs.find((el) => el.role === 'input:email');
    expect(emailInput).toBeDefined();

    // Verify links
    const links = result.interactiveElements.filter((el) => el.role === 'link');
    expect(links.length).toBeGreaterThan(0);

    // Every element has a non-empty selector
    for (const el of result.interactiveElements) {
      expect(el.selector).toBeTruthy();
      expect(el.selector.length).toBeGreaterThan(0);
    }

    await pageWrapper.close();
  });

  // ── Test 4: Token reduction ───────────────────────────────────────────────
  it('table-heavy: reductionRatio < 0.5 (at least 50% token reduction)', async () => {
    manager = new BrowserManager();
    const pageWrapper = await manager.getPage(fixtureUrl('table-heavy.html'));

    const result = await distill(pageWrapper.page);

    expect(result.reductionRatio).toBeLessThan(0.5);

    await pageWrapper.close();
  });

  // ── Test 5: Token counter unit tests ─────────────────────────────────────
  describe('estimateTokens()', () => {
    it('"hello world" → ~3 tokens', () => {
      // "hello world" = 11 chars → ceil(11/4) = 3
      expect(estimateTokens('hello world')).toBe(3);
    });

    it('empty string → 0 tokens', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('returns a positive integer for non-empty input', () => {
      const result = estimateTokens('Some longer text for testing purposes.');
      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});
