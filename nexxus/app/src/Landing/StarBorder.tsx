import { CSSProperties, ElementType, ReactNode } from 'react';
import { createElement } from 'react';
import './StarBorder.css';

type StarBorderProps = {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  color?: string;
  speed?: string;
  style?: CSSProperties;
  thickness?: number;
  [key: string]: unknown;
};

export default function StarBorder({
  as: Component = 'button',
  children,
  className = '',
  color = '#d8b4fe',
  speed = '6s',
  style,
  thickness = 1,
  ...rest
}: StarBorderProps) {
  return createElement(
    Component,
    {
      className: `star-border-container ${className}`,
      style: {
        padding: `${thickness}px 0`,
        ...style,
      },
      ...rest,
    },
    createElement('div', {
      className: 'border-gradient-bottom',
      style: {
        animationDuration: speed,
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
      },
    }),
    createElement('div', {
      className: 'border-gradient-top',
      style: {
        animationDuration: speed,
        background: `radial-gradient(circle, ${color}, transparent 10%)`,
      },
    }),
    createElement('div', { className: 'star-inner-content' }, children)
  );
}
