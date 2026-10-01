import React from 'react'
import { SectionHead, LINKS } from './ui.jsx'

/*
  Figures from benchmarks/results.md — `npm run bench` on 2026-10-01 with browsermcp 0.3.0
  and @playwright/mcp 0.0.83. Tokens ≈ characters ÷ 4 in every column, so columns compare alike.
*/
const BENCH = [
  { page: 'Stripe API reference', url: 'docs.stripe.com/api', html: 428457, snap: 30724, full: 482, dflt: 482, source: 'publisher markdown' },
  { page: 'Vercel docs', url: 'vercel.com/docs', html: 212432, snap: 13061, full: 2120, dflt: 2120, source: 'publisher markdown' },
  { page: 'GitHub REST: Issues', url: 'docs.github.com/en/rest/issues/issues', html: 330083, snap: 87350, full: 20228, dflt: 4002, source: 'publisher markdown' },
  { page: 'Next.js docs', url: 'nextjs.org/docs', html: 159921, snap: 19721, full: 799, dflt: 799, source: 'rendered' },
  { page: 'MDN: Accept header', url: 'developer.mozilla.org/…/Headers/Accept', html: 33299, snap: 19146, full: 1228, dflt: 1228, source: 'rendered' },
  { page: 'Wikipedia: Model Context Protocol', url: 'en.wikipedia.org/wiki/Model_Context_Protocol', html: 109268, snap: 20288, full: 6387, dflt: 3991, source: 'rendered' },
  { page: 'Python: json module', url: 'docs.python.org/3/library/json.html', html: 29700, snap: 25381, full: 8624, dflt: 3996, source: 'rendered' },
  { page: 'Hacker News front page', url: 'news.ycombinator.com', html: 8539, snap: 12207, full: 4023, dflt: 3945, source: 'rendered' },
]
const fmt = n => n.toLocaleString('en-US')

export function TokenReduction() {
  return (
    <section className="section" id="tokens" aria-labelledby="tokens-title">
      <div className="wrap">
        <SectionHead num="06" kicker="Token economics" id="tokens-title" title={<>Pay for the <em>content,</em> not the markup.</>}>
          The page is the bill. A raw dump, or a full accessibility snapshot, can cost more than the answer is worth.
          browsermcp returns the page’s own text — focused, under a budget you set. Here is what that costs on real pages.
        </SectionHead>

        <div className="bt-wrap reveal">
          <table className="bt">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Rendered HTML</th>
                <th scope="col">Playwright MCP snapshot</th>
                <th scope="col">browsermcp, full</th>
                <th scope="col">browsermcp, 4k default</th>
                <th scope="col" className="bt-src">Source</th>
              </tr>
            </thead>
            <tbody>
              {BENCH.map(b => (
                <tr key={b.url}>
                  <th scope="row" className="bt-page">
                    {b.page}
                    <span className="bt-url">{b.url}</span>
                    <span className="bt-bar" aria-hidden="true"><i style={{ '--w': `${Math.max(0.5, (b.dflt / b.html) * 100)}%` }} /></span>
                  </th>
                  <td className="bt-dim">{fmt(b.html)}</td>
                  <td className="bt-dim">{fmt(b.snap)}</td>
                  <td className="bt-us">{fmt(b.full)}</td>
                  <td className="bt-us bt-ratio">{fmt(b.dflt)}</td>
                  <td className="bt-src">{b.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="honest reveal">
          <span className="honest-range">2× – 889×</span>
          <span>
            Savings depend on the page. A site that serves its own markdown drops by hundreds of times; dense prose like
            Python’s <code>json</code> docs only 3×; Hacker News’s front page is already mostly text, so there is little to
            remove — and the snapshot there is bigger than the HTML. <code>focus</code> and <code>maxTokens</code> cap any
            page at a budget you choose.
          </span>
        </p>

        <p className="bt-foot reveal">
          Measured 2026-10-01 with browsermcp 0.3.0 and @playwright/mcp 0.0.83; the snapshot column is <code>browser_snapshot</code>, the page
          text an agent reads. Reproduce it with <code>npm run bench</code> —{' '}
          <a href={`${LINKS.github}/blob/main/benchmarks/results.md`} target="_blank" rel="noopener noreferrer">results on GitHub</a>.
          Tool schemas: browsermcp 1,352 tokens for 5 tools, Playwright MCP 5,072 for 25. Claude Code, Cursor and Codex load tool
          schemas on demand, so that mostly matters for clients that don’t.
        </p>
      </div>
    </section>
  )
}
