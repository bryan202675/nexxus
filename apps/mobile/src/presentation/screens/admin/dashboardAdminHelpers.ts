/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/dashboardAdminHelpers.ts
 * Capa: presentacion.
 * Proposito: Helpers puros de fecha/formato/estado usados por el Dashboard de administracion, extraidos de DashboardAdmin.tsx.
 * Dependencias clave: TareaAdmin/CheckInAdmin (dashboardAdminTypes).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consumen DashboardAdmin y sus subcomponentes.
 */

import { TareaAdmin, CheckInAdmin } from './dashboardAdminTypes';

/**
 * Declaracion obtenerFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerFecha = (valor: any): Date | null => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!valor) return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.toDate === 'function') return valor.toDate();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor === 'number') return new Date(valor);
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion obtenerFechaTarea. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerFechaTarea = (tarea: TareaAdmin): Date | null => obtenerFecha(
  tarea.fecha_creacion ||
  tarea.createdAt ||
  (tarea as any).fechaCreacion ||
  (tarea as any).created_at ||
  (tarea as any).timestamp ||
  tarea.fecha_limite
);

/**
 * Declaracion obtenerFechaCheckIn. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerFechaCheckIn = (checkIn: CheckInAdmin): Date | null => obtenerFecha(
  checkIn.fecha ||
  checkIn.timestamp ||
  (checkIn as any).createdAt ||
  (checkIn as any).created_at
);

/**
 * Declaracion valorEscalaCinco. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const valorEscalaCinco = (valor: any) => {
  // Declara numero; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const numero = Number(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isFinite(numero) ? Math.max(0, Math.min(5, numero)) : 0;
};

/**
 * Declaracion formatearMoneda. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const formatearMoneda = (valor: number) => `$${valor.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

/**
 * Declaracion mismoDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const mismoDia = (fecha: Date | null) => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

/**
 * Declaracion estaVencida. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const estaVencida = (valor?: string) => {
  // Declara fecha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const fecha = obtenerFecha(valor);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  hoy.setHours(0, 0, 0, 0);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return fecha < hoy;
};
