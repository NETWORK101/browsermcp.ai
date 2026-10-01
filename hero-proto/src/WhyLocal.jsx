import React from 'react'
import { SectionHead, Command } from './ui.jsx'

export function WhyLocal() {
  return (
    <section className="section" id="local" aria-labelledby="local-title">
      <div className="wrap">
        <SectionHead num="02" kicker="Local &amp; authenticated" id="local-title" title={<>Signed in as <em>you.</em> Running on <em>your</em> machine.</>}>
          browsermcp drives a real Chromium on your computer through Playwright. No API key, no account, no relay —
          the page goes from your browser to your agent and nowhere else.
        </SectionHead>

        <div className="local-grid">
          <ol className="steps reveal">
            <li className="step">
              <span className="step-n">i.</span>
              <div>
                <h3>Sign in once, by hand.</h3>
                <p>
                  <code>login</code> opens a visible browser on a dedicated, persistent profile at{' '}
                  <code>~/.browsermcp/profile</code>. Sign in like you normally would — passkeys, SSO, 2FA — then close it.
                </p>
              </div>
            </li>
            <li className="step">
              <span className="step-n">ii.</span>
              <div>
                <h3>Your agent reuses the session.</h3>
                <p>Every later <code>browse</code> on that site reads the page as you see it. Your credentials never pass through the agent.</p>
              </div>
            </li>
            <li className="step">
              <span className="step-n">iii.</span>
              <div>
                <h3>Or attach to the Chrome you already use.</h3>
                <p>Start Chrome with remote debugging and point browsermcp at it over CDP.</p>
              </div>
            </li>
            <li className="step">
              <span className="step-n">iv.</span>
              <div>
                <h3>localhost just works.</h3>
                <p>Your dev server, your staging build behind a VPN, the admin panel on your laptop — all readable, because it’s your machine doing the reading.</p>
              </div>
            </li>
          </ol>

          <div className="local-side reveal" style={{ '--d': '120ms' }}>
            <div className="panel">
              <div className="panel-head">
                <span>Terminal</span>
                <span className="panel-tag">once per site</span>
              </div>
              <div className="panel-body">
                <Command text="npx browsermcpai login https://dashboard.stripe.com" />
                <pre className="term-out">
<span className="t-dim"># a visible Chromium window opens</span>{'\n'}
<span className="t-dim"># profile: ~/.browsermcp/profile</span>{'\n'}
<span className="t-dim"># sign in, then close the window</span>
                </pre>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span>.browsermcp.json</span>
                <span className="panel-tag">optional</span>
              </div>
              <pre className="panel-body code-block">
<span className="c-p">{'{'}</span>{'\n'}
{'  '}<span className="c-k">"cdpEndpoint"</span><span className="c-p">:</span> <span className="c-s">"http://localhost:9222"</span>{'\n'}
<span className="c-p">{'}'}</span>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
