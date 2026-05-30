import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browse, extract, links, screenshot } from "@headlessdev/core";

/**
 * Builds the headlessdev MCP server. EXACTLY four tools. Diff and auth are
 * parameters on `browse`, not new tools — that discipline keeps the schema
 * small (the structural edge over Playwright MCP's 40+ tools / ~13.7k tokens
 * of schema per request).
 */
export function buildServer(): McpServer {
  const server = new McpServer({ name: "headlessdev", version: "0.1.0" });

  // ── browse ───────────────────────────────────────────────────────────
  server.tool(
    "browse",
    "Read a web page as clean, token-efficient markdown. Use instead of " +
      "fetching raw HTML. Supports a token budget, diff-since-last-read, and " +
      "a local profile for reading your own authenticated pages.",
    {
      url: z.string().describe("The URL to read"),
      tokenBudget: z.number().int().positive().optional()
        .describe("Truncate output to fit within this token budget"),
      mainContentOnly: z.boolean().optional()
        .describe("Extract only main article content (default true)"),
      instruction: z.string().optional()
        .describe("Instruction or context note prepended to the output"),
      since: z.boolean().optional()
        .describe("Return a diff against the previous read instead of full content"),
    },
    async ({ url, ...opts }) => {
      const res = await browse({ url, ...opts });
      // In diff mode, surface the diff as formatted text
      let body = res.markdown;
      if (res.diff && res.diff.addedCount + res.diff.removedCount > 0) {
        const diffText = res.diff.lines
          .map(l => (l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  ") + l.text)
          .join("\n");
        body = `## Changes since last read\n\n+${res.diff.addedCount} added, -${res.diff.removedCount} removed\n\n\`\`\`diff\n${diffText}\n\`\`\`\n\n---\n_Diff tokens: ${res.diff.diffTokens} | Full page: ${res.diff.fullPageTokens}_`;
      }
      return {
        content: [{ type: "text" as const, text: body }],
      };
    }
  );

  // ── extract ──────────────────────────────────────────────────────────
  server.tool(
    "extract",
    "Extract structured data from a web page, optionally guided by a JSON schema.",
    {
      url: z.string().describe("The URL to extract data from"),
      schema: z.record(z.unknown()).optional()
        .describe("JSON schema describing the data to extract"),
    },
    async ({ url, schema }) => {
      const res = await extract({ url, schema });
      return {
        content: [{ type: "text" as const, text: res.markdown }],
      };
    }
  );

  // ── links ────────────────────────────────────────────────────────────
  server.tool(
    "links",
    "List links on a page without reading the full content. Cheap — for mapping and navigation.",
    {
      url: z.string().describe("The URL to list links from"),
      filter: z.string().optional()
        .describe("Regex or substring to filter hrefs"),
      selector: z.string().optional()
        .describe("CSS selector to scope link extraction (e.g. 'nav', '#sidebar')"),
    },
    async ({ url, filter, selector }) => {
      const res = await links({ url, filter, selector });
      const text = res.links
        .map(l => `- [${l.text}](${l.href})`)
        .join("\n");
      return {
        content: [{ type: "text" as const, text: text || "No links found." }],
      };
    }
  );

  // ── screenshot ───────────────────────────────────────────────────────
  server.tool(
    "screenshot",
    "Capture a full-page or element-specific screenshot.",
    {
      url: z.string().describe("The URL to screenshot"),
      selector: z.string().optional()
        .describe("CSS selector to screenshot a specific element"),
      fullPage: z.boolean().optional()
        .describe("Whether to take a full-page screenshot"),
    },
    async ({ url, selector, fullPage }) => {
      const res = await screenshot({ url, selector, fullPage });
      return {
        content: [{
          type: "image" as const,
          data: res.data.toString("base64"),
          mimeType: res.mimeType,
        }],
      };
    }
  );

  return server;
}
