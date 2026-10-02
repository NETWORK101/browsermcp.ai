import React, { useEffect, useMemo, useRef, useState } from 'react'
import { prefersReducedMotion } from './ui.jsx'

/*
  The "distillation": dense raw HTML collapses, line by line, into a crisp
  markdown block while a token counter ticks down. One rAF loop writes a
  single CSS variable (--p, 0→1) and the counter text — no React re-render
  per frame.
*/

const SAMPLES = [
  {
    id: 'api',
    tab: 'API docs',
    url: 'docs.stripe.com/api/payment_intents',
    args: 'focus: "create a payment"',
    raw: 84201,
    out: 1847,
    ratio: '46×',
    md: [
      ['h1', 'Payment Intents'],
      ['p', 'A PaymentIntent guides you through collecting a payment from a customer.'],
      ['h2', 'Create a PaymentIntent'],
      ['code', 'POST /v1/payment_intents'],
      ['th', '| param    | type    | required |'],
      ['td', '| amount   | integer | yes      |'],
      ['td', '| currency | enum    | yes      |'],
      ['td', '| customer | string  | no       |'],
      ['h2', 'Confirm a PaymentIntent'],
      ['code', 'POST /v1/payment_intents/:id/confirm'],
      ['meta', '[truncated · omitted: ## Errors, ## Pagination]'],
    ],
  },
  {
    id: 'spa',
    tab: 'Dashboard',
    url: 'localhost:3000/admin/orders',
    args: 'maxTokens: 3200',
    raw: 42800,
    out: 3100,
    ratio: '14×',
    md: [
      ['h1', 'Orders'],
      ['p', 'Showing 1–25 of 1,204 · Filter: last 7 days'],
      ['th', '| order  | customer  | total   | status   |'],
      ['td', '| #10482 | J. Okafor | $129.00 | Paid     |'],
      ['td', '| #10481 | M. Lind   |  $64.50 | Refunded |'],
      ['td', '| #10480 | A. Raman  | $212.10 | Pending  |'],
      ['h2', 'Summary'],
      ['li', '- Revenue (7d): $48,210'],
      ['li', '- Refund rate: 1.8%'],
      ['meta', '[signed-in session · profile ~/.localmcp]'],
    ],
  },
  {
    id: 'pdp',
    tab: 'Product page',
    url: 'shop.example.com/p/trail-runner-4',
    args: 'elements: true',
    raw: 67300,
    out: 4200,
    ratio: '16×',
    md: [
      ['h1', 'Trail Runner 4'],
      ['p', '$148.00 · In stock · Free returns within 30 days'],
      ['h2', 'Details'],
      ['li', '- Drop: 6 mm · Weight: 268 g'],
      ['li', '- Upper: recycled mesh'],
      ['h2', 'Interactive elements'],
      ['code', 'select  #size         "Size"'],
      ['code', 'button  [data-add-cart] "Add to cart"'],
      ['code', 'link    a.reviews     "412 reviews"'],
      ['meta', '[3 of 41 elements shown]'],
    ],
  },
]

const TAGS = ['div', 'span', 'a', 'svg', 'path', 'li', 'button', 'section', 'nav', 'script', 'i', 'img', 'p', 'header']
const ATTRS = ['class', 'data-testid', 'aria-hidden', 'style', 'data-v-7f2a', 'role', 'tabindex', 'id', 'data-track', 'jsaction']
const CLS = ['css-1x9kq2', 'sc-bdVaJa', 'flex', 'items-center', 'tw-mt-2', 'hidden', 'md:block', 'Nav__item', 'kGxQzT', 'gap-4', 'truncate', 'is-active', 'u-sr-only', '_3fKe9', 'px-6', 'text-sm']

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeNoise(seed, lines = 64, width = 120) {
  const r = rng(seed)
  const pick = arr => arr[Math.floor(r() * arr.length)]
  const out = []
  for (let i = 0; i < lines; i++) {
    let s = ' '.repeat(Math.floor(r() * 8) * 2)
    while (s.length < width) {
      const roll = r()
      if (roll < 0.55) {
        const tag = pick(TAGS)
        let el = `<${tag}`
        const n = 1 + Math.floor(r() * 3)
        for (let k = 0; k < n; k++) {
          const at = pick(ATTRS)
          el += at === 'class'
            ? ` class="${pick(CLS)} ${pick(CLS)} ${pick(CLS)}"`
            : at === 'style'
              ? ` style="transform:translate3d(0,${Math.floor(r() * 99)}px,0)"`
              : ` ${at}="${Math.floor(r() * 1e6).toString(36)}"`
        }
        s += el + '>'
      } else if (roll < 0.8) {
        s += `</${pick(TAGS)}>`
      } else if (roll < 0.9) {
        s += `{"__NEXT_DATA__":{"k":"${Math.floor(r() * 1e9).toString(36)}"}}`
      } else {
        s += '&nbsp;'
      }
    }
    out.push(s.slice(0, width))
  }
  return out.join('\n')
}

