/**
 * Simple character-based token estimation.
 * ~4 chars per token for English text — good enough for relative comparisons.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
