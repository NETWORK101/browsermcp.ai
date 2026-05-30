import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';
import { diffMarkdown } from '../distill/differ.js';
import { UsageTracker } from '../cost/tracker.js';

export async function handleWatch(
  args: { url: string },
  browserManager: BrowserManager,
  tracker: UsageTracker
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const pageWrapper = await browserManager.getPage(args.url);
  try {
    // Distill the current page
    const current = await distill(pageWrapper.page);
    const previous = tracker.getSnapshot(args.url);

    // Save the new snapshot
    tracker.saveSnapshot(args.url, current.markdown, current.tokenCount);

    // First read — no previous snapshot to diff against
    if (!previous) {
      let output = `## watch — First read (no previous snapshot)\n\n`;
      output += current.markdown;
      output += `\n\n---\n_First snapshot saved. Next call will show changes._`;
      output += `\n_Tokens: ${current.tokenCount} | Reduction: ${Math.round((1 - current.reductionRatio) * 100)}%_`;
      return { content: [{ type: 'text', text: output }] };
    }

    // Diff against previous
    const diff = diffMarkdown(previous.markdown, current.markdown);

    // No changes
    if (diff.addedCount === 0 && diff.removedCount === 0) {
      const output = `## watch — No changes detected\n\nURL: ${args.url}\nLast checked: ${previous.updatedAt}\n\nPage content is identical to the previous snapshot.\n\n---\n_Diff tokens: 0 | Full page would have been: ${diff.fullPageTokens} tokens_`;
      return { content: [{ type: 'text', text: output }] };
    }

    // Build diff output
    let output = `## watch — ${diff.changedSections} section${diff.changedSections !== 1 ? 's' : ''} changed\n\n`;
    output += `URL: ${args.url}\n`;
    output += `Last checked: ${previous.updatedAt}\n`;
    output += `Changes: +${diff.addedCount} added, -${diff.removedCount} removed\n\n`;
    output += `### Diff\n\n\`\`\`diff\n`;

    for (const line of diff.lines) {
      const prefix = line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  ';
      output += prefix + line.text + '\n';
    }

    output += `\`\`\`\n\n---\n`;
    output += `_Diff tokens: ${diff.diffTokens} | Full page: ${diff.fullPageTokens} tokens | Saved: ${Math.round((1 - diff.diffTokens / diff.fullPageTokens) * 100)}% vs re-read_`;

    return { content: [{ type: 'text', text: output }] };
  } finally {
    await pageWrapper.close();
  }
}
