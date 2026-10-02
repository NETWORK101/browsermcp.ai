import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs, toToolArgs, runCliTool } from '../src/cli/tools.js';
import { UsageTracker } from '../src/cost/tracker.js';
import { DEFAULT_CONFIG } from '../src/config/schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bmcp-cli-'));
const config = { ...DEFAULT_CONFIG, browser: { ...DEFAULT_CONFIG.browser, profile: 'ephemeral' as const } };

let server: http.Server;
let base = '';
beforeAll(async () => {
  server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><title>CLI page</title><main><h1>CLI page</h1>
      <h2>Install</h2><p>Run the installer and restart your terminal before continuing.</p>
      <h2>Retries</h2><p>Back off exponentially and honour the Retry-After header.</p>
      <p><a href="/docs/a">Doc A</a> <a href="https://example.org/x">External</a></p></main>`);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, io: { out: (s: string) => out.push(s), err: (s: string) => err.push(s) } };
}
const tracker = () => new UsageTracker(path.join(tmp(), 'usage.db'));

describe('CLI argument parsing', () => {
  it('handles --k v, --k=v, booleans and positionals', () => {
    const p = parseArgs(['https://x.test', '--focus', 'rate limits', '--max-tokens=800', '--json', '--same-origin']);
    expect(p.positionals).toEqual(['https://x.test']);
    expect(p.flags).toEqual({ focus: 'rate limits', 'max-tokens': '800', json: true, 'same-origin': true });
  });

  it('maps flags to tool arguments and validates them', () => {
    expect(toToolArgs('https://x.test', { 'max-tokens': '800', 'same-origin': true, json: true }))
      .toEqual({ url: 'https://x.test', maxTokens: 800, sameOrigin: true });
    expect(toToolArgs('u', { schema: '{"a":"string"}' })).toEqual({ url: 'u', schema: { a: 'string' } });
    expect(() => toToolArgs('u', { 'max-tokens': 'lots' })).toThrow(/positive number/);
    expect(() => toToolArgs('u', { schema: '{nope' })).toThrow(/valid JSON/);
  });
});

describe('CLI commands (in-process)', () => {
  it('read prints the fenced page, focused', async () => {
    const c = capture();
    const code = await runCliTool('read', [base, '--focus', 'retries'], { config, tracker: tracker(), io: c.io });
    expect(code).toBe(0);
    const out = c.out.join('\n');
    expect(out).toContain('<untrusted-page-content');
    expect(out).toContain('Retry-After');
    expect(out).not.toContain('Run the installer');
  });

  it('links --json prints structuredContent', async () => {
    const c = capture();
    const code = await runCliTool('links', [base, '--same-origin', '--json'], { config, tracker: tracker(), io: c.io });
    expect(code).toBe(0);
    const json = JSON.parse(c.out.join(''));
    expect(json.links.map((l: { href: string }) => l.href)).toEqual([`${base}/docs/a`]);
  });

  it('enforces the same policy as the MCP server', async () => {
    const c = capture();
    const code = await runCliTool('read', ['file:///etc/passwd'], { config, tracker: tracker(), io: c.io });
    expect(code).toBe(1);
    expect(c.err.join('')).toMatch(/Blocked by localmcp policy/);
  });

  it('prints usage and exits 2 on a missing URL', async () => {
    const c = capture();
    expect(await runCliTool('read', [], { config, tracker: tracker(), io: c.io })).toBe(2);
    expect(c.err.join('')).toMatch(/localmcp read <url>/);
  });
});

describe('CLI binary (end to end)', () => {
  // Async spawn on purpose: spawnSync would block this process, which is also serving the test page.
  it('`localmcp read` runs through tsx with an isolated home directory', async () => {
    const home = tmp();
    const browsers =
      process.env.PLAYWRIGHT_BROWSERS_PATH ??
      (process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
        : process.platform === 'win32'
          ? path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
          : path.join(os.homedir(), '.cache', 'ms-playwright'));
    const r = await new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) => {
      const child = spawn(process.execPath, [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(root, 'bin', 'localmcp.ts'), 'read', base, '--max-tokens', '300'], {
        cwd: home,
        env: { ...process.env, HOME: home, USERPROFILE: home, PLAYWRIGHT_BROWSERS_PATH: browsers },
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('close', (status) => resolve({ status, stdout, stderr }));
    });
    expect(r.stderr).not.toMatch(/__name is not defined/);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('# CLI page');
    expect(fs.existsSync(path.join(home, '.localmcp', 'usage.db'))).toBe(true); // usage stayed in the isolated home
  });
});
