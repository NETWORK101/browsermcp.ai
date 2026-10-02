import React from 'react'
import { SectionHead } from './ui.jsx'

/*
  Lead with the moment people recognise: the agent's reply when it can't read
  the page. Each card is symptom → cause → what localmcp does instead.
*/
const PAINS = [
  {
    tag: 'Login wall',
    says: '“I can’t access that page — it looks like it requires you to sign in.”',
    why: 'Your agent’s fetch has none of your cookies, so Stripe, Jira, Notion and your admin panel all return a login screen.',
    fix: 'Sign in once with localmcp login. The session stays in a profile on your disk.',
  },
  {
    tag: 'Empty shell',
    says: '“The page appears to be empty or still loading.”',
    why: 'Most dashboards render with JavaScript. A plain HTTP fetch gets <div id="root"></div> and nothing else.',
    fix: 'A real browser renders the page before anything is read.',
  },
  {
    tag: 'Context flood',
    says: '“That page is too large to process in full.”',
    why: 'GitHub’s Issues REST reference is 286,280 tokens of raw HTML — bigger than a 200k context window.',
    fix: 'focus + maxTokens returned the relevant 1,500 tokens.',
    measured: true,
  },
  {
    tag: 'Unreachable',
    says: '“I can’t reach localhost:3000 from here.”',
    why: 'Hosted browsing and scraping services run on someone else’s servers — your dev server, VPN and intranet are invisible to them.',
    fix: 'localmcp runs on your machine, so it reaches what you can reach.',
  },
  {
    tag: 'Data exposure',
    says: '“Add your session cookie to the scraper’s config and I’ll retry.”',
    why: 'Reading private pages through a cloud scraper means handing that service your session and your data.',
    fix: 'Nothing is relayed. Page → your browser → your agent.',
  },
  {
    tag: 'Hidden instructions',
    says: '“Following the note on the page, I’ve updated the settings.”',
    why: 'Page text lands in the agent’s context looking just like your instructions. That’s how prompt injection works.',
    fix: 'Every page is fenced as untrusted data; domains and actions are limited by policy.',
  },
]

export function ProblemSection() {
  return (
    <section className="section" id="problem" aria-labelledby="problem-title">
      <div className="wrap">
        <SectionHead num="01" kicker="The problem" id="problem-title" title={<>You ask your agent to read a page. <em>Here’s what comes back.</em></>}>
          Agents are good at reasoning about the web and bad at getting to it. The pages that matter most — the ones you’re
          signed in to, the ones that render in JavaScript, the ones on your own machine — are exactly the ones they can’t read.
        </SectionHead>

        <ol className="pain-grid">
          {PAINS.map((p, i) => (
            <li key={p.tag} className="pain reveal" style={{ '--d': `${(i % 3) * 70}ms` }}>
              <div className="pain-top">
                <span className="pain-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="pain-tag">{p.tag}</span>
                {p.measured && <span className="pain-measured">measured</span>}
              </div>
              <blockquote className="pain-says">
                <span className="pain-who" aria-hidden="true">agent ›</span>
                {p.says}
              </blockquote>
              <p className="pain-why">{p.why}</p>
              <p className="pain-fix"><span className="pain-fix-k">localmcp</span> {p.fix}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
