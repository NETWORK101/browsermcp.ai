import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';

export async function handleBrowse(
  args: { url: string; instruction?: string },
  browserManager: BrowserManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const pageWrapper = await browserManager.getPage(args.url);
  try {
    const result = await distill(pageWrapper.page);

    let output = '';
    if (args.instruction) {
      output += `> Instruction: ${args.instruction}\n\n`;
    }
    output += result.markdown;
    output += `\n\n---\n_Tokens: ${result.tokenCount} | Reduction: ${Math.round((1 - result.reductionRatio) * 100)}%_`;

    return { content: [{ type: 'text', text: output }] };
  } finally {
    await pageWrapper.close();
  }
}
