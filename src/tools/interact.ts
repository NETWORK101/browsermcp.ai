import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';

interface Action {
  type: 'click' | 'fill' | 'select';
  selector: string;
  value?: string;
}

export async function handleInteract(
  args: { url: string; actions: Action[] },
  browserManager: BrowserManager
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const pageWrapper = await browserManager.getPage(args.url);
  try {
    const actionSummaryLines: string[] = [];
    const errors: string[] = [];

    const ACTION_TIMEOUT_MS = 5_000;

    for (const action of args.actions) {
      try {
        if (action.type === 'click') {
          await pageWrapper.locator(action.selector).click({ timeout: ACTION_TIMEOUT_MS });
          actionSummaryLines.push(`- Clicked ${action.selector}`);
        } else if (action.type === 'fill') {
          await pageWrapper.locator(action.selector).fill(action.value ?? '', { timeout: ACTION_TIMEOUT_MS });
          actionSummaryLines.push(`- Filled ${action.selector} with '${action.value ?? ''}'`);
        } else if (action.type === 'select') {
          await pageWrapper.locator(action.selector).selectOption(action.value ?? '', { timeout: ACTION_TIMEOUT_MS });
          actionSummaryLines.push(`- Selected '${action.value ?? ''}' in ${action.selector}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        actionSummaryLines.push(`- Failed ${action.type} on ${action.selector}: ${message}`);
        errors.push(`Action failed (${action.type} on ${action.selector}): ${message}`);
      }
    }

    const result = await distill(pageWrapper.page);

    let output = `## Actions Performed\n${actionSummaryLines.join('\n')}\n\n`;
    if (errors.length > 0) {
      output += `## Errors\n${errors.map((e) => `- ${e}`).join('\n')}\n\n`;
    }
    output += result.markdown;
    output += `\n\n---\n_Tokens: ${result.tokenCount} | Reduction: ${Math.round((1 - result.reductionRatio) * 100)}%_`;

    return { content: [{ type: 'text', text: output }] };
  } finally {
    await pageWrapper.close();
  }
}
