import { Page } from 'playwright';
import { extractContent } from './readability.js';
import { htmlToMarkdown, MarkdownOptions } from './markdown.js';
import { extractInteractiveElements, InteractiveElement } from './accessibility-tree.js';
import { estimateTokens } from './token-counter.js';
import { applyBudget } from './sections.js';

export type { InteractiveElement } from './accessibility-tree.js';

export interface DistillOptions extends MarkdownOptions {
  /** What the agent is looking for — sections are ranked against it. */
  focus?: string;
  /** Token budget for the content (interactive elements are budgeted separately). */
  maxTokens?: number;
  /** Append the interactive-elements list. Defaults to true for backward compatibility. */
  elements?: boolean;
}

export interface DistillResult {
  markdown: string;
  /** Full distilled content before focus/budget — used for diff snapshots. */
  fullMarkdown: string;
  title: string;
  url: string;
  interactiveElements: InteractiveElement[];
  tokenCount: number;
  rawTokenCount: number;
  reductionRatio: number;
  truncated: boolean;
  omittedSections: string[];
}

/**
 * Format an interactive elements list as a markdown section.
 */
export function formatInteractiveElements(elements: InteractiveElement[]): string {
  if (elements.length === 0) return '';

  const lines = elements.map((el) => {
    if (el.role === 'link') {
      return `- [${el.role}] "${el.name}" → ${el.value ?? ''} (selector: ${el.selector})`;
    }
    const v = el.value ? ` = "${el.value}"` : '';
    return `- [${el.role}] "${el.name}"${v} (selector: ${el.selector})`;
  });

  return `\n\n## Interactive Elements\n${lines.join('\n')}`;
}

/**
 * Distill a Playwright page into token-efficient markdown plus metadata.
 */
export async function distill(page: Page, opts: DistillOptions = {}): Promise<DistillResult> {
  // Step 1: capture raw HTML and measure baseline token cost
  const rawHtml = await page.content();
  const rawTokenCount = estimateTokens(rawHtml);

  // Step 2: extract article content (readability → clean HTML)
  const cleanHtml = extractContent(rawHtml, page.url());

  // Step 3: convert to markdown
  const fullMarkdown = htmlToMarkdown(cleanHtml, opts);

  // Step 4: rank by focus and fit the token budget
  const budget = applyBudget(fullMarkdown, { focus: opts.focus, maxTokens: opts.maxTokens });
  let markdown = budget.markdown;

  // Step 5: measure content-only tokens for reduction ratio (before interactive elements)
  const contentTokenCount = estimateTokens(markdown);
  const reductionRatio = rawTokenCount > 0 ? contentTokenCount / rawTokenCount : 1;

  // Step 6: collect + append interactive elements from the live DOM
  const interactiveElements = opts.elements === false ? [] : await extractInteractiveElements(page);
  markdown += formatInteractiveElements(interactiveElements);

  return {
    markdown,
    fullMarkdown,
    title: await page.title(),
    url: page.url(),
    interactiveElements,
    tokenCount: estimateTokens(markdown),
    rawTokenCount,
    reductionRatio,
    truncated: budget.truncated,
    omittedSections: budget.omitted,
  };
}
