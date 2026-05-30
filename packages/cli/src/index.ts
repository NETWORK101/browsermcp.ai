#!/usr/bin/env node

import { writeFileSync } from "fs";
import {
  browse,
  extract,
  links,
  screenshot,
  UsageTracker,
} from "@headlessdev/core";

// ── Argument parsing ───────────────────────────────────────────────

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] ?? "";
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 1;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { command, positional, flags };
}

// ── Output helpers ─────────────────────────────────────────────────

function output(data: string, outPath?: string): void {
  if (outPath) {
    writeFileSync(outPath, data, "utf-8");
    console.error(`Written to ${outPath}`);
  } else {
    process.stdout.write(data);
  }
}

function outputBinary(data: Buffer, outPath?: string): void {
  if (outPath) {
    writeFileSync(outPath, data);
    console.error(`Written to ${outPath}`);
  } else {
    process.stdout.write(data);
  }
}

// ── Help ───────────────────────────────────────────────────────────

const HELP = `
headlessdev — browse the web from your terminal

Usage:
  headlessdev browse <url> [--budget N] [--instruction "..."] [--since] [--json] [--out file.md]
  headlessdev extract <url> [--schema '{}'] [--json] [--out file.md]
  headlessdev links <url> [--filter "pattern"] [--selector "css"] [--json]
  headlessdev screenshot <url> [--selector "css"] [--full-page] [--out file.png]
  headlessdev init          Print MCP config setup instructions
  headlessdev usage         Show today's usage stats

Flags:
  --json        Output JSON instead of default format
  --out <path>  Write output to a file instead of stdout
  --budget <N>  Token budget for browse (default: unlimited)
  --instruction "..."  Instruction prepended to browse output
  --since       Return diff since last browse of this URL
  --schema '{}'  JSON schema hint for extract
  --filter "pattern"   Filter links by href substring/regex
  --selector "css"     CSS selector to scope links or screenshot
  --full-page   Capture the full scrollable page (screenshot)
`.trim();

// ── Commands ───────────────────────────────────────────────────────

async function cmdBrowse(args: ParsedArgs): Promise<void> {
  const url = args.positional[0];
  if (!url) {
    console.error("Error: browse requires a URL argument.");
    process.exit(1);
  }

  const result = await browse({
    url,
    tokenBudget: args.flags["budget"]
      ? Number(args.flags["budget"])
      : undefined,
    instruction:
      typeof args.flags["instruction"] === "string"
        ? args.flags["instruction"]
        : undefined,
    since: args.flags["since"] === true,
  });

  const outPath =
    typeof args.flags["out"] === "string" ? args.flags["out"] : undefined;

  if (args.flags["json"]) {
    output(JSON.stringify(result, null, 2) + "\n", outPath);
  } else {
    output(result.markdown + "\n", outPath);
  }
}

async function cmdExtract(args: ParsedArgs): Promise<void> {
  const url = args.positional[0];
  if (!url) {
    console.error("Error: extract requires a URL argument.");
    process.exit(1);
  }

  let schema: Record<string, unknown> | undefined;
  if (typeof args.flags["schema"] === "string") {
    try {
      schema = JSON.parse(args.flags["schema"]);
    } catch {
      console.error("Error: --schema must be valid JSON.");
      process.exit(1);
    }
  }

  const result = await extract({ url, schema });

  const outPath =
    typeof args.flags["out"] === "string" ? args.flags["out"] : undefined;

  if (args.flags["json"]) {
    output(JSON.stringify(result, null, 2) + "\n", outPath);
  } else {
    output(result.markdown + "\n", outPath);
  }
}

async function cmdLinks(args: ParsedArgs): Promise<void> {
  const url = args.positional[0];
  if (!url) {
    console.error("Error: links requires a URL argument.");
    process.exit(1);
  }

  const result = await links({
    url,
    filter:
      typeof args.flags["filter"] === "string"
        ? args.flags["filter"]
        : undefined,
    selector:
      typeof args.flags["selector"] === "string"
        ? args.flags["selector"]
        : undefined,
  });

  const outPath =
    typeof args.flags["out"] === "string" ? args.flags["out"] : undefined;

  if (args.flags["json"]) {
    output(JSON.stringify(result, null, 2) + "\n", outPath);
  } else {
    // Default output for links is JSON since it's structured data
    output(JSON.stringify(result, null, 2) + "\n", outPath);
  }
}

async function cmdScreenshot(args: ParsedArgs): Promise<void> {
  const url = args.positional[0];
  if (!url) {
    console.error("Error: screenshot requires a URL argument.");
    process.exit(1);
  }

  const result = await screenshot({
    url,
    selector:
      typeof args.flags["selector"] === "string"
        ? args.flags["selector"]
        : undefined,
    fullPage: args.flags["full-page"] === true,
  });

  const outPath =
    typeof args.flags["out"] === "string"
      ? args.flags["out"]
      : "screenshot.png";

  if (args.flags["json"]) {
    const json = {
      url: result.url,
      mimeType: result.mimeType,
      data: result.data.toString("base64"),
    };
    output(JSON.stringify(json, null, 2) + "\n");
  } else {
    outputBinary(result.data, outPath);
  }
}

function cmdInit(): void {
  const config = {
    mcpServers: {
      headlessdev: {
        command: "npx",
        args: ["-y", "@headlessdev/mcp"],
      },
    },
  };

  console.log(`
headlessdev — MCP Server Setup
===============================

Add this to your MCP client config (e.g. ~/.claude/settings.json):

${JSON.stringify(config, null, 2)}

For Claude Code, you can also run:

  claude mcp add headlessdev npx -y @headlessdev/mcp

After configuring, restart your MCP client to activate the tools:
  browse, extract, links, screenshot, watch, interact
`);
}

function cmdUsage(): void {
  const tracker = new UsageTracker();
  try {
    const today = tracker.todayUsage();
    const week = tracker.usage(7);

    console.log(`
headlessdev — Usage Stats
=========================

Today:
  Sessions:       ${today.sessions}
  Tokens:         ${today.tokens.toLocaleString()}
  Estimated cost: ${today.estimatedCost}

Last 7 days:
  Sessions:       ${week.sessions}
  Tokens:         ${week.tokens.toLocaleString()}
  Estimated cost: ${week.estimatedCost}
`);
  } finally {
    tracker.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command || args.command === "help" || args.flags["help"]) {
    console.log(HELP);
    process.exit(0);
  }

  switch (args.command) {
    case "browse":
      await cmdBrowse(args);
      break;
    case "extract":
      await cmdExtract(args);
      break;
    case "links":
      await cmdLinks(args);
      break;
    case "screenshot":
      await cmdScreenshot(args);
      break;
    case "init":
      cmdInit();
      break;
    case "usage":
      cmdUsage();
      break;
    default:
      console.error(`Unknown command: ${args.command}`);
      console.error('Run "headlessdev help" for usage information.');
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
