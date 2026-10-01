import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './ThemeContext.jsx'
import { Nav } from './Nav.jsx'
import { Hero } from './Hero.jsx'
import { ProblemSection } from './ProblemSection.jsx'
import { WhyLocal } from './WhyLocal.jsx'
import { Tools } from './Tools.jsx'
import { TokenReduction } from './TokenReduction.jsx'
import { McpSpec } from './McpSpec.jsx'
import { Safety } from './Safety.jsx'
import { Comparison } from './Comparison.jsx'
import { Pricing } from './Pricing.jsx'
import { CTA } from './CTA.jsx'
import { Footer } from './Footer.jsx'
import { useRevealAll } from './ui.jsx'
import './styles.css'

function App() {
  useRevealAll()
  return (
    <ThemeProvider>
      <Nav />
      <main id="main">
        <Hero />
        <ProblemSection />
        <WhyLocal />
        <Tools />
        <TokenReduction />
        <McpSpec />
        <Safety />
        <Comparison />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
