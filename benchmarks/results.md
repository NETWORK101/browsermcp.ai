# Token benchmark

Run on 2026-10-01 with localmcp 0.3.0 and Playwright MCP 1.64.0-alpha-1790635538000 (`@playwright/mcp@0.0.83`). Reproduce with `npm run bench`.

Tokens are estimated as characters ÷ 4 for every column, so the columns compare like with like. Live pages change, so expect different numbers on a re-run.

| Page | URL | Rendered HTML | Playwright MCP snapshot | localmcp full | localmcp default (4k budget) | HTML ÷ full | localmcp source |
|---|---|---:|---:|---:|---:|---:|---|
| Stripe API reference | https://docs.stripe.com/api | 428,457 | 30,724 | 482 | 482 | 889× | publisher-negotiated |
| Vercel docs | https://vercel.com/docs | 212,432 | 13,061 | 2,120 | 2,120 | 100× | publisher-alternate |
| GitHub REST: Issues | https://docs.github.com/en/rest/issues/issues | 330,083 | 87,350 | 20,228 | 4,002 | 16× | publisher-alternate |
| MDN: Accept header | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept | 33,299 | 19,146 | 1,228 | 1,228 | 27× | rendered |
| Python: json module | https://docs.python.org/3/library/json.html | 29,700 | 25,381 | 8,624 | 3,996 | 3× | rendered |
| Next.js docs | https://nextjs.org/docs | 159,921 | 19,721 | 799 | 799 | 200× | rendered |
| Wikipedia: Model Context Protocol | https://en.wikipedia.org/wiki/Model_Context_Protocol | 109,268 | 20,288 | 6,387 | 3,991 | 17× | rendered |
| Hacker News front page | https://news.ycombinator.com/ | 8,539 | 12,207 | 4,023 | 3,945 | 2× | rendered |

- **Rendered HTML** is the page after load, which is what a raw dump would put into context.
- **Playwright MCP snapshot** is `browser_snapshot`, the accessibility-tree text an agent reads to see the page. In this version, `browser_navigate` returns a link to a snapshot file rather than inlining it.
- **localmcp full** is `browse` with no budget. **default** is `browse` with its 4,000-token default; `focus` picks which sections fill that budget.
- **source** is `publisher-*` when the site served its own markdown, or `rendered` when localmcp distilled the page.

Tool schemas (tools/list JSON): localmcp 1,352 tokens (5 tools); Playwright MCP 5,072 tokens. Claude Code, Cursor and Codex load MCP tool schemas on demand, so this matters mainly for clients that don't.
