import React, { useState } from 'react'
import { Distill } from './Distill.jsx'
import { Command, INSTALL, CLAUDE_CODE, LINKS, IconArrow, IconGitHub } from './ui.jsx'

const INSTALLS = [
  { id: 'any', label: 'Any client', cmd: INSTALL, note: 'Prints config for Claude Code, Claude Desktop, Cursor, Codex and VS Code.' },
  { id: 'cc', label: 'Claude Code', cmd: CLAUDE_CODE, note: 'One line. Registers the server with Claude Code directly.' },
]

export function Hero() {
  const [mode, setMode] = useState('any')
  const active = INSTALLS.find(i => i.id === mode)

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="masthead">
          <span>Local MCP server</span>
          <span className="mh-dot mh-hide-xs" aria-hidden="true" />
          <span className="mh-hide-xs">Real Chromium via Playwright</span>
          <span className="mh-dot mh-hide" aria-hidden="true" />
          <span className="mh-hide">MIT · free · no account</span>
          <span className="mh-right">No. 0.2.0</span>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title" id="hero-title">
              The web, <em>distilled</em> for your agent.
            </h1>
            <p className="hero-lede">
              browsermcp is a local MCP server that renders pages in a real browser and hands your agent
              clean, budgeted markdown — <strong>4× to 46× fewer tokens</strong> than raw HTML.
              Signed-in pages included. Nothing is relayed through anyone’s cloud.
            </p>

            <div className="install">
              <div className="install-tabs" role="tablist" aria-label="Install method">
                {INSTALLS.map(i => (
                  <button
                    key={i.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === i.id}
                    className="install-tab"
                    onClick={() => setMode(i.id)}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
              <Command text={active.cmd} />
              <p className="install-note">{active.note}</p>
            </div>

            <div className="hero-links">
              <a className="btn btn-primary" href="#tools">
                See the five tools <IconArrow />
              </a>
              <a className="btn btn-ghost" href={LINKS.github} target="_blank" rel="noopener noreferrer">
                <IconGitHub /> Source on GitHub
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <Distill />
          </div>
        </div>

        <dl className="ledger-strip">
          <div><dt>Tools</dt><dd>5</dd></div>
          <div><dt>Tool schema</dt><dd>~1.3k <small>tokens</small></dd></div>
          <div><dt>Page tokens saved</dt><dd>4–46<small>×</small></dd></div>
          <div><dt>Cloud relay</dt><dd>None</dd></div>
        </dl>
      </div>
    </section>
  )
}
