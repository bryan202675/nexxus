import { motion } from 'motion/react';
import { siteData } from '../config/site-data';
import Reveal from './Reveal';

export default function FinalCta({ onCta }: { onCta: () => void }) {
  const { finalCta } = siteData;

  return (
    <Reveal as="section" className="nxn-final-cta">
      <h2>{finalCta.title}</h2>
      <p>{finalCta.text}</p>
      <motion.button className="nxn-btn nxn-btn-primary" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onCta}>
        Registrarse
      </motion.button>
    </Reveal>
  );
}
