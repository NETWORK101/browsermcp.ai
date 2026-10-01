import React from 'react'
import { SectionHead } from './ui.jsx'

const BENCH = [
  { page: 'API docs', eg: 'Stripe API reference', raw: 84201, out: 1847, ratio: '46×' },
  { page: 'SPA dashboard', eg: 'internal admin', raw: 42800, out: 3100, ratio: '14×' },
  { page: 'E-commerce PDP', eg: 'storefront product page', raw: 67300, out: 4200, ratio: '16×' },
  { page: 'Docs landing', eg: 'framework docs home', raw: 31500, out: 2800, ratio: '11×' },
  { page: 'Blog post', eg: 'long-form article', raw: 18400, out: 4600, ratio: '4×' },
]
const MAX = 84201
const fmt = n => n.toLocaleString('en-US')

export function TokenReduction() {
  return (
    <section className="section" id="tokens" aria-labelledby="tokens-title">
      <div className="wrap">
        <SectionHead num="04" kicker="Token economics" id="tokens-title" title={<>Pay for the <em>content,</em> not the markup.</>}>
          There are two bills. The obvious one is the page itself. The hidden one is tool schema —
          definitions your client loads into context on every single request.
        </SectionHead>

        <div className="schema-tax reveal">
          <div className="st-row">
            <div className="st-label">
              <span className="st-name">Playwright MCP</span>
              <span className="st-sub">tool schema, per request</span>
            </div>
            <div className="st-bar-wrap"><span className="st-bar st-bar-them" style={{ '--w': '100%' }} /></div>
            <span className="st-num">~13.7k</span>
          </div>
          <div className="st-row">
            <div className="st-label">
              <span className="st-name is-us">browsermcp</span>
              <span className="st-sub">tool schema, per request</span>
            </div>
            <div className="st-bar-wrap"><span className="st-bar st-bar-us" style={{ '--w': '7.3%' }} /></div>
            <span className="st-num is-us">~1.3k</span>
          </div>
        </div>

        <div className="bench reveal" role="table" aria-label="Page tokens: raw HTML versus browsermcp output">
          <div className="bench-row bench-headrow" role="row">
            <span role="columnheader">Page type</span>
            <span role="columnheader" className="bench-bars-h">Raw HTML <i aria-hidden="true">vs</i> distilled</span>
            <span role="columnheader" className="num">Raw</span>
            <span role="columnheader" className="num">Out</span>
            <span role="columnheader" className="num">Ratio</span>
          </div>
          {BENCH.map((b, i) => (
            <div className="bench-row" role="row" key={b.page} style={{ '--d': `${i * 90}ms` }}>
              <span role="cell" className="bench-page">
                {b.page}
                <small>{b.eg}</small>
              </span>
              <span role="cell" className="bench-bars" aria-hidden="true">
                <span className="bb bb-raw" style={{ '--w': `${(b.raw / MAX) * 100}%` }} />
                <span className="bb bb-out" style={{ '--w': `${(b.out / MAX) * 100}%` }} />
              </span>
              <span role="cell" className="num dim">{fmt(b.raw)}</span>
              <span role="cell" className="num">{fmt(b.out)}</span>
              <span role="cell" className="num ratio">{b.ratio}</span>
            </div>
          ))}
        </div>

        <p className="honest reveal">
          <span className="honest-range">4× – 46×</span>
          <span>
            Savings depend on the page. Chrome-heavy docs and dashboards compress the most; a plain blog post is
            already mostly prose, so you save about 4×. Add <code>focus</code> and <code>maxTokens</code> to cap any page at a budget you choose.
          </span>
        </p>
      </div>
    </section>
  )
}
