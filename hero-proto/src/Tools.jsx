import React from 'react'
import { motion } from 'framer-motion'

const tools = [
  {
    name: 'browse',
    tagline: 'Read any page as markdown',
    description: 'Navigate to a URL, get clean distilled content back. Not raw HTML — structured markdown your agent can reason about in a fraction of the tokens.',
    code: `browse({ url: "https://docs.stripe.com/api",\n  instruction: "find the pricing endpoints" })`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    name: 'extract',
    tagline: 'Structured data, not guesswork',
    description: 'Pull structured data from any page with an optional JSON schema. Your agent gets exactly the shape it needs — no parsing, no regex, no hallucination.',
    code: `extract({ url: "https://competitor.com/pricing",\n  schema: { plans: [{ name, price, features }] } })`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
  },
  {
    name: 'screenshot',
    tagline: 'See what your agent sees',
    description: 'Full-page or element-specific PNG capture. Visual verification after deploys, checking UI state, or capturing evidence — without opening a browser yourself.',
    code: `screenshot({ url: "http://localhost:3000",\n  fullPage: true })`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    name: 'interact',
    tagline: 'When reading isn\'t enough',
    description: 'Click, fill, submit. For the 10% of the time your agent actually needs to drive — login flows, form submissions, multi-step wizards. Returns clean page state after.',
    code: `interact({ url: "https://app.com/login",\n  actions: [\n    { type: "fill", selector: "#email", value: "..." },\n    { type: "click", selector: "button[type=submit]" }\n  ] })`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 15l-2 5L9 9l11 4-5 2z" />
        <path d="M15 15l5 5" />
      </svg>
    ),
  },
]

export function Tools() {
  return (
    <section className="section tools-section" id="tools">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          4 tools. Not 40.
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Everything your agent needs.
          <br />
          <span className="text-muted">Nothing it doesn't.</span>
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Other tools expose 30+ browser actions and let the agent figure it out.
          browsermcp gives it 4 — because 90% of the time, your agent just needs to read.
        </motion.p>

        <div className="tools-grid">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              className="tool-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 * i }}
            >
              <div className="tool-icon">{tool.icon}</div>
              <h3 className="tool-name">{tool.name}</h3>
              <p className="tool-tagline">{tool.tagline}</p>
              <p className="tool-desc">{tool.description}</p>
              <div className="tool-code">
                <code>{tool.code}</code>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
