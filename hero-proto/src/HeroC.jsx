import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AnimatedGradientBackground from './AnimatedGradientBackground.jsx'
import { useTheme } from './ThemeContext.jsx'

const darkGradientColors = [
  '#050510',
  '#0a1a3a',
  '#1a0a35',
  '#0d2847',
  '#180a30',
  '#0a1520',
  '#060610',
]

const lightGradientColors = [
  '#F7F3EE',
  '#e8dfd6',
  '#e0d0c8',
  '#d8c8be',
  '#e8ddd4',
  '#f0e8e0',
  '#F7F3EE',
]

const useCases = [
  { icon: '🔒', text: 'Authenticated dashboards' },
  { icon: '🏠', text: 'Localhost & dev servers' },
  { icon: '📄', text: 'Internal docs & wikis' },
  { icon: '⚡', text: 'JavaScript-heavy apps' },
  { icon: '🔍', text: 'Staging environments' },
  { icon: '📊', text: 'Private admin panels' },
]

export function HeroC() {
  const { theme } = useTheme()
  const [typed, setTyped] = useState({ line: 0, chars: 0 })
  const [copied, setCopied] = useState(false)

  const demoLines = [
    { prompt: '$', text: 'npx browsermcpai init' },
    { prompt: '✓', text: 'MCP config written — browsing happens locally', type: 'success' },
    { prompt: '', text: '' },
    { prompt: '→', text: 'browse({ url: "http://localhost:3000/admin" })' },
    { prompt: '', text: '  Your dev server → clean markdown. Nothing left your machine.', type: 'success' },
    { prompt: '', text: '' },
    { prompt: '→', text: 'browse({ url: "https://dashboard.stripe.com/payments" })' },
    { prompt: '', text: '  Authenticated session reused locally. No credentials shared.', type: 'success' },
  ]

  useEffect(() => {
    let timer
    const tick = () => {
      setTyped(prev => {
        const currentLine = demoLines[prev.line]
        if (!currentLine) return prev
        if (prev.chars < currentLine.text.length) {
          return { ...prev, chars: prev.chars + 1 }
        }
        if (prev.line < demoLines.length - 1) {
          return { line: prev.line + 1, chars: 0 }
        }
        return prev
      })
      timer = setTimeout(tick, 30 + Math.random() * 20)
    }
    timer = setTimeout(tick, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText('npx browsermcpai init')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="hero-c">
      <AnimatedGradientBackground
        startingGap={100}
        Breathing={true}
        gradientColors={theme === 'dark' ? darkGradientColors : lightGradientColors}
        gradientStops={[15, 30, 45, 58, 72, 86, 100]}
        animationSpeed={0.015}
        breathingRange={8}
        topOffset={-20}
      />

      <div className="noise-overlay" />

      <motion.div
        className="hero-c-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {/* Badge */}
        <motion.div
          className="hero-c-badge"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6, type: 'spring' }}
        >
          <span className="badge-dot" />
          <span>Local MCP browser for AI agents</span>
        </motion.div>

        {/* Title — THE headline, matches CTA */}
        <motion.h1
          className="hero-c-title"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Free, private browser access
          <br />
          <span className="title-gradient">for your AI agent.</span>
        </motion.h1>

        {/* Value prop — one repeatable line */}
        <motion.p
          className="hero-c-sub"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          browsermcp gives AI agents a secure, local, MCP-native browser for reading
          authenticated pages, localhost apps, internal tools, and JS-rendered websites
          as clean markdown. Nothing leaves your machine.
        </motion.p>

        {/* Use cases strip */}
        <motion.div
          className="hero-use-cases"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {useCases.map((uc, i) => (
            <span key={i} className="hero-use-case">
              <span className="hero-uc-icon">{uc.icon}</span>
              {uc.text}
            </span>
          ))}
        </motion.div>

        {/* Install CTA */}
        <motion.div
          className="hero-c-cta"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        >
          <button className="cta-install" onClick={handleCopy}>
            <span className="cta-dollar">$</span>
            <span>npx browsermcpai init</span>
            <span className="cta-copy">{copied ? '✓ copied' : 'copy'}</span>
          </button>

          <a
            className="cta-github"
            href="https://github.com/NETWORK101/browsermcp.ai"
            target="_blank"
            rel="noopener"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </motion.div>

        {/* Terminal demo */}
        <motion.div
          className="hero-c-terminal"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 1.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="term-chrome">
            <div className="term-dots">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#febc2e' }} />
              <span style={{ background: '#28c840' }} />
            </div>
            <div className="term-title">browsermcp — local MCP browser</div>
          </div>
          <div className="term-body">
            {demoLines.map((line, i) => {
              if (i > typed.line) return null
              const chars = i < typed.line ? line.text.length : typed.chars
              const text = line.text.slice(0, chars)

              if (!line.prompt && !line.text) {
                return <div key={i} className="term-line term-spacer" />
              }

              return (
                <div key={i} className={`term-line ${line.type || ''}`}>
                  {line.prompt && (
                    <span className={`term-prompt ${line.type === 'success' ? 'prompt-success' : ''}`}>
                      {line.prompt}
                    </span>
                  )}
                  <span className="term-text">{text}</span>
                  {i === typed.line && chars < line.text.length && (
                    <span className="term-cursor" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
