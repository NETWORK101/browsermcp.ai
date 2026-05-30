import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TOOLS = [
  {
    id: 'browse',
    name: 'browse',
    tagline: 'Read any page as markdown',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    presets: [
      { label: 'Stripe API Docs', url: 'https://docs.stripe.com/api', instruction: 'find the pricing endpoints', mode: 'read' },
      { label: 'localhost:3000', url: 'http://localhost:3000/dashboard', instruction: '', mode: 'read' },
      { label: '⟳ Diff mode', url: 'https://docs.stripe.com/changelog', instruction: '', mode: 'diff' },
    ],
    buildCall: (p) => p.mode === 'diff'
      ? `browse({\n  url: "${p.url}",\n  since: true\n})`
      : `browse({\n  url: "${p.url}"${p.instruction ? `,\n  instruction: "${p.instruction}"` : ''}\n})`,
    simulateOutput: (p) => p.mode === 'diff' ? ({
      meta: { tokens: { fullPage: '1,847', diff: '127', saved: '93% fewer tokens vs re-read' }, time: '0.9s', lastChecked: '1h ago' },
      json: JSON.stringify({
        url: p.url,
        mode: "diff",
        since: "2026-05-29T14:30:00Z",
        diff: {
          changedSections: 3,
          addedLines: 5,
          removedLines: 2,
          changes: [
            { section: "Payments API", type: "modified", detail: "PaymentIntent `amount` field now optional (was required)" },
            { section: "Payments API", type: "added", detail: "New `auto_calculate` parameter" },
            { section: "Payments API", type: "deprecated", detail: "`source` parameter — use `payment_method`" },
            { section: "Webhooks", type: "modified", detail: "`payment_intent.succeeded` may fire multiple times (idempotency key required)" }
          ]
        },
        tokens: { fullPage: 1847, diff: 127, savedPercent: 93.1 }
      }, null, 2),
    }) : ({
      meta: { tokens: { raw: '84,201', distilled: '1,847', reduction: '97.8%' }, time: '1.2s' },
      json: JSON.stringify({
        url: p.url,
        tokens: { raw: 84201, distilled: 1847, reductionPercent: 97.8 },
        content: {
          title: "Stripe API Reference",
          sections: [
            {
              heading: "Payments",
              summary: "Create, confirm, and capture payments.",
              endpoints: [
                { method: "POST", path: "/v1/payment_intents", description: "Create a PaymentIntent" },
                { method: "POST", path: "/v1/payment_intents/:id/confirm", description: "Confirm" },
                { method: "POST", path: "/v1/payment_intents/:id/capture", description: "Capture" }
              ]
            }
          ],
          interactiveElements: [
            { role: "button", name: "Try it →", selector: "button.api-explorer-btn" },
            { role: "link", name: "API keys", selector: "a.nav-link[href='/apikeys']" }
          ]
        }
      }, null, 2),
    }),
  },
  {
    id: 'extract',
    name: 'extract',
    tagline: 'Structured data, not guesswork',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
    ),
    presets: [
      { label: 'Competitor Pricing', url: 'https://competitor.com/pricing', schema: '{ plans: [{ name, price, features }] }' },
      { label: 'GitHub Repo', url: 'https://github.com/vercel/next.js', schema: '{ stars, language, description }' },
      { label: 'Job Listings', url: 'https://jobs.lever.co/company', schema: '{ jobs: [{ title, location, team }] }' },
    ],
    buildCall: (p) => `extract({\n  url: "${p.url}",\n  schema: ${p.schema}\n})`,
    simulateOutput: (p) => ({
      meta: { tokens: { raw: '67,300', distilled: '890', reduction: '98.7%' }, time: '2.1s' },
      json: JSON.stringify({
        url: p.url,
        schema: p.schema,
        tokens: { raw: 67300, distilled: 890, reductionPercent: 98.7 },
        data: {
          plans: [
            { name: "Starter", price: "$0/mo", features: ["1,000 API calls", "Community support", "Basic analytics"] },
            { name: "Pro", price: "$29/mo", features: ["100,000 API calls", "Priority support", "Advanced analytics", "Team seats"] },
            { name: "Enterprise", price: "Custom", features: ["Unlimited API calls", "Dedicated support", "SLA", "SSO", "Audit logs"] }
          ]
        }
      }, null, 2),
    }),
  },
  {
    id: 'links',
    name: 'links',
    tagline: 'Map without reading',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    presets: [
      { label: 'Docs navigation', url: 'https://docs.stripe.com', filter: '/api/' },
      { label: 'Blog index', url: 'https://blog.cloudflare.com', filter: '' },
      { label: 'Sidebar links', url: 'https://nextjs.org/docs', filter: '', selector: 'nav' },
    ],
    buildCall: (p) => `links({\n  url: "${p.url}"${p.filter ? `,\n  filter: "${p.filter}"` : ''}${p.selector ? `,\n  selector: "${p.selector}"` : ''}\n})`,
    simulateOutput: (p) => ({
      meta: { count: 24, time: '0.4s' },
      json: JSON.stringify({
        url: p.url,
        filter: p.filter || null,
        count: 24,
        links: [
          { text: "Payment Intents", href: "/api/payment_intents", selector: "a[href='/api/payment_intents']" },
          { text: "Customers", href: "/api/customers", selector: "a[href='/api/customers']" },
          { text: "Subscriptions", href: "/api/subscriptions", selector: "a[href='/api/subscriptions']" },
          { text: "Invoices", href: "/api/invoices", selector: "a[href='/api/invoices']" },
          { text: "Prices", href: "/api/prices", selector: "a[href='/api/prices']" },
          { text: "Products", href: "/api/products", selector: "a[href='/api/products']" },
          { text: "Checkout Sessions", href: "/api/checkout/sessions", selector: "a[href='/api/checkout/sessions']" },
          { text: "Webhooks", href: "/api/webhooks", selector: "a[href='/api/webhooks']" }
        ],
        truncated: true,
        totalAvailable: 24
      }, null, 2),
    }),
  },
  {
    id: 'screenshot',
    name: 'screenshot',
    tagline: 'See what your agent sees',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    presets: [
      { label: 'Full Page', url: 'http://localhost:3000', fullPage: true },
      { label: 'Element Only', url: 'https://myapp.dev', selector: '#hero-section', fullPage: false },
      { label: 'After Deploy', url: 'https://staging.myapp.dev', fullPage: true },
    ],
    buildCall: (p) => `screenshot({\n  url: "${p.url}"${p.selector ? `,\n  selector: "${p.selector}"` : ''},\n  fullPage: ${p.fullPage}\n})`,
    simulateOutput: (p) => ({
      meta: { size: '847 KB', dimensions: '1440×3200', time: '0.8s' },
      image: true,
      json: JSON.stringify({
        url: p.url,
        type: "image/png",
        dimensions: { width: 1440, height: 3200 },
        sizeBytes: 867328,
        fullPage: p.fullPage ?? false,
        selector: p.selector || null,
        data: "[base64 PNG — 847 KB]"
      }, null, 2),
    }),
  },
]

