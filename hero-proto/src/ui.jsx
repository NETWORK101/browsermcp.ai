import React, { useEffect, useRef, useState } from 'react'

export const LINKS = {
  github: 'https://github.com/NETWORK101/browsermcp.ai',
  npm: 'https://www.npmjs.com/package/browsermcpai',
  docs: 'https://github.com/NETWORK101/browsermcp.ai#readme',
}

export const INSTALL = 'npx browsermcpai init'
export const CLAUDE_CODE = 'claude mcp add browsermcp -- npx -y browsermcpai'

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* One shared observer marks .reveal elements as in-view. */
export function useRevealAll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'))
      return
    }
    document.documentElement.classList.add('has-reveal')
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export function SectionHead({ num, kicker, title, children, id }) {
  return (
    <header className="sec-head reveal">
      <div className="sec-rule">
        <span className="sec-num">{num}</span>
        <span className="sec-kicker">{kicker}</span>
      </div>
      <h2 className="sec-title" id={id}>{title}</h2>
      {children && <p className="sec-lede">{children}</p>}
    </header>
  )
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function CopyButton({ text, label = 'Copy command', className = '' }) {
  const [state, setState] = useState('idle')
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1800)
  }
  return (
    <button type="button" className={`copy-btn ${className}`} onClick={onClick} aria-label={label} data-state={state}>
      {state === 'copied' ? <IconCheck /> : <IconCopy />}
      <span className="copy-btn-text" aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Press ⌘C' : 'Copy'}
      </span>
    </button>
  )
}

export function Command({ text, prompt = '$', label }) {
  return (
    <div className="cmd">
      <code className="cmd-text">
        <span className="cmd-prompt" aria-hidden="true">{prompt}</span>
        {text}
      </code>
      <CopyButton text={text} label={label || `Copy: ${text}`} />
    </div>
  )
}

const svg = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'square', strokeLinejoin: 'miter', 'aria-hidden': true, focusable: 'false' }

export const IconCopy = () => (
  <svg {...svg}><rect x="8" y="8" width="12" height="12" /><path d="M4 16V4h12" /></svg>
)
export const IconCheck = () => (
  <svg {...svg}><path d="M4 12.5l5 5L20 6.5" /></svg>
)
export const IconArrow = () => (
  <svg {...svg}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const IconExternal = () => (
  <svg {...svg} width="12" height="12"><path d="M8 4h12v12M20 4L5 19" /></svg>
)
export const IconGitHub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
  </svg>
)

export function Mark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="mark">
      <rect x="1" y="1" width="22" height="22" fill="currentColor" />
      <path d="M6 8l4 4-4 4" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="square" />
      <rect x="12" y="15" width="6" height="2.2" fill="var(--accent)" />
    </svg>
  )
}
