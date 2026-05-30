import React from 'react'
import { motion } from 'framer-motion'

const agents = [
  { name: 'Claude Desktop', status: 'works', note: 'MCP native — no shell needed' },
  { name: 'ChatGPT', status: 'works', note: 'MCP native — no shell needed' },
  { name: 'Custom chat UIs', status: 'works', note: 'Any MCP-compatible client' },
  { name: 'Claude Code', status: 'works', note: 'CLI + MCP — both paths work' },
  { name: 'Cursor', status: 'works', note: 'MCP integration built in' },
  { name: 'Codex CLI', status: 'works', note: 'MCP config, one command' },
]

export function SandboxProof() {
  return (
    <section className="section sandbox-section" id="sandbox">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Built for the agents others forgot
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          No shell? No problem.
        </motion.h2>

        <motion.p
          className="section-desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Agent-Browser is a CLI. It needs a shell to run. Claude Desktop, ChatGPT, and custom chat UIs
          don't have one. headlessdev is MCP-native — your sandboxed agent gets the same
          read capability the CLI crowd has.
        </motion.p>

        {/* Agent compatibility grid */}
        <div className="agent-compat-grid">
          <motion.div
            className="compat-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="compat-col-name">Agent / Client</div>
            <div className="compat-col-hdv">headlessdev</div>
            <div className="compat-col-ab">Agent-Browser</div>
            <div className="compat-col-note">Why</div>
          </motion.div>

          {agents.map((agent, i) => {
            const needsShell = ['Claude Code', 'Cursor', 'Codex CLI'].includes(agent.name)
            return (
              <motion.div
                key={agent.name}
                className="compat-row"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.06 * i + 0.4 }}
              >
                <div className="compat-col-name">{agent.name}</div>
                <div className="compat-col-hdv">
                  <span className="compat-check">✓</span>
                </div>
                <div className="compat-col-ab">
                  {needsShell ? (
                    <span className="compat-check">✓</span>
                  ) : (
                    <span className="compat-cross">✗</span>
                  )}
                </div>
                <div className="compat-col-note">
                  <span className={needsShell ? '' : 'compat-note-highlight'}>{agent.note}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="sandbox-callout"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p>
            Even Microsoft's Playwright team recommends MCP for sandboxed environments and CLI
            for coding agents with filesystem access.{' '}
            <strong>We serve both — they serve one.</strong>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
