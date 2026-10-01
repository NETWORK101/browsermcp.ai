import React, { useState } from 'react'
import { Distill } from './Distill.jsx'
import { TokenField } from './TokenField.jsx'
import { ScrambleWord } from './Scramble.jsx'
import { Command, INSTALL, CLAUDE_CODE, LINKS, IconArrow, IconGitHub } from './ui.jsx'

const INSTALLS = [
  { id: 'any', label: 'Any client', cmd: INSTALL, note: 'Prints config for Claude Code, Claude Desktop, Cursor, Codex and VS Code.' },
  { id: 'cc', label: 'Claude Code', cmd: CLAUDE_CODE, note: 'One line. Registers the server with Claude Code directly.' },
]

const LINES = [
  { words: ['Let', 'your', 'agent'] },
  { words: ['read', 'the', 'web'] },
  { words: ['securely', 'and', 'locally'], tone: 'accent' },
]

const GUARANTEES = [
  ['Local', 'A real Chromium on your machine. No cloud relay, no API key, no account.'],
  ['Private', 'Signed-in sessions stay in a profile on your disk and are never uploaded.'],
  ['Guarded', 'Domain allow/deny, read-only mode, and a prompt-injection fence on every page.'],
]

export function Hero() {
  const [mode, setMode] = useState('any')
  const active = INSTALLS.find(i => i.id === mode)
  let wordIndex = 0

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <TokenField />
      <div className="wrap hero-inner">
        <div className="masthead">
          <span>Local MCP server</span>
          <span className="mh-dot mh-hide-xs" aria-hidden="true" />
          <span className="mh-hide-xs">Runs on your machine</span>
          <span className="mh-dot mh-hide" aria-hidden="true" />
          <span className="mh-hide">Nothing leaves it</span>
          <span className="mh-right">No. 0.2.1</span>
        </div>

        <h1 className="hero-title" id="hero-title" aria-label="Let your agent read the web securely and locally">
          {LINES.map((line, li) => (
            <span key={li} className={`ht-line${line.tone ? ` ht-${line.tone}` : ''}`} aria-hidden="true">
              {line.words.map((word, wi) => (
                <React.Fragment key={wi}>
                  {wi > 0 && ' '}
                  <ScrambleWord text={word} delay={120 + wordIndex++ * 90} />
                </React.Fragment>
              ))}
            </span>
          ))}
        </h1>
        <p className="hero-hint" aria-hidden="true">Move across the grid to distill it · click for a shockwave · hover a word</p>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-lede">
              browsermcp is an MCP server that renders pages in a real browser <strong>on your machine</strong> and
              hands your agent clean, budgeted markdown — <strong>4× to 46× fewer tokens</strong> than raw HTML.
              Dashboards, intranets and localhost included. Nothing is relayed through anyone’s cloud.
            </p>

            <ol className="guarantees">
              {GUARANTEES.map(([k, v], i) => (
                <li key={k}>
                  <span className="g-n">0{i + 1}</span>
                  <span className="g-k">{k}</span>
                  <span className="g-v">{v}</span>
                </li>
              ))}
            </ol>

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
              <a className="btn btn-primary" href="#local">
                How it stays local <IconArrow />
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
          <div><dt>Where it runs</dt><dd>Local</dd></div>
          <div><dt>Cloud relay</dt><dd>None</dd></div>
          <div><dt>Injection fence</dt><dd>On</dd></div>
          <div><dt>Page tokens saved</dt><dd>4–46<small>×</small></dd></div>
        </dl>
      </div>
    </section>
  )
}
