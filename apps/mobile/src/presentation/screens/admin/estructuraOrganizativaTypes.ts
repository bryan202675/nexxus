/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/estructuraOrganizativaTypes.ts
 * Capa: presentacion.
 * Proposito: Tipos de datos y helpers puros (normalizacion de departamento, porcentaje, catalogo de permisos) de Estructura Organizativa.
 * Dependencias clave: ninguna externa.
 * Consideracion de mantenimiento: EntidadSeleccionada usa `ReturnType<typeof normalizarDepartamento>` — mantener ambos en el mismo archivo evita gimnasia de imports circulares.
 */

/**
 * Describe la forma tipada SectorEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SectorEstructura = {
  id?: string;
  nombre?: string;
  name?: string;
  responsableNombre?: string;
  lead?: string;
  empleadosCount?: number;
  count?: number;
};

/**
 * Describe la forma tipada DepartamentoEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type DepartamentoEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  name?: string;
  sedeId?: string;
  sedeNombre?: string;
  jefeNombre?: string;
  jefeId?: string;
  manager?: string;
  empleadosCount?: number;
  count?: number;
  sectores?: SectorEstructura[];
  sectors?: SectorEstructura[];
};

/**
 * Describe la forma tipada UsuarioEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type UsuarioEstructura = {
  id?: string;
  nombre?: string;
  rol?: string;
  cargoId?: string;
  cargo?: string;
  departamentoId?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
  estado_activo?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

/**
 * Describe la forma tipada SedeEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SedeEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  pais?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  responsableId?: string;
  responsableNombre?: string;
  activa?: boolean;
};

/**
 * Describe la forma tipada CargoEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type CargoEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  nivel?: string;
  descripcion?: string;
  activo?: boolean;
};

export type CargoDetalle = {
  cargo: CargoEstructura;
  empleados: UsuarioEstructura[];
};

export type RolDetalle = {
  rol: RolPersonalizado;
  empleados: UsuarioEstructura[];
};

/**
 * Describe la forma tipada RolPersonalizado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type RolPersonalizado = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  descripcion?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
};

/**
 * Describe la forma tipada TareaEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type TareaEstructura = {
  estado?: string;
  depto?: string;
  departamento?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada FiltroDepto; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type FiltroDepto = 'todos' | 'conJefe' | 'sinJefe' | 'conCarga';
/**
 * Describe la forma tipada ModalActivo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type ModalActivo = 'sede' | 'departamento' | 'cargo' | 'rol' | null;
/**
 * Describe la forma tipada ModoModal; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type ModoModal = 'crear' | 'editar';
/**
 * Describe la forma tipada EntidadSeleccionada; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type EntidadSeleccionada = SedeEstructura | ReturnType<typeof normalizarDepartamento> | CargoEstructura | RolPersonalizado | null;

/**
 * Componente MODULOS_PERMISOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const MODULOS_PERMISOS = [
  'dashboard',
  'plantilla',
  'estructura',
  'nomina',
  'mensajeria',
  'auditoria',
  'aprobaciones',
  'documentos',
  'analytics',
  'configuracion',
] as const;

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

/**
 * Declaracion normalizarDepartamento. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const normalizarDepartamento = (departamento: DepartamentoEstructura) => {
  // Calcula sectores; transforma la lista original en datos listos para renderizar o guardar.
  const sectores = (departamento.sectores || departamento.sectors || []).map((sector) => ({
    id: sector.id || sector.nombre || sector.name,
    nombre: sector.nombre || sector.name || 'Sector sin nombre',
    responsable: sector.responsableNombre || sector.lead || 'No asignado',
    empleados: sector.empleadosCount ?? sector.count ?? 0,
  }));

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    id: departamento.id,
    nombre: departamento.nombre || departamento.name || 'Departamento sin nombre',
    sedeId: departamento.sedeId || '',
    sedeNombre: (departamento.sedeNombre && departamento.sedeNombre.toLowerCase().trim() !== 'global.global') ? departamento.sedeNombre : 'Global',
    jefeId: departamento.jefeId || '',
    jefe: departamento.jefeNombre || departamento.manager || '',
    empleados: departamento.empleadosCount ?? departamento.count ?? 0,
    sectores,
  };
};

export type DepartamentoDetalle = {
  departamento: ReturnType<typeof normalizarDepartamento> & {
    productividad?: number;
    cobertura?: number;
  };
  empleados: UsuarioEstructura[];
};
