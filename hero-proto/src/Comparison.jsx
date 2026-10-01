import React from 'react'
import { SectionHead } from './ui.jsx'

const COLS = ['browsermcp', 'Playwright MCP', 'Agent-Browser', 'Firecrawl']

// [label, browsermcp, playwright, agent-browser, firecrawl]; a leading "+" marks a strength.
const ROWS = [
  ['Built for', '+Reading pages', 'Driving a browser', 'Driving a browser', 'Crawling & scraping'],
  ['Where it runs', '+Your machine', '+Your machine', '+Your machine', 'Hosted API (self-host option)'],
  ['Interface', '+MCP', '+MCP', 'CLI (needs a shell)', 'API, SDKs, MCP'],
  ['Browsers', '+Chromium, Chrome, Edge, Firefox, WebKit', '+Chromium, Chrome, Edge, Firefox, WebKit', 'Chromium (default)', 'Hosted (not your browser)'],
  ['Signed-in pages', '+Persistent profile or CDP attach', '+Persistent profile or extension', '+Saved session state', 'Cookies/headers sent to the service'],
  ['Reads localhost', '+Yes', '+Yes', '+Yes', 'Not from the hosted API'],
  ['Page output', '+Publisher markdown when offered, else distilled markdown', 'Accessibility snapshot', 'Accessibility snapshot', '+Markdown'],
  ['Provenance per page', '+Page card: type, author, dates, canonical, source', '—', '—', 'Metadata fields'],
  ['Tool schema per request', '~1.3k tokens', '~13.7k tokens', 'n/a (CLI)', 'Not measured'],
  ['Focus + token budget', '+focus, maxTokens', '—', '—', '—'],
  ['Only-what-changed reads', '+diff: true', '—', '—', 'Change tracking (hosted)'],
  ['Full automation', '8 basic actions', '+Yes', '+Yes', 'Scripted actions'],
  ['Price', '+Free, MIT', '+Free, open source', '+Free, open source', 'Paid tiers + free tier'],
]

function Cell({ v }) {
  const strong = v.startsWith('+')
  return <span className={strong ? 'cmp-strong' : 'cmp-plain'}>{strong ? v.slice(1) : v}</span>
}

export function Comparison() {
  return (
    <section className="section" id="compare" aria-labelledby="compare-title">
      <div className="wrap">
        <SectionHead num="09" kicker="Comparison" id="compare-title" title={<>Good tools. <em>Different jobs.</em></>}>
          Playwright MCP and Agent-Browser are excellent when an agent needs to drive a browser end to end.
          Firecrawl is built for crawling at scale. browsermcp is for the far more common job: reading — cheaply, locally, signed in.
        </SectionHead>

        <div className="cmp-wrap reveal">
          <div className="cmp-scroll" tabIndex={0} role="region" aria-label="Comparison table, scrolls horizontally">
            <table className="cmp">
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Capability</span></th>
                  {COLS.map((c, i) => <th scope="col" key={c} className={i === 0 ? 'is-us' : ''}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, ...vals]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {vals.map((v, i) => <td key={i} className={i === 0 ? 'is-us' : ''}><Cell v={v} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cmp-note">
            Based on each project’s public documentation at the time of writing; check their docs for the latest. Schema sizes are approximate.
          </p>
        </div>
      </div>
    </section>
  )
}
