import { motion } from 'motion/react';
import { siteData } from '../config/site-data';
import Icon from './Icon';
import Reveal, { RevealGroup, revealItemVariants } from './Reveal';

export default function AIShowcase() {
  const { ai } = siteData;
  const { dashboard } = ai;

  return (
    <section className="nxn-ai-section" id="ia">
      <div className="nxn-ai-main">
        <Reveal className="nxn-ai-copy">
          <span className="nxn-eyebrow">
            <Icon name="spark" />
            {ai.eyebrow}
          </span>
          <h2>
            IA que <em>{ai.titleEmphasis}</em> datos operativos en decisiones estratégicas.
          </h2>
          <p>{ai.text}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="nxn-ai-dashboard">
            <div className="nxn-ai-dashboard-head">
              <strong>
                <Icon name="spark" />
                {dashboard.title}
              </strong>
              <span>
                <i />
                {dashboard.statusLabel}
              </span>
            </div>

            <RevealGroup className="nxn-ai-feature-list">
              {ai.features.map((feature) => (
                <motion.div className="nxn-ai-feature" key={feature.title} variants={revealItemVariants}>
                  <div>
                    <Icon name={feature.icon} />
                  </div>
                  <span>
                    <strong>{feature.title}</strong>
                    <small>{feature.text}</small>
                  </span>
                </motion.div>
              ))}
            </RevealGroup>

            <div className="nxn-ai-analytics">
              <div className="nxn-ai-chart-card">
                <span>{dashboard.performance.label}</span>
                <strong>{dashboard.performance.value}</strong>
                <small>
                  {dashboard.performance.change} <b>{dashboard.performance.changeLabel}</b>
                </small>
                <svg aria-hidden="true" className="nxn-ai-line-chart" viewBox="0 0 360 130" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="nxn-ai-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#c084fc" stopOpacity=".4" />
                      <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 112 C24 93 34 104 55 86 S88 112 110 92 S145 49 166 68 S196 80 218 43 S256 34 277 36 S318 20 360 2 L360 130 L0 130Z"
                    fill="url(#nxn-ai-area)"
                  />
                  <path
                    d="M0 112 C24 93 34 104 55 86 S88 112 110 92 S145 49 166 68 S196 80 218 43 S256 34 277 36 S318 20 360 2"
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <div className="nxn-ai-mini-grid">
                <div className="nxn-ai-mini-card is-alert">
                  <span>{dashboard.alerts.label}</span>
                  <strong>{dashboard.alerts.value}</strong>
                  <small>{dashboard.alerts.subtext}</small>
                  <div>
                    {dashboard.alerts.bars.map((height, index) => (
                      <i key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="nxn-ai-mini-card">
                  <span>{dashboard.tasksCompleted.label}</span>
                  <strong>{dashboard.tasksCompleted.value}</strong>
                  <small>{dashboard.tasksCompleted.change}</small>
                  <div>
                    {dashboard.tasksCompleted.bars.map((height, index) => (
                      <i key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="nxn-ai-impact-card">
                <span>{dashboard.impactAreas.label}</span>
                {dashboard.impactAreas.items.map((entry) => (
                  <div key={entry.label}>
                    <small>{entry.label}</small>
                    <i>
                      <b style={{ width: `${entry.value}%` }} />
                    </i>
                    <strong>{entry.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <RevealGroup className="nxn-ai-metrics">
        {siteData.metrics.map((metric) => (
          <motion.div className="nxn-ai-metric" key={metric.label} variants={revealItemVariants}>
            <span>
              <Icon name={metric.icon} />
            </span>
            <div>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </div>
          </motion.div>
        ))}
      </RevealGroup>

      <Reveal className="nxn-testimonial" delay={0.1}>
        <Icon name="spark" />
        <span>{siteData.testimonial}</span>
      </Reveal>
    </section>
  );
}
