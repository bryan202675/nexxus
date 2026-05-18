/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/FondoAurora.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';

/**
 * Componente FondoAurora. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function FondoAurora() {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return <FondoMobilePremium />;
}
