import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Hero A — "Void Terminal"
 * Dark cinematic void with Three.js particle constellation
 * forming a browser silhouette + floating terminal with typed commands.
 */
export function HeroA() {
  const canvasRef = useRef(null)
  const [typed, setTyped] = useState({ cmd1: '', out1: '', cmd2: '', out2: '' })
  const rafRef = useRef(null)

  // Three.js particle field
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.z = 120
    camera.position.y = 10

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // ── Star field ──
    const starCount = 4000
    const starGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const r = 150 + Math.random() * 600
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const c = new THREE.Color()
      const roll = Math.random()
      if (roll < 0.6) c.setHSL(0.58, 0.6, 0.75)       // blue-cyan
      else if (roll < 0.85) c.setHSL(0.75, 0.5, 0.7)   // purple
      else c.setHSL(0.88, 0.4, 0.8)                     // pink

      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      sizes[i] = Math.random() * 2.5 + 0.3
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vDist;
        uniform float time;
        void main() {
          vColor = color;
          vec3 pos = position;
          float angle = time * 0.03;
          float c = cos(angle), s = sin(angle);
          pos.xz = mat2(c, -s, s, c) * pos.xz;
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          vDist = -mv.z;
          gl_PointSize = size * (250.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vDist;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * smoothstep(800.0, 200.0, vDist);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // ── Browser silhouette particles ──
    const browserPts = []
    // Top bar
    for (let x = -40; x <= 40; x += 1.5) {
      browserPts.push(x, 25, 0)
    }
    // Sides
    for (let y = -25; y <= 25; y += 1.5) {
      browserPts.push(-40, y, 0)
      browserPts.push(40, y, 0)
    }
    // Bottom
    for (let x = -40; x <= 40; x += 1.5) {
      browserPts.push(x, -25, 0)
    }
    // Tab bar line
    for (let x = -40; x <= 40; x += 1.5) {
      browserPts.push(x, 20, 0)
    }
    // Three dots
    for (let i = 0; i < 3; i++) {
      const cx = -36 + i * 4
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2
        browserPts.push(cx + Math.cos(angle) * 0.8, 22.5 + Math.sin(angle) * 0.8, 0)
      }
    }

    const browserGeo = new THREE.BufferGeometry()
    const browserPositions = new Float32Array(browserPts.length)
    const browserOriginal = new Float32Array(browserPts.length)
    const browserRandom = new Float32Array(browserPts.length)

    for (let i = 0; i < browserPts.length; i++) {
      browserOriginal[i] = browserPts[i]
      // Start scattered
      browserRandom[i] = browserPts[i] + (Math.random() - 0.5) * 200
      browserPositions[i] = browserRandom[i]
    }

    browserGeo.setAttribute('position', new THREE.BufferAttribute(browserPositions, 3))

    const browserMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, convergence: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.5 * (150.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vAlpha = 1.0;
        }
      `,
      fragmentShader: `
        uniform float convergence;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * convergence * 0.8;
          gl_FragColor = vec4(0.39, 0.82, 1.0, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const browserFrame = new THREE.Points(browserGeo, browserMat)
    browserFrame.position.z = -30
    scene.add(browserFrame)

    // ── Glow ring ──
    const ringGeo = new THREE.RingGeometry(55, 58, 64)
    const ringMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          float pulse = sin(time * 1.5) * 0.3 + 0.7;
          float alpha = pulse * 0.04;
          vec3 color = mix(vec3(0.39, 0.82, 1.0), vec3(0.66, 0.55, 0.98), sin(vUv.x * 6.28 + time) * 0.5 + 0.5);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.z = -35
    scene.add(ring)

    let mouseX = 0, mouseY = 0
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    const startTime = Date.now()

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const t = (Date.now() - startTime) * 0.001

      starMat.uniforms.time.value = t

      // Converge browser particles over 4 seconds starting at t=1
      const convergence = Math.min(1, Math.max(0, (t - 1) / 4))
      browserMat.uniforms.convergence.value = convergence
      browserMat.uniforms.time.value = t
      ringMat.uniforms.time.value = t

      const posAttr = browserGeo.attributes.position
      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3
        const tx = browserOriginal[ix]
        const ty = browserOriginal[ix + 1]
        const tz = browserOriginal[ix + 2]
        const cx = browserRandom[ix]
        const cy = browserRandom[ix + 1]
        const cz = browserRandom[ix + 2]

        posAttr.array[ix] = cx + (tx - cx) * convergence + Math.sin(t * 2 + i) * (1 - convergence) * 3
        posAttr.array[ix + 1] = cy + (ty - cy) * convergence + Math.cos(t * 1.5 + i) * (1 - convergence) * 3
        posAttr.array[ix + 2] = cz + (tz - cz) * convergence
      }
      posAttr.needsUpdate = true

      // Camera follows mouse subtly
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.02
      camera.position.y += (10 - mouseY * 5 - camera.position.y) * 0.02
      camera.lookAt(0, 0, -30)

      // Slow float
      ring.rotation.z = t * 0.1

      renderer.render(scene, camera)
    }

    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      starGeo.dispose()
      starMat.dispose()
      browserGeo.dispose()
      browserMat.dispose()
      ringGeo.dispose()
      ringMat.dispose()
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    const lines = [
      { key: 'cmd1', text: 'npx browsermcpai init', delay: 1500 },
      { key: 'out1', text: '✓ MCP config written — restart your agent to connect', delay: 3500 },
      { key: 'cmd2', text: 'browse("https://docs.stripe.com/api")', delay: 5500 },
      { key: 'out2', text: '→ 84,201 tokens → 1,847 tokens (97.8% reduction)', delay: 7500 },
    ]

    const timers = []

    lines.forEach(({ key, text, delay }) => {
      for (let i = 0; i <= text.length; i++) {
        timers.push(
          setTimeout(() => {
            setTyped(prev => ({ ...prev, [key]: text.slice(0, i) }))
          }, delay + i * 35)
        )
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="hero-a">
      <canvas ref={canvasRef} />

      <div className="content">
        <div className="badge">
          <span className="dot" />
          MCP Server
        </div>

        <h1>
          Give your AI agent<br />
          a <span className="accent">browser.</span>
        </h1>

        <p className="tagline">
          Zero-config headless browser for Claude, Cursor, and any MCP-compatible agent.<br />
          <strong>10–50× token reduction.</strong> Local. Free. Instant.
        </p>

        <div className="terminal">
          <div className="terminal-header">
            <div className="terminal-dot" />
            <div className="terminal-dot" />
            <div className="terminal-dot" />
          </div>
          <div className="terminal-body">
            <div className="terminal-line">
              <span className="terminal-prompt">$</span>
              <span className="terminal-command">{typed.cmd1}<span className="cursor-blink" /></span>
            </div>
            {typed.out1 && (
              <div className="terminal-success">{typed.out1}</div>
            )}
            {typed.cmd2 && (
              <>
                <div className="terminal-line" style={{ marginTop: 12 }}>
                  <span className="terminal-prompt">→</span>
                  <span className="terminal-command">{typed.cmd2}</span>
                </div>
                {typed.out2 && (
                  <div className="terminal-output">{typed.out2}</div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="cta-row">
          <button className="cta-primary">Get Started</button>
          <button className="cta-secondary">View on GitHub</button>
        </div>

        <div className="stats">
          <div>
            <div className="stat-value">97%</div>
            <div className="stat-label">Token Reduction</div>
          </div>
          <div>
            <div className="stat-value">4</div>
            <div className="stat-label">MCP Tools</div>
          </div>
          <div>
            <div className="stat-value">0</div>
            <div className="stat-label">Config Required</div>
          </div>
        </div>
      </div>
    </div>
  )
}
