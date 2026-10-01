import React, { useEffect, useMemo, useRef, useState } from 'react'
import { prefersReducedMotion } from './ui.jsx'

/*
  A canned playground: real call shapes, illustrative outputs.
  Nothing here talks to a browser.
*/

const J = v => JSON.stringify(v, null, 2)

const TOOLS = [
  {
    id: 'browse',
    presets: [
      {
        label: 'focus + budget',
        call: `browse({\n  url: "https://docs.stripe.com/api",\n  focus: "pricing endpoints",\n  maxTokens: 1500\n})`,
        meta: ['84,201 raw', '1,492 returned', 'ranked by focus'],
        format: 'markdown',
        out: `# Prices
A Price defines the unit cost, currency and billing
cycle for a Product.

## Create a price
\`POST /v1/prices\`

| param       | type    | required |
|-------------|---------|----------|
| currency    | enum    | yes      |
| unit_amount | integer | no       |
| product     | string  | no       |
| recurring   | object  | no       |

## List all prices
\`GET /v1/prices\` — filter by \`active\`, \`product\`, \`type\`.

_Omitted sections — call again with \`focus\` or a
larger \`maxTokens\` to read them: Products ·
Coupons · Customers · Invoices · Subscriptions ·
… (+9 more)_`,
      },
      {
        label: 'diff: true',
        call: `browse({\n  url: "https://docs.stripe.com/changelog",\n  diff: true\n})`,
        meta: ['1,847 full page', '131 changed', 'since last read'],
        format: 'markdown diff',
        out: `2 sections changed · +3 / -1 lines
93% fewer tokens than a re-read

  ### 2026-09-29 — Payment Intents
+ \`amount_details.tip\` is now returned on
+ confirmed PaymentIntents.
  ...
  ### 2026-09-27 — Webhooks
- Endpoints are disabled after 3 days of failures.
+ Endpoints are disabled after 5 days of failures.`,
      },
      {
        label: 'elements: true',
        call: `browse({\n  url: "http://localhost:3000/settings",\n  elements: true\n})`,
        meta: ['12,940 raw', '612 returned', 'localhost'],
        format: 'markdown',
        out: `# Settings
Workspace: Acme Staging

## Notifications
- Weekly digest: on
- Deploy alerts: off

## Interactive Elements
- [input:checkbox] "Weekly digest" (selector: #notify-digest)
- [input:checkbox] "Deploy alerts" (selector: #notify-deploys)
- [button] "Save changes" (selector: button[data-testid="save"])
- [link] "Billing" → http://localhost:3000/settings/billing
  (selector: nav > a:nth-of-type(3))`,
      },
    ],
  },
  {
    id: 'extract',
    presets: [
      {
        label: 'schema → sampling',
        call: `extract({\n  url: "https://example.com/pricing",\n  schema: {\n    plans: [{ name: "string",\n              monthly: "number" }]\n  }\n})`,
        meta: ['filled via sampling', 'no extra API key'],
        format: 'structuredContent',
        out: J({
          method: 'sampling',
          data: {
            plans: [
              { name: 'Starter', monthly: 0 },
              { name: 'Growth', monthly: 49 },
              { name: 'Scale', monthly: 199 },
            ],
          },
        }),
      },
      {
        label: 'no schema',
        call: `extract({\n  url: "https://shop.example.com/p/trail-runner-4"\n})`,
        meta: ['JSON-LD', 'OpenGraph', 'tables'],
        format: 'structuredContent',
        out: J({
          jsonLd: [{ '@type': 'Product', name: 'Trail Runner 4', offers: { price: '148.00', priceCurrency: 'USD', availability: 'InStock' } }],
          meta: { 'og:title': 'Trail Runner 4', 'og:type': 'product' },
          tables: [{ headers: ['Size', 'EU', 'Heel–toe'], rows: [{ Size: '9', EU: '42.5', 'Heel–toe': '28.0 cm' }, { Size: '10', EU: '44', 'Heel–toe': '28.8 cm' }] }],
          headings: [{ level: 1, text: 'Trail Runner 4' }, { level: 2, text: 'Size guide' }],
          method: 'dom',
        }),
      },
    ],
  },
  {
    id: 'links',
    presets: [
      {
        label: 'sameOrigin',
        call: `links({\n  url: "https://nextjs.org/docs",\n  sameOrigin: true\n})`,
        meta: ['212 found', '97 unique', 'same origin'],
        format: 'structuredContent',
        out: J({
          total: 97,
          links: [
            { text: 'Installation', href: 'https://nextjs.org/docs/app/getting-started/installation' },
            { text: 'Project structure', href: 'https://nextjs.org/docs/app/getting-started/project-structure' },
            { text: 'Layouts and pages', href: 'https://nextjs.org/docs/app/getting-started/layouts-and-pages' },
            { text: 'Fetching data', href: 'https://nextjs.org/docs/app/getting-started/fetching-data' },
            '… 93 more',
          ],
        }),
      },
      {
        label: 'match',
        call: `links({\n  url: "https://docs.stripe.com/api",\n  match: "/api/payment_"\n})`,
        meta: ['4 matches'],
        format: 'structuredContent',
        out: J({
          total: 4,
          links: [
            { text: 'Payment Intents', href: 'https://docs.stripe.com/api/payment_intents' },
            { text: 'Payment Methods', href: 'https://docs.stripe.com/api/payment_methods' },
            { text: 'Payment Links', href: 'https://docs.stripe.com/api/payment_links' },
            { text: 'Payment Method Domains', href: 'https://docs.stripe.com/api/payment_method_domains' },
          ],
        }),
      },
    ],
  },
  {
    id: 'screenshot',
    presets: [
      {
        label: 'full page',
        call: `screenshot({\n  url: "http://localhost:3000",\n  fullPage: true\n})`,
        meta: ['PNG', '1280 × 4210'],
        format: 'image',
        image: true,
        out: J({ mimeType: 'image/png', width: 1280, height: 4210, data: '<base64 · 612 KB>' }),
      },
      {
        label: 'element · jpeg',
        call: `screenshot({\n  url: "http://localhost:3000",\n  selector: "#pricing",\n  format: "jpeg"\n})`,
        meta: ['JPEG', '1120 × 640'],
        format: 'image',
        image: true,
        out: J({ mimeType: 'image/jpeg', width: 1120, height: 640, data: '<base64 · 88 KB>' }),
      },
    ],
  },
  {
    id: 'interact',
    presets: [
      {
        label: 'search, then read',
        call: `interact({\n  url: "https://shop.example.com",\n  actions: [\n    { type: "fill", selector: "#q",\n      value: "trail shoes" },\n    { type: "press", value: "Enter" },\n    { type: "wait", selector: ".results" }\n  ]\n})`,
        meta: ['3 actions', '1,204 returned'],
        format: 'markdown',
        out: `# Search: “trail shoes”
48 results · sorted by relevance

1. **Trail Runner 4** — $148.00 · ★ 4.7 (412)
2. **Ridge Mid GTX** — $175.00 · ★ 4.5 (198)
3. **Summit Lite** — $129.00 · ★ 4.4 (87)

[page 1 of 4 · use links() to map pagination]`,
      },
    ],
  },
]

