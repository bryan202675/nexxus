/**
 * Documentacion Nexxus - nexxus/app/src/Landing/StarBorder.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { CSSProperties, ElementType, ReactNode } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { CSSProperties, ElementType, ReactNode } from 'react';
// Importa { createElement } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement } from 'react';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './StarBorder.css';

/**
 * Describe la forma tipada StarBorderProps; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
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

/**
 * Componente StarBorder. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
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
  // Devuelve el valor final calculado para esta funcion o caso de uso.
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
