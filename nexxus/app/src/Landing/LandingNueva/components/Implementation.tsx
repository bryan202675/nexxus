import { motion } from 'motion/react';
import { siteData } from '../config/site-data';
import Icon from './Icon';
import Reveal, { RevealGroup, revealItemVariants } from './Reveal';

export default function Implementation() {
  const { implementation } = siteData;

  return (
    <section className="nxn-section" id="implementacion">
      <Reveal className="nxn-section-head">
        <span className="nxn-eyebrow">{implementation.eyebrow}</span>
        <h2 className="nxn-section-title">{implementation.title}</h2>
        <p className="nxn-section-text">{implementation.text}</p>
      </Reveal>

      <RevealGroup className="nxn-rail">
        {implementation.items.map((entry) => (
          <motion.span key={entry.label} variants={revealItemVariants}>
            <Icon name={entry.icon} />
            {entry.label}
          </motion.span>
        ))}
      </RevealGroup>
    </section>
  );
}
