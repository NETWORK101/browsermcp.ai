import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("MCP server", () => {
  async function startServer() {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    const client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);

    return { server, client };
  }

  it("lists exactly 4 tools", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    expect(result.tools).toHaveLength(4);
  });

  it("lists browse, extract, screenshot, and interact tools", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name);
    expect(names).toContain("browse");
    expect(names).toContain("extract");
    expect(names).toContain("screenshot");
    expect(names).toContain("interact");
  });

  it("browse tool has correct input schema", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const browse = result.tools.find((t) => t.name === "browse");
    expect(browse).toBeDefined();
    expect(browse!.inputSchema.properties).toHaveProperty("url");
    expect(browse!.inputSchema.properties).toHaveProperty("instruction");
    expect(browse!.inputSchema.required).toContain("url");
    expect(browse!.inputSchema.required).not.toContain("instruction");
  });

  it("extract tool has correct input schema", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const extract = result.tools.find((t) => t.name === "extract");
    expect(extract).toBeDefined();
    expect(extract!.inputSchema.properties).toHaveProperty("url");
    expect(extract!.inputSchema.properties).toHaveProperty("schema");
    expect(extract!.inputSchema.required).toContain("url");
    expect(extract!.inputSchema.required).not.toContain("schema");
  });

  it("screenshot tool has correct input schema", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const screenshot = result.tools.find((t) => t.name === "screenshot");
    expect(screenshot).toBeDefined();
    expect(screenshot!.inputSchema.properties).toHaveProperty("url");
    expect(screenshot!.inputSchema.properties).toHaveProperty("selector");
    expect(screenshot!.inputSchema.properties).toHaveProperty("fullPage");
    expect(screenshot!.inputSchema.required).toContain("url");
    expect(screenshot!.inputSchema.required).not.toContain("selector");
    expect(screenshot!.inputSchema.required).not.toContain("fullPage");
  });

  it("interact tool has correct input schema", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const interact = result.tools.find((t) => t.name === "interact");
    expect(interact).toBeDefined();
    expect(interact!.inputSchema.properties).toHaveProperty("url");
    expect(interact!.inputSchema.properties).toHaveProperty("actions");
    expect(interact!.inputSchema.required).toContain("url");
    expect(interact!.inputSchema.required).toContain("actions");
  });

  it("interact tool actions have correct item schema", async () => {
    const { client } = await startServer();
    const result = await client.listTools();
    const interact = result.tools.find((t) => t.name === "interact");
    const actionsSchema = (interact!.inputSchema.properties as Record<string, any>)["actions"];
    expect(actionsSchema.type).toBe("array");
    const items = actionsSchema.items;
    expect(items.properties).toHaveProperty("type");
    expect(items.properties).toHaveProperty("selector");
    expect(items.properties).toHaveProperty("value");
    expect(items.properties.type.enum).toEqual(["click", "fill", "select"]);
    expect(items.required).toContain("type");
    expect(items.required).toContain("selector");
    expect(items.required).not.toContain("value");
  });

  it("calling any tool returns placeholder response", async () => {
    const { client } = await startServer();
    const result = await client.callTool({ name: "browse", arguments: { url: "https://example.com" } });
    expect(result.content).toHaveLength(1);
    expect((result.content[0] as { type: string; text: string }).type).toBe("text");
    expect((result.content[0] as { type: string; text: string }).text).toBe("not implemented yet");
  });
});
