# headlessdev — Claude Code Guide

## What is this?

headlessdev is an MCP server that gives you (Claude Code) browser capabilities. You can browse websites, extract data, take screenshots, and interact with pages — all through MCP tools.

## Setup

If headlessdev is not yet configured, ask the user to run:

```bash
npx headlessdev init
```

This writes the MCP config automatically. After restart, you'll have 5 new tools.

## Available Tools

### browse
Navigate to any URL and get back clean, token-efficient markdown.

```
browse({ url: "https://example.com/pricing", instruction: "find the pricing tiers" })
```

Returns: Distilled markdown (10-50x fewer tokens than raw HTML) + list of interactive elements with CSS selectors.

**When to use:** Reading documentation, checking web pages, gathering information from any URL.

### extract
Pull structured data from a page, optionally guided by a JSON schema.

```
extract({ url: "https://example.com/api", schema: { endpoints: [{ method: "string", path: "string" }] } })
```

Returns: Page content with the schema prepended so you can parse it into the requested structure.

**When to use:** Pulling structured data like pricing tables, API endpoints, product listings, team directories.

### screenshot
Capture a full-page or element-specific screenshot.

```
screenshot({ url: "https://myapp.dev", fullPage: true })
screenshot({ url: "https://myapp.dev", selector: "#hero-section" })
```

Returns: Base64 PNG image.

**When to use:** Visual verification after deploys, checking UI appearance, capturing visual evidence.

### watch
Read a page and diff against the previous snapshot. Returns only what changed — dramatically fewer tokens than re-reading the full page.

```
watch({ url: "https://docs.stripe.com/changelog" })
```

Returns: On first call, stores a baseline snapshot and returns the full distilled page. On subsequent calls, returns a unified diff showing only added/removed/changed lines, with the diff token count and savings vs a full re-read.

**When to use:** Monitoring docs for API changes, tracking competitor pricing, watching status pages, detecting content updates. The diff output is typically 90%+ fewer tokens than re-reading the full page.

### interact
Click buttons, fill forms, select options on a page. Returns the page state after actions complete.

```
interact({
  url: "https://app.com/signup",
  actions: [
    { type: "fill", selector: "input#email", value: "test@example.com" },
    { type: "fill", selector: "input#password", value: "testpass123" },
    { type: "click", selector: "button[type=submit]" }
  ]
})
```

Returns: Distilled page state after all actions, plus any errors encountered.

**When to use:** Testing signup/login flows, submitting forms, navigating multi-step wizards, E2E testing.

## How DOM Distillation Works

When you call `browse` or `extract`, headlessdev:
1. Opens a real Chromium browser and navigates to the URL
2. Strips scripts, styles, SVGs, nav bars, footers, and boilerplate
3. Converts the remaining content to clean markdown
4. Extracts interactive elements (buttons, links, inputs) with their CSS selectors
5. Returns the result with a token count and reduction ratio

A page that would cost 80,000 tokens as raw HTML typically costs 1,000-4,000 tokens through headlessdev.

## Cost Tracking

headlessdev tracks your usage in a local SQLite database. A circuit breaker stops execution if you exceed daily limits (default: 100 sessions/day, 1M tokens/day). This prevents runaway token costs.

The user can check usage with:
```bash
headlessdev usage
```

## Best Practices

- **Use `browse` for reading, `extract` for structured data.** Browse returns narrative markdown; extract returns content with a schema hint for parsing.
- **Use `instruction` parameter** to tell headlessdev what you're looking for. It's prepended to the output so you remember what you asked for.
- **Use `interact` for multi-step flows** rather than calling `browse` repeatedly. One interact call can fill a form and submit it, returning the final state.
- **Check the `reductionRatio` in results** — if it's above 0.5, the page may have minimal content or the distillation missed something.
- **Screenshots are expensive in tokens** (images), so use them only when visual verification is genuinely needed.

## Configuration

The user's `.headlessdev.json` controls behavior:

```json
{
  "browser": { "timeout": 30000, "headless": true },
  "distill": { "maxTokens": 4000, "includeLinks": true, "includeImages": false },
  "limits": { "maxSessionsPerDay": 100, "maxTokensPerDay": 1000000 }
}
```

## Common Tasks

| Task | Tool | Example |
|------|------|---------|
| Read a webpage | browse | `browse({ url: "https://docs.stripe.com/api" })` |
| Check competitor pricing | browse | `browse({ url: "https://competitor.com/pricing", instruction: "extract plan names and prices" })` |
| Pull API docs into context | extract | `extract({ url: "https://api.example.com/docs" })` |
| Test a signup flow | interact | `interact({ url: "https://app.com/signup", actions: [...] })` |
| Verify a deploy | screenshot | `screenshot({ url: "https://myapp.dev", fullPage: true })` |
| Check if a page has errors | browse | `browse({ url: "https://myapp.dev/dashboard" })` — check for error messages in the output |
| Fill and submit a form | interact | `interact({ url, actions: [{ type: "fill", ... }, { type: "click", ... }] })` |
| Monitor docs for changes | watch | `watch({ url: "https://docs.stripe.com/changelog" })` |
| Track competitor pricing | watch | `watch({ url: "https://competitor.com/pricing" })` — returns diff on repeat calls |
| Watch a status page | watch | `watch({ url: "https://status.aws.amazon.com" })` |
