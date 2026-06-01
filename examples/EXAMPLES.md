# headlessdev — Usage Examples

These examples show what happens when your AI agent uses headlessdev's MCP tools. You don't call these directly — your agent does.

## browse — Read a webpage as markdown

**Prompt to your agent:**
> "Check the Stripe API changelog for any recent breaking changes"

**What the agent calls:**
```json
{
  "tool": "browse",
  "arguments": {
    "url": "https://docs.stripe.com/changelog",
    "instruction": "find any recent breaking changes or deprecations"
  }
}
```

**What comes back:** Clean markdown of the page content (typically 10-50x fewer tokens than raw HTML), plus a list of interactive elements with CSS selectors.

---

## extract — Pull structured data

**Prompt to your agent:**
> "Get all the pricing tiers from Linear's pricing page"

**What the agent calls:**
```json
{
  "tool": "extract",
  "arguments": {
    "url": "https://linear.app/pricing",
    "schema": {
      "type": "object",
      "properties": {
        "tiers": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "price": { "type": "string" },
              "features": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    }
  }
}
```

**What comes back:** Page content with the schema prepended, so the agent knows what structure to parse the content into.

---

## screenshot — Capture a visual snapshot

**Prompt to your agent:**
> "Take a screenshot of our deployed app to verify the hero section looks right"

**What the agent calls:**
```json
{
  "tool": "screenshot",
  "arguments": {
    "url": "https://myapp.dev",
    "selector": "#hero-section"
  }
}
```

**What comes back:** A base64-encoded PNG image of just that element.

For a full-page capture, use `"fullPage": true` instead of `selector`.

---

## watch — Monitor a page for changes

**Prompt to your agent:**
> "Keep an eye on the AWS status page for us-east-1"

**First call:**
```json
{
  "tool": "watch",
  "arguments": {
    "url": "https://health.aws.amazon.com/health/status"
  }
}
```

**First result:** Full page content is returned and stored as a baseline snapshot.

**Subsequent calls (same URL):** Returns only a unified diff of what changed — typically 90%+ fewer tokens than re-reading the whole page. If nothing changed, returns a "no changes detected" message with 0 diff tokens.

---

## interact — Fill forms and click buttons

**Prompt to your agent:**
> "Test our signup flow with a dummy account"

**What the agent calls:**
```json
{
  "tool": "interact",
  "arguments": {
    "url": "https://myapp.dev/signup",
    "actions": [
      { "type": "fill", "selector": "input[name='email']", "value": "test@example.com" },
      { "type": "fill", "selector": "input[name='password']", "value": "TestPass123!" },
      { "type": "click", "selector": "button[type='submit']" }
    ]
  }
}
```

**What comes back:** The page state after all actions complete, rendered as markdown. Any failed actions are reported individually without crashing the whole sequence.

Supported action types:
- `fill` — type text into an input or textarea
- `click` — click a button, link, or any element
- `select` — choose an option from a `<select>` dropdown

---

## MCP Config Files

| AI Tool | Config File | Example |
|---------|-------------|---------|
| Claude Code | `.mcp.json` in project root | [claude_code_mcp.json](claude_code_mcp.json) |
| Claude Desktop | `claude_desktop_config.json` | [claude_desktop_config.json](claude_desktop_config.json) |
| Cursor | `.cursor/mcp.json` in home dir | [cursor_mcp.json](cursor_mcp.json) |
| OpenAI Codex CLI | `.codex/config.json` | [codex_config.json](codex_config.json) |

Or just run `npx headlessdev init` to auto-detect and configure.
