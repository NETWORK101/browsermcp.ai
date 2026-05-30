import React from 'react'
import { motion } from 'framer-motion'

const problems = [
  {
    title: 'Cloud scraping APIs',
    desc: "Firecrawl, Jina, Browserbase send your page content through their servers. Fine for public pages. Not fine for your Stripe dashboard, internal wiki, or localhost:3000.",
    icon: '\u2601',
  },
  {
    title: 'CLI browser tools',
    desc: "Agent-Browser, Stagehand run locally \u2014 but they need a shell. Claude Desktop, ChatGPT, and custom chat UIs don't have one. Your sandboxed agent is locked out.",
    icon: '>_',
  },
  {
    title: 'Full browser automation MCP',
    desc: "Playwright MCP gives your agent 30+ tools and 13,700 tokens of schema per request. When the job is just to read a page, that's a sledgehammer for a nail.",
    icon: '\u2699',
  },
]

export function ProblemSection() {
  return (
    <section className="section problem-section" id="problem">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          The problem
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Three ways to give an agent browser access.
          <br />
          <span className="text-muted">None of them are right.</span>
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          AI agents increasingly need to read private, authenticated, internal, and localhost
          content. But the existing options all have trade-offs.
        </motion.p>

        <div className="problem-grid">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              className="problem-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 * i + 0.3 }}
            >
              <div className="problem-card-icon">{problem.icon}</div>
              <h3 className="problem-card-title">{problem.title}</h3>
              <p className="problem-card-desc">{problem.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="problem-callout"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p>
            <strong>headlessdev</strong> is the alternative: a local, read-optimized MCP browser
            that works in sandboxed agents and keeps your content on your machine.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
