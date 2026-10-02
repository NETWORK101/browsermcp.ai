import React, { useState } from 'react'
import { SectionHead } from './ui.jsx'

/*
  Metadata-first reading, shown on real pages. Every number and card line below
  is from a default browse() run on 2026-10-01 with localmcp 0.3.0.
*/

const STEPS = [
  {
    id: 'publisher',
    title: 'Ask the publisher',
    signals: ['<link rel="alternate" type="text/markdown">', 'Accept: text/markdown', '/llms.txt'],
    body: 'If the site already serves clean markdown for agents, use it verbatim. No guessing, no scraping.',
  },
  {
    id: 'meta',
    title: 'Read the metadata',
    signals: ['JSON-LD & @graph', 'OpenGraph', '<meta>', 'canonical', 'front matter'],
    body: 'Turn what the page says about itself into one line: type, site, author, published, updated, source.',
  },
  {
    id: 'structure',
    title: 'Read the structure',
    signals: ['landmarks', 'headings', 'tables', 'ARIA'],
    body: 'No publisher markdown? Render it, drop nav, banners and hidden nodes, keep the semantic skeleton.',
  },
  {
    id: 'budget',
    title: 'Rank & budget',
    signals: ['focus', 'maxTokens', 'omitted headings'],
    body: 'Keep the sections that answer the question. List the rest so the agent can ask for them by name.',
  },
  {
    id: 'fence',
    title: 'Fence & type',
    signals: ['<untrusted-page-content>', 'structuredContent.card', '.source'],
    body: 'Hand it over as data, never as instructions, with machine-readable provenance alongside.',
  },
]

const EXAMPLES = [
  {
    id: 'stripe',
    label: 'Stripe API reference',
    url: 'docs.stripe.com/api',
    raw: 428443,
    out: 482,
    card: '> source: publisher markdown (Accept: text/markdown)',
    path: {
      publisher: 'Served markdown on Accept: text/markdown',
      meta: 'Read — no type, author or dates published',
      structure: 'Skipped — publisher markdown used',
      budget: 'Fits the 4,000-token default',
      fence: 'Applied',
    },
  },
  {
    id: 'vercel',
    label: 'Vercel docs',
    url: 'vercel.com/docs',
    raw: 212024,
    out: 2108,
    card: '> TechArticle · Vercel · updated 2026-09-13 · source: publisher markdown (declared text/markdown alternate)',
    path: {
      publisher: 'Declared a text/markdown alternate',
      meta: 'Type and last-updated date from page metadata',
      structure: 'Skipped — publisher markdown used',
      budget: 'Fits the 4,000-token default',
      fence: 'Applied',
    },
  },
  {
    id: 'wiki',
    label: 'Wikipedia article',
    url: 'en.wikipedia.org/wiki/Model_Context_Protocol',
    raw: 109267,
    out: 3991,
    card: '> Article · Wikimedia Foundation, Inc. · by Contributors to Wikimedia projects · published 2025-04-14 · updated 2026-09-05 · source: rendered page, distilled',
    path: {
      publisher: 'Nothing offered (no alternate, no llms.txt)',
      meta: 'JSON-LD author, publisher and dates',
      structure: 'Rendered, de-chromed, headings kept',
      budget: 'Trimmed to 4,000 tokens; omitted sections listed',
      fence: 'Applied',
    },
  },
]

const fmt = n => n.toLocaleString('en-US')
const skipped = s => /^(Skipped|Nothing offered)/.test(s)

export function HowItReads() {
  const [id, setId] = useState('stripe')
  const ex = EXAMPLES.find(e => e.id === id)

  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="wrap">
        <SectionHead num="03" kicker="How it reads" id="how-title" title={<>Metadata first. <em>The page tells us how to read it.</em></>}>
          Before distilling anything, localmcp checks what the page says about itself. If the publisher serves markdown
          for agents, it uses that. Either way it turns the page’s metadata into a one-line card — so your agent knows what
          it’s reading, who wrote it, and how fresh it is.
        </SectionHead>

        <div className="hir reveal">
          <div className="hir-examples" role="tablist" aria-label="Example page">
            {EXAMPLES.map(e => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={e.id === id}
                aria-controls="hir-panel"
                className="hir-ex"
                onClick={() => setId(e.id)}
              >
                <span className="hir-ex-l">{e.label}</span>
                <span className="hir-ex-u">{e.url}</span>
              </button>
            ))}
          </div>

          <div id="hir-panel" role="tabpanel" aria-live="polite">
            <ol className="hir-steps">
              {STEPS.map((s, i) => {
                const note = ex.path[s.id]
                return (
                  <li key={s.id} className={`hir-step${skipped(note) ? ' is-skipped' : ' is-used'}`}>
                    <span className="hir-n">{String(i + 1).padStart(2, '0')}</span>
                    <div className="hir-main">
                      <h3>{s.title}</h3>
                      <p>{s.body}</p>
                      <ul className="hir-signals" aria-label="Signals read">
                        {s.signals.map(sig => <li key={sig}><code>{sig}</code></li>)}
                      </ul>
                    </div>
                    <p className="hir-note"><span className="hir-dot" aria-hidden="true" />{note}</p>
                  </li>
                )
              })}
            </ol>

            <div className="hir-out">
              <div className="hir-stats">
                <div><span className="hir-k">Raw HTML</span><span className="hir-v is-dim">{fmt(ex.raw)}</span></div>
                <div><span className="hir-k">Returned</span><span className="hir-v">{fmt(ex.out)}</span></div>
                <div><span className="hir-k">Smaller</span><span className="hir-v is-accent">{fmt(Math.round(ex.raw / ex.out))}×</span></div>
              </div>
              <pre className="hir-card" aria-label="Page card returned by browse">{ex.card}</pre>
              <p className="hir-foot">Measured with a default <code>browse</code> call on 2026-10-01 · tokens ≈ characters ÷ 4</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
