import { estimateTokens } from "./tokens.js";
import type { DiffLine, DiffOutput } from "./types.js";

/**
 * Compute a line-level diff between two markdown strings.
 * Uses a simple LCS-based approach -- no external dependency needed.
 */
export function diffMarkdown(previous: string, current: string): DiffOutput {
  const prevLines = previous.split("\n");
  const currLines = current.split("\n");

  // Build LCS table
  const m = prevLines.length;
  const n = currLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (prevLines[i - 1] === currLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const lines: DiffLine[] = [];
  let i = m,
    j = n;

  const stack: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prevLines[i - 1] === currLines[j - 1]) {
      stack.push({ type: "context", text: prevLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", text: currLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", text: prevLines[i - 1] });
      i--;
    }
  }

  // Reverse since we built it backwards
  stack.reverse();

  // Collapse to only show context around changes (3 lines of context)
  const contextRadius = 3;
  const changeIndices = new Set<number>();
  stack.forEach((line, idx) => {
    if (line.type !== "context") {
      for (
        let k = Math.max(0, idx - contextRadius);
        k <= Math.min(stack.length - 1, idx + contextRadius);
        k++
      ) {
        changeIndices.add(k);
      }
    }
  });

  let lastIncluded = -1;
  let addedCount = 0;
  let removedCount = 0;
  let changedSections = 0;
  let inChange = false;

  stack.forEach((line, idx) => {
    if (changeIndices.has(idx)) {
      if (lastIncluded < idx - 1 && lastIncluded !== -1) {
        lines.push({ type: "context", text: "..." });
      }
      lines.push(line);
      lastIncluded = idx;
    }

    if (line.type === "added") addedCount++;
    if (line.type === "removed") removedCount++;
    if (line.type !== "context" && !inChange) {
      changedSections++;
      inChange = true;
    }
    if (line.type === "context") inChange = false;
  });

  // If no changes, say so
  if (addedCount === 0 && removedCount === 0) {
    return {
      lines: [{ type: "context", text: "No changes detected." }],
      addedCount: 0,
      removedCount: 0,
      changedSections: 0,
      diffTokens: estimateTokens("No changes detected."),
      fullPageTokens: estimateTokens(current),
    };
  }

  const diffText = lines
    .map((l) => {
      const prefix =
        l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  ";
      return prefix + l.text;
    })
    .join("\n");

  return {
    lines,
    addedCount,
    removedCount,
    changedSections,
    diffTokens: estimateTokens(diffText),
    fullPageTokens: estimateTokens(current),
  };
}
