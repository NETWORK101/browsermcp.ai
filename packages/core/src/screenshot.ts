import { getSession } from "./session.js";
import type { ScreenshotOptions, ScreenshotResult } from "./types.js";

/**
 * Capture a screenshot of a URL (full page, viewport, or specific element).
 */
export async function screenshot(
  opts: ScreenshotOptions,
): Promise<ScreenshotResult> {
  const { url, selector, fullPage = false, timeout } = opts;

  const session = getSession();
  const handle = await session.getPage(url, { timeout });

  try {
    let data: Buffer;

    if (selector) {
      const element = handle.page.locator(selector);
      data = (await element.screenshot()) as Buffer;
    } else {
      data = (await handle.page.screenshot({ fullPage })) as Buffer;
    }

    return {
      url,
      data,
      mimeType: "image/png",
    };
  } finally {
    await handle.close();
  }
}
