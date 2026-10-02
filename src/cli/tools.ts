import { loadConfig, type LocalMcpConfig } from '../config/schema.js';
import { createRuntime, runTool } from '../runtime.js';
import { UsageTracker } from '../cost/tracker.js';

/**
 * CLI entry points for agents that have a shell (Claude Code, Codex…): same tools, same policy,
 * zero tool-schema tokens. Output is the same fenced markdown the MCP tools return, or --json.
 *
 *   localmcp read <url> [--focus <text>] [--max-tokens <n>] [--diff] [--elements] [--wait-for <css>] [--json]
 *   localmcp extract <url> [--schema '<json>'] [--focus <text>] [--max-tokens <n>] [--json]
 *   localmcp links <url> [--same-origin] [--match <text>] [--limit <n>] [--json]
 */

export const CLI_TOOLS: Record<string, 'browse' | 'extract' | 'links'> = {
  read: 'browse',
  browse: 'browse',
  extract: 'extract',
  links: 'links',
};

const BOOLEAN_FLAGS = new Set(['diff', 'elements', 'json', 'same-origin', 'help']);
const NUMBER_FLAGS = new Set(['max-tokens', 'limit']);

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      positionals.push(a);
      continue;
    }
    const eq = a.indexOf('=');
    const key = (eq === -1 ? a.slice(2) : a.slice(2, eq)).toLowerCase();
    if (eq !== -1) flags[key] = a.slice(eq + 1);
    else if (BOOLEAN_FLAGS.has(key)) flags[key] = true;
    else if (i + 1 < argv.length) flags[key] = argv[++i];
    else flags[key] = true;
  }
  return { positionals, flags };
}

const camel = (k: string) => k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Turn CLI flags into the tool's MCP arguments. Throws on malformed input. */
export function toToolArgs(url: string, flags: ParsedArgs['flags']): Record<string, unknown> {
  const args: Record<string, unknown> = { url };
  for (const [k, v] of Object.entries(flags)) {
    if (k === 'json' || k === 'help') continue;
    if (k === 'schema') {
      try {
        args.schema = JSON.parse(String(v));
      } catch {
        throw new Error('--schema must be valid JSON, e.g. --schema \'{"plans":[{"name":"string"}]}\'');
      }
      continue;
    }
    if (NUMBER_FLAGS.has(k)) {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) throw new Error(`--${k} needs a positive number`);
      args[camel(k)] = n;
      continue;
    }
    args[camel(k)] = v;
  }
  return args;
}

export const CLI_HELP = `Read pages from a shell (same tools and policy as the MCP server, no tool schema in context):
  localmcp read <url> [--focus <text>] [--max-tokens <n>] [--diff] [--elements] [--wait-for <css>] [--json]
  localmcp extract <url> [--schema '<json>'] [--focus <text>] [--max-tokens <n>] [--json]
  localmcp links <url> [--same-origin] [--match <text>] [--limit <n>] [--json]`;

export interface CliIO {
  out: (s: string) => void;
  err: (s: string) => void;
}

const defaultIO: CliIO = {
  out: (s) => process.stdout.write(s.endsWith('\n') ? s : `${s}\n`),
  err: (s) => process.stderr.write(s.endsWith('\n') ? s : `${s}\n`),
};

/** Run one CLI tool command. Returns the process exit code. */
export async function runCliTool(
  command: string,
  argv: string[],
  opts: { config?: LocalMcpConfig; tracker?: UsageTracker; io?: CliIO } = {}
): Promise<number> {
  const io = opts.io ?? defaultIO;
  const tool = CLI_TOOLS[command];
  const { positionals, flags } = parseArgs(argv);
  if (!tool || flags.help || positionals.length !== 1) {
    (flags.help ? io.out : io.err)(CLI_HELP);
    return flags.help ? 0 : 2;
  }

  let args: Record<string, unknown>;
  try {
    args = toToolArgs(positionals[0], flags);
  } catch (e) {
    io.err((e as Error).message);
    return 2;
  }

  const rt = createRuntime(opts.config ?? loadConfig(), opts.tracker);
  try {
    const result = await runTool(rt, tool, args);
    const text = result.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    if (result.isError) {
      io.err(text);
      return 1;
    }
    io.out(flags.json ? JSON.stringify(result.structuredContent ?? {}, null, 2) : text);
    return 0;
  } finally {
    await rt.browserManager.cleanup();
    if (!opts.tracker) rt.tracker.close();
  }
}
