import { describe, it, expect } from 'vitest';
import { applyBudget, splitSections, scoreSections } from '../../src/distill/sections.js';

const DOC = `Intro paragraph about the product.

## Authentication
Use a bearer token. Tokens are scoped.

## Widgets
Create and list widgets.

\`\`\`bash
# a comment, not a heading
curl /widgets
\`\`\`

## Rate limits
100 requests per second. Exceeding the rate limit returns 429.

## Pricing
Starter is free, Growth is $29.`;

describe('splitSections', () => {
  it('splits on headings and keeps the lead section', () => {
    const s = splitSections(DOC);
    expect(s.map((x) => x.heading)).toEqual(['', 'Authentication', 'Widgets', 'Rate limits', 'Pricing']);
  });

  it('ignores # lines inside fenced code', () => {
    const widgets = splitSections(DOC).find((x) => x.heading === 'Widgets')!;
    expect(widgets.text).toContain('# a comment, not a heading');
  });
});

describe('scoreSections', () => {
  it('ranks the section titled with the focus term highest', () => {
    const sections = splitSections(DOC);
    const scores = scoreSections(sections, 'what are the rate limits?');
    const best = sections[scores.indexOf(Math.max(...scores))];
    expect(best.heading).toBe('Rate limits');
  });
});

describe('applyBudget', () => {
  it('returns the input untouched when it fits and there is no focus', () => {
    const r = applyBudget(DOC, { maxTokens: 10_000 });
    expect(r.markdown).toBe(DOC);
    expect(r.truncated).toBe(false);
  });

  it('with a focus, keeps the lead + relevant sections in document order and lists the rest', () => {
    const r = applyBudget(DOC, { focus: 'pricing', maxTokens: 10_000 });
    expect(r.markdown).toContain('Intro paragraph');
    expect(r.markdown).toContain('## Pricing');
    expect(r.markdown).not.toContain('## Authentication');
    expect(r.omitted).toEqual(expect.arrayContaining(['Authentication', 'Widgets', 'Rate limits']));
    expect(r.truncated).toBe(true);
  });

  it('a bulky intro never crowds the relevant section out of a tight budget', () => {
    const doc = `${'Intro infobox filler. '.repeat(200)}\n\n## Reception\nCritics raised security concerns.\n\n## History\nOld stuff.`;
    const r = applyBudget(doc, { focus: 'security concerns', maxTokens: 300 });
    expect(r.markdown).toContain('## Reception');
    expect(r.markdown).toContain('Intro infobox'); // trimmed lead fills the remainder
    expect(r.omitted).toContain('History');
  });

  it('a page that opens straight into a section has no lead to keep as filler', () => {
    const doc = `## Install\nRun the installer first.\n\n## Retries\nBack off exponentially.`;
    const r = applyBudget(doc, { focus: 'retries', maxTokens: 4000 });
    expect(r.markdown).toContain('## Retries');
    expect(r.markdown).not.toContain('## Install');
    expect(r.omitted).toEqual(['Install']);
  });

  it('falls back to document order when the focus matches nothing', () => {
    const r = applyBudget(DOC, { focus: 'kubernetes', maxTokens: 10_000 });
    expect(r.markdown).toBe(DOC);
  });

  it('enforces maxTokens in document order and reports omitted headings', () => {
    const r = applyBudget(DOC, { maxTokens: 30 });
    expect(r.truncated).toBe(true);
    expect(r.omitted.length).toBeGreaterThan(0);
    expect(r.markdown.length / 4).toBeLessThanOrEqual(31);
  });

  it('never returns empty: an oversized single section is sliced', () => {
    const big = '## Huge\n' + 'word '.repeat(5000);
    const r = applyBudget(big, { maxTokens: 100 });
    expect(r.markdown.length).toBeGreaterThan(0);
    expect(r.markdown.length).toBeLessThan(500);
  });
});
