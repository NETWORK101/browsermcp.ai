# Changelog

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
