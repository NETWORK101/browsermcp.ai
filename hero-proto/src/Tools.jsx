import React from 'react'
import { SectionHead } from './ui.jsx'
import { Playground } from './Playground.jsx'

const TOOLS = [
  {
    name: 'browse',
    what: 'Page → clean markdown.',
    detail: 'Rank sections against a focus and keep only what fits your token budget. Truncated output names the omitted headings so the agent can ask for more.',
    params: ['focus', 'maxTokens', 'diff', 'elements'],
    hint: 'read',
  },
  {
    name: 'extract',
    what: 'Structured data.',
    detail: 'JSON-LD, OpenGraph and meta, tables as JSON rows, headings. Pass a schema and your own client’s model fills it via MCP sampling.',
    params: ['schema'],
    hint: 'read',
  },
  {
    name: 'links',
    what: 'A map of the page.',
    detail: 'Deduplicated links, filterable to the same origin or a substring match — find the right page before reading it.',
    params: ['sameOrigin', 'match'],
    hint: 'read',
  },
  {
    name: 'screenshot',
    what: 'Pixels, when words aren’t enough.',
    detail: 'Full page or a single element, as PNG or JPEG.',
    params: ['selector', 'fullPage', 'format'],
    hint: 'read',
  },
  {
    name: 'interact',
    what: 'Act, then read the result.',
    detail: 'Click, fill, select, press, check, hover, scroll, wait — then get the distilled page that results. Can be switched off by policy.',
    params: ['actions'],
    hint: 'write',
  },
]

export function Tools() {
  return (
    <section className="section" id="tools" aria-labelledby="tools-title">
      <div className="wrap">
        <SectionHead num="03" kicker="The tools" id="tools-title" title={<>Five tools. <em>About 1.3k tokens</em> of schema.</>}>
          Built for reading first. Four tools never change a page; the fifth says so in its annotations,
          so your client can auto-approve reads and ask before writes.
        </SectionHead>

        <ol className="tool-ledger">
          {TOOLS.map((t, i) => (
            <li key={t.name} className="tool-row reveal" style={{ '--d': `${i * 60}ms` }}>
              <span className="tr-n">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="tr-name"><code>{t.name}</code></h3>
              <div className="tr-desc">
                <p className="tr-what">{t.what}</p>
                <p className="tr-detail">{t.detail}</p>
              </div>
              <ul className="tr-params" aria-label="Key parameters">
                {t.params.map(p => <li key={p}><code>{p}</code></li>)}
              </ul>
              <span className={`tr-hint tr-hint-${t.hint}`}>
                {t.hint === 'read' ? 'readOnly' : 'confirm'}
              </span>
            </li>
          ))}
        </ol>

        <Playground />
      </div>
    </section>
  )
}
