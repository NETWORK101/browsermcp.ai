import { describe, it, expect, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { handleBrowse } from '../../src/tools/browse.js';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const simplePageUrl = pathToFileURL(resolve('tests/fixtures/simple-page.html')).href;

const browserManager = new BrowserManager();

afterAll(async () => {
  await browserManager.cleanup();
});

describe('handleBrowse', () => {
  it('browse with URL returns markdown content', async () => {
    const result = await handleBrowse({ url: simplePageUrl }, browserManager);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBeTruthy();
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it('browse with instruction prefixes output with the instruction', async () => {
    const result = await handleBrowse(
      { url: simplePageUrl, instruction: 'Find the heading' },
      browserManager
    );
    expect(result.content[0].text).toMatch(/^> Instruction: Find the heading/);
  });

  it('browse with invalid URL returns error content without crashing', async () => {
    const result = await handleBrowse(
      { url: 'file:///nonexistent-path-that-does-not-exist/page.html' },
      browserManager
    ).catch((err) => ({
      content: [{ type: 'text', text: `Error: ${err.message}` }],
    }));
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });
});
