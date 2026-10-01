import React from 'react'
import { SectionHead, Command } from './ui.jsx'
import { Playground } from './Playground.jsx'

const TOOLS = [
  {
    name: 'browse',
    what: 'Page → clean markdown.',
    detail: 'Uses the publisher’s own markdown when a site offers it, otherwise distills the rendered page. Opens with a page card (type, author, dates, source), ranks sections against a focus, and lists what it left out.',
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
    detail: 'Deduplicated links, filterable to the same origin or a substring match. Points out the site’s /llms.txt when it publishes one.',
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
    detail: 'Click, fill, select, press, check, hover, scroll, wait — then get the distilled page that results. Off by default while a signed-in session is in use; switch on with allowInteract: true.',
    params: ['actions'],
    hint: 'write',
  },
]

export function Tools() {
  return (
    <section className="section" id="tools" aria-labelledby="tools-title">
      <div className="wrap">
        <SectionHead num="05" kicker="The tools" id="tools-title" title={<>Five tools, <em>or three shell commands.</em></>}>
          Built for reading first. Four tools never change a page; the fifth says so in its annotations, so your client
          can auto-approve reads and ask before writes — and it stays off while you’re signed in unless you turn it on.
          Agents with a shell can skip MCP entirely and run the same tools through the same policy.
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

        <div className="cli-strip reveal">
          <span className="cli-k">Same tools, from a shell</span>
          <Command text='npx browsermcpai read https://docs.stripe.com/api --focus "pagination" --max-tokens 1500' />
          <p>No tool schema in context. <code>extract</code> and <code>links</code> work the same way; add <code>--json</code> for structured output. Policy, budget and the untrusted-content fence all still apply.</p>
        </div>

        <Playground />
      </div>
    </section>
  )
}
