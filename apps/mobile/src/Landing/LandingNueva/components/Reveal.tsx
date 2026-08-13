import { ReactNode } from 'react';
import { motion, Variants } from 'motion/react';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'section';
};

export default function Reveal({ children, className, delay = 0, y = 22, as = 'div' }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </Component>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: 'div' | 'ul';
};

export function RevealGroup({ children, className, stagger = 0.08, as = 'div' }: RevealGroupProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </Component>
  );
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};
