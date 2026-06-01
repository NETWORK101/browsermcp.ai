# headlessdev

**Give your AI a browser it can use.** One command. No cloud. No API key. No cost.

headlessdev lets AI tools like Claude Code, Cursor, and Codex CLI browse the web, read pages, fill out forms, take screenshots, and track changes — all running privately on your machine.

## What can it do?

| You say to your AI... | What happens |
|------------------------|-------------|
| "Check the Stripe docs for breaking changes" | **browse** — opens the page, strips the clutter, gives your AI clean text instead of raw HTML |
| "Get the pricing tiers from Linear's website" | **extract** — reads the page and structures the data however you need it |
| "Screenshot our homepage after that deploy" | **screenshot** — captures a full-page or element-level PNG |
| "Has anything changed on the AWS status page?" | **watch** — compares the page to last time and only shows what's different |
| "Test our signup form with a dummy account" | **interact** — fills inputs, clicks buttons, submits forms |

## Setup (30 seconds)

**Step 1:** Run this in your terminal:

```bash
npx headlessdev init
```

**Step 2:** It prints a config block. Copy it into your AI tool's settings:

- **Claude Code** — paste into `.mcp.json` in your project folder
- **Cursor** — paste into `~/.cursor/mcp.json`
- **Codex CLI** — paste into `~/.codex/config.json`

**Step 3:** Restart your AI tool. Done — your AI can now browse the web.

> Not sure where to paste it? Run `npx headlessdev init` — it detects your tools and tells you exactly where.

## How it works

```
Your AI (Claude Code / Cursor / Codex CLI)
  |
  |  asks headlessdev to browse a page
  v
headlessdev (runs on your machine)
  |
  |  opens a real browser, reads the page,
  |  strips out all the junk (ads, scripts, menus),
  |  and returns just the useful content
  v
Your AI gets clean, readable text
```

**Why this matters:** A typical webpage is 80,000+ tokens as raw HTML. headlessdev distills it down to 1,000-8,000 tokens — **10 to 50x smaller**. Your AI reads faster, understands better, and costs less.

## The five tools

### browse

Read any webpage. Returns clean markdown text.

```
browse({ url: "https://example.com/pricing" })
```

Add an `instruction` to focus on what matters:

```
browse({ url: "https://example.com/pricing", instruction: "just the plan names and prices" })
```

### extract

Same as browse, but you tell it what shape you want the data in:

```
extract({
  url: "https://example.com/team",
  schema: { people: [{ name: "string", role: "string" }] }
})
```

### screenshot

Capture what a page looks like:

```
screenshot({ url: "https://myapp.dev", fullPage: true })
```

Or just one part of the page:

```
screenshot({ url: "https://myapp.dev", selector: "#hero" })
```

### watch

Track changes on a page over time:

```
watch({ url: "https://docs.stripe.com/changelog" })
```

First time: saves a snapshot and returns the full page.
Next time: returns **only what changed** — 90%+ fewer tokens.

### interact

Fill forms, click buttons, test flows:

```
interact({
  url: "https://myapp.dev/signup",
  actions: [
    { type: "fill", selector: "input[name='email']", value: "test@example.com" },
    { type: "click", selector: "button[type='submit']" }
  ]
})
```

## Staying in control

headlessdev tracks how much your AI browses and stops it if it goes overboard.

```bash
npx headlessdev usage    # see today's and weekly stats
```

Default limits (changeable in `.headlessdev.json`):
- 100 browsing sessions per day
- 1 million tokens per day

## How does this compare?

| | headlessdev | Browserbase | Browser-Use | Stagehand |
|--|------------|-------------|-------------|-----------|
| **Setup** | One command | Sign up + API key | pip install + config | npm install + API key |
| **Cost** | Free | $20-99/mo | Free (self-host) | Free + Browserbase |
| **Runs on** | Your machine | Cloud | Your machine | Cloud (optional) |
| **Token savings** | 10-50x built-in | None | Some | Some |
| **Works with** | Claude Code, Cursor, Codex CLI | Custom SDKs | Python agents | JS agents |

## Configuration

`npx headlessdev init` creates a `.headlessdev.json` file in your project:

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

You can also put a config at `~/.config/headlessdev/config.json` for global defaults. Project-level config takes priority.

## Requirements

- Node.js 20 or later
- That's it. Playwright installs its own browser automatically.

## License

MIT
