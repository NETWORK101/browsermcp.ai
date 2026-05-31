# headlessdev

Give your AI agent a browser. Zero-config MCP server for headless browser automation.

## Why

AI coding agents like Claude Code, Cursor, and OpenAI Codex CLI are powerful — but they can't browse the web. headlessdev fixes that with a single command. Unlike cloud browser services (Browserbase at $20-99/mo) or complex Python frameworks (Browser-Use, Stagehand), headlessdev runs entirely on your machine, costs nothing, and distills pages down to clean markdown with 10-50x fewer tokens than raw HTML.

## Quickstart (30 seconds)

```bash
npx headlessdev init   # writes config + shows MCP setup
```

Then add the printed MCP config block to your AI tool (Claude Code, Cursor, or OpenAI Codex CLI). Your agent now has five browser tools: `browse`, `extract`, `screenshot`, `watch`, and `interact`.

## Tools

### browse — Navigate to a URL, get token-efficient markdown

```
Agent calls: browse({ url: "https://example.com/pricing", instruction: "find the pricing tiers" })
Returns: Clean markdown with pricing content + interactive elements list
```

### extract — Get structured data from a page

```
Agent calls: extract({ url: "https://example.com/api", schema: { type: "object", properties: { endpoints: { type: "array" } } } })
Returns: Page content with schema hint for the agent to parse
```

### screenshot — Capture a visual snapshot

```
Agent calls: screenshot({ url: "https://example.com", fullPage: true })
Returns: Base64 PNG image
```

### watch — Monitor a page for changes

```
Agent calls: watch({ url: "https://docs.stripe.com/changelog" })
First call: Stores a baseline snapshot and returns the full page content
Subsequent calls: Returns a unified diff showing only what changed (90%+ fewer tokens vs re-reading)
```

### interact — Click, fill forms, select options

```
Agent calls: interact({ url: "https://example.com/login", actions: [
  { type: "fill", selector: "input#email", value: "user@example.com" },
  { type: "click", selector: "button[type=submit]" }
] })
Returns: Page state after actions
```

## How It Works

```
AI Agent (Claude Code / Cursor / Codex CLI)
  │ MCP protocol
  ▼
headlessdev MCP Server
  │ Tools: browse, extract, screenshot, watch, interact
  │ DOM distillation (10-50x token reduction)
  │ Cost tracking + circuit breaker
  │ CDP
  ▼
Local Chromium (via Playwright)
```

DOM distillation strips scripts, styles, and boilerplate from pages, then converts the result to markdown. A page that would cost 80,000 tokens as raw HTML typically costs 1,000-8,000 tokens through headlessdev.

## Configuration

`npx headlessdev init` writes `.headlessdev.json` to your project directory:

```json
{
  "browser": {
    "timeout": 30000,
    "headless": true
  },
  "distill": {
    "maxTokens": 4000,
    "includeLinks": true,
    "includeImages": false
  },
  "limits": {
    "maxSessionsPerDay": 100,
    "maxTokensPerDay": 1000000
  }
}
```

You can also place a config at `~/.config/headlessdev/config.json` for global defaults. Local config takes precedence.

## Usage Tracking

```bash
headlessdev usage   # see today's and weekly stats
```

headlessdev tracks sessions and token counts in a local SQLite database. A circuit breaker stops the agent if it hits your configured daily limits.

## Comparison

| Feature | headlessdev | Browserbase | Browser-Use | Stagehand |
|---------|------------|-------------|-------------|-----------|
| Setup | `npx headlessdev init` | Sign up + API key | pip install + config | npm install + API key |
| Cost | Free (local) | $20-99/mo | Free (self-host) | Free + Browserbase |
| Token reduction | 10-50x built-in | None | Some | Some |
| MCP native | Yes | No | No | No |
| Cloud required | No | Yes | No | Optional |
| Language | TypeScript | Multi | Python | TypeScript |
| Works with | Claude Code, Cursor, Codex CLI, any MCP client | Custom SDKs | Python agents | JS agents |

## License

MIT
