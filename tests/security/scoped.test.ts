import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { chromium, type Browser } from 'playwright';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createServer } from '../../src/server.js';
import { UsageTracker } from '../../src/cost/tracker.js';
import { DEFAULT_CONFIG, type BrowserMcpConfig } from '../../src/config/schema.js';
import { interactDecision, isDeniedRequest } from '../../src/security/policy.js';

type Text = { type: string; text: string };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bmcp-scope-'));

function config(browser: Partial<BrowserMcpConfig['browser']> = {}, policy: Partial<BrowserMcpConfig['policy']> = {}): BrowserMcpConfig {
  return {
    ...DEFAULT_CONFIG,
    browser: { ...DEFAULT_CONFIG.browser, profile: 'ephemeral', ...browser },
    policy: { ...DEFAULT_CONFIG.policy, ...policy },
  };
}

const closers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (closers.length) await closers.pop()!();
});

async function connect(cfg: BrowserMcpConfig) {
  const tracker = new UsageTracker(path.join(tmp(), 'usage.db'));
  const server = createServer({ config: cfg, tracker });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);
  const client = new Client({ name: 'scope-test', version: '1.0.0' });
  await client.connect(ct);
  closers.push(async () => {
    await client.close();
    await server.close();
    tracker.close();
  });
  return client;
}

// Two local "hosts" told apart by port: the page lives on one, a third party on the other.
const hits: string[] = [];
let page: http.Server;
let thirdParty: http.Server;
let pageBase = '';
let thirdHost = '';

beforeAll(async () => {
  thirdParty = http.createServer((req, res) => {
    hits.push(req.url ?? '');
    res.writeHead(200, { 'content-type': req.url === '/frame' ? 'text/html' : 'image/gif', 'access-control-allow-origin': '*' });
    res.end(req.url === '/frame' ? '<p>third-party frame</p>' : '');
  });
  await new Promise<void>((r) => thirdParty.listen(0, '127.0.0.1', () => r()));
  thirdHost = `127.0.0.1:${(thirdParty.address() as AddressInfo).port}`;

  page = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><title>Scoped</title><main><h1>Scoped page</h1>
      <p>This page pulls in third-party resources that a deny rule should stop.</p>
      <img src="http://${thirdHost}/pixel.gif">
      <iframe src="http://${thirdHost}/frame"></iframe>
      <script>fetch("http://${thirdHost}/api").catch(() => {})</script></main>`);
  });
  await new Promise<void>((r) => page.listen(0, '127.0.0.1', () => r()));
  pageBase = `http://127.0.0.1:${(page.address() as AddressInfo).port}`;
});

afterAll(() => {
  page.close();
  thirdParty.close();
});

describe('signed in, but scoped: allowInteract "auto"', () => {
  it('allows interact in a throwaway session', () => {
    expect(interactDecision(config()).allowed).toBe(true);
  });

  it('turns interact off for a persistent profile, an existing auto profile, or CDP attach', () => {
    const dir = path.join(tmp(), 'profile');
    fs.mkdirSync(dir);
    for (const browser of [
      { profile: 'persistent' as const, profileDir: dir },
      { profile: 'auto' as const, profileDir: dir },
      { cdpEndpoint: 'http://127.0.0.1:9222' },
    ]) {
      const d = interactDecision(config(browser));
      expect(d.allowed).toBe(false);
      if (!d.allowed) expect(d.reason).toMatch(/signed-in session/);
    }
  });

  it('an explicit true or false always wins', () => {
    expect(interactDecision(config({ profile: 'persistent' }, { allowInteract: true })).allowed).toBe(true);
    expect(interactDecision(config({}, { allowInteract: false })).allowed).toBe(false);
  });

  it('hides interact from tools/list and refuses calls when signed in', async () => {
    const client = await connect(config({ profile: 'persistent', profileDir: path.join(tmp(), 'p') }));
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).not.toContain('interact');
    const r = await client.callTool({ name: 'interact', arguments: { url: pageBase, actions: [{ type: 'click', selector: 'h1' }] } });
    expect(r.isError).toBe(true);
    expect((r.content as Text[])[0].text).toMatch(/allowInteract/);
  });
});

describe('deny rules cover every request, not just navigation', () => {
  it('isDeniedRequest matches hosts and ignores non-network schemes', () => {
    const policy = { ...DEFAULT_CONFIG.policy, deny: ['*.tracker.test', 'localhost:4000'] };
    expect(isDeniedRequest('https://cdn.tracker.test/x.js', policy)).toBe(true);
    expect(isDeniedRequest('wss://ws.tracker.test/', policy)).toBe(true);
    expect(isDeniedRequest('http://localhost:4000/a', policy)).toBe(true);
    expect(isDeniedRequest('http://localhost:4001/a', policy)).toBe(false);
    expect(isDeniedRequest('data:image/gif;base64,R0l', policy)).toBe(false);
  });

  it('without a deny rule, the page reaches the third party (control)', async () => {
    hits.length = 0;
    const client = await connect(config());
    const r = await client.callTool({ name: 'browse', arguments: { url: pageBase } });
    expect(r.isError).toBeFalsy();
    expect(hits.length).toBeGreaterThan(0);
  });

  it('with a deny rule, images, iframes and fetch to that host never leave the browser', async () => {
    hits.length = 0;
    const client = await connect(config({}, { deny: [thirdHost] }));
    const r = await client.callTool({ name: 'browse', arguments: { url: pageBase } });
    expect(r.isError).toBeFalsy();
    expect((r.content as Text[])[0].text).toContain('Scoped page');
    expect(hits).toEqual([]);
  });
});

describe('policy holds when attached to a running browser over CDP', () => {
  let external: Browser | null = null;
  let endpoint = '';

  beforeAll(async () => {
    const port = 9300 + Math.floor(Math.random() * 500);
    try {
      external = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
      endpoint = `http://127.0.0.1:${port}`;
    } catch {
      external = null;
    }
  });
  afterAll(async () => {
    await external?.close();
  });

  it('reads through the attached browser, blocks denied hosts, and keeps interact off', async (ctx) => {
    if (!external) ctx.skip();
    hits.length = 0;
    const client = await connect(config({ cdpEndpoint: endpoint }, { deny: [thirdHost] }));
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).not.toContain('interact');

    const r = await client.callTool({ name: 'browse', arguments: { url: pageBase } });
    expect(r.isError).toBeFalsy();
    expect((r.content as Text[])[0].text).toContain('Scoped page');
    expect(hits).toEqual([]);

    const denied = await client.callTool({ name: 'browse', arguments: { url: `http://${thirdHost}/frame` } });
    expect(denied.isError).toBe(true);
  });
});
