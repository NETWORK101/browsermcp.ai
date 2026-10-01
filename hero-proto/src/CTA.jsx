import React from 'react'
import { Command, INSTALL, CLAUDE_CODE, LINKS, IconExternal } from './ui.jsx'

export function CTA() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="wrap">
        <div className="cta-inner reveal">
          <p className="cta-kicker">One command to start</p>
          <h2 className="cta-title" id="cta-title">
            Let your agent <em>read</em> the web.
          </h2>
          <div className="cta-cmds">
            <Command text={INSTALL} />
            <Command text={CLAUDE_CODE} />
          </div>
          <p className="cta-links">
            <a href={LINKS.docs} target="_blank" rel="noopener noreferrer">Read the docs <IconExternal /></a>
            <a href={LINKS.npm} target="_blank" rel="noopener noreferrer">npm package <IconExternal /></a>
            <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub <IconExternal /></a>
          </p>
        </div>
      </div>
    </section>
  )
}
