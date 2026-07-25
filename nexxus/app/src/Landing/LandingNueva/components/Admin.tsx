import { motion } from 'motion/react';
import { siteData } from '../config/site-data';
import Reveal, { RevealGroup, revealItemVariants } from './Reveal';

export default function Admin() {
  const { admin } = siteData;

  return (
    <section className="nxn-section" id="admin">
      <div className="nxn-admin">
        <Reveal className="nxn-admin-copy">
          <span className="nxn-eyebrow">{admin.eyebrow}</span>
          <h2 className="nxn-section-title">{admin.title}</h2>
          <p className="nxn-section-text">{admin.text}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="nxn-console">
            <div className="nxn-console-head">
              <strong>{admin.liveLabel}</strong>
            </div>
            <RevealGroup as="ul">
              {admin.items.map((entry) => (
                <motion.li key={entry.label} variants={revealItemVariants}>
                  <span>{entry.label}</span>
                  <b>{entry.value}%</b>
                </motion.li>
              ))}
            </RevealGroup>
            <div className="nxn-radar">
              <motion.i
                animate={{ opacity: [0.8, 0], scale: [0.5, 1.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              />
              <motion.i
                animate={{ opacity: [0.8, 0], scale: [0.5, 1.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 0.5 }}
              />
              <motion.i
                animate={{ opacity: [0.8, 0], scale: [0.5, 1.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 1 }}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
