import { BrowserManager } from '../browser/manager.js';
import { distill } from '../distill/pipeline.js';
import { defaultContext, errorMessage, errorResult, landedOutsidePolicy, renderPage, type ToolContext, type ToolResult } from './common.js';

export const ACTION_TYPES = ['click', 'fill', 'select', 'press', 'check', 'uncheck', 'hover', 'scroll', 'wait'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface Action {
  type: ActionType;
  selector?: string;
  value?: string;
}

const ACTION_TIMEOUT_MS = 5_000;

export async function handleInteract(
  args: { url: string; actions: Action[]; focus?: string; maxTokens?: number },
  browserManager: BrowserManager,
  ctx: ToolContext = defaultContext()
): Promise<ToolResult> {
  if (!Array.isArray(args.actions) || args.actions.length === 0) {
    return errorResult('interact needs a non-empty `actions` array.');
  }
  const total = args.actions.length + 2;
  try {
    await ctx.progress(0, total, `Opening ${args.url}`);
    const pageWrapper = await browserManager.getPage(args.url);
    const page = pageWrapper.page;
    try {
      const summary: string[] = [];
      const errors: string[] = [];

      for (const [i, action] of args.actions.entries()) {
        await ctx.progress(i + 1, total, `${action.type} ${action.selector ?? ''}`.trim());
        const sel = action.selector;
        const need = () => {
          if (!sel) throw new Error(`"${action.type}" requires a selector`);
          return page.locator(sel).first();
        };
        try {
          switch (action.type) {
            case 'click':
              await need().click({ timeout: ACTION_TIMEOUT_MS });
              summary.push(`- Clicked ${sel}`);
              break;
            case 'fill': {
              const loc = need();
              await loc.fill(action.value ?? '', { timeout: ACTION_TIMEOUT_MS });
              const isSecret = (await loc.getAttribute('type').catch(() => null)) === 'password';
              summary.push(`- Filled ${sel} with '${isSecret ? '••••••' : (action.value ?? '')}'`);
              break;
            }
            case 'select':
              await need().selectOption(action.value ?? '', { timeout: ACTION_TIMEOUT_MS });
              summary.push(`- Selected '${action.value ?? ''}' in ${sel}`);
              break;
            case 'press':
              if (sel) await page.locator(sel).first().press(action.value ?? 'Enter', { timeout: ACTION_TIMEOUT_MS });
              else await page.keyboard.press(action.value ?? 'Enter');
              summary.push(`- Pressed ${action.value ?? 'Enter'}${sel ? ` in ${sel}` : ''}`);
              break;
            case 'check':
              await need().check({ timeout: ACTION_TIMEOUT_MS });
              summary.push(`- Checked ${sel}`);
              break;
            case 'uncheck':
              await need().uncheck({ timeout: ACTION_TIMEOUT_MS });
              summary.push(`- Unchecked ${sel}`);
              break;
            case 'hover':
              await need().hover({ timeout: ACTION_TIMEOUT_MS });
              summary.push(`- Hovered ${sel}`);
              break;
            case 'scroll':
              if (sel) await page.locator(sel).first().scrollIntoViewIfNeeded({ timeout: ACTION_TIMEOUT_MS });
              else await page.mouse.wheel(0, Number(action.value) || 800);
              summary.push(`- Scrolled ${sel ? `to ${sel}` : `${Number(action.value) || 800}px`}`);
              break;
            case 'wait':
              if (sel) await page.waitForSelector(sel, { timeout: Math.min(Number(action.value) || 10_000, 30_000) });
              else await page.waitForTimeout(Math.min(Number(action.value) || 1000, 10_000));
              summary.push(`- Waited for ${sel ?? `${Math.min(Number(action.value) || 1000, 10_000)}ms`}`);
              break;
            default:
              throw new Error(`Unknown action type "${(action as Action).type}". Use one of: ${ACTION_TYPES.join(', ')}`);
          }
        } catch (err) {
          const message = errorMessage(err);
          summary.push(`- Failed ${action.type} on ${sel ?? '(page)'}: ${message}`);
          errors.push(`Action failed (${action.type} on ${sel ?? '(page)'}): ${message}`);
        }
      }

      // Let any navigation triggered by the last action settle, then re-check policy on where we landed.
      await page.waitForLoadState('domcontentloaded', { timeout: 5_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {});
      const blocked = landedOutsidePolicy(args.url, page.url(), ctx.config);
      if (blocked) {
        return errorResult(`Actions navigated to a URL blocked by policy: ${blocked}\n\n## Actions Performed\n${summary.join('\n')}`);
      }

      const result = await distill(page, {
        focus: args.focus,
        maxTokens: args.maxTokens ?? ctx.config.distill.maxTokens,
        elements: true,
        includeLinks: ctx.config.distill.includeLinks,
        publisherMarkdown: false, // after actions, the live DOM is the truth
        includeImages: ctx.config.distill.includeImages,
      });

      const lead = [`\n## Actions Performed\n${summary.join('\n')}`];
      if (errors.length > 0) lead.push(`\n## Errors\n${errors.map((e) => `- ${e}`).join('\n')}`);
      // Keep the action log first so agents (and tests) see the outcome before the page.
      const text = `${lead.join('\n').trim()}\n\n${renderPage(result, result.markdown, { notices: browserManager.drainNotices() })}`;

      return {
        content: [{ type: 'text', text }],
        structuredContent: {
          url: result.url,
          title: result.title,
          actionsSucceeded: args.actions.length - errors.length,
          actionsFailed: errors.length,
          errors,
        },
      };
    } finally {
      await pageWrapper.close();
    }
  } catch (err) {
    return errorResult(`Error interacting with ${args.url}: ${errorMessage(err)}`);
  }
}
