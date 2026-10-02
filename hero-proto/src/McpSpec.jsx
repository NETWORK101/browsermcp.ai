import React from 'react'
import { SectionHead } from './ui.jsx'

const ITEMS = [
  {
    k: 'annotations',
    title: 'Tool annotations',
    body: 'Every tool declares readOnlyHint, destructiveHint and openWorldHint — so clients can auto-approve reads and confirm writes.',
    code: '{ readOnlyHint: true,\n  openWorldHint: true }',
  },
  {
    k: 'outputSchema',
    title: 'Typed, structured output',
    body: 'Each tool publishes an outputSchema and returns structuredContent alongside text. No regex over prose.',
    code: 'structuredContent: {\n  url, title, tokens, … }',
  },
  {
    k: 'sampling',
    title: 'Sampling for extraction',
    body: 'extract with a schema asks your own client’s model to fill it. No second API key; falls back to schema-hinted markdown.',
    code: 'sampling/createMessage',
  },
  {
    k: 'resources',
    title: 'Snapshots as resources',
    body: 'Pages you read with diff mode are kept as snapshots and exposed as MCP resources your client can list and re-read.',
    code: 'resources/list',
  },
  {
    k: 'instructions',
    title: 'Instructions & progress',
    body: 'Server instructions teach the model when to reach for which tool. Long renders report progress notifications.',
    code: 'notifications/progress',
  },
]

export function McpSpec() {
  return (
    <section className="section" id="spec" aria-labelledby="spec-title">
      <div className="wrap">
        <SectionHead num="07" kicker="Protocol" id="spec-title" title={<>Built on the <em>current</em> MCP spec.</>}>
          Not a wrapper around a CLI. localmcp uses the parts of the protocol that make tools safer and cheaper to call.
        </SectionHead>

        <ul className="spec-grid">
          {ITEMS.map((it, i) => (
            <li key={it.k} className="spec-cell reveal" style={{ '--d': `${i * 60}ms` }}>
              <span className="spec-k">{it.k}</span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
              <pre className="spec-code"><code>{it.code}</code></pre>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
