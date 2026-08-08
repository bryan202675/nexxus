/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/gestionPlantillaConstants.ts
 * Capa: presentacion.
 * Proposito: Constantes visuales (paleta de marca, morado de Plantilla) de la pantalla de Gestion de Plantilla.
 * Dependencias clave: ADMIN (tema del panel de admin).
 * Consideracion de mantenimiento: preservar los nombres exportados, los consumen GestionPlantilla y sus subcomponentes/estilos.
 */

import { ADMIN } from './adminTheme';

/**
 * Componente BRAND. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

/**
 * Declaracion PLANTILLA_PURPLE. Mantiene el mismo morado oscuro en Plantilla para modo claro y oscuro.
 */
export const PLANTILLA_PURPLE = '#6320A6';
