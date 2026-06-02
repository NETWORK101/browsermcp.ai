import React from 'react'
import { motion } from 'framer-motion'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Everything you need to browse locally.',
    cta: 'npx browsermcpai init',
    ctaStyle: 'pricing-cta-outline',
    features: [
      { text: 'All 5 tools', included: true },
      { text: '50 sessions / day', included: true },
      { text: 'DOM distillation (10-50x)', included: true },
      { text: 'Localhost & auth pages', included: true },
      { text: 'Cloud relay', included: false },
      { text: 'Team dashboard', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$4',
    period: '/mo',
    description: 'For developers shipping with AI agents.',
    cta: 'Start Pro — 14 days free',
    ctaStyle: 'pricing-cta-primary',
    popular: true,
    features: [
      { text: 'Unlimited sessions', included: true },
      { text: 'All 5 tools', included: true },
      { text: 'Cloud relay (CI/CD)', included: true },
      { text: 'Watch + Slack alerts', included: true },
      { text: 'Priority support', included: true },
      { text: '"Powered by browsermcp"', included: true },
    ],
  },
  {
    name: 'Team',
    price: '$12',
    period: '/mo',
    description: 'For teams building AI-powered workflows.',
    cta: 'Contact Us',
    ctaStyle: 'pricing-cta-outline',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited seats', included: true },
      { text: 'Shared browse configs', included: true },
      { text: 'Team dashboard + audit logs', included: true },
      { text: 'SSO & role-based access', included: true },
      { text: 'Priority support + SLA', included: true },
    ],
  },
]

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Pricing() {
  return (
    <section className="section pricing-section" id="pricing">
      <div className="section-inner">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Pricing
        </motion.div>

        <motion.h2
          className="section-title pricing-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Start free. Go Pro when you ship.
        </motion.h2>

        <div className="pricing-grid">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              className={`pricing-card ${tier.popular ? 'pricing-card-popular' : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 * i + 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
            >
              {tier.popular && (
                <div className="pricing-badge">
                  <span className="pricing-badge-text">Most Popular</span>
                </div>
              )}

              <div className="pricing-header">
                <h3 className="pricing-name">{tier.name}</h3>
                <div className="pricing-price">
                  <span className="pricing-amount">{tier.price}</span>
                  {tier.period && <span className="pricing-period">{tier.period}</span>}
                </div>
                <p className="pricing-desc">{tier.description}</p>
              </div>

              <div className="pricing-divider" />

              <ul className="pricing-features">
                {tier.features.map((f, j) => (
                  <motion.li
                    key={j}
                    className={f.included ? 'pricing-feature-included' : 'pricing-feature-excluded'}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.05 * j + 0.15 * i + 0.4 }}
                  >
                    <span className="pricing-feature-icon">
                      {f.included ? <Check /> : <span className="pricing-dash">&ndash;</span>}
                    </span>
                    <span>{f.text}</span>
                  </motion.li>
                ))}
              </ul>

              <button className={tier.ctaStyle}>
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Cost comparison callout */}
        <motion.div
          className="pricing-compare-callout"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="pricing-compare-items">
            <div className="pricing-compare-item pricing-compare-them">
              <span className="pricing-compare-label">Browserbase</span>
              <span className="pricing-compare-cost">$20–99/mo</span>
            </div>
            <div className="pricing-compare-item pricing-compare-them">
              <span className="pricing-compare-label">Firecrawl</span>
              <span className="pricing-compare-cost">$16–333/mo</span>
            </div>
            <div className="pricing-compare-item pricing-compare-us">
              <span className="pricing-compare-label">browsermcp Pro</span>
              <span className="pricing-compare-cost">$4/mo</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
