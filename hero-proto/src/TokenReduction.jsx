import React from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const benchmarks = [
  { page: 'API docs', site: 'stripe.com/docs', raw: '84,201', distilled: '1,847', ratio: '46×', pct: 2.2 },
  { page: 'SPA dashboard', site: 'internal admin', raw: '42,800', distilled: '3,100', ratio: '14×', pct: 7.2 },
  { page: 'E-commerce PDP', site: 'shopify store', raw: '67,300', distilled: '4,200', ratio: '16×', pct: 6.2 },
  { page: 'Docs landing', site: 'nextjs.org', raw: '31,500', distilled: '2,800', ratio: '11×', pct: 8.9 },
  { page: 'Blog post', site: 'medium article', raw: '18,400', distilled: '4,600', ratio: '4×', pct: 25 },
]

export function TokenReduction() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="section token-section" ref={ref}>
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          What headlessdev does
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Clean markdown, not raw HTML.
          <br />
          <span className="text-muted">4 tools, not 40.</span>
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          headlessdev distills pages into structured markdown your agent can reason about.
          And unlike 30-tool automation servers, it keeps the schema small. Page tokens are the obvious cost. Schema tokens — the tool definitions your agent loads
          on every request — are the hidden one.
        </motion.p>

        {/* Schema tax comparison */}
        <motion.div
          className="schema-tax"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="schema-card schema-card-them">
            <div className="schema-header">
              <span className="schema-name">Playwright MCP</span>
              <span className="schema-tools">~30 tools</span>
            </div>
            <div className="schema-cost">
              <span className="schema-number">~13,700</span>
              <span className="schema-unit">tokens per request just for tool definitions</span>
            </div>
          </div>
          <div className="schema-vs">vs</div>
          <div className="schema-card schema-card-us">
            <div className="schema-header">
              <span className="schema-name">headlessdev</span>
              <span className="schema-tools">4 tools</span>
            </div>
            <div className="schema-cost">
              <span className="schema-number">~800</span>
              <span className="schema-unit">tokens per request for tool definitions</span>
            </div>
          </div>
        </motion.div>

        {/* Section divider */}
        <motion.div
          className="section-divider-label"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Page content reduction — per page type
        </motion.div>

        {/* Per-page-type benchmark bars */}
        <div className="benchmark-grid">
          {benchmarks.map((b, i) => (
            <motion.div
              key={b.page}
              className="benchmark-row"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * i + 0.3 }}
            >
              <div className="benchmark-meta">
                <span className="benchmark-page">{b.page}</span>
                <span className="benchmark-site">{b.site}</span>
              </div>
              <div className="benchmark-bars">
                <div className="benchmark-bar-row">
                  <span className="benchmark-label-sm">Raw</span>
                  <div className="token-bar-track">
                    <motion.div
                      className="token-bar-fill raw"
                      initial={{ width: 0 }}
                      animate={inView ? { width: '100%' } : { width: 0 }}
                      transition={{ duration: 1, delay: 0.1 * i + 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="benchmark-tokens">{b.raw}</span>
                </div>
                <div className="benchmark-bar-row">
                  <span className="benchmark-label-sm">hdv</span>
                  <div className="token-bar-track">
                    <motion.div
                      className="token-bar-fill efficient"
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${b.pct}%` } : { width: 0 }}
                      transition={{ duration: 1, delay: 0.1 * i + 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="benchmark-tokens accent">{b.distilled}</span>
                </div>
              </div>
              <div className="benchmark-ratio">{b.ratio}</div>
            </motion.div>
          ))}
        </div>

        {/* Honest callout */}
        <motion.div
          className="honest-callout"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="honest-range">
            <span className="honest-low">4×</span>
            <span className="honest-dash">to</span>
            <span className="honest-high">46×</span>
          </div>
          <p className="honest-note">
            Reduction varies by page type. We publish the raw fixtures so you can reproduce every number.
            We'll show you the pages where we only save 4×.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
