import React, { useEffect, useState, useRef } from 'react'

/**
 * Hero B — "Living Gradient"
 * Animated MeshGradient background with bold oversized typography
 * and a floating browser mockup showing live code extraction.
 */
export function HeroB() {
  const [mounted, setMounted] = useState(false)
  const [MeshGradientComp, setMeshGradientComp] = useState(null)
  const [codeLines, setCodeLines] = useState([])
  const [copied, setCopied] = useState(false)

  // Dynamic import for MeshGradient (may not be available)
  useEffect(() => {
    setMounted(true)

    import('@paper-design/shaders-react')
      .then(mod => setMeshGradientComp(() => mod.MeshGradient))
      .catch(() => console.warn('MeshGradient not available, using CSS fallback'))
  }, [])

  // Animated code reveal
  useEffect(() => {
    const lines = [
      { delay: 1000, parts: [
        { cls: 'comment', text: '// Agent browses Stripe docs' }
      ]},
      { delay: 1800, parts: [
        { cls: 'keyword', text: 'const ' },
        { cls: 'fn', text: 'result' },
        { cls: 'op', text: ' = ' },
        { cls: 'keyword', text: 'await ' },
        { cls: 'fn', text: 'browse' },
        { cls: 'op', text: '({' },
      ]},
      { delay: 2400, parts: [
        { cls: 'op', text: '  url: ' },
        { cls: 'str', text: '"https://docs.stripe.com/api"' },
      ]},
      { delay: 3000, parts: [
        { cls: 'op', text: '})' },
      ]},
      { delay: 3800, parts: [
        { cls: 'comment', text: '' },
      ]},
      { delay: 4400, parts: [
        { cls: 'comment', text: '// 84,201 → 1,847 tokens' },
      ]},
      { delay: 5000, parts: [
        { cls: 'comment', text: '// 97.8% reduction ✓' },
      ]},
    ]

    const timers = lines.map(({ delay }, i) =>
      setTimeout(() => setCodeLines(prev => [...prev, lines[i]]), delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText('npx browsermcp init')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="hero-b">
      {/* Gradient background */}
      <div className="gradient-bg">
        {mounted && MeshGradientComp ? (
          <MeshGradientComp
            style={{ width: '100%', height: '100%' }}
            colors={['#0a1628', '#1a0a3e', '#0d2847', '#1a0533', '#0a2233', '#0f0a28']}
            distortion={0.6}
            swirl={0.5}
            speed={0.3}
            grainMixer={0}
            grainOverlay={0}
          />
        ) : mounted ? (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at 30% 40%, #1a0a3e 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, #0d2847 0%, transparent 50%), #0a0a14',
          }} />
        ) : null}
      </div>
      <div className="gradient-veil" />

      <div className="content">
        <div className="eyebrow">MCP Browser Server</div>

        <h1>
          headless
          <span style={{
            background: 'linear-gradient(135deg, #63d2ff, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>dev</span>
          <span className="line-two">Give your AI agent a browser</span>
        </h1>

        <p className="sub">
          Zero-config MCP server with 10–50× token reduction. Browse, extract, screenshot, interact — all from your agent.
        </p>

        {/* Browser mockup with live code */}
        <div className="browser-mock">
          <div className="browser-bar">
            <div className="browser-dot" />
            <div className="browser-dot" />
            <div className="browser-dot" />
            <div className="browser-url">claude code — browsermcp</div>
          </div>
          <div className="browser-content">
            {codeLines.map((line, i) => (
              <div
                key={i}
                className="code-line"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {line.parts.map((part, j) => (
                  <span key={j} className={part.cls}>{part.text}</span>
                ))}
              </div>
            ))}
            {codeLines.length < 7 && (
              <div className="code-line" style={{ opacity: 1 }}>
                <span className="cursor-blink" style={{
                  display: 'inline-block',
                  width: 8,
                  height: 18,
                  background: '#63d2ff',
                  animation: 'blink 1s step-end infinite',
                  verticalAlign: 'text-bottom',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-area">
          <button className="install-cmd" onClick={handleCopy}>
            <span className="dollar">$</span>
            npx browsermcp init
            <span className="copy-icon">{copied ? '✓' : '⎘'}</span>
          </button>
          <a className="github-btn" href="https://github.com/browsermcp/browsermcp" target="_blank" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric">
            <div className="metric-val">97%</div>
            <div className="metric-label">Token Reduction</div>
          </div>
          <div className="metric">
            <div className="metric-val">4</div>
            <div className="metric-label">MCP Tools</div>
          </div>
          <div className="metric">
            <div className="metric-val">0</div>
            <div className="metric-label">Config Lines</div>
          </div>
          <div className="metric">
            <div className="metric-val">∞</div>
            <div className="metric-label">Pages Browsable</div>
          </div>
        </div>
      </div>
    </div>
  )
}
