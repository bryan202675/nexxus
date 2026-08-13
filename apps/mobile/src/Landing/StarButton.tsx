/**
 * Documentacion Nexxus - apps/mobile/src/Landing/StarButton.tsx
 * Capa: landing.
 * Proposito: Botón reutilizable con efecto visual "shimmer" para el landing público.
 */

import { ReactNode } from 'react';

type StarButtonProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
};

export default function StarButton({
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}: StarButtonProps) {
  return (
    <button
      className={`nx-btn-shimmer ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}