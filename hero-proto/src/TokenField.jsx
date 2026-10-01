import React, { useEffect, useRef } from 'react'
import { prefersReducedMotion } from './ui.jsx'

/*
  A Swiss grid of dim markup glyphs behind the hero. Wherever the pointer
  passes, glyphs "distill" into solid accent cells that cool back down;
  a click sends a distilling shockwave across the grid. When nobody is
  pointing, a slow virtual cursor drifts so the field never sits dead.
  One canvas, one rAF loop, paused off-screen; static for reduced motion.
*/

const GLYPHS = '<>/{}=#_:;[]()*.-+div span class a href'.replace(/\s/g, '').split('')
const CELL = 22
const RADIUS = 130

export function TokenField() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d')
    const reduced = prefersReducedMotion()

    let w = 0, h = 0, cols = 0, rows = 0, dpr = 1
    let glyph = new Uint8Array(0)
    let heat = new Float32Array(0)
    const pointer = { x: -1e4, y: -1e4, last: 0 }
    const ripples = []
    let visible = true
    let raf = 0
    let colors = { ink: '#8C887D', accent: '#C6FF3D', base: 0.12 }

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      const light = document.documentElement.dataset.theme === 'light'
      colors = {
        ink: cs.getPropertyValue('--ink-3').trim() || '#8C887D',
        accent: cs.getPropertyValue('--accent').trim() || '#C6FF3D',
        base: light ? 0.2 : 0.13,
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = host.clientWidth
      h = host.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / CELL) + 1
      rows = Math.ceil(h / CELL) + 1
      glyph = new Uint8Array(cols * rows).map(() => Math.floor(Math.random() * GLYPHS.length))
      heat = new Float32Array(cols * rows)
      draw()
    }

    const warm = (px, py, radius, strength = 1) => {
      const c0 = Math.max(0, Math.floor((px - radius) / CELL))
      const c1 = Math.min(cols - 1, Math.ceil((px + radius) / CELL))
      const r0 = Math.max(0, Math.floor((py - radius) / CELL))
      const r1 = Math.min(rows - 1, Math.ceil((py + radius) / CELL))
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const d = Math.hypot(c * CELL + CELL / 2 - px, r * CELL + CELL / 2 - py)
          if (d < radius) {
            const i = r * cols + c
            const v = (1 - d / radius) * strength
            if (v > heat[i]) heat[i] = v
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      ctx.font = `500 11px 'Geist Mono', ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const v = heat[i]
          const x = c * CELL + CELL / 2
          const y = r * CELL + CELL / 2
          if (v > 0.06) {
            // distilled: a solid cell whose size tracks heat
            const s = 3 + v * (CELL - 8)
            ctx.globalAlpha = 0.25 + v * 0.75
            ctx.fillStyle = colors.accent
            ctx.fillRect(x - s / 2, y - s / 2, s, s)
          }
          if (v < 0.6) {
            ctx.globalAlpha = colors.base * (1 - v * 1.6)
            ctx.fillStyle = colors.ink
            ctx.fillText(GLYPHS[glyph[i]], x, y)
          }
        }
      }
      ctx.globalAlpha = 1
    }

    const tick = now => {
      raf = requestAnimationFrame(tick)
      if (!visible) return

      for (let i = 0; i < heat.length; i++) heat[i] *= 0.93

      // idle drift: a virtual cursor on a slow Lissajous path
      if (now - pointer.last > 2500) {
        const t = now / 1000
        warm(w * (0.62 + 0.3 * Math.sin(t * 0.37)), h * (0.5 + 0.38 * Math.sin(t * 0.53 + 1)), RADIUS * 0.8, 0.7)
      } else {
        warm(pointer.x, pointer.y, RADIUS)
      }

      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k]
        const radius = (now - rp.t0) * 0.9
        if (radius > Math.hypot(w, h)) { ripples.splice(k, 1); continue }
        const fade = Math.max(0, 1 - radius / Math.hypot(w, h))
        const band = 26
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const d = Math.abs(Math.hypot(c * CELL + CELL / 2 - rp.x, r * CELL + CELL / 2 - rp.y) - radius)
            if (d < band) {
              const i = r * cols + c
              const v = (1 - d / band) * fade
              if (v > heat[i]) heat[i] = v
            }
          }
        }
      }

      // a little live churn in the markup
      for (let k = 0; k < 6; k++) glyph[Math.floor(Math.random() * glyph.length)] = Math.floor(Math.random() * GLYPHS.length)

      draw()
    }

    const local = e => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const onMove = e => {
      const [x, y] = local(e)
      pointer.x = x; pointer.y = y; pointer.last = performance.now()
    }
    const onLeave = () => { pointer.x = -1e4; pointer.y = -1e4 }
    const onDown = e => {
      if (e.target.closest('a, button, input, [role=tab], pre, code')) return
      const [x, y] = local(e)
      ripples.push({ x, y, t0: performance.now() })
      pointer.last = performance.now()
    }

    readColors()
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const mo = new MutationObserver(() => { readColors(); draw() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    if (!reduced) {
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
      io.observe(host)
      host.addEventListener('pointermove', onMove)
      host.addEventListener('pointerleave', onLeave)
      host.addEventListener('pointerdown', onDown)
      raf = requestAnimationFrame(tick)
      return () => {
        cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); io.disconnect()
        host.removeEventListener('pointermove', onMove)
        host.removeEventListener('pointerleave', onLeave)
        host.removeEventListener('pointerdown', onDown)
      }
    }
    return () => { ro.disconnect(); mo.disconnect() }
  }, [])

  return <canvas className="token-field" ref={ref} aria-hidden="true" />
}