const fmt = n => Math.round(n).toLocaleString('en-US')
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// timeline in ms
const HOLD_RAW = 1100
const SCAN = 2600
const HOLD_DONE = 5200
const FADE = 500
const CYCLE = HOLD_RAW + SCAN + HOLD_DONE + FADE

function MdLine({ kind, text }) {
  if (kind === 'h1') return <div className="md md-h1"><span className="md-mark">#</span> {text}</div>
  if (kind === 'h2') return <div className="md md-h2"><span className="md-mark">##</span> {text}</div>
  if (kind === 'code') return <div className="md md-code">{text}</div>
  if (kind === 'meta') return <div className="md md-meta">{text}</div>
  if (kind === 'th') return <div className="md md-table md-th">{text}</div>
  if (kind === 'td') return <div className="md md-table">{text}</div>
  if (kind === 'li') return <div className="md md-li">{text}</div>
  return <div className="md md-p">{text}</div>
}

/** Fit a sample's markdown lines into a token budget, like browse({ maxTokens }). */
function budgetView(sample, budget) {
  const body = sample.md.filter(([k]) => k !== 'meta')
  if (budget == null || budget >= sample.out) return { lines: sample.md, tokens: sample.out }
  const totalLen = body.reduce((a, [, t]) => a + t.length, 0)
  const cost = body.map(([, t]) => (sample.out * t.length) / totalLen)
  const lines = []
  const omitted = []
  let used = 0
  body.forEach((line, i) => {
    if (i === 0 || used + cost[i] <= budget) { lines.push(line); used += cost[i] }
    else if (line[0] === 'h2') omitted.push(line[1])
  })
  lines.push(['meta', omitted.length
    ? `[budget ${fmt(budget)} · omitted: ${omitted.map(o => `## ${o}`).join(', ')}]`
    : `[budget ${fmt(budget)} · ${body.length - lines.length} lines trimmed]`])
  return { lines, tokens: Math.max(1, Math.round(used)) }
}

