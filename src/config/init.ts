import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { DEFAULT_CONFIG, ENGINES, loadConfig, type BrowserEngine } from './schema.js';
import { browserTypeFor, launchOptions, profileDirFor } from '../browser/manager.js';

const SERVER_ENTRY = { command: 'npx', args: ['-y', 'localmcp'] };

const bold = (s: string) => (process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s);
const dim = (s: string) => (process.stdout.isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const green = (s: string) => (process.stdout.isTTY ? `\x1b[32m${s}\x1b[0m` : s);

interface ClientTarget {
  name: string;
  detected: boolean;
  where: string;
  snippet: string;
}

function clientTargets(): ClientTarget[] {
  const home = homedir();
  const cwd = process.cwd();
  const mcpServers = JSON.stringify({ mcpServers: { localmcp: SERVER_ENTRY } }, null, 2);
  const claudeDesktop =
    process.platform === 'darwin'
      ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : process.platform === 'win32'
        ? join(process.env.APPDATA ?? home, 'Claude', 'claude_desktop_config.json')
        : join(home, '.config', 'Claude', 'claude_desktop_config.json');

  return [
    {
      name: 'Claude Code',
      detected: existsSync(join(home, '.claude.json')) || existsSync(join(home, '.claude')),
      where: 'run once in your terminal',
      snippet: 'claude mcp add localmcp -- npx -y localmcp',
    },
    {
      name: 'Claude Desktop',
      detected: existsSync(claudeDesktop),
      where: claudeDesktop,
      snippet: mcpServers,
    },
    {
      name: 'Cursor',
      detected: existsSync(join(home, '.cursor')),
      where: join(home, '.cursor', 'mcp.json'),
      snippet: mcpServers,
    },
    {
      name: 'VS Code',
      detected: existsSync(join(cwd, '.vscode')),
      where: join(cwd, '.vscode', 'mcp.json'),
      snippet: JSON.stringify({ servers: { localmcp: { type: 'stdio', ...SERVER_ENTRY } } }, null, 2),
    },
    {
      name: 'Codex CLI',
      detected: existsSync(join(home, '.codex')),
      where: join(home, '.codex', 'config.toml'),
      snippet: '[mcp_servers.localmcp]\ncommand = "npx"\nargs = ["-y", "localmcp"]',
    },
  ];
}

export async function runInit(): Promise<void> {
  console.log(bold('\nlocalmcp init\n'));

  // 1. Project config (never clobber an existing one)
  const localConfigPath = join(process.cwd(), '.localmcp.json');
  const legacyConfigPath = join(process.cwd(), '.browsermcp.json');
  if (existsSync(localConfigPath)) {
    console.log(`${dim('•')} Keeping existing ${localConfigPath}`);
  } else if (existsSync(legacyConfigPath)) {
    console.log(`${dim('•')} Found ${legacyConfigPath} — still honoured. Rename it to .localmcp.json when convenient.`);
  } else {
    const { profileDir: _omit, ...browser } = DEFAULT_CONFIG.browser;
    const starter = { ...DEFAULT_CONFIG, browser };
    writeFileSync(localConfigPath, JSON.stringify(starter, null, 2) + '\n', 'utf-8');
    console.log(`${green('✓')} Created ${localConfigPath}`);
  }

  // 2. Per-client setup — detected clients first
  const targets = clientTargets().sort((a, b) => Number(b.detected) - Number(a.detected));
  console.log(bold('\nConnect your MCP client'));
  for (const t of targets) {
    console.log(`\n${t.detected ? green('●') : dim('○')} ${bold(t.name)}${t.detected ? green(' (detected)') : ''}`);
    console.log(dim(`  ${t.where}`));
    console.log(t.snippet.split('\n').map((l) => `  ${l}`).join('\n'));
  }

  // 3. Authenticated browsing
  console.log(bold('\nRead pages you are signed in to'));
  console.log('  npx localmcp login https://dashboard.stripe.com');
  console.log(dim('  Opens a browser on a private profile (~/.localmcp/profile). Sign in, close the window,'));
  console.log(dim('  and your agent reuses that session. Or attach to your own Chrome with "cdpEndpoint".'));
  console.log(bold('\nOther browsers'));
  console.log(dim('  "engine": "firefox" | "webkit" (Safari\'s engine) · "channel": "chrome" | "msedge"'));
  console.log(dim('  Non-Chromium engines need a one-time download: npx playwright install firefox webkit'));

  console.log(`\n${green('Done.')} Restart your MCP client to load the 5 localmcp tools.\n`);
}

export async function runLogin(url?: string, engineOverride?: string): Promise<void> {
  const config = loadConfig();
  const engine = (engineOverride ?? config.browser.engine) as BrowserEngine;
  if (!ENGINES.includes(engine)) {
    console.error(`Unknown browser "${engine}". Use one of: ${ENGINES.join(', ')}.`);
    process.exitCode = 1;
    return;
  }
  const profileDir = profileDirFor(engine, config.browser.profileDir);
  mkdirSync(profileDir, { recursive: true });

  console.log(bold('\nlocalmcp login'));
  console.log(`Browser: ${engine}${config.browser.channel ? ` (${config.browser.channel})` : ''}`);
  console.log(`Profile: ${profileDir}`);
  console.log('Sign in to any sites your agent should read, then close the browser window to save.\n');

  let context;
  try {
    context = await browserTypeFor(engine).launchPersistentContext(profileDir, {
      headless: false,
      viewport: null,
      ...launchOptions(engine, engine === 'chromium' ? config.browser.channel : undefined),
    });
  } catch (err) {
    console.error(
      `Could not open the profile — is localmcp already running in an MCP client?\n` +
        `Quit that client (or run login before starting it) and try again.\n\n${(err as Error).message.split('\n')[0]}`
    );
    process.exitCode = 1;
    return;
  }

  const page = context.pages()[0] ?? (await context.newPage());
  if (url) await page.goto(url).catch((e) => console.error(`Could not open ${url}: ${e.message}`));

  await new Promise<void>((resolve) => context.once('close', () => resolve()));
  const hint = engine === config.browser.engine ? '' : ` Set "browser": { "engine": "${engine}" } in .localmcp.json to use it.`;
  console.log(`${green('✓')} Session saved. localmcp will use it automatically (browser.profile = "auto").${hint}\n`);
}
