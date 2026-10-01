import React from 'react'
import { SectionHead, Command } from './ui.jsx'

export function Safety() {
  return (
    <section className="section" id="safety" aria-labelledby="safety-title">
      <div className="wrap">
        <SectionHead num="06" kicker="Safety" id="safety-title" title={<>Guardrails you can read <em>in one file.</em></>}>
          An agent with a browser is an agent reading text written by strangers. browsermcp treats every page that way.
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
{'    '}<span className="c-k">"allow"</span><span className="c-p">: [</span><span className="c-s">"*.stripe.com"</span><span className="c-p">, </span><span className="c-s">"localhost"</span><span className="c-p">],</span>{'\n'}
{'    '}<span className="c-k">"deny"</span><span className="c-p">:  [</span><span className="c-s">"*.internal.example"</span><span className="c-p">],</span>{'\n'}
{'    '}<span className="c-k">"allowInteract"</span><span className="c-p">: </span><span className="c-b">false</span>{'\n'}
{'  '}<span className="c-p">{'}'}</span>{'\n'}
<span className="c-p">{'}'}</span>
            </pre>
          </div>

          <dl className="safety-list reveal" style={{ '--d': '100ms' }}>
            <div>
              <dt><span className="sl-n">a</span>Domain policy</dt>
              <dd>Allow and deny lists of host globs decide where the agent may go. Set <code>allowInteract: false</code> and the browser stays read-only.</dd>
            </div>
            <div>
              <dt><span className="sl-n">b</span>Dangerous schemes blocked</dt>
              <dd><code>file:</code>, <code>javascript:</code> and <code>chrome:</code> URLs are refused outright.</dd>
            </div>
            <div>
              <dt><span className="sl-n">c</span>Untrusted-content fence</dt>
              <dd>All page content comes back inside an explicit fence that marks it as data, not instructions — blunting prompt injection hidden in pages.</dd>
            </div>
            <div>
              <dt><span className="sl-n">d</span>Daily circuit breaker</dt>
              <dd>Local caps on sessions and tokens per day stop a runaway agent loop. Check the meter any time:
                <Command text="npx browsermcpai usage" />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