export function Distill() {
  const reduced = useMemo(prefersReducedMotion, [])
  const [idx, setIdx] = useState(0)
  const rootRef = useRef(null)
  const countRef = useRef(null)
  const startRef = useRef(0)
  const idxRef = useRef(0)
  const visibleRef = useRef(true)
  const noises = useMemo(() => SAMPLES.map((_, i) => makeNoise(17 + i * 31)), [])
  const s = SAMPLES[idx]
  const [budget, setBudget] = useState(null)
  const budgetRef = useRef(null)
  const view = useMemo(() => budgetView(s, budget), [s, budget])
  const viewRef = useRef(view)
  viewRef.current = view

  const apply = (p, phase, sample) => {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--p', p.toFixed(4))
    el.dataset.phase = phase
    if (countRef.current) {
      countRef.current.textContent = budgetRef.current != null
        ? fmt(viewRef.current.tokens)
        : reduced ? fmt(sample.out) : fmt(sample.raw - (sample.raw - sample.out) * p)
    }
  }

  // Jump to a sample (tab click) and restart its cycle.
  const select = i => {
    budgetRef.current = null
    setBudget(null)
    idxRef.current = i
    setIdx(i)
    startRef.current = performance.now()
    if (reduced) apply(1, 'done', SAMPLES[i])
  }

  useEffect(() => {
    if (reduced) { apply(1, 'done', SAMPLES[idxRef.current]); return }
    let raf
    startRef.current = performance.now()
    const io = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting })
    if (rootRef.current) io.observe(rootRef.current)
    let pausedAt = 0

    const tick = now => {
      raf = requestAnimationFrame(tick)
      if (!visibleRef.current) {
        if (!pausedAt) pausedAt = now
        return
      }
      if (pausedAt) { startRef.current += now - pausedAt; pausedAt = 0 }
      if (budgetRef.current != null) {
        // The visitor is steering the budget: hold the finished state.
        startRef.current = now - (HOLD_RAW + SCAN)
        apply(1, 'done', SAMPLES[idxRef.current])
        return
      }
      let t = now - startRef.current
      if (t >= CYCLE) {
        const next = (idxRef.current + 1) % SAMPLES.length
        idxRef.current = next
        setIdx(next)
        startRef.current = now
        t = 0
      }
      const sample = SAMPLES[idxRef.current]
      if (t < HOLD_RAW) apply(0, 'raw', sample)
      else if (t < HOLD_RAW + SCAN) apply(easeInOut((t - HOLD_RAW) / SCAN), 'scan', sample)
      else if (t < HOLD_RAW + SCAN + HOLD_DONE) apply(1, 'done', sample)
      else apply(1, 'fade', sample)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [reduced])

  const pct = ((view.tokens / s.raw) * 100).toFixed(2)
  const ratio = budget == null ? s.ratio : `${Math.round(s.raw / view.tokens)}×`
  const onBudget = e => {
    const v = Number(e.target.value)
    budgetRef.current = v
    setBudget(v)
    apply(1, 'done', s)
  }
  const resume = () => {
    budgetRef.current = null
    setBudget(null)
    startRef.current = performance.now()
  }

  return (
    <figure
      className="distill"
      ref={rootRef}
      data-phase={reduced ? 'done' : 'raw'}
      style={{ '--p': reduced ? 1 : 0, '--pct': `${pct}%` }}
      aria-label={`Illustration: browse distills ${s.url} from ${fmt(s.raw)} tokens of raw HTML to ${fmt(s.out)} tokens of markdown, ${s.ratio} smaller.`}
    >
      <div className="distill-head">
        <div className="distill-call">
          <span className="dc-fn">browse</span>
          <span className="dc-paren">(</span>
          <span className="dc-url">{s.url}</span>
          <span className="dc-sep">, </span>
          <span className="dc-arg">{s.args}</span>
          <span className="dc-paren">)</span>
        </div>
        <div className="distill-status" aria-hidden="true">
          <span className="ds-dot" />
          <span className="ds-label ds-raw">rendering</span>
          <span className="ds-label ds-scan">distilling</span>
          <span className="ds-label ds-done">markdown</span>
        </div>
      </div>

      <div className="distill-stage" aria-hidden="true">
        <pre className="distill-raw">{noises[idx]}</pre>
        <div className="distill-md">
          {view.lines.map(([k, t], i) => <MdLine key={`${s.id}-${i}-${k}`} kind={k} text={t} />)}
        </div>
        <div className="distill-scan" />
      </div>

      <figcaption className="distill-foot">
        <div className="df-count">
          <span className="df-label">tokens</span>
          <span className="df-num" ref={countRef}>{fmt(reduced ? s.out : s.raw)}</span>
          <span className="df-from">from {fmt(s.raw)}</span>
          <span className="df-ratio">{ratio}</span>
        </div>
        <div className="df-budget">
          <label className="df-label" htmlFor="df-budget-range">maxTokens</label>
          <input
            id="df-budget-range"
            type="range"
            min={Math.max(150, Math.round(s.out * 0.12))}
            max={s.out}
            step={10}
            value={budget ?? s.out}
            onChange={onBudget}
            aria-valuetext={`${fmt(budget ?? s.out)} tokens`}
          />
          <output htmlFor="df-budget-range" className="df-budget-val">{fmt(budget ?? s.out)}</output>
          {budget != null
            ? <button type="button" className="df-resume" onClick={resume}>Auto ↺</button>
            : <span className="df-budget-hint">drag me</span>}
        </div>
        <div className="df-meter" aria-hidden="true">
          <span className="df-meter-raw" />
          <span className="df-meter-out" />
        </div>
        <div className="df-tabs" role="tablist" aria-label="Example pages">
          {SAMPLES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === idx}
              className="df-tab"
              onClick={() => select(i)}
            >
              <span className="df-tab-n">0{i + 1}</span> {x.tab}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
