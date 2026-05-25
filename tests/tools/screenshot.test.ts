import { describe, it, expect, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { handleScreenshot } from '../../src/tools/screenshot.js';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const simplePageUrl = pathToFileURL(resolve('tests/fixtures/simple-page.html')).href;

const browserManager = new BrowserManager();

afterAll(async () => {
  await browserManager.cleanup();
});

describe('handleScreenshot', () => {
  it('screenshot of URL returns content with type image and non-empty base64 data', async () => {
    const result = await handleScreenshot({ url: simplePageUrl }, browserManager);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('image');
    expect(result.content[0].data.length).toBeGreaterThan(0);
    expect(result.content[0].mimeType).toBe('image/png');
  });

  it('screenshot with fullPage returns a valid base64 image', async () => {
    const result = await handleScreenshot({ url: simplePageUrl, fullPage: true }, browserManager);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('image');
    expect(result.content[0].data.length).toBeGreaterThan(0);
    // Verify it's valid base64 by decoding without throwing
    const buf = Buffer.from(result.content[0].data, 'base64');
    expect(buf.length).toBeGreaterThan(0);
  });
});
