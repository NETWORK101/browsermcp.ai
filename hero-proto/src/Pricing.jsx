import React from 'react'
import { SectionHead, Command, INSTALL, LINKS, IconGitHub, IconCheck } from './ui.jsx'

const LOCAL = [
  'All five tools: browse, extract, links, screenshot, interact',
  'Signed-in pages via persistent profile or CDP attach',
  'focus, maxTokens, diff and elements on every read',
  'Domain policy, injection fence, daily circuit breaker',
  'Works with Claude Code, Claude Desktop, Cursor, Codex, VS Code',
  'No account, no API key, no usage limits beyond caps you set',
]

const ROADMAP = [
  'Hosted remote MCP endpoint for CI',
  'Shared team configs and policies',
  'Audit logs',
  'SSO',
]

export function Pricing() {
  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <div className="wrap">
        <SectionHead num="10" kicker="Pricing" id="pricing-title" title={<>Free. <em>Actually</em> free.</>}>
          Everything on this page runs on your machine at no cost, under the MIT license. There’s nothing to sign up for.
        </SectionHead>

        <div className="price-grid">
          <article className="price price-main reveal" aria-labelledby="p-local">
            <div className="price-top">
              <h3 id="p-local">Local</h3>
              <span className="price-badge">Available now</span>
            </div>
            <p className="price-amt">
              <span className="price-cur">$</span>0
              <span className="price-per">free forever · MIT</span>
            </p>
            <ul className="price-list">
              {LOCAL.map(f => <li key={f}><IconCheck />{f}</li>)}
            </ul>
            <Command text={INSTALL} />
          </article>

          <article className="price price-soon reveal" style={{ '--d': '100ms' }} aria-labelledby="p-team">
            <div className="price-top">
              <h3 id="p-team">Hosted / Team</h3>
              <span className="price-badge is-muted">Coming soon</span>
            </div>
            <p className="price-amt price-amt-soon">Not yet.</p>
            <p className="price-desc">
              For teams that want the same tools in CI and shared across machines. Nothing below exists yet —
              it’s what we’re exploring next.
            </p>
            <ul className="price-list is-roadmap">
              {ROADMAP.map(f => <li key={f}><span className="roadmap-tag">Roadmap</span>{f}</li>)}
            </ul>
            <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noopener noreferrer">
              <IconGitHub /> Follow on GitHub
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
