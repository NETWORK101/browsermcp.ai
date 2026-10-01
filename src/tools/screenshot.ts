import { BrowserManager } from '../browser/manager.js';
import { defaultContext, errorMessage, errorResult, landedOutsidePolicy, type ToolContext, type ToolResult } from './common.js';

export interface ScreenshotArgs {
  url: string;
  selector?: string;
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
  waitFor?: string;
}

export async function handleScreenshot(
  args: ScreenshotArgs,
  browserManager: BrowserManager,
  ctx: ToolContext = defaultContext()
): Promise<ToolResult> {
  try {
    await ctx.progress(0, 2, `Opening ${args.url}`);
    const pageWrapper = await browserManager.getPage(args.url, { waitFor: args.waitFor });
    try {
      const redirected = landedOutsidePolicy(args.url, pageWrapper.page.url(), ctx.config);
      if (redirected) return errorResult(`${args.url} redirected to a URL blocked by policy: ${redirected}`);
      await ctx.progress(1, 2, 'Capturing');
      const format = args.format === 'jpeg' ? 'jpeg' : 'png';
      const buffer = await pageWrapper.screenshot({
        selector: args.selector,
        fullPage: args.fullPage,
        format,
        quality: args.quality,
      });
      return {
        content: [{ type: 'image', data: buffer.toString('base64'), mimeType: `image/${format}` }],
      };
    } finally {
      await pageWrapper.close();
    }
  } catch (err) {
    return errorResult(`Error taking screenshot of ${args.url}: ${errorMessage(err)}`);
  }
}
