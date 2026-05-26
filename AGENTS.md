# headlessdev — Agent Instructions

## Overview

headlessdev is an MCP server that gives AI agents browser capabilities. Once configured, you have 4 tools for interacting with the web: `browse`, `extract`, `screenshot`, and `interact`.

## Setup

If headlessdev is not configured, ask the user to run:

```bash
npx headlessdev init
```

This writes `.headlessdev.json` and outputs the MCP server config for your environment.

For Codex CLI, add to `~/.codex/config.json` or `.codex/config.json`:

```json
{
  "mcpServers": {
    "headlessdev": {
      "command": "npx",
      "args": ["-y", "headlessdev"]
    }
  }
}
```

## Tools Reference

### browse(url, instruction?)

Browse a URL and get token-efficient markdown.

**Parameters:**
- `url` (required): The URL to navigate to
- `instruction` (optional): What to look for — prepended to output for context

**Returns:** Distilled markdown content + interactive elements list + token count

**Use when:** Reading web pages, checking documentation, gathering information from any URL.

**Example:**
```json
{ "url": "https://docs.stripe.com/api", "instruction": "find authentication methods" }
```

### extract(url, schema?)

Extract structured data from a page.

**Parameters:**
- `url` (required): The URL to extract from
- `schema` (optional): JSON schema describing the expected data structure

**Returns:** Page content with schema hint for parsing

**Use when:** Pulling tables, lists, pricing data, API endpoints, or any structured information.

**Example:**
```json
{
  "url": "https://example.com/pricing",
  "schema": { "plans": [{ "name": "string", "price": "number", "features": ["string"] }] }
}
```

### screenshot(url, selector?, fullPage?)

Capture a screenshot of a page or element.

**Parameters:**
- `url` (required): The URL to screenshot
- `selector` (optional): CSS selector to screenshot a specific element
- `fullPage` (optional): Boolean, capture the full scrollable page

**Returns:** Base64 PNG image

**Use when:** Visual verification, checking UI appearance, capturing evidence.

**Example:**
```json
{ "url": "https://myapp.dev", "fullPage": true }
```

### interact(url, actions)

Perform a sequence of browser actions on a page.

**Parameters:**
- `url` (required): The URL to interact with
- `actions` (required): Array of actions to perform sequentially

**Action types:**
- `{ "type": "click", "selector": "button.submit" }` — Click an element
- `{ "type": "fill", "selector": "input#email", "value": "user@example.com" }` — Fill an input
- `{ "type": "select", "selector": "select#plan", "value": "pro" }` — Select an option

**Returns:** Distilled page state after all actions complete, including any errors

**Use when:** Testing flows, submitting forms, navigating multi-step processes.

**Example:**
```json
{
  "url": "https://app.com/login",
  "actions": [
    { "type": "fill", "selector": "input#email", "value": "test@test.com" },
    { "type": "fill", "selector": "input#password", "value": "password123" },
    { "type": "click", "selector": "button[type=submit]" }
  ]
}
```

## Key Concepts

### DOM Distillation
headlessdev doesn't return raw HTML. It distills pages into clean markdown with 10-50x fewer tokens. A page with 80,000 tokens of HTML returns as 1,000-4,000 tokens of structured markdown. This saves cost and improves your reasoning quality.

### Interactive Elements
Browse and extract results include a list of interactive elements (buttons, links, inputs) with their CSS selectors. Use these selectors with the `interact` tool to click or fill elements.

### Cost Tracking
Usage is tracked locally. A circuit breaker prevents runaway costs by stopping after 100 sessions/day or 1M tokens/day (configurable). Override with `HEADLESSDEV_NO_LIMIT=1` environment variable.

## Common Workflows

### Competitive research
1. `browse` competitor's pricing page
2. `extract` the pricing data with a schema
3. Compare with your own pricing

### QA testing
1. `interact` to navigate through a signup flow
2. `screenshot` the final state
3. Report any errors found in the page content

### Documentation ingestion
1. `browse` the docs page with an instruction
2. Use the returned markdown as context for coding tasks

### Web monitoring
1. `browse` a page periodically
2. Compare current content with previous content
3. Flag differences to the user

## Limitations

- Runs a local Chromium instance — requires the machine to have Chrome/Chromium available
- No anti-bot or stealth capabilities (v1)
- Chromium only (no Firefox/WebKit)
- No persistent sessions across restarts — each session starts fresh
- Screenshots use tokens as images — use sparingly
