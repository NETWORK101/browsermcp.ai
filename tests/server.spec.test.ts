import { describe, it, expect, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createServer, TOOLS } from '../src/server.js';
import { UsageTracker } from '../src/cost/tracker.js';
import { DEFAULT_CONFIG, type BrowserMcpConfig } from '../src/config/schema.js';

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const docsUrl = `file://${path.join(fixtures, 'docs-page.html')}`;
const tableUrl = `file://${path.join(fixtures, 'table-heavy.html')}`;

type Text = { type: string; text: string };

function config(policy: Partial<BrowserMcpConfig['policy']> = {}): BrowserMcpConfig {
  return {
    ...DEFAULT_CONFIG,
    browser: { ...DEFAULT_CONFIG.browser, profile: 'ephemeral' },
    policy: { ...DEFAULT_CONFIG.policy, allowFileUrls: true, ...policy },
  };
}

const closers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (closers.length) await closers.pop()!();
});

async function connect(opts: { policy?: Partial<BrowserMcpConfig['policy']>; sampling?: (prompt: string) => string } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'browsermcp-test-'));
  const tracker = new UsageTracker(path.join(dir, 'usage.db'));
  const server = createServer({ config: config(opts.policy), tracker });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);

  const client = new Client(
    { name: 'spec-test', version: '1.0.0' },
    { capabilities: opts.sampling ? { sampling: {} } : {} }
  );
  if (opts.sampling) {
    const reply = opts.sampling;
    client.setRequestHandler(CreateMessageRequestSchema, async (req) => {
      const msg = req.params.messages[0].content as { type: 'text'; text: string };
      return { role: 'assistant', model: 'test-model', content: { type: 'text', text: reply(msg.text) } };
    });
  }
  await client.connect(ct);
  closers.push(async () => {
    await client.close();
    await server.close();
    tracker.close();
  });
  // listTools first so the client caches outputSchemas and validates structuredContent on every call.
  await client.listTools();
  return { client, tracker };
}

describe('MCP spec surface', () => {
  it('declares title + annotations on every tool, and marks only interact as side-effecting', async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    for (const t of tools) {
      expect(t.title, t.name).toBeTruthy();
      expect(t.annotations, t.name).toBeDefined();
    }
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    expect(byName.browse.annotations!.readOnlyHint).toBe(true);
    expect(byName.interact.annotations!.readOnlyHint).toBe(false);
    expect(byName.interact.annotations!.destructiveHint).toBe(true);
    expect(byName.extract.outputSchema).toBeDefined();
  });

  it('keeps the schema tax small (< 1,500 tokens for all tool definitions)', () => {
    expect(Math.ceil(JSON.stringify(TOOLS).length / 4)).toBeLessThan(1500);
  });

  it('sends server instructions that tell the model page content is untrusted', async () => {
    const { client } = await connect();
    expect(client.getInstructions()).toMatch(/untrusted-page-content/);
    expect(client.getServerVersion()?.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('hides interact entirely in read-only mode', async () => {
    const { client } = await connect({ policy: { allowInteract: false } });
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).not.toContain('interact');
    const r = await client.callTool({ name: 'interact', arguments: { url: tableUrl, actions: [{ type: 'click', selector: 'button' }] } });
    expect(r.isError).toBe(true);
  });
});

describe('policy enforcement at the protocol boundary', () => {
  it('refuses file:// unless explicitly allowed', async () => {
    const { client } = await connect({ policy: { allowFileUrls: false } });
    const r = await client.callTool({ name: 'browse', arguments: { url: docsUrl } });
    expect(r.isError).toBe(true);
    expect((r.content as Text[])[0].text).toMatch(/Blocked by browsermcp policy/);
  });

  it('refuses hosts in policy.deny without launching a browser', async () => {
    const { client } = await connect({ policy: { deny: ['*.internal.test'] } });
    const r = await client.callTool({ name: 'browse', arguments: { url: 'https://admin.internal.test/' } });
    expect(r.isError).toBe(true);
  });
});

describe('browse', () => {
  it('focus returns the relevant section, lists omitted ones, and fences page content', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const r = await client.callTool({ name: 'browse', arguments: { url: docsUrl, focus: 'rate limits' } });
    const text = (r.content as Text[])[0].text;
    expect(r.isError).toBeFalsy();
    expect(text).toContain('Rate limits');
    expect(text).toContain('429');
    expect(text).not.toContain('bearer token');
    expect(text).toMatch(/Omitted sections.*Authentication/);
    const sc = r.structuredContent as { omittedSections: string[]; title: string };
    expect(sc.title).toBe('Acme API Reference');
    expect(sc.omittedSections).toContain('Pricing');
  });

  it('an injected closing tag in the page cannot break out of the fence', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const r = await client.callTool({ name: 'browse', arguments: { url: docsUrl, focus: 'changelog' } });
    const text = (r.content as Text[])[0].text;
    expect(text).toContain('admin mode');
    expect(text.match(/<\/untrusted-page-content>/g)).toHaveLength(1);
  });

  it('emits progress notifications when the client asks for them', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const seen: number[] = [];
    await client.callTool({ name: 'browse', arguments: { url: docsUrl } }, undefined, {
      onprogress: (p) => seen.push(p.progress),
    });
    expect(seen.length).toBeGreaterThanOrEqual(2);
  });

  it('diff mode stores a snapshot, reports no change on re-read, and exposes it as a resource', { timeout: 40_000 }, async () => {
    const { client } = await connect();
    const first = await client.callTool({ name: 'browse', arguments: { url: docsUrl, diff: true } });
    expect((first.structuredContent as { firstRead: boolean }).firstRead).toBe(true);

    // The legacy `watch` name still works and maps to diff mode.
    const second = await client.callTool({ name: 'watch', arguments: { url: docsUrl } });
    expect((second.structuredContent as { changed: boolean }).changed).toBe(false);

    const { resources } = await client.listResources();
    const res = resources.find((x) => x.name === docsUrl);
    expect(res).toBeDefined();
    const read = await client.readResource({ uri: res!.uri });
    expect((read.contents[0] as { text: string }).text).toContain('Rate limits');
  });
});

