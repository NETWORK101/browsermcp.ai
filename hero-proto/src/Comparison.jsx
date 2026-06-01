import React from 'react'
import { motion } from 'framer-motion'

const features = [
  { label: 'Built for', browsermcp: 'Reading pages', agentbrowser: 'Driving browsers', playwright: 'Driving browsers', firecrawl: 'Crawling at scale' },
  { label: 'Runs locally', browsermcp: 'Yes — always', agentbrowser: 'Yes', playwright: 'Yes', firecrawl: 'Cloud only' },
  { label: 'Authenticated pages', browsermcp: 'Your local session', agentbrowser: 'Your local session', playwright: 'Your local session', firecrawl: 'No' },
  { label: 'Reads localhost', browsermcp: 'Yes', agentbrowser: 'Yes', playwright: 'Yes', firecrawl: 'No' },
  { label: 'Sandboxed agents', browsermcp: 'Yes (MCP)', agentbrowser: 'No (needs shell)', playwright: 'Yes (but heavy)', firecrawl: 'Yes (but cloud)' },
  { label: 'Content → markdown', browsermcp: 'Built-in', agentbrowser: 'No', playwright: 'No', firecrawl: 'Built-in' },
  { label: 'Schema tax / request', browsermcp: '~800 tokens', agentbrowser: 'N/A (CLI)', playwright: '~13,700 tokens', firecrawl: '~2,000 tokens' },
  { label: 'Diff mode (since)', browsermcp: 'Built-in', agentbrowser: 'No', playwright: 'No', firecrawl: 'No' },
  { label: 'JavaScript rendering', browsermcp: 'Full (Chromium)', agentbrowser: 'Full (Chromium)', playwright: 'Full (Chromium)', firecrawl: 'Optional' },
  { label: 'Data leaves machine', browsermcp: 'Never', agentbrowser: 'Never', playwright: 'Never', firecrawl: 'Always' },
  { label: 'Cost', browsermcp: 'Free forever', agentbrowser: 'Free', playwright: 'Free', firecrawl: '$16-333/mo' },
]

function CellValue({ value, isHeadlessdev }) {
  const positiveValues = ['Yes', 'Yes — always', 'Free', 'Free forever', 'One command', 'Built-in', 'MCP native', '~800 tokens', 'MIT', 'Reading pages', 'Your local session', 'Full (Chromium)', 'Never', 'Yes (MCP)']
  const negativeValues = ['No', 'Cloud only', 'No (needs shell)', 'Raw HTML', '~13,700 tokens', 'CLI only', 'AGPL-3.0', 'Always']

  const isPositive = positiveValues.includes(value)
  const isNegative = negativeValues.includes(value)

  return (
    <span className={`cell-value ${isHeadlessdev ? 'cell-highlight' : ''} ${isPositive ? 'cell-positive' : ''} ${isNegative ? 'cell-negative' : ''}`}>
      {value}
    </span>
  )
}

export function Comparison() {
  return (
    <section className="section comparison-section" id="comparison">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          How it compares
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Local. Read-optimized. Minimal.
          <br />
          <span className="text-muted">No other tool ships all three.</span>
        </motion.h2>

        <motion.div
          className="comparison-table-wrap"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="comparison-table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="th-feature"></th>
                  <th className="th-browsermcp">browsermcp</th>
                  <th>Agent-Browser</th>
                  <th>Playwright MCP</th>
                  <th>Firecrawl</th>
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <motion.tr
                    key={row.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.05 * i + 0.4 }}
                  >
                    <td className="td-feature">{row.label}</td>
                    <td className="td-browsermcp"><CellValue value={row.browsermcp} isHeadlessdev /></td>
                    <td><CellValue value={row.agentbrowser} /></td>
                    <td><CellValue value={row.playwright} /></td>
                    <td><CellValue value={row.firecrawl} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
