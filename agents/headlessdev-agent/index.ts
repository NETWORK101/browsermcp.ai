import { agent } from "@21st-sdk/agent"

export default agent({
  model: "claude-sonnet-4-6",
  mcpServers: [
    {
      name: "github",
      url: "https://api.githubcopilot.com/mcp/",
    },
    {
      name: "linear",
      url: "https://mcp.linear.app/mcp",
    },
  ],
  systemPrompt: `You are a full-stack coding assistant.
Use the configured MCP servers whenever they are helpful.`,
})
