import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { BrowserManager } from './browser/manager.js';
import { handleBrowse } from './tools/browse.js';
import { handleExtract } from './tools/extract.js';
import { handleScreenshot } from './tools/screenshot.js';
import { handleInteract } from './tools/interact.js';
import { handleWatch } from './tools/watch.js';
import { UsageTracker } from './cost/tracker.js';
import { CircuitBreaker } from './cost/circuit-breaker.js';
import { loadConfig } from './config/schema.js';

const TOOLS = [
  {
    name: "browse",
    description: "Browse a URL and return its content",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The URL to browse" },
        instruction: {
          type: "string",
          description: "Optional instruction for what to extract or do",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "extract",
    description: "Extract structured data from a URL",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The URL to extract data from" },
        schema: {
          type: "object",
          description: "Optional JSON schema describing the data to extract",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "screenshot",
    description: "Take a screenshot of a URL",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The URL to screenshot" },
        selector: {
          type: "string",
          description: "Optional CSS selector to screenshot a specific element",
        },
        fullPage: {
          type: "boolean",
          description: "Whether to take a full-page screenshot",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "watch",
    description: "Read a page and diff against the previous snapshot. Returns only what changed since the last read — dramatically fewer tokens than re-reading the full page. First call stores a baseline; subsequent calls return a diff.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The URL to watch for changes" },
      },
      required: ["url"],
    },
  },
  {
    name: "interact",
    description: "Interact with a page by performing a sequence of actions",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "The URL to interact with" },
        actions: {
          type: "array",
          description: "List of actions to perform on the page",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["click", "fill", "select"],
                description: "The type of action to perform",
              },
              selector: {
                type: "string",
                description: "CSS selector for the target element",
              },
              value: {
                type: "string",
                description: "Optional value for fill or select actions",
              },
            },
            required: ["type", "selector"],
          },
        },
      },
      required: ["url", "actions"],
    },
  },
];

function estimateTokensFromResult(result: { content: Array<{ type: string; text?: string }> }): number {
  let chars = 0;
  for (const item of result.content) {
    if (item.type === 'text' && item.text) {
      chars += item.text.length;
    }
  }
  return Math.ceil(chars / 4);
}

export function createServer(): Server {
  const config = loadConfig();

  const server = new Server(
    { name: "headlessdev", version: "0.2.0" },
    { capabilities: { tools: {} } }
  );

  const browserManager = new BrowserManager(config.browser);
  const tracker = new UsageTracker();
  const circuitBreaker = new CircuitBreaker(tracker, config.limits);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const check = circuitBreaker.check();
    if (!check.allowed) {
      return { content: [{ type: 'text', text: check.message! }] };
    }

    const startTime = Date.now();
    let result: { content: Array<{ type: string; text?: string }> };

    switch (name) {
      case 'browse':
        result = await handleBrowse(args as any, browserManager);
        break;
      case 'extract':
        result = await handleExtract(args as any, browserManager);
        break;
      case 'screenshot':
        result = await handleScreenshot(args as any, browserManager);
        break;
      case 'watch':
        result = await handleWatch(args as any, browserManager, tracker);
        break;
      case 'interact':
        result = await handleInteract(args as any, browserManager);
        break;
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }

    const durationMs = Date.now() - startTime;
    const url = (args as any)?.url;
    tracker.record(name, estimateTokensFromResult(result), durationMs, url);

    return result;
  });

  return server;
}
