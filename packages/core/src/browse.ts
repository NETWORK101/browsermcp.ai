import { getSession } from "./session.js";
import { distill } from "./distill/pipeline.js";
import { diffMarkdown } from "./diff.js";
import { estimateTokens, applyBudget } from "./tokens.js";
import { BrowseCache } from "./cache.js";
import type { BrowseOptions, BrowseResult } from "./types.js";

const cache = new BrowseCache();

// In-memory snapshot store for diff mode (keyed by URL)
const snapshots = new Map<string, string>();

/**
 * Browse a URL and return clean, token-efficient markdown.
 *
 * Supports:
 * - In-memory caching (skip with `fresh: true`)
 * - Token budget truncation
 * - Diff mode (`since: true`) to return only changes since last browse
 * - Instruction prepending
 */
export async function browse(opts: BrowseOptions): Promise<BrowseResult> {
  const {
    url,
    tokenBudget,
    mainContentOnly = true,
    instruction,
    since = false,
    fresh = false,
    timeout,
  } = opts;

  // Check cache unless fresh or diff mode
  if (!fresh && !since) {
    const cached = cache.get(url, mainContentOnly);
    if (cached) return cached;
  }

  // Get a page from the session manager
  const session = getSession();
  const handle = await session.getPage(url, { timeout });

  try {
    // Distill the page
    const distilled = await distill(handle.page);
    let markdown = distilled.markdown;

    // Prepend instruction if provided
    if (instruction) {
      markdown = `> **Instruction:** ${instruction}\n\n${markdown}`;
    }

    // Handle diff mode
    let diff = undefined;
    if (since) {
      const previousMarkdown = snapshots.get(url);
      if (previousMarkdown) {
        diff = diffMarkdown(previousMarkdown, distilled.markdown);
      }
    }

    // Store snapshot for future diffs
    snapshots.set(url, distilled.markdown);

    // Apply token budget
    const { markdown: finalMarkdown, truncated } = applyBudget(
      markdown,
      tokenBudget,
    );

    const result: BrowseResult = {
      url,
      markdown: finalMarkdown,
      tokens: estimateTokens(finalMarkdown),
      reductionRatio: distilled.reductionRatio,
      ...(diff ? { diff } : {}),
    };

    // Cache the result (only full, non-diff results)
    if (!since) {
      cache.set(url, mainContentOnly, result);
    }

    return result;
  } finally {
    await handle.close();
  }
}
