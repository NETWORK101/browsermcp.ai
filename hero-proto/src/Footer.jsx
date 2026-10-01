import React from 'react'
import { LINKS, Mark } from './ui.jsx'

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <span className="brand"><Mark size={16} /><span className="brand-name">browsermcp</span></span>
          <p>A read-optimized browser for AI agents. Runs locally. MIT licensed.</p>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={LINKS.npm} target="_blank" rel="noopener noreferrer">npm</a>
          <a href={LINKS.docs} target="_blank" rel="noopener noreferrer">Docs</a>
          <a href="#top">Back to top ↑</a>
        </nav>
        <p className="footer-colophon">
          <span>browsermcpai v0.2.0</span>
          <span>Set in Instrument Serif, Geist &amp; Geist Mono</span>
        </p>
      </div>
    </footer>
  )
}
