import React from 'react'
import { motion } from 'framer-motion'

const capabilities = [
  {
    title: 'Your dev server',
    desc: 'Point your agent at localhost:3000. Check the dashboard, verify the deploy, read the error page. No tunneling, no cloud relay.',
    code: 'browse({ url: "http://localhost:3000/admin" })',
    icon: '→',
    why: 'Cloud tools can\'t reach your localhost',
  },
  {
    title: 'Authenticated dashboards',
    desc: 'Stripe dashboard. AWS console. GitHub settings. headlessdev uses your existing browser session — no credential exfiltration, no cloud round-trip.',
    code: 'browse({ url: "https://dashboard.stripe.com/payments" })',
    icon: '→',
    why: 'Cloud tools can\'t access your sessions',
  },
  {
    title: 'JS-rendered SPAs',
    desc: 'React apps, Next.js dashboards, Vue admin panels. Unlike mcp-server-fetch (plain HTTP), headlessdev runs a real Chromium browser and renders JavaScript.',
    code: 'browse({ url: "https://app.internal.co/dashboard" })',
    icon: '→',
    why: 'Plain HTTP fetch misses JS-rendered content',
  },
]

export function LocalMoat() {
  return (
    <section className="section moat-section" id="local">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The local advantage
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Read your own pages.
          <br />
          <span className="text-muted">Nobody else can copy this.</span>
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Cloud readers (Firecrawl, Jina) can't see your localhost or authenticated pages — structurally.
          Plain HTTP fetchers (mcp-server-fetch) can't render JavaScript — architecturally.
          headlessdev is a real browser, on your machine, in your session.
        </motion.p>

        <div className="moat-grid">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              className="moat-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 * i + 0.3 }}
            >
              <div className="moat-card-header">
                <span className="moat-icon">{cap.icon}</span>
                <h3 className="moat-card-title">{cap.title}</h3>
              </div>
              <p className="moat-card-desc">{cap.desc}</p>
              <div className="moat-card-code">
                <code>{cap.code}</code>
              </div>
              <div className="moat-card-why">{cap.why}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="moat-privacy-strip"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            No data leaves your machine. No API keys. No cloud relay. Privacy isn't the limitation — it's the feature.
          </span>
        </motion.div>
      </div>
    </section>
  )
}
