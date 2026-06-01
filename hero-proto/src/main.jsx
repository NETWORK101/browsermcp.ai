import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './ThemeContext.jsx'
import { Nav } from './Nav.jsx'
import { HeroC } from './HeroC.jsx'
import { ProblemSection } from './ProblemSection.jsx'
import { WhyLocal } from './WhyLocal.jsx'
import { TokenReduction } from './TokenReduction.jsx'
import { Playground } from './Playground.jsx'
import { Comparison } from './Comparison.jsx'
import { Pricing } from './Pricing.jsx'
import { CTA } from './CTA.jsx'
import { Footer } from './Footer.jsx'
import './styles.css'

/*
  Page structure (per content review proposal):
  1. Security-first hero
  2. Problem space
  3. Why local matters
  4. What browsermcp does (token reduction + playground)
  5. How it compares
  6. CTA with adoption path
*/
function App() {
  return (
    <ThemeProvider>
      <Nav />
      <main>
        <HeroC />
        <ProblemSection />
        <WhyLocal />
        <TokenReduction />
        <Playground />
        <Comparison />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
