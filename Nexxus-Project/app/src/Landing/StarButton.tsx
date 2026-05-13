import { ReactNode } from 'react';
import { createElement } from 'react';
import StarBorder from './StarBorder';

export default function StarButton({
  children,
  className = '',
  onClick,
  type = 'button',
}: {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return createElement(
    StarBorder,
    {
      as: 'button',
      className: `nx-star-button ${className}`,
      color: '#d8b4fe',
      onClick,
      speed: '5s',
      thickness: 1,
      type,
    },
    children
  );
}
