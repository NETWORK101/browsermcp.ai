import React from 'react'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">&#x2B21;</span>
          <span className="logo-text">headlessdev</span>
        </div>
        <div className="footer-links">
          <a href="https://github.com/headlessdev/headlessdev" target="_blank" rel="noopener">GitHub</a>
          <a href="#tools">Tools</a>
          <a href="#">Docs</a>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} headlessdev. Open source under MIT.
        </div>
      </div>
    </footer>
  )
}
