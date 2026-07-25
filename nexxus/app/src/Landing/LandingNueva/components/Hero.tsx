import { motion, Variants } from 'motion/react';
import { siteData } from '../config/site-data';
import Icon from './Icon';

type HeroProps = {
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] } },
};

export default function Hero({ onPrimaryCta, onSecondaryCta }: HeroProps) {
  return (
    <section className="nxn-hero" id="hero">
      <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'contents' }}>
        <motion.span className="nxn-eyebrow" variants={item}>
          <Icon name="spark" className="nxn-icon" />
          Nexxus
        </motion.span>

        <motion.h1 className="nxn-hero-title" variants={item}>
          {siteData.hero.title}
        </motion.h1>

        <motion.p className="nxn-hero-subtitle" variants={item}>
          {siteData.hero.subtitle}
        </motion.p>

        <motion.div className="nxn-hero-actions" variants={item}>
          <motion.button
            className="nxn-btn nxn-btn-primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPrimaryCta}
          >
            <Icon name={siteData.hero.primaryCta.icon} />
            {siteData.hero.primaryCta.label}
          </motion.button>
          <motion.button
            className="nxn-btn nxn-btn-ghost"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSecondaryCta}
          >
            <Icon name={siteData.hero.secondaryCta.icon} />
            {siteData.hero.secondaryCta.label}
          </motion.button>
        </motion.div>

        <motion.div className="nxn-metrics-row" variants={item}>
          {siteData.metrics.map((metric) => (
            <div className="nxn-metric-card" key={metric.label}>
              <Icon name={metric.icon} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="nxn-orb nxn-orb-a"
        aria-hidden="true"
        animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="nxn-orb nxn-orb-b"
        aria-hidden="true"
        animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </section>
  );
}
