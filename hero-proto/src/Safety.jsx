import React from 'react'
import { SectionHead, Command } from './ui.jsx'

export function Safety() {
  return (
    <section className="section" id="safety" aria-labelledby="safety-title">
      <div className="wrap">
        <SectionHead num="08" kicker="Safety" id="safety-title" title={<>Signed in, <em>but scoped.</em></>}>
          An agent with your browser is an agent reading text written by strangers, with your cookies. Anthropic and
          OpenAI both advise the same shape: a separate profile, limited logged-in access, an allowlist. browsermcp
          ships that shape as defaults you can read in one file.
        </SectionHead>

        <div className="safety-grid">
          <div className="panel reveal">
            <div className="panel-head">
              <span>.browsermcp.json</span>
              <span className="panel-tag">policy</span>
            </div>
            <pre className="panel-body code-block">
<span className="c-p">{'{'}</span>{'\n'}
{'  '}<span className="c-k">"policy"</span><span className="c-p">: {'{'}</span>{'\n'}
{'    '}<span className="c-k">"allow"</span><span className="c-p">: [</span><span className="c-s">"*.stripe.com"</span><span className="c-p">, </span><span className="c-s">"localhost:*"</span><span className="c-p">],</span>{'\n'}
{'    '}<span className="c-k">"deny"</span><span className="c-p">:  [</span><span className="c-s">"*.ads.example"</span><span className="c-p">, </span><span className="c-s">"*.tracker.example"</span><span className="c-p">],</span>{'\n'}
{'    '}<span className="c-k">"allowInteract"</span><span className="c-p">: </span><span className="c-s">"auto"</span>{'\n'}
{'  '}<span className="c-p">{'}'}</span>{'\n'}
<span className="c-p">{'}'}</span>
            </pre>
          </div>

          <dl className="safety-list reveal" style={{ '--d': '100ms' }}>
            <div>
              <dt><span className="sl-n">a</span>Read-only while signed in</dt>
              <dd>With <code>allowInteract: "auto"</code>, clicking and typing are off whenever a saved login profile or an attached browser is in use. The agent reads as you; it doesn’t act as you unless you say so.</dd>
            </div>
            <div>
              <dt><span className="sl-n">b</span>Host policy on every request</dt>
              <dd>Allow and deny lists of host globs are checked before navigation, again after redirects, and on every request a page makes — images, iframes, scripts, fetches. They hold in persistent-profile and attached-browser modes too.</dd>
            </div>
            <div>
              <dt><span className="sl-n">c</span>Dangerous schemes and sources blocked</dt>
              <dd><code>file:</code>, <code>javascript:</code>, <code>data:</code> and <code>chrome:</code> URLs are refused outright. Publisher markdown is trusted only from the page’s own origin, and only if it matches the rendered page.</dd>
            </div>
            <div>
              <dt><span className="sl-n">d</span>Untrusted-content fence</dt>
              <dd>Page text comes back inside an explicit fence that marks it as data, not instructions, and the server tells the model so. This reduces exposure to prompt injection; it is not a guarantee, so keep write actions behind confirmation.</dd>
            </div>
            <div>
              <dt><span className="sl-n">e</span>Daily circuit breaker</dt>
              <dd>Local caps on sessions and tokens per day stop a runaway loop. No telemetry, no account. Check the meter any time:
                <Command text="npx browsermcpai usage" />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
