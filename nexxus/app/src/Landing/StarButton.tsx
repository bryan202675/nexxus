/**
 * Documentacion Nexxus - nexxus/app/src/Landing/StarButton.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { ReactNode } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { ReactNode } from 'react';
// Importa { createElement } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement } from 'react';
// Importa StarBorder; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import StarBorder from './StarBorder';

/**
 * Componente StarButton. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
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
  // Devuelve el valor final calculado para esta funcion o caso de uso.
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
