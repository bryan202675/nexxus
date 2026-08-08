/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/adminNavigatorTypes.ts
 * Capa: presentacion.
 * Proposito: Tipos compartidos entre useAdminSignals y NotificationPanel/NotificationItemComponent,
 * extraidos de AdminNavigator.tsx para romper el ciclo de dependencia entre el hook y el panel.
 * Dependencias clave: ninguna (solo tipos).
 * Consideracion de mantenimiento: preservar la forma exacta de SignalItem, la consumen ambos archivos.
 */

/**
 * Describe la forma tipada SignalItem; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SignalItem = {
  id: string;
  title: string;
  detail: string;
  type: 'approval' | 'alert' | 'audit';
  tone: 'success' | 'warning' | 'danger' | 'info';
};
