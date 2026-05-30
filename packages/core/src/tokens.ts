/**
 * Simple character-based token estimation.
 * ~4 chars per token for English text -- good enough for relative comparisons.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Truncate markdown to fit within a token budget.
 * If truncation occurs, appends a note indicating content was trimmed.
 */
export function applyBudget(
  markdown: string,
  budget?: number,
): { markdown: string; truncated: boolean } {
  if (!budget || budget <= 0) {
    return { markdown, truncated: false };
  }

  const currentTokens = estimateTokens(markdown);
  if (currentTokens <= budget) {
    return { markdown, truncated: false };
  }

  // Budget in characters (4 chars per token), reserving space for the truncation note
  const truncationNote = "\n\n---\n*Content truncated to fit token budget.*";
  const noteChars = truncationNote.length;
  const charBudget = budget * 4 - noteChars;

  if (charBudget <= 0) {
    return { markdown: truncationNote.trim(), truncated: true };
  }

  // Try to truncate at a line boundary
  const truncated = markdown.slice(0, charBudget);
  const lastNewline = truncated.lastIndexOf("\n");
  const cleanCut =
    lastNewline > charBudget * 0.8 ? truncated.slice(0, lastNewline) : truncated;

  return {
    markdown: cleanCut + truncationNote,
    truncated: true,
  };
}
