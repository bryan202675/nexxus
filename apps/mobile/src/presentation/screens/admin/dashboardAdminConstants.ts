/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/dashboardAdminConstants.ts
 * Capa: presentacion.
 * Proposito: Constantes visuales (paleta de marca, tipografia de graficos) del Dashboard de administracion.
 * Dependencias clave: ADMIN (tema del panel de admin).
 * Consideracion de mantenimiento: preservar los nombres exportados, los consumen DashboardAdmin y sus subcomponentes de graficos/estilos.
 */

import { Platform } from 'react-native';
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
 * Componente CHART_FONT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const CHART_FONT = Platform.OS === 'ios' ? 'Avenir Next' : Platform.OS === 'web' ? 'Avenir Next, Satoshi, Segoe UI, sans-serif' : 'sans-serif';