describe('extract', () => {
  it('returns JSON-LD, meta, and tables as row objects without any model', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const r = await client.callTool({ name: 'extract', arguments: { url: docsUrl } });
    const sc = r.structuredContent as any;
    expect(sc.method).toBe('dom');
    expect(sc.jsonLd[0]['@type']).toBe('SoftwareApplication');
    expect(sc.meta['og:title']).toBe('Acme API');
    expect(sc.tables[0].rows).toContainEqual({ Plan: 'Growth', Price: '$29', Requests: '1M' });
  });

  it('fills a schema through MCP sampling when the client supports it', { timeout: 30_000 }, async () => {
    let promptSeen = '';
    const { client } = await connect({
      sampling: (prompt) => {
        promptSeen = prompt;
        return '```json\n{"plans":[{"name":"Free","sessions":"100"},{"name":"Pro","sessions":"1,000"}]}\n```';
      },
    });
    const schema = { plans: [{ name: 'string', sessions: 'string' }] };
    const r = await client.callTool({ name: 'extract', arguments: { url: tableUrl, schema } });
    const sc = r.structuredContent as any;
    expect(sc.method).toBe('sampling');
    expect(sc.data.plans[1]).toEqual({ name: 'Pro', sessions: '1,000' });
    expect(promptSeen).toContain('untrusted-page-content');
    expect((r.content as Text[])[0].text).toContain('MCP sampling');
  });

  it('falls back to a schema hint when the client cannot sample', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const r = await client.callTool({ name: 'extract', arguments: { url: tableUrl, schema: { plans: [] } } });
    expect((r.structuredContent as any).method).toBe('dom');
    expect((r.content as Text[])[0].text).toContain('## Expected Schema');
  });
});

describe('links', () => {
  it('returns absolute, de-duplicated links and filters by origin', { timeout: 30_000 }, async () => {
    const { client } = await connect();
    const all = await client.callTool({ name: 'links', arguments: { url: docsUrl } });
    const links = (all.structuredContent as any).links as Array<{ href: string }>;
    expect(links.filter((l) => l.href.endsWith('/docs'))).toHaveLength(1); // deduped
    expect(links.some((l) => l.href.includes('#'))).toBe(false); // fragment-only links skipped
    expect(links.some((l) => l.href === 'https://github.com/acme/api')).toBe(true);

    const local = await client.callTool({ name: 'links', arguments: { url: docsUrl, sameOrigin: true } });
    expect(((local.structuredContent as any).links as Array<{ href: string }>).every((l) => !l.href.startsWith('https://github.com'))).toBe(true);
  });
});
