import React from 'react'
import { motion } from 'framer-motion'

const capabilities = [
  {
    title: 'Authenticated pages',
    desc: "Stripe dashboard. AWS console. GitHub settings. headlessdev uses your existing browser session. No credentials leave your machine.",
    code: 'browse({ url: "https://dashboard.stripe.com/payments" })',
  },
  {
    title: 'Localhost & dev servers',
    desc: "Read your own localhost:3000, staging environments, internal admin panels. Cloud tools structurally can't reach these.",
    code: 'browse({ url: "http://localhost:3000/admin" })',
  },
  {
    title: 'Internal wikis & docs',
    desc: "Confluence behind SSO, Notion workspaces, your team's internal docs. If you can see it in Chrome, your agent can read it.",
    code: 'browse({ url: "https://yourco.atlassian.net/wiki/..." })',
  },
  {
    title: 'JavaScript-heavy apps',
    desc: "React dashboards, Next.js apps, Vue admin panels — pages that load content with JavaScript after the initial page load. Plain HTTP fetchers see an empty shell. headlessdev runs a real Chromium browser, so your agent sees the fully rendered page.",
    code: 'browse({ url: "https://app.internal.co/dashboard" })',
  },
]

export function WhyLocal() {
  return (
    <section className="section why-local-section" id="local">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Why local matters
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Browsing stays on your machine.
          <br />
          <span className="text-muted">Always.</span>
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          headlessdev runs a real Chromium browser locally. Your authenticated sessions,
          localhost servers, and internal pages are read directly — no cloud relay,
          no credential sharing, no API keys.
        </motion.p>

        <div className="why-local-grid">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              className="why-local-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 * i + 0.3 }}
            >
              <h3 className="why-local-card-title">{cap.title}</h3>
              <p className="why-local-card-desc">{cap.desc}</p>
              <div className="why-local-card-code">
                <code>{cap.code}</code>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust / safety callout */}
        <motion.div
          className="why-local-trust"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p>
            Because headlessdev can access local and internal resources, it ships with safe
            defaults, visible controls, and clear permissions over what agents are allowed to read.
          </p>
        </motion.div>

        {/* Privacy strip */}
        <motion.div
          className="why-local-privacy"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          No data leaves your machine. No API keys. No cloud relay. You stay in control.
        </motion.div>
      </div>
    </section>
  )
}
