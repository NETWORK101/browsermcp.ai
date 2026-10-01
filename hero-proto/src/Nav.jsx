import React, { useState, useEffect } from 'react'
import { useTheme } from './ThemeContext.jsx'
import { LINKS, Mark, IconGitHub } from './ui.jsx'

const ITEMS = [
  ['#problem', 'Problem'],
  ['#versus', 'Why'],
  ['#how', 'How'],
  ['#local', 'Local'],
  ['#tools', 'Tools'],
  ['#compare', 'Compare'],
  ['#pricing', 'Pricing'],
]

export function Nav() {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="nav-inner wrap" aria-label="Primary">
        <a href="#top" className="brand" aria-label="browsermcp — home">
          <Mark />
          <span className="brand-name">browsermcp</span>
          <span className="brand-ver">v0.2.1</span>
        </a>

        <ul className="nav-links">
          {ITEMS.map(([href, label]) => (
            <li key={href}><a href={href}>{label}</a></li>
          ))}
        </ul>

        <div className="nav-actions">
          <a className="nav-gh" href={LINKS.github} target="_blank" rel="noopener noreferrer">
            <IconGitHub />
            <span>GitHub</span>
          </a>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${next} theme`}
            title={`Switch to ${next} theme`}
          >
            <span className="tt-track" aria-hidden="true">
              <span className="tt-opt" data-on={theme === 'dark'}>Ink</span>
              <span className="tt-opt" data-on={theme === 'light'}>Paper</span>
            </span>
          </button>
        </div>
      </nav>
    </header>
  )
}
