import { describe, it, expect, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { handleExtract } from '../../src/tools/extract.js';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const simplePageUrl = pathToFileURL(resolve('tests/fixtures/simple-page.html')).href;
const tablePageUrl = pathToFileURL(resolve('tests/fixtures/table-heavy.html')).href;

const browserManager = new BrowserManager();

afterAll(async () => {
  await browserManager.cleanup();
});

describe('handleExtract', () => {
  it('extract with URL returns distilled markdown', async () => {
    const result = await handleExtract({ url: simplePageUrl }, browserManager);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it('extract with schema includes Expected Schema section with JSON', async () => {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        price: { type: 'number' },
      },
    };
    const result = await handleExtract({ url: tablePageUrl, schema }, browserManager);
    expect(result.content[0].text).toContain('## Expected Schema');
    expect(result.content[0].text).toContain('"type": "object"');
    expect(result.content[0].text).toContain('"title"');
  });
});
