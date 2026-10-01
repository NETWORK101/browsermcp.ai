import React, { useState } from 'react'
import { SectionHead } from './ui.jsx'

/*
  "My agent already runs locally — why add this?" Same task, three ways.
  Numbers tagged `measured` came from a live run (2026-10-01, browsermcp 0.2.1);
  everything else is a typical shape, labelled as such.
*/

const APPROACHES = [
  { id: 'fetch', name: 'Your agent alone', sub: 'built-in web fetch / curl' },
  { id: 'auto', name: 'Agent + automation MCP', sub: 'drives a browser step by step' },
  { id: 'bmcp', name: 'Agent + browsermcp', sub: 'one focused read', us: true },
]

const TASKS = [
  {
    id: 'docs',
    label: 'Huge docs page',
    prompt: 'Which endpoint creates an issue? Check GitHub’s REST docs.',
    runs: {
      fetch: {
        steps: ['fetch(docs.github.com/en/rest/issues/issues)', '← 286,280 tokens of raw HTML'],
        calls: '1', context: '286,280', measured: true,
        outcome: 'fail', note: 'Bigger than a 200k context window. Truncated or rejected before the answer.',
      },
      auto: {
        steps: ['navigate(url)', 'snapshot() ← full accessibility tree', 'find / scroll / snapshot …'],
        calls: '3–6', context: '13.7k schema per turn + snapshots',
        outcome: 'ok', note: 'Gets there, paying for the tool schema on every turn and a page-sized tree each step.',
      },
      bmcp: {
        steps: ['browse({ url, focus: "create an issue" })', '← ## Create an issue → Parameters · Status codes · Code samples'],
        calls: '1', context: '1,500', measured: true,
        outcome: 'ok', note: 'Ranked sections, fitted to budget, omitted headings listed for follow-up.',
      },
    },
  },
  {
    id: 'auth',
    label: 'Signed-in dashboard',
    prompt: 'Summarise the failed payouts on my Stripe dashboard.',
    runs: {
      fetch: {
        steps: ['fetch(dashboard.stripe.com/payouts?status=failed)', '← 302 → /login'],
        calls: '1', context: 'A login page',
        outcome: 'fail', note: 'No cookies, no session. The agent can only ask you to paste data in.',
      },
      auto: {
        steps: ['navigate(url)', 'snapshot()', 'click(filter) · snapshot() …'],
        calls: '4+', context: '13.7k schema per turn + snapshots',
        outcome: 'ok', note: 'Works if you’ve set up a logged-in profile — at automation prices for a read.',
      },
      bmcp: {
        steps: ['npx browsermcpai login dashboard.stripe.com  # once', 'browse({ url, focus: "failed payouts" })'],
        calls: '1', context: '~1–3k typical',
        outcome: 'ok', note: 'Your session, on your disk. The page never touches a third-party server.',
      },
    },
  },
  {
    id: 'local',
    label: 'localhost SPA',
    prompt: 'Did the new terms checkbox ship on localhost:3000/signup?',
    runs: {
      fetch: {
        steps: ['curl localhost:3000/signup', '← <div id="root"></div>'],
        calls: '1', context: 'An empty shell',
        outcome: 'fail', note: 'The form renders in JavaScript. curl never sees it.',
      },
      auto: {
        steps: ['navigate(url)', 'snapshot() ← every node on the page'],
        calls: '2', context: '13.7k schema per turn + snapshot',
        outcome: 'ok', note: 'Correct answer, heavier than the question needs.',
      },
      bmcp: {
        steps: ['browse({ url, elements: true, focus: "terms" })', '← [input:checkbox] "I accept the new terms" (#terms)'],
        calls: '1', context: '~500 typical',
        outcome: 'ok', note: 'Rendered locally, with a selector ready if the agent needs to click it.',
      },
    },
  },
]

const OUTCOME = { ok: 'Answered', fail: 'Stuck' }

export function Versus() {
  const [taskId, setTaskId] = useState('docs')
  const task = TASKS.find(t => t.id === taskId)

  return (
    <section className="section" id="versus" aria-labelledby="versus-title">
      <div className="wrap">
        <SectionHead num="02" kicker="Versus your agent alone" id="versus-title" title={<>Your agent already runs locally. <em>So why add a browser?</em></>}>
          A local agent can already fetch URLs. It still can’t sign in as you, run the page’s JavaScript, or fit a
          300k-token page into its context. Pick a task and compare what actually happens.
        </SectionHead>

        <div className="vs reveal">
          <div className="vs-tasks" role="tablist" aria-label="Example task">
            {TASKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === taskId}
                aria-controls="vs-panel"
                className="vs-task"
                onClick={() => setTaskId(t.id)}
              >
                <span className="vs-task-n">0{i + 1}</span>
                <span className="vs-task-l">{t.label}</span>
              </button>
            ))}
          </div>

          <p className="vs-prompt"><span className="vs-you">you ›</span> {task.prompt}</p>

          <div className="vs-grid" id="vs-panel" role="tabpanel" aria-live="polite">
            {APPROACHES.map(a => {
              const r = task.runs[a.id]
              return (
                <article key={a.id} className={`vs-col${a.us ? ' is-us' : ''} is-${r.outcome}`}>
                  <header className="vs-col-head">
                    <h3>{a.name}</h3>
                    <span>{a.sub}</span>
                  </header>
                  <ol className="vs-steps">
                    {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <dl className="vs-stats">
                    <div><dt>Tool calls</dt><dd>{r.calls}</dd></div>
                    <div>
                      <dt>Into context{r.measured && <span className="vs-measured">measured</span>}</dt>
                      <dd>{r.context}{/^[\d,~–]+$/.test(r.context) ? <small> tokens</small> : null}</dd>
                    </div>
                  </dl>
                  <p className="vs-outcome"><span className="vs-badge">{OUTCOME[r.outcome]}</span> {r.note}</p>
                </article>
              )
            })}
          </div>

          <p className="vs-foot">
            “Measured” figures: live run on 2026-10-01 with browsermcp 0.2.1, tokens estimated at 4 characters each.
            Other figures are typical shapes, not benchmarks. Automation MCPs are the right tool when a task really
            is multi-step driving — browsermcp is for the far more common job of reading.
          </p>
        </div>
      </div>
    </section>
  )
}
