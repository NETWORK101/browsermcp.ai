# Changelog

## 0.2.1 — 2026-10-01

### Added
- **More browsers.** `browser.engine` can be `"chromium"` (default), `"firefox"`, or `"webkit"` (Safari's engine). `browser.channel` runs an installed Google Chrome or Microsoft Edge (`"chrome"`, `"msedge"`, beta/dev channels). `cdpEndpoint` attaches to any Chromium-based browser you already run (Chrome, Edge, Brave, Arc, Vivaldi, Opera).
- `browsermcp login [url] --browser firefox|webkit|chromium`.
- Each engine keeps its own persistent profile (`~/.browsermcp/profile`, `profile-firefox`, `profile-webkit`), so switching engines never mixes session stores.

- **Metadata-first reading.** `browse`, `extract` and `focus` use the publisher's own markdown when a page offers it: a same-origin `<link rel="alternate" type="text/markdown">`, or `Accept: text/markdown` content negotiation. Otherwise the rendered DOM is distilled as before. Configure with `distill.publisherMarkdown` (default `true`).
- **Page card.** Each result starts with one line of provenance (type, site, author, published/updated, canonical, content source) built from JSON-LD (including `@graph`), OpenGraph, `<meta>`, canonical links and markdown front matter. It's also returned as `structuredContent.card`, with `structuredContent.source`.
- **`links` reports `/llms.txt`** when a site publishes one, guarding against soft-404 HTML pages.

### Fixed
- In-page scripts failed with `__name is not defined` when the server ran through `tsx` (`npm run dev`), because esbuild's keepNames wraps helper functions. Every page script now runs through a wrapper that works with any compiler.

### Roadmap
- Attach to your running Firefox (WebDriver BiDi) and Safari (`safaridriver`).
- Optional browser-extension bridge, so the agent can read tabs in your everyday browser without remote-debugging flags.

## 0.2.0 — 2026-09-30

### Added
- **Authenticated sessions that work.** `browsermcp login [url]` signs in on a persistent profile (`~/.browsermcp/profile`), used automatically via `browser.profile: "auto"`. `browser.cdpEndpoint` attaches to your own running Chrome. Earlier versions always used a fresh, cookie-less context, so signed-in pages showed a login screen.
- **`browse` focus and budget.** `focus` ranks sections (BM25 with heading boost). `maxTokens` enforces a budget (default `distill.maxTokens`, which was previously ignored). Truncated results list the omitted section headings.
- **`browse({ diff: true })`** replaces the `watch` tool. `watch` remains as a hidden alias.
- **`links` tool.** Returns de-duplicated absolute links with `sameOrigin` / `match` filters.
- **`extract` returns real structure.** JSON-LD, meta/OpenGraph, tables as row objects, and headings in `structuredContent`. With `schema`, it fills the schema via **MCP sampling** when the client supports it.
- **`interact` actions.** `press`, `check`, `uncheck`, `hover`, `scroll`, `wait` (in addition to `click`, `fill`, `select`). `selector` is now optional where it makes sense.
- **`screenshot`** supports `format: "jpeg"`, `quality`, and `waitFor`.
- **MCP spec features.** Tool `title` + `annotations` (read-only vs destructive), `outputSchema` + `structuredContent`, `isError` results, server `instructions`, progress notifications, and diff snapshots exposed as resources.
- **Policy.** `policy.allow` / `policy.deny` host globs, `policy.allowInteract` (read-only mode), `policy.allowFileUrls`. URLs are checked before navigation and again after cross-origin redirects or actions.
- **Prompt-injection fence.** Page content is wrapped in `<untrusted-page-content>`, and early-close attempts are neutralised.
- `init` prints ready-to-paste setup for Claude Code, Claude Desktop, Cursor, VS Code and Codex CLI, and no longer overwrites an existing `.browsermcp.json`.
- `--version`, `help`, and friendlier `usage` output.

### Changed
- Navigation waits for DOMContentLoaded plus a bounded network-settle (≤2.5s), so client-rendered apps are read after they render.
- `browse` no longer appends every link and button by default. Pass `elements: true`, which also caps the list at 80 visible elements.
- Interactive-element selectors are now verified unique (id → data-testid → name → aria-label → structural path). The previous `nth-of-type` selectors were computed across the whole document and were often wrong.
- Relative links and images resolve to absolute URLs.
- Headerless tables (infoboxes, layout tables) render as rows instead of raw HTML. Pages where Readability discards section headings fall back to structure-preserving extraction.
- `includeLinks` / `includeImages` are honoured (images are dropped by default).
- Tool errors set `isError: true`.
- Server version is read from `package.json` (previously hard-coded and out of sync).
- `BROWSERMCP_NO_LIMIT=1` overrides the circuit breaker (`HEADLESSDEV_NO_LIMIT` still works).

### Fixed
- Line diff falls back to a set-based diff on very large pages instead of allocating an O(n·m) table.
- Usage query no longer interpolates values into SQL.
