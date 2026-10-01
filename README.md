# browsermcp

**A local, read-optimized browser for AI agents.** Your agent reads any page — including the ones you're signed in to — as focused, token-budgeted markdown. Runs a real Chromium on your machine. No cloud relay, no API key, no account.

```bash
claude mcp add browsermcp -- npx -y browsermcpai     # Claude Code
npx browsermcpai init                                # everything else: prints config for your clients
```

[![npm](https://img.shields.io/npm/v/browsermcpai)](https://www.npmjs.com/package/browsermcpai) · MIT · Node ≥ 20 · [Website](https://browsermcp.pages.dev)

---

## Why

| Option | Problem for agents |
|---|---|
| Built-in web fetch (e.g. Claude Code's WebFetch) | No cookies, no JavaScript, refuses localhost, and large pages come back as a small-model summary rather than the page. |
| Cloud scrapers (Firecrawl, Jina, Browserbase) | Your Stripe dashboard, internal wiki, and `localhost:3000` go through someone else's servers — or can't be reached at all. |
| Full automation MCPs (e.g. Playwright MCP) | Great for driving a browser. For *reading*, one page snapshot is 13k–87k tokens of accessibility tree ([measured](benchmarks/results.md)). |
| CLI browser tools | Need a shell. Claude Desktop and other sandboxed clients don't have one. |

browsermcp is the reading-first option: the page itself — no summarizer in the middle — focused and under a token budget, read by a browser on your machine. Five MCP tools, or three shell commands. See the [benchmark](benchmarks/results.md).

## What's new in 0.2

- **Real authenticated browsing.** `npx browsermcpai login <url>` opens a visible browser on a private profile. Sign in once; the agent reuses the session. Or attach to your own Chrome over CDP.
- **Focus + budget.** `browse({ url, focus: "rate limits", maxTokens: 1500 })` ranks sections by relevance and returns only what fits — and tells the agent which sections it left out.
- **Structured extraction with MCP sampling.** `extract` returns JSON-LD, meta tags, and tables as row objects. Pass a `schema` and your *client's own model* fills it — no extra API key.
- **Current MCP spec.** Tool `annotations`, `outputSchema` + `structuredContent`, server `instructions`, progress notifications, and diff snapshots as resources.
- **Safety by default.** Domain allow/deny policy, read-only mode, dangerous schemes blocked, and every page wrapped in an untrusted-content fence against prompt injection.
- **Metadata-first reading (0.2.1).** If a site publishes markdown for agents (a `text/markdown` alternate link, or `Accept: text/markdown`), browsermcp reads that instead of the rendered HTML. Stripe's API reference drops from 428k tokens of HTML to the publisher's own markdown. Every result opens with a page card (type, site, author, published/updated dates, canonical URL, source) read from JSON-LD, OpenGraph, `<meta>` and front matter, and `links` points out a site's `/llms.txt`.

See [CHANGELOG.md](CHANGELOG.md) for the full list and migration notes.

## How a page becomes agent-readable

1. **Ask the publisher.** Use a declared `<link rel="alternate" type="text/markdown">` on the same origin, or request the page with `Accept: text/markdown`. Many docs platforms (Stripe, Vercel, Cloudflare, Anthropic, GitHub) serve clean markdown this way. It's used only from the page's own origin and only if it matches the rendered page's title; otherwise the rendered page wins and the result says so.
2. **Read the metadata.** Use JSON-LD (including `@graph`), OpenGraph, `<meta>`, the canonical link and markdown front matter to build a one-line page card covering what the page is, who wrote it, how fresh it is, and where the text came from.
3. **Read the structure.** If there's no publisher markdown, render the page, strip chrome (nav, footer, banners, hidden and `aria-hidden` nodes), keep semantic landmarks, headings and tables, and convert to GFM.
4. **Rank and budget.** `focus` ranks sections; `maxTokens` caps the result and lists omitted headings.
5. **Fence it.** Wrap the result in `<untrusted-page-content>` with typed `structuredContent` (`source`, `card`).

Example card:

```
> TechArticle · Vercel · updated 2026-09-13 · source: publisher markdown (declared text/markdown alternate)
```

Turn publisher markdown off with `"distill": { "publisherMarkdown": false }`. Cross-origin alternates are always ignored, so a page can't point the agent at another host.

## Tools

| Tool | What it does | Annotations |
|---|---|---|
| `browse` | Page → clean markdown. `focus`, `maxTokens`, `diff`, `elements`, `waitFor`. | read-only |
| `extract` | JSON-LD, meta/OpenGraph, tables as rows, headings; optional `schema` filled via sampling. | read-only |
| `links` | De-duplicated absolute links; filter by `sameOrigin` or `match`. | read-only |
| `screenshot` | Viewport, full page, or one `selector`; `png` or `jpeg`. | read-only |
| `interact` | `click` `fill` `select` `press` `check` `uncheck` `hover` `scroll` `wait`, then returns the resulting page. | **destructive** |

Read-only annotations let clients auto-approve reads while still confirming `interact`.

### From a shell

The same tools and policy, with no tool schema in your agent's context:

```bash
npx browsermcpai read https://docs.stripe.com/api --focus "pagination" --max-tokens 1500
npx browsermcpai extract https://example.com/pricing --schema '{"plans":[{"name":"string"}]}' --json
npx browsermcpai links https://docs.example.com --same-origin --match /api/
```

`--json` prints `structuredContent`; otherwise you get the same fenced markdown the MCP tools return. Exit code 1 means a policy block or a page error.

### browse

```js
browse({ url: "https://docs.stripe.com/api", focus: "pagination", maxTokens: 1500 })
```

```
# Pagination | Stripe API Reference
https://docs.stripe.com/api/pagination · 1,204 tokens · 98% smaller than raw HTML · truncated to budget
> Focus: pagination

<untrusted-page-content source="https://docs.stripe.com/api/pagination">
…the relevant sections, in page order…
</untrusted-page-content>

_Omitted sections — call again with `focus` or a larger `maxTokens` to read them: Errors · Idempotent requests · …_
```

- **`diff: true`** — first call saves a baseline; later calls return only a unified diff of what changed (the old `watch` tool; `watch` still works as an alias).
- **`elements: true`** — appends visible buttons/links/inputs with CSS selectors verified unique in the live DOM, ready for `interact`.
- **`waitFor: "#app table"`** — wait for a late-rendering SPA element before reading.

### extract

```js
extract({ url: "https://example.com/pricing", schema: { plans: [{ name: "string", price: "string" }] } })
```

`structuredContent` always contains `title`, `meta`, `jsonLd[]`, `tables[]` (`{ headers, rows: [{ header: value }] }`), and `headings[]`. If the client supports **sampling**, `data` holds the schema filled by the client's model and `method` is `"sampling"`; otherwise the schema is returned as a hint next to the content (`method: "dom"`).

### links

```js
links({ url: "https://docs.example.com", sameOrigin: true, match: "/api/" })
```

### interact

```js
interact({
  url: "http://localhost:3000/signup",
  actions: [
    { type: "fill", selector: "input[name='email']", value: "test@example.com" },
    { type: "press", selector: "input[name='email']", value: "Enter" },
    { type: "wait", selector: ".welcome" }
  ]
})
```

Password values are never echoed back. If an action navigates to a host your policy denies, the result is withheld.

## Signed-in pages

**Option A: dedicated profile (recommended)**

```bash
npx browsermcpai login https://dashboard.stripe.com
```

A browser window opens on `~/.browsermcp/profile`. Sign in to whatever your agent should read, then close the window. With the default `browser.profile: "auto"`, browsermcp uses that profile from then on. Chromium locks a profile to one process. If two clients run browsermcp at once, the second one falls back to an ephemeral session and says so in its output.

**Option B: your own Chrome**

Start Chrome with `--remote-debugging-port=9222`, then:

```json
{ "browser": { "cdpEndpoint": "http://localhost:9222" } }
```

browsermcp opens its own tabs in your existing session and never closes your browser.

> Either way the agent can read anything those sessions can. So while a signed-in session is in use, `interact` is **off by default** (`policy.allowInteract: "auto"`): the agent reads as you but can't click or type as you until you set `allowInteract: true`. Pair this with `policy.allow` (below).

## Browsers

| Browser | How | Status |
|---|---|---|
| Chromium (bundled) | default | ✓ |
| Google Chrome, Microsoft Edge | `"channel": "chrome"` / `"msedge"` | ✓ |
| Firefox | `"engine": "firefox"` | ✓ |
| WebKit (Safari's engine) | `"engine": "webkit"` | ✓ |
| Your running Chrome, Edge, Brave, Arc, Vivaldi, Opera | `"cdpEndpoint"` | ✓ |
| Your running Firefox | WebDriver BiDi attach | Roadmap |
| Your running Safari | `safaridriver` | Roadmap |
| Tabs in your everyday browser, no flags | extension bridge | Roadmap |

Firefox and WebKit need a one-time `npx playwright install firefox webkit`. Sign in per engine with `npx browsermcpai login <url> --browser firefox`.

## Configuration

`npx browsermcpai init` writes `.browsermcp.json`. Global defaults can live in `~/.config/browsermcp/config.json`; project config wins.

```jsonc
{
  "browser": {
    "timeout": 30000,
    "headless": true,
    "engine": "chromium",         // "chromium" | "firefox" | "webkit"
    "channel": null,              // chromium only: "chrome" | "msedge" | …
    "profile": "auto",            // "auto" | "persistent" | "ephemeral"
    "cdpEndpoint": null           // e.g. "http://localhost:9222"
  },
  "distill": {
    "maxTokens": 4000,            // default budget for browse/extract/interact
    "includeLinks": true,
    "includeImages": false,
    "publisherMarkdown": true     // prefer markdown the site serves for agents
  },
  "policy": {
    "allow": [],                  // host globs; empty = any. e.g. ["*.stripe.com", "localhost:*"]
    "deny": [],                   // checked first
    "allowInteract": "auto",      // "auto": off while signed in · true · false (read-only)
    "allowFileUrls": false
  },
  "limits": {
    "maxSessionsPerDay": 100,     // local circuit breaker against runaway agents
    "maxTokensPerDay": 1000000
  }
}
```

Host globs: `example.com` (exact host, any port), `*.example.com` (subdomains, not the apex), `localhost:3000`, `localhost:*`.

## Security model

- **Nothing is relayed.** Pages are fetched and distilled by a browser on your machine, then go only to the model your agent already uses. No telemetry, no account.
- **Policy at the boundary.** Every URL is checked before a browser is touched, and again after redirects or actions that change origin. Deny rules also apply to every request a page makes — images, iframes, scripts, fetches — including when attached to your own browser. Only `http(s)` is allowed by default; `file:`, `javascript:`, `chrome:`, `data:` are refused.
- **Prompt-injection fence.** Page content comes back inside `<untrusted-page-content>` tags, and the server's `instructions` tell the model to treat it as data. Pages that try to close the fence early are neutralised. This *reduces* injection risk; it doesn't eliminate it. Keep `interact` confirmations on in your client.
- **Circuit breaker.** Daily session and token caps (local SQLite at `~/.browsermcp/usage.db`). `npx browsermcpai usage` shows totals. `BROWSERMCP_NO_LIMIT=1` overrides.

## MCP protocol surface

| Feature | Support |
|---|---|
| `tools` with `title`, `annotations`, `outputSchema`, `structuredContent` | ✓ |
| `isError` tool results | ✓ |
| Server `instructions` | ✓ |
| `notifications/progress` (when the client sends a `progressToken`) | ✓ |
| `sampling/createMessage` (used by `extract` when the client supports it) | ✓ |
| `resources` — diff snapshots at `browsermcp://snapshot/{url}` | ✓ |
| Transport | stdio |

## CLI

```
browsermcp                 Start the MCP server on stdio
browsermcp init            Create .browsermcp.json and print setup for your MCP clients
browsermcp login [url]     Sign in once on the persistent profile
browsermcp usage           Today's and this week's usage
browsermcp --version
```

## Token benchmark

`npm run bench` measures named public pages four ways — rendered HTML, a Playwright MCP `browser_snapshot`, `browse` with no budget, and `browse` with the 4,000-token default — and writes [benchmarks/results.md](benchmarks/results.md). On 2026-10-01:

| Page | Rendered HTML | Playwright MCP snapshot | browsermcp (full) | browsermcp (default) |
|---|---:|---:|---:|---:|
| Stripe API reference | 428,457 | 30,724 | 482 | 482 |
| GitHub REST: Issues | 330,083 | 87,350 | 20,228 | 4,002 |
| Next.js docs | 159,921 | 19,721 | 799 | 799 |
| Wikipedia: Model Context Protocol | 109,268 | 20,288 | 6,387 | 3,991 |
| Python: json module | 29,700 | 25,381 | 8,624 | 3,996 |
| Hacker News front page | 8,539 | 12,207 | 4,023 | 3,945 |

Tokens ≈ characters ÷ 4 in every column. Savings range from 2× (a page that is already mostly text) to hundreds of times (a site serving its own markdown); `focus` and `maxTokens` cap any page at the budget you choose. Tool schemas: browsermcp 1,352 tokens, Playwright MCP 5,072 — Claude Code, Cursor and Codex load schemas on demand, so this mainly matters for clients that don't.

## Development

```bash
npm install
npx playwright install chromium
npm test          # vitest — unit, browser, and end-to-end MCP protocol tests
npm run build
```

## Name

browsermcp (`browsermcpai` on npm) is not affiliated with Browser MCP (browsermcp.io), a separate Chrome-extension project.

## License

MIT
