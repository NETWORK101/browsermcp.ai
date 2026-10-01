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
| Cloud scrapers (Firecrawl, Jina, Browserbase) | Your Stripe dashboard, internal wiki, and `localhost:3000` go through someone else's servers — or can't be reached at all. |
| Full automation MCPs (e.g. Playwright MCP) | Great for driving a browser, but ~30 tools and ~13.7k tokens of schema on every request when the job is *reading*. |
| CLI browser tools | Need a shell. Claude Desktop and other sandboxed clients don't have one. |

browsermcp is the reading-first option: **5 tools, ~1.3k tokens of schema**, pages distilled 4×–46× smaller, and the results stay on your machine.

## What's new in 0.2

- **Real authenticated browsing.** `npx browsermcpai login <url>` opens a visible browser on a private profile. Sign in once; the agent reuses the session. Or attach to your own Chrome over CDP.
- **Focus + budget.** `browse({ url, focus: "rate limits", maxTokens: 1500 })` ranks sections by relevance and returns only what fits — and tells the agent which sections it left out.
- **Structured extraction with MCP sampling.** `extract` returns JSON-LD, meta tags, and tables as row objects. Pass a `schema` and your *client's own model* fills it — no extra API key.
- **Current MCP spec.** Tool `annotations`, `outputSchema` + `structuredContent`, server `instructions`, progress notifications, and diff snapshots as resources.
- **Safety by default.** Domain allow/deny policy, read-only mode, dangerous schemes blocked, and every page wrapped in an untrusted-content fence against prompt injection.

See [CHANGELOG.md](CHANGELOG.md) for the full list and migration notes.

## Tools

| Tool | What it does | Annotations |
|---|---|---|
| `browse` | Page → clean markdown. `focus`, `maxTokens`, `diff`, `elements`, `waitFor`. | read-only |
| `extract` | JSON-LD, meta/OpenGraph, tables as rows, headings; optional `schema` filled via sampling. | read-only |
| `links` | De-duplicated absolute links; filter by `sameOrigin` or `match`. | read-only |
| `screenshot` | Viewport, full page, or one `selector`; `png` or `jpeg`. | read-only |
| `interact` | `click` `fill` `select` `press` `check` `uncheck` `hover` `scroll` `wait`, then returns the resulting page. | **destructive** |

Read-only annotations let clients auto-approve reads while still confirming `interact`.

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

> Either way the agent can read anything those sessions can. Pair this with `policy.allow` (below).

## Configuration

`npx browsermcpai init` writes `.browsermcp.json`. Global defaults can live in `~/.config/browsermcp/config.json`; project config wins.

```jsonc
{
  "browser": {
    "timeout": 30000,
    "headless": true,
    "profile": "auto",            // "auto" | "persistent" | "ephemeral"
    "cdpEndpoint": null           // e.g. "http://localhost:9222"
  },
  "distill": {
    "maxTokens": 4000,            // default budget for browse/extract/interact
    "includeLinks": true,
    "includeImages": false
  },
  "policy": {
    "allow": [],                  // host globs; empty = any. e.g. ["*.stripe.com", "localhost:*"]
    "deny": [],                   // checked first
    "allowInteract": true,        // false = read-only mode (interact is hidden)
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

- **Nothing is relayed.** Pages are fetched and distilled by a Chromium process on your machine.
- **Policy at the boundary.** Every URL is checked before a browser is touched, and again after redirects or actions that change origin. Only `http(s)` is allowed by default; `file:`, `javascript:`, `chrome:`, `data:` are refused.
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

## Token benchmarks

| Page type | Raw HTML | Distilled | Reduction |
|---|---|---|---|
| API docs | 84,201 | 1,847 | 46× |
| E-commerce PDP | 67,300 | 4,200 | 16× |
| SPA dashboard | 42,800 | 3,100 | 14× |
| Docs landing | 31,500 | 2,800 | 11× |
| Blog post | 18,400 | 4,600 | 4× |

Fixtures and the runner are in [`benchmarks/`](benchmarks). We publish the 4× case too.

## Development

```bash
npm install
npx playwright install chromium
npm test          # vitest — unit, browser, and end-to-end MCP protocol tests
npm run build
```

## License

MIT
