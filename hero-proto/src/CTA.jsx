import React, { useState } from 'react'
import { motion } from 'framer-motion'

export function CTA() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('npx headlessdev init')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="section cta-section">
      <div className="section-inner">
        <motion.h2
          className="cta-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Secure, private browser access
          <br />
          <span className="title-gradient">for your AI agent.</span>
        </motion.h2>

        <motion.p
          className="cta-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Install headlessdev locally and give your AI agent secure, private
          browser access in minutes. Free forever for local use.
        </motion.p>

        <motion.div
          className="cta-actions"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="cta-install-big" onClick={handleCopy}>
            <span className="cta-dollar">$</span>
            <span>npx headlessdev init</span>
            <span className="cta-copy">{copied ? '✓ copied' : 'copy'}</span>
          </button>
        </motion.div>

        {/* Adoption path */}
        <motion.div
          className="cta-adoption"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="adoption-steps">
            <div className="adoption-step">
              <span className="adoption-num">1</span>
              <span className="adoption-text">Install the free local MCP browser</span>
            </div>
            <div className="adoption-arrow">→</div>
            <div className="adoption-step">
              <span className="adoption-num">2</span>
              <span className="adoption-text">Connect to Claude Desktop, ChatGPT, or your MCP client</span>
            </div>
            <div className="adoption-arrow">→</div>
            <div className="adoption-step">
              <span className="adoption-num">3</span>
              <span className="adoption-text">Read docs, authenticated pages, localhost, internal tools</span>
            </div>
          </div>
        </motion.div>

        {/* Paid path hint */}
        <motion.p
          className="cta-paid-hint"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Need hosted remote MCP, shared team access, audit logs, or managed proxy infrastructure?{' '}
          <a href="#" className="cta-paid-link">Talk to us about teams.</a>
        </motion.p>

        <motion.div
          className="cta-links"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a
            href="https://github.com/headlessdev/headlessdev"
            target="_blank"
            rel="noopener"
            className="cta-link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
          <a href="#" className="cta-link">Read the Docs</a>
          <a href="#" className="cta-link">Run the Benchmark</a>
        </motion.div>
      </div>
    </section>
  )
}
