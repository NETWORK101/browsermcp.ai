import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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

const PLACEHOLDER_RESPONSE = {
  content: [{ type: "text" as const, text: "not implemented yet" }],
};

export function createServer(): Server {
  const server = new Server(
    { name: "headlessdev", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async () => PLACEHOLDER_RESPONSE);

  return server;
}
