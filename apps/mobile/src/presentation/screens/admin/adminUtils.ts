/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/adminUtils.ts
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from 'domain/entities/User';

/**
 * Declaracion obtenerEmpresaIdAdmin. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerEmpresaIdAdmin = (user: User | null | undefined): string => {
  // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const valor = user?.empresaId || (user as any)?.empresa_id || (user as any)?.empresaID;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof valor === 'string' ? valor.trim() : '';
};
