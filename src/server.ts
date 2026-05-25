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

export function createServer(): Server {
  const server = new Server(
    { name: "headlessdev", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  const browserManager = new BrowserManager();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'browse':
        return handleBrowse(args as any, browserManager);
      case 'extract':
        return handleExtract(args as any, browserManager);
      case 'screenshot':
        return handleScreenshot(args as any, browserManager);
      case 'interact':
        return handleInteract(args as any, browserManager);
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  });

  return server;
}
