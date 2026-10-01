#!/usr/bin/env node

const command = process.argv[2];

const HELP = `browsermcp — a local, read-optimized browser for AI agents (MCP)

Usage:
  browsermcp                 Start the MCP server on stdio (what your MCP client runs)
  browsermcp init            Create .browsermcp.json and print setup for your MCP clients
  browsermcp login [url] [--browser chromium|firefox|webkit]
                             Open a visible browser to sign in; the agent reuses the session
  browsermcp usage           Show today's and this week's usage
  browsermcp --version       Print the version

Read pages from a shell (same tools and policy, no tool schema in your agent's context):
  browsermcp read <url> [--focus <text>] [--max-tokens <n>] [--diff] [--elements] [--json]
  browsermcp extract <url> [--schema '<json>'] [--json]
  browsermcp links <url> [--same-origin] [--match <text>] [--json]
`;

if (command === 'init') {
  const { runInit } = await import('../src/config/init.js');
  await runInit();
} else if (command === 'login') {
  const { runLogin } = await import('../src/config/init.js');
  const args = process.argv.slice(3);
  const flag = args.findIndex((a) => a === '--browser' || a.startsWith('--browser='));
  let engine: string | undefined;
  if (flag !== -1) {
    engine = args[flag].includes('=') ? args[flag].split('=')[1] : args[flag + 1];
    args.splice(flag, args[flag].includes('=') ? 1 : 2);
  }
  await runLogin(args[0], engine);
} else if (command === 'usage') {
  const { UsageTracker } = await import('../src/cost/tracker.js');
  const tracker = new UsageTracker();
  const fmt = (u: { sessions: number; tokens: number; estimatedCost: string }) =>
    `${u.sessions} calls · ${u.tokens.toLocaleString('en-US')} tokens returned · ~${u.estimatedCost} at $3/M`;
  console.log(`Today:     ${fmt(tracker.todayUsage())}`);
  console.log(`Last 7d:   ${fmt(tracker.usage(7))}`);
  const snaps = tracker.listSnapshots(5);
  if (snaps.length) console.log(`Watching:  ${snaps.map((s) => s.url).join(', ')}`);
  tracker.close();
} else if (command === 'read' || command === 'browse' || command === 'extract' || command === 'links') {
  const { runCliTool } = await import('../src/cli/tools.js');
  process.exitCode = await runCliTool(command, process.argv.slice(3));
} else if (command === '--version' || command === '-v') {
  const { VERSION } = await import('../src/version.js');
  console.log(VERSION);
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(HELP);
} else if (command && !command.startsWith('-')) {
  console.error(`Unknown command "${command}".\n\n${HELP}`);
  process.exitCode = 1;
} else {
  await import('../src/index.js');
}
