/**
 * Reproducible token benchmark — `npm run bench`.
 *
 * For each named public page, measures (tokens ≈ characters ÷ 4 everywhere):
 *  - rendered HTML: what a browser holds after load (the raw material),
 *  - browsermcp full: browse with no budget (what distillation alone does),
 *  - browsermcp default: browse with the default 4,000-token budget,
 *  - Playwright MCP: `browser_snapshot`, the inline page representation an agent reads
 *    (in @playwright/mcp 0.0.83, `browser_navigate` returns only a link to a snapshot file).
 * Writes benchmarks/results.md. Pages change; re-run for current numbers.
 */
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { BrowserManager } from '../src/browser/manager.js';
import { handleBrowse } from '../src/tools/browse.js';
import { TOOLS } from '../src/server.js';
import { VERSION } from '../src/version.js';

const PLAYWRIGHT_MCP = '@playwright/mcp@0.0.83';

const PAGES = [
  { name: 'Stripe API reference', url: 'https://docs.stripe.com/api' },
  { name: 'Vercel docs', url: 'https://vercel.com/docs' },
  { name: 'GitHub REST: Issues', url: 'https://docs.github.com/en/rest/issues/issues' },
  { name: 'MDN: Accept header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept' },
  { name: 'Python: json module', url: 'https://docs.python.org/3/library/json.html' },
  { name: 'Next.js docs', url: 'https://nextjs.org/docs' },
  { name: 'Wikipedia: Model Context Protocol', url: 'https://en.wikipedia.org/wiki/Model_Context_Protocol' },
  { name: 'Hacker News front page', url: 'https://news.ycombinator.com/' },
];

const tok = (s: string) => Math.ceil(s.length / 4);
const text = (r: { content: unknown }) => (r.content as Array<{ type: string; text?: string }>).map((c) => c.text ?? '').join('\n');
const fmt = (n: number | null) => (n == null ? 'n/a' : n.toLocaleString('en-US'));
const ratio = (a: number | null, b: number | null) => (a && b ? `${Math.round(a / b).toLocaleString('en-US')}×` : 'n/a');

async function playwright(): Promise<{ client: Client; version: string; schema: number } | null> {
  try {
    const client = new Client({ name: 'browsermcp-bench', version: VERSION });
    await client.connect(new StdioClientTransport({ command: 'npx', args: ['-y', PLAYWRIGHT_MCP, '--headless', '--isolated', '--output-dir', join(tmpdir(), 'browsermcp-bench')], stderr: 'ignore' }));
    const { tools } = await client.listTools();
    return { client, version: client.getServerVersion()?.version ?? '?', schema: tok(JSON.stringify(tools)) };
  } catch (e) {
    console.error(`Playwright MCP unavailable (${(e as Error).message}); skipping that column.`);
    return null;
  }
}

async function main() {
  const manager = new BrowserManager();
  const pw = await playwright();
  const rows: string[] = [];

  for (const p of PAGES) {
    process.stderr.write(`· ${p.name}\n`);
    const full = await handleBrowse({ url: p.url, maxTokens: 10_000_000 }, manager);
    const dflt = await handleBrowse({ url: p.url }, manager);
    let snapshot: number | null = null;
    if (pw) {
      try {
        await pw.client.callTool({ name: 'browser_navigate', arguments: { url: p.url } });
        snapshot = tok(text(await pw.client.callTool({ name: 'browser_snapshot', arguments: {} })));
      } catch {
        snapshot = null;
      }
    }
    if (full.isError || dflt.isError) {
      rows.push(`| ${p.name} | ${p.url} | error | | | | | |`);
      continue;
    }
    const f = full.structuredContent as { rawTokens: number; tokens: number; source: string };
    const d = dflt.structuredContent as { tokens: number };
    rows.push(
      `| ${p.name} | ${p.url} | ${fmt(f.rawTokens)} | ${fmt(snapshot)} | ${fmt(f.tokens)} | ${fmt(d.tokens)} | ${ratio(f.rawTokens, f.tokens)} | ${f.source} |`
    );
  }

  await pw?.client.close();
  await manager.cleanup();

  const ours = tok(JSON.stringify(TOOLS));
  const date = new Date().toISOString().slice(0, 10);
  const md = `# Token benchmark

Run on ${date} with browsermcp ${VERSION}${pw ? ` and Playwright MCP ${pw.version} (\`${PLAYWRIGHT_MCP}\`)` : ''}. Reproduce with \`npm run bench\`.

Tokens are estimated as characters ÷ 4 for every column, so the columns compare like with like. Live pages change, so expect different numbers on a re-run.

| Page | URL | Rendered HTML | Playwright MCP snapshot | browsermcp full | browsermcp default (4k budget) | HTML ÷ full | browsermcp source |
|---|---|---:|---:|---:|---:|---:|---|
${rows.join('\n')}

- **Rendered HTML** is the page after load, which is what a raw dump would put into context.
- **Playwright MCP snapshot** is \`browser_snapshot\`, the accessibility-tree text an agent reads to see the page. In this version, \`browser_navigate\` returns a link to a snapshot file rather than inlining it.
- **browsermcp full** is \`browse\` with no budget. **default** is \`browse\` with its 4,000-token default; \`focus\` picks which sections fill that budget.
- **source** is \`publisher-*\` when the site served its own markdown, or \`rendered\` when browsermcp distilled the page.

Tool schemas (tools/list JSON): browsermcp ${fmt(ours)} tokens (${TOOLS.length} tools)${pw ? `; Playwright MCP ${fmt(pw.schema)} tokens` : ''}. Claude Code, Cursor and Codex load MCP tool schemas on demand, so this matters mainly for clients that don't.
`;
  writeFileSync(new URL('./results.md', import.meta.url), md);
  console.log(md);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
