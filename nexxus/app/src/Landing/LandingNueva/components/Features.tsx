import { motion } from 'motion/react';
import { IconName } from '../config/icons';
import Icon from './Icon';
import { RevealGroup, revealItemVariants } from './Reveal';

type FeatureCard = { title: string; text: string; icon: IconName };

type FeaturesProps = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cards: FeatureCard[];
  columns?: 3 | 4;
  numbered?: boolean;
};

export default function Features({ id, eyebrow, title, text, cards, columns = 3, numbered = false }: FeaturesProps) {
  return (
    <section className="nxn-section" id={id}>
      <motion.div
        className="nxn-section-head"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        <span className="nxn-eyebrow">{eyebrow}</span>
        <h2 className="nxn-section-title">{title}</h2>
        <p className="nxn-section-text">{text}</p>
      </motion.div>

      <RevealGroup className={`nxn-card-grid cols-${columns}`}>
        {cards.map((card, index) => (
          <motion.div className="nxn-card" key={card.title} variants={revealItemVariants} whileHover={{ y: -4 }}>
            {numbered ? (
              <div className="nxn-card-topline">
                <Icon name={card.icon} />
                <span>{`0${index + 1}`}</span>
              </div>
            ) : (
              <Icon name={card.icon} />
            )}
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}
