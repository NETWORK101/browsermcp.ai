import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

/**
 * Strips noisy tags from an HTML string in-place on a JSDOM document.
 */
function stripNoiseTags(document: Document, tags: string[]): void {
  for (const tag of tags) {
    for (const el of Array.from(document.querySelectorAll(tag))) {
      el.remove();
    }
  }
}

const NOISE_TAGS = [
  "script",
  "style",
  "svg",
  "noscript",
  "nav",
  "footer",
  "header",
];

/**
 * Extract article-quality HTML from a raw HTML string.
 * Falls back to <main> or <body> innerHTML when Readability returns null.
 */
export function extractContent(rawHtml: string): string {
  const dom = new JSDOM(rawHtml);
  const document = dom.window.document;

  // Try Readability first — works well for article-style content
  const reader = new Readability(document.cloneNode(true) as Document);
  const article = reader.parse();

  if (article?.content) {
    return article.content;
  }

  // Fallback: strip noise then return main/body
  stripNoiseTags(document, NOISE_TAGS);

  const main = document.querySelector("main");
  if (main) {
    return main.innerHTML;
  }

  return document.body?.innerHTML ?? rawHtml;
}