function useStream(text, run) {
  const [n, setN] = useState(0)
  const reduced = useMemo(prefersReducedMotion, [])
  useEffect(() => {
    if (!run) { setN(0); return }
    if (reduced) { setN(text.length); return }
    let raf
    const start = performance.now()
    const dur = Math.min(900, 200 + text.length * 1.2)
    const tick = now => {
      const k = Math.min(1, (now - start) / dur)
      setN(Math.ceil(text.length * k))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, run, reduced])
  return text.slice(0, n)
}

function highlightMd(text, diff) {
  return text.split('\n').map((line, i) => {
    let el = line
    const h = line.match(/^(#{1,6})(\s.*)$/)
    if (h) el = <span className="hl-h"><b>{h[1]}</b>{h[2]}</span>
    else if (diff && line.startsWith('+ ')) el = <span className="hl-add">{line}</span>
    else if (diff && line.startsWith('- ')) el = <span className="hl-del">{line}</span>
    else if (line.startsWith('[') || line.startsWith('omitted') || line.startsWith('  ')) el = <span className="hl-meta">{line}</span>
    return <React.Fragment key={i}>{el}{'\n'}</React.Fragment>
  })
}

function highlightJson(text) {
  const parts = text.split(/("(?:[^"\\]|\\.)*")(\s*:)?/g)
  const out = []
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) out.push(parts[i])
    const str = parts[i + 1]
    if (str === undefined) continue
    if (parts[i + 2]) out.push(<span key={i} className="hl-key">{str}</span>, parts[i + 2])
    else out.push(<span key={i} className="hl-add">{str}</span>)
  }
  return out
}

function Output({ preset, phase }) {
  const shown = useStream(preset.out, phase === 'done')
  if (phase === 'idle') {
    return (
      <div className="pg-empty">
        <p>Press <kbd>Run</kbd> to see what your agent gets back.</p>
      </div>
    )
  }
  if (phase === 'running') {
    return (
      <div className="pg-empty pg-running" role="status">
        <span className="pg-bar" aria-hidden="true" />
        <p>Rendering in Chromium · distilling…</p>
      </div>
    )
  }
  return (
    <div className="pg-result">
      <div className="pg-meta">
        {preset.meta.map((m, i) => <span key={i} className={i === preset.meta.length - 1 ? 'is-accent' : ''}>{m}</span>)}
      </div>
      {preset.image && (
        <div className="pg-shot" aria-hidden="true">
          <div className="pg-shot-bar"><span /><span /><span /></div>
          <div className="pg-shot-body">
            <div className="pg-shot-h" />
            <div className="pg-shot-l" /><div className="pg-shot-l s" />
            <div className="pg-shot-grid"><div /><div /><div /></div>
          </div>
        </div>
      )}
      <pre className="pg-pre" tabIndex={0} aria-label={`Example ${preset.format} output`}>
        {preset.format.startsWith('markdown') ? highlightMd(shown, preset.format === 'markdown diff') : highlightJson(shown)}
      </pre>
    </div>
  )
}

export function Playground() {
  const [toolId, setToolId] = useState('browse')
  const [pi, setPi] = useState(0)
  const [phase, setPhase] = useState('idle')
  const timer = useRef()
  const tool = TOOLS.find(t => t.id === toolId)
  const preset = tool.presets[pi]

  useEffect(() => () => clearTimeout(timer.current), [])

  const reset = () => { clearTimeout(timer.current); setPhase('idle') }
  const run = () => {
    clearTimeout(timer.current)
    setPhase('running')
    timer.current = setTimeout(() => setPhase('done'), prefersReducedMotion() ? 0 : 650)
  }

  return (
    <div className="pg reveal" id="playground">
      <div className="pg-head">
        <h3 className="pg-title">Playground</h3>
        <p className="pg-sub">Real call shapes, canned example output. Nothing here touches a browser.</p>
      </div>

      <div className="pg-tabs" role="tablist" aria-label="Tool">
        {TOOLS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === toolId}
            className="pg-tab"
            onClick={() => { setToolId(t.id); setPi(0); reset() }}
          >
            {t.id}
          </button>
        ))}
      </div>

      <div className="pg-body">
        <div className="pg-in">
          <div className="pg-presets" role="group" aria-label="Example">
            {tool.presets.map((p, i) => (
              <button
                key={p.label}
                type="button"
                className="pg-chip"
                aria-pressed={i === pi}
                onClick={() => { setPi(i); reset() }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <pre className="pg-call"><code>{preset.call}</code></pre>
          <button type="button" className="btn btn-primary pg-run" onClick={run}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor" /></svg>
            Run
          </button>
        </div>
        <div className="pg-out">
          <div className="pg-out-head">
            <span>Response</span>
            <span className="pg-format">{preset.format}</span>
          </div>
          <Output key={`${toolId}-${pi}`} preset={preset} phase={phase} />
        </div>
      </div>
    </div>
  )
}
