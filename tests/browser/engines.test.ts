import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { BrowserManager, browserTypeFor, launchOptions, profileDirFor } from '../../src/browser/manager.js';
import { handleBrowse } from '../../src/tools/browse.js';
import type { BrowserEngine } from '../../src/config/schema.js';

const fixture = `file://${path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/docs-page.html')}`;
const installed = (e: BrowserEngine) => {
  try {
    return existsSync(browserTypeFor(e).executablePath());
  } catch {
    return false;
  }
};

let manager: BrowserManager | null = null;
afterEach(async () => {
  await manager?.cleanup();
  manager = null;
});

describe('browser engines', () => {
  for (const engine of ['chromium', 'firefox', 'webkit'] as BrowserEngine[]) {
    // CI installs Chromium only; other engines run wherever they're installed.
    it.skipIf(!installed(engine))(`${engine}: browse distills the same page`, async () => {
      manager = new BrowserManager({ engine });
      const r = await handleBrowse({ url: fixture, focus: 'rate limits' }, manager);
      expect(r.isError).toBeFalsy();
      expect((r.content[0] as { text: string }).text).toContain('429');
    });
  }

  it.skipIf(!installed('firefox'))('firefox: persistent profile lives in its own directory', async () => {
    const base = path.join(mkdtempSync(path.join(tmpdir(), 'bmcp-eng-')), 'profile');
    manager = new BrowserManager({ engine: 'firefox', profile: 'persistent', profileDir: base });
    const page = await manager.getPage(fixture);
    await page.close();
    expect(manager.sessionKind).toBe('persistent');
    expect(existsSync(`${base}-firefox`)).toBe(true);
    expect(existsSync(base)).toBe(false);
  });

  it('keeps per-engine profiles apart and rejects channel on non-Chromium engines', () => {
    expect(profileDirFor('chromium', '/p')).toBe('/p');
    expect(profileDirFor('webkit', '/p')).toBe('/p-webkit');
    expect(launchOptions('chromium', 'msedge')).toEqual({ channel: 'msedge' });
    expect(() => launchOptions('firefox', 'chrome')).toThrow(/only applies to the chromium engine/);
  });

  it('refuses CDP attach for non-Chromium engines with a clear error', async () => {
    manager = new BrowserManager({ engine: 'firefox', cdpEndpoint: 'http://localhost:9' });
    await expect(manager.getPage(fixture)).rejects.toThrow(/Chromium-based browsers only/);
  });
});
