import { describe, it, expect, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { handleInteract } from '../../src/tools/interact.js';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const tablePageUrl = pathToFileURL(resolve('tests/fixtures/table-heavy.html')).href;
const simplePageUrl = pathToFileURL(resolve('tests/fixtures/simple-page.html')).href;

const browserManager = new BrowserManager();

afterAll(async () => {
  await browserManager.cleanup();
});

describe('handleInteract', () => {
  it('interact with fill action on email input returns page state', async () => {
    const result = await handleInteract(
      {
        url: tablePageUrl,
        actions: [{ type: 'fill', selector: '#email', value: 'test@test.com' }],
      },
      browserManager
    );
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('## Actions Performed');
    expect(result.content[0].text).toContain("Filled #email with 'test@test.com'");
  });

  it('interact with click action returns page state after click', async () => {
    const result = await handleInteract(
      {
        url: tablePageUrl,
        actions: [{ type: 'click', selector: 'button.cta-primary' }],
      },
      browserManager
    );
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('## Actions Performed');
    expect(result.content[0].text).toContain('Clicked button.cta-primary');
  });

  it('interact with invalid selector returns error message but does not crash and includes page state', { timeout: 15000 }, async () => {
    const result = await handleInteract(
      {
        url: simplePageUrl,
        actions: [{ type: 'click', selector: '#nonexistent-element-xyz' }],
      },
      browserManager
    );
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    // Should contain error info
    expect(result.content[0].text).toContain('## Actions Performed');
    expect(result.content[0].text).toMatch(/Failed|Error/i);
    // Should still include page state (distill output)
    expect(result.content[0].text.length).toBeGreaterThan(50);
  });
});
