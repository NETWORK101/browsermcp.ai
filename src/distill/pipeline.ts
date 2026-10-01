import { Page } from 'playwright';
import { extractContent } from './readability.js';
import { htmlToMarkdown, MarkdownOptions } from './markdown.js';
import { extractInteractiveElements, InteractiveElement } from './accessibility-tree.js';
import { estimateTokens } from './token-counter.js';
import { applyBudget } from './sections.js';
import {
  readPageMeta, fetchPublisherMarkdown, splitFrontMatter, mergeFrontMatter, trimMarkdown, markdownMatchesPage,
  type PageMeta, type ContentSource,
} from './metadata.js';

export type { InteractiveElement } from './accessibility-tree.js';

export interface DistillOptions extends MarkdownOptions {
  /** What the agent is looking for — sections are ranked against it. */
  focus?: string;
  /** Token budget for the content (interactive elements are budgeted separately). */
  maxTokens?: number;
  /** Append the interactive-elements list. Defaults to true for backward compatibility. */
  elements?: boolean;
  /** Use the publisher's own markdown when the page offers it. Default true. */
  publisherMarkdown?: boolean;
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
  /** Provenance read from JSON-LD, OpenGraph, <meta>, canonical and markdown front matter. */
  meta: PageMeta;
  /** Where the text came from: the rendered DOM, or markdown the publisher serves for agents. */
  source: ContentSource;
  /** Things the agent should know about how this result was produced. */
  notes: string[];
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
  // Step 1: metadata first — what does the page say about itself?
  let meta = await readPageMeta(page);
  const publisherP = opts.publisherMarkdown === false
    ? Promise.resolve(null)
    : fetchPublisherMarkdown(page, meta.markdownAlternate);

  // Step 2: capture raw HTML (in parallel with the publisher-markdown request) for the baseline
  const rawHtml = await page.content();
  const rawTokenCount = estimateTokens(rawHtml);

  // Step 3: prefer the publisher's markdown; otherwise distill the rendered DOM
  let publisher = await publisherP;
  const notes: string[] = [];
  const renderedTitle = await page.title();
  if (publisher && !markdownMatchesPage(publisher.markdown, renderedTitle)) {
    notes.push(`The publisher's markdown (${publisher.url}) didn't match the rendered page, so the rendered page was used.`);
    publisher = null;
  }
  let fullMarkdown: string;
  let source: ContentSource = 'rendered';
  if (publisher) {
    const { body, fields } = splitFrontMatter(publisher.markdown);
    meta = mergeFrontMatter(meta, fields);
    fullMarkdown = trimMarkdown(body, opts);
    source = publisher.source;
  } else {
    fullMarkdown = htmlToMarkdown(extractContent(rawHtml, page.url()), opts);
  }

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
    title: renderedTitle || meta.title || '',
    url: page.url(),
    interactiveElements,
    tokenCount: estimateTokens(markdown),
    rawTokenCount,
    reductionRatio,
    truncated: budget.truncated,
    omittedSections: budget.omitted,
    meta,
    source,
    notes,
  };
}
