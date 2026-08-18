/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/adminNavigatorHelpers.ts
 * Capa: presentacion.
 * Proposito: Helpers puros (lectura de datos de usuario/empresa, tipos de busqueda del admin) extraidos de AdminNavigator.tsx.
 * Dependencias clave: MaterialIcons (solo para el tipo de icono), esPanelSuperAdmin.
 * Consideracion de mantenimiento: preservar las firmas exportadas, son consumidas por AdminNavigator y sus subcomponentes.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { esPanelSuperAdmin } from './adminMenuConfig';
import { getTenantId } from '@/shared/auth/tenant';

/**
 * Declaracion obtenerEmpresaId. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerEmpresaId = (user: any) => getTenantId(user);

/**
 * Declaracion obtenerNombreEmpresa. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerNombreEmpresa = (user: any) => {
  // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const nombre = user?.empresa || user?.empresaNombre || user?.nombreEmpresa || user?.companyName;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof nombre === 'string' && nombre.trim().length > 0 ? nombre.trim() : 'Nexxus Enterprise';
};

/**
 * Declaracion obtenerFotoPerfil. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerFotoPerfil = (user: any) => {
  // Declara foto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const foto = user?.foto_perfil || user?.fotoPerfil || user?.photoURL || user?.avatarUrl;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof foto === 'string' && foto.trim().length > 0 ? foto.trim() : '';
};

/**
 * Declaracion etiquetaRolSidebar. Etiqueta legible del rol mostrado bajo el nombre en el sidebar.
 */
export const etiquetaRolSidebar = (rol?: string | null) => {
  if (esPanelSuperAdmin(rol)) return 'Super Admin';
  if (rol === 'admin' || rol === 'admin_empresa') return 'Propietario';
  return rol || 'Propietario';
};

export type AdminSearchResult = {
  id: string;
  route: string;
  params?: Record<string, any>;
  title: string;
  detail: string;
  category: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keywords: string;
};

export type AdminSearchRecord = Record<string, any> & { id?: string };

export const normalizarBusquedaAdmin = (valor: unknown) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();
