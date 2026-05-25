import { BrowserManager } from '../browser/manager.js';

export async function handleScreenshot(
  args: { url: string; selector?: string; fullPage?: boolean },
  browserManager: BrowserManager
): Promise<{ content: Array<{ type: string; data: string; mimeType: string }> }> {
  const pageWrapper = await browserManager.getPage(args.url);
  try {
    const buffer = await pageWrapper.screenshot({
      selector: args.selector,
      fullPage: args.fullPage,
    });

    return {
      content: [
        {
          type: 'image',
          data: buffer.toString('base64'),
          mimeType: 'image/png',
        },
      ],
    };
  } finally {
    await pageWrapper.close();
  }
}
