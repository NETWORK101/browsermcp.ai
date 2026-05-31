import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';

export async function handleExtract(
  args: { url: string; schema?: object },
  browserManager: BrowserManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const pageWrapper = await browserManager.getPage(args.url);
  try {
    const result = await distill(pageWrapper.page);

    let output = '';
    if (args.schema) {
      output += `## Expected Schema\n\`\`\`json\n${JSON.stringify(args.schema, null, 2)}\n\`\`\`\n\n`;
    }
    output += result.markdown;
    output += `\n\n---\n_Tokens: ${result.tokenCount} | Reduction: ${Math.round((1 - result.reductionRatio) * 100)}%_`;

    return { content: [{ type: 'text', text: output }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Error extracting from ${args.url}: ${message}` }] };
  } finally {
    await pageWrapper.close();
  }
}