function TypewriterText({ text, speed = 8, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    const timer = setInterval(() => {
      indexRef.current += 1
      const chunk = Math.min(indexRef.current, text.length)
      setDisplayed(text.slice(0, chunk))
      if (chunk >= text.length) {
        clearInterval(timer)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text])

  return <>{displayed}</>
}

function OutputPanel({ tool, preset, running }) {
  const [phase, setPhase] = useState('idle') // idle | connecting | rendering | done
  const output = tool.simulateOutput(preset)

  useEffect(() => {
    if (!running) { setPhase('idle'); return }
    setPhase('connecting')
    const t1 = setTimeout(() => setPhase('rendering'), 800)
    const t2 = setTimeout(() => setPhase('done'), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [running])

  if (phase === 'idle') {
    return (
      <div className="pg-output-empty">
        <span className="pg-output-prompt">Click "Run" to see the output</span>
      </div>
    )
  }

  const isDiffMode = tool.id === 'browse' && preset.mode === 'diff'

  if (phase === 'connecting') {
    return (
      <div className="pg-output-status">
        <span className="pg-spinner" />
        <span>{isDiffMode ? 'Fetching current snapshot...' : 'Connecting to browser...'}</span>
      </div>
    )
  }

  if (phase === 'rendering') {
    return (
      <div className="pg-output-status">
        <span className="pg-spinner" />
        <span>{isDiffMode ? 'Diffing against previous read...' : 'Rendering page & distilling content...'}</span>
      </div>
    )
  }

  // Done
  return (
    <div className="pg-output-result">
      {/* Meta bar */}
      <div className="pg-meta-bar">
        {output.meta.tokens && !output.meta.tokens.diff && (
          <>
            <span className="pg-meta-item pg-meta-bad">{output.meta.tokens.raw} raw</span>
            <span className="pg-meta-arrow">→</span>
            <span className="pg-meta-item pg-meta-good">{output.meta.tokens.distilled} distilled</span>
            {output.meta.tokens.reduction && (
              <span className="pg-meta-item pg-meta-accent">{output.meta.tokens.reduction}</span>
            )}
          </>
        )}
        {output.meta.tokens && output.meta.tokens.diff && (
          <>
            <span className="pg-meta-item pg-meta-bad">{output.meta.tokens.fullPage} full page</span>
            <span className="pg-meta-arrow">→</span>
            <span className="pg-meta-item pg-meta-good">{output.meta.tokens.diff} diff only</span>
            <span className="pg-meta-item pg-meta-accent">{output.meta.tokens.saved}</span>
          </>
        )}
        {output.meta.lastChecked && (
          <span className="pg-meta-item">prev: {output.meta.lastChecked}</span>
        )}
        {output.meta.size && (
          <span className="pg-meta-item">{output.meta.size}</span>
        )}
        {output.meta.dimensions && (
          <span className="pg-meta-item">{output.meta.dimensions}</span>
        )}
        {output.meta.count && (
          <span className="pg-meta-item pg-meta-good">{output.meta.count} links found</span>
        )}
        {output.meta.actions && (
          <span className="pg-meta-item pg-meta-good">{output.meta.actions} actions completed</span>
        )}
        <span className="pg-meta-item pg-meta-time">{output.meta.time}</span>
      </div>

      {/* Content — all tools output structured JSON */}
      <div className="pg-output-content">
        {output.json && (
          <pre className="pg-json"><TypewriterText text={output.json} speed={4} /></pre>
        )}
        {output.image && (
          <div className="pg-screenshot-mock">
            <div className="pg-screenshot-bar">
              <div className="pg-screenshot-dots">
                <span /><span /><span />
              </div>
              <div className="pg-screenshot-url">{preset.url}</div>
            </div>
            <div className="pg-screenshot-body">
              <div className="pg-screenshot-hero" />
              <div className="pg-screenshot-grid">
                <div className="pg-screenshot-block" />
                <div className="pg-screenshot-block" />
                <div className="pg-screenshot-block" />
              </div>
              <div className="pg-screenshot-lines">
                <div /><div /><div />
              </div>
            </div>
            <div className="pg-screenshot-label">Base64 PNG — 847 KB</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Playground() {
  const [activeTab, setActiveTab] = useState('browse')
  const [presetIndex, setPresetIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const [runKey, setRunKey] = useState(0)

  const tool = TOOLS.find(t => t.id === activeTab)
  const preset = tool.presets[presetIndex]

  const handleTabChange = (id) => {
    setActiveTab(id)
    setPresetIndex(0)
    setRunning(false)
  }

  const handleRun = () => {
    setRunning(false)
    setRunKey(k => k + 1)
    // defer to next tick so React re-renders OutputPanel with running=false first
    requestAnimationFrame(() => setRunning(true))
  }

  return (
    <section className="section playground-section" id="playground">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Try the tools
        </motion.div>

        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Browse, extract, map, capture.
          <br />
          <span className="text-muted">See what your agent gets back.</span>
        </motion.h2>

        <motion.div
          className="pg-container"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Tool tabs */}
          <div className="pg-tabs">
            {TOOLS.map(t => (
              <button
                key={t.id}
                className={`pg-tab ${activeTab === t.id ? 'pg-tab-active' : ''}`}
                onClick={() => handleTabChange(t.id)}
              >
                <span className="pg-tab-icon">{t.icon}</span>
                <span className="pg-tab-name">{t.name}</span>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div className="pg-main">
            {/* Left: Input */}
            <div className="pg-input-panel">
              <div className="pg-tool-header">
                <h3 className="pg-tool-name">{tool.name}</h3>
                <span className="pg-tool-tagline">{tool.tagline}</span>
              </div>

              {/* Preset selector */}
              <div className="pg-presets">
                <span className="pg-presets-label">Try with:</span>
                <div className="pg-preset-btns">
                  {tool.presets.map((p, i) => (
                    <button
                      key={i}
                      className={`pg-preset ${presetIndex === i ? 'pg-preset-active' : ''}`}
                      onClick={() => { setPresetIndex(i); setRunning(false) }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diff mode callout */}
              {preset.mode === 'diff' && (
                <div className="pg-diff-callout">
                  <span className="pg-diff-callout-icon">⟳</span>
                  <span>
                    <strong>Diff mode:</strong> browse with <code>since: true</code> returns only what
                    changed since the last read — typically 90%+ fewer tokens.
                  </span>
                </div>
              )}

              {/* Code preview */}
              <div className="pg-code-block">
                <div className="pg-code-header">
                  <span className="pg-code-lang">MCP Tool Call</span>
                </div>
                <pre className="pg-code-body">
                  <code>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${activeTab}-${presetIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tool.buildCall(preset)}
                      </motion.span>
                    </AnimatePresence>
                  </code>
                </pre>
              </div>

              {/* Run button */}
              <button className="pg-run-btn" onClick={handleRun}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run
              </button>
            </div>

            {/* Right: Output */}
            <div className="pg-output-panel">
              <div className="pg-output-header">
                <span className="pg-output-title">Output</span>
                {running && <span className="pg-live-dot" />}
              </div>
              <div className="pg-output-body">
                <OutputPanel key={runKey} tool={tool} preset={preset} running={running} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
