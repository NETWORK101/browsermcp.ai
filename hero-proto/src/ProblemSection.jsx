import React from 'react'
import { SectionHead } from './ui.jsx'

const ROWS = [
  {
    k: 'A',
    who: 'Cloud scrapers',
    title: 'Your private pages pass through someone else’s servers.',
    body: 'Hosted crawlers can’t reach localhost, and reading your signed-in dashboards means handing them your cookies.',
    cost: 'Costs: your privacy',
  },
  {
    k: 'B',
    who: 'CLI browser tools',
    title: 'They assume your agent has a shell.',
    body: 'Great in a terminal. But chat clients and sandboxed agents speak MCP, not bash — so the tool simply isn’t there.',
    cost: 'Costs: your sandbox',
  },
  {
    k: 'C',
    who: 'Full automation MCPs',
    title: 'Dozens of tools, loaded on every request.',
    body: 'Built to drive a browser, not to read one. You pay ~13.7k tokens of tool schema before the page even loads — then an accessibility tree instead of prose.',
    cost: 'Costs: ~13.7k tokens, every turn',
  },
]

export function ProblemSection() {
  return (
    <section className="section" id="problem" aria-labelledby="problem-title">
      <div className="wrap">
        <SectionHead num="01" kicker="The problem" id="problem-title" title={<>Every way to hand an agent a browser <em>costs something.</em></>}>
          Agents mostly need to <em>read</em> the web: docs, dashboards, changelogs, the app on localhost:3000.
          The existing options each charge for it in a different currency.
        </SectionHead>

        <ol className="problem-grid">
          {ROWS.map((r, i) => (
            <li key={r.k} className="problem-cell reveal" style={{ '--d': `${i * 80}ms` }}>
              <div className="pc-top">
                <span className="pc-k">{r.k}</span>
                <span className="pc-who">{r.who}</span>
              </div>
              <h3 className="pc-title">{r.title}</h3>
              <p className="pc-body">{r.body}</p>
              <p className="pc-cost">{r.cost}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
