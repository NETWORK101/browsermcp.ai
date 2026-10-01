import React, { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './ui.jsx'

/*
  A word that resolves out of markup glyphs — on load (staggered by `delay`)
  and again whenever it's hovered. A hidden ghost copy holds the real width,
  so the scramble never reflows the headline.
*/

const NOISE = '<>/{}=#_[];:*'
const FRAME_MS = 45

export function ScrambleWord({ text, delay = 0, className = '' }) {
  const [chars, setChars] = useState(() => (prefersReducedMotion() ? null : scrambled(text, 0)))
  const raf = useRef(0)
  const running = useRef(false)

  const run = useCallback((wait = 0) => {
    if (prefersReducedMotion() || running.current) return
    running.current = true
    const start = performance.now() + wait
    const dur = 380 + text.length * 55
    let lastFrame = 0
    const step = now => {
      const t = now - start
      if (t < 0) { raf.current = requestAnimationFrame(step); return }
      if (t >= dur) {
        // Always land on the real word — never let the frame throttle skip the final state.
        setChars(null)
        running.current = false
        return
      }
      if (now - lastFrame >= FRAME_MS) {
        lastFrame = now
        setChars(scrambled(text, Math.floor((t / dur) * text.length)))
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [text])

  useEffect(() => {
    run(delay)
    return () => {
      cancelAnimationFrame(raf.current)
      running.current = false
    }
  }, [run, delay])

  return (
    <span className={`sw ${className}`} onPointerEnter={() => run(0)}>
      <span className="sw-ghost">{text}</span>
      {chars && (
        <span className="sw-live" aria-hidden="true">
          {chars.map(([ch, done], i) => (done ? ch : <span key={i} className="sw-noise">{ch}</span>))}
        </span>
      )}
    </span>
  )
}

function scrambled(text, settled) {
  return [...text].map((ch, i) =>
    i < settled || ch === ' ' || ch === ',' || ch === '.' || ch === '&'
      ? [ch, true]
      : [NOISE[Math.floor(Math.random() * NOISE.length)], false]
  )
}
