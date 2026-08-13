/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/estructuraOrganizativaConstants.ts
 * Capa: presentacion.
 * Proposito: Constantes visuales (paleta de marca, colores suaves de catalogos, gradiente de cabecera) de Estructura Organizativa.
 * Dependencias clave: ADMIN (tema del panel de admin).
 * Consideracion de mantenimiento: preservar los nombres exportados, los consumen EstructuraOrganizativa y sus subcomponentes/estilos.
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
 * Componente SOFT_COLORS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const SOFT_COLORS = {
  sedes: '#3B82F6',
  deptos: '#8B5CF6',
  cargos: '#14B8A6',
  roles: '#F59E0B',
};

/**
 * Componente DEPT_HEADER_GRADIENT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const DEPT_HEADER_GRADIENT = ['#211A62', '#6D28D9', '#2563EB'] as const;
/**
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const CONTRAST_TEXT = '#FFFFFF';

