import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { siteData } from '../config/site-data';
import Icon from './Icon';
import Reveal, { RevealGroup, revealItemVariants } from './Reveal';

type BillingCycle = 'monthly' | 'annual';

function priceFor(monthly: number, cycle: BillingCycle) {
  return cycle === 'annual' ? Math.round(monthly * 12 * siteData.pricing.annualDiscount) : monthly;
}

export default function Pricing({ onChoosePlan }: { onChoosePlan: (plan: string) => void }) {
  const { pricing, plans } = siteData;
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const togglePlan = (name: string) => {
    setExpandedPlan((current) => (current === name ? null : name));
  };

  return (
    <section className="nxn-section" id="planes">
      <Reveal className="nxn-pricing-head" y={16}>
        <div>
          <span className="nxn-eyebrow">{pricing.eyebrow}</span>
          <h2 className="nxn-section-title">{pricing.title}</h2>
        </div>
        <div className="nxn-toggle" role="group" aria-label="Facturación">
          <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>
            {pricing.monthlyLabel}
          </button>
          <button className={billing === 'annual' ? 'active' : ''} onClick={() => setBilling('annual')}>
            {pricing.annualLabel}
          </button>
        </div>
      </Reveal>

      <RevealGroup className="nxn-plan-grid">
        {plans.map((plan) => {
          const isOpen = expandedPlan === plan.name;
          return (
            <motion.div
              className={`nxn-plan ${plan.featured ? 'featured' : ''}`}
              key={plan.name}
              variants={revealItemVariants}
              whileHover={{ y: -4 }}
            >
              <div className="nxn-plan-header">
                <Icon name={plan.icon} />
                <span className="nxn-plan-badge">{plan.badge}</span>
              </div>
              <h3>{plan.name}</h3>
              <div className="nxn-price">
                ${priceFor(plan.monthly, billing)}
                <small>/{billing === 'annual' ? 'Año' : 'Mes'}</small>
              </div>
              <p className="nxn-plan-users">{plan.users}</p>

              <div className="nxn-plan-includes">
                <strong>{pricing.includesLabel}</strong>
                <ul className="nxn-plan-benefits">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <button className="nxn-btn nxn-btn-ghost nxn-btn-sm" style={{ marginTop: 16 }} onClick={() => togglePlan(plan.name)}>
                {isOpen ? pricing.hideBenefitsLabel : pricing.viewBenefitsLabel}
                <span>{isOpen ? '−' : '+'}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
                      {plan.detailGroups.map((group) => (
                        <div key={group.title}>
                          <h4 style={{ fontSize: 12, color: 'var(--nxn-soft)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                            {group.title}
                          </h4>
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {group.items.map((detailItem) => (
                              <li key={detailItem} style={{ fontSize: 13, color: 'var(--nxn-muted)' }}>
                                {detailItem}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <motion.button
                className="nxn-btn nxn-btn-primary nxn-plan-cta"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChoosePlan(plan.name)}
              >
                {pricing.choosePlanLabel}
              </motion.button>
            </motion.div>
          );
        })}
      </RevealGroup>
    </section>
  );
}
