/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/adminUtils.ts
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from 'domain/entities/User';
import { getTenantId } from '@/shared/auth/tenant';

/**
 * Declaracion obtenerEmpresaIdAdmin. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerEmpresaIdAdmin = (user: User | null | undefined): string => getTenantId(user);
