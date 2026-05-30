import type { Page } from "playwright";
import { extractContent } from "./readability.js";
import { htmlToMarkdown } from "./markdown.js";
import { extractInteractiveElements } from "./accessibility-tree.js";
import { estimateTokens } from "../tokens.js";

export type { InteractiveElement } from "./accessibility-tree.js";

export interface DistillResult {
  markdown: string;
  interactiveElements: Awaited<ReturnType<typeof extractInteractiveElements>>;
  tokenCount: number;
  reductionRatio: number;
}

/**
 * Format an interactive elements list as a markdown section.
 */
function formatInteractiveElements(
  elements: Awaited<ReturnType<typeof extractInteractiveElements>>,
): string {
  if (elements.length === 0) return "";

  const lines = elements.map((el) => {
    if (el.role === "link") {
      return `- [${el.role}] "${el.name}" → ${el.value ?? ""} (selector: ${el.selector})`;
    }
    return `- [${el.role}] "${el.name}" (selector: ${el.selector})`;
  });

  return `\n\n## Interactive Elements\n${lines.join("\n")}`;
}

/**
 * Distill a Playwright page into token-efficient markdown plus metadata.
 */
export async function distill(page: Page): Promise<DistillResult> {
  // Step 1: capture raw HTML and measure baseline token cost
  const rawHtml = await page.content();
  const rawTokenCount = estimateTokens(rawHtml);

  // Step 2: extract article content (readability → clean HTML)
  const cleanHtml = extractContent(rawHtml);

  // Step 3: convert to markdown
  let markdown = htmlToMarkdown(cleanHtml);

  // Step 4: collect interactive elements from live DOM
  const interactiveElements = await extractInteractiveElements(page);

  // Step 5: measure content-only tokens for reduction ratio (before interactive elements)
  const contentTokenCount = estimateTokens(markdown);
  const reductionRatio =
    rawTokenCount > 0 ? contentTokenCount / rawTokenCount : 1;

  // Step 6: append interactive element list to markdown
  markdown += formatInteractiveElements(interactiveElements);

  // Total token count includes the interactive elements section
  const tokenCount = estimateTokens(markdown);

  return {
    markdown,
    interactiveElements,
    tokenCount,
    reductionRatio,
  };
}
