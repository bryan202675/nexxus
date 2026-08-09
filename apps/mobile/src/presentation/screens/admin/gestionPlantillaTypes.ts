/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/gestionPlantillaTypes.ts
 * Capa: presentacion.
 * Proposito: Tipos de datos de la pantalla de Gestion de Plantilla (empleados, catalogos, formularios, importacion CSV), extraidos de GestionPlantilla.tsx.
 * Dependencias clave: ninguna (solo tipos).
 * Consideracion de mantenimiento: preservar la forma exacta de cada tipo, son consumidos por GestionPlantilla y sus subcomponentes/helpers.
 */

/**
 * Describe la forma tipada UsuarioPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type UsuarioPlantilla = {
  id?: string;
  nombre?: string;
  correo?: string;
  usuarioInterno?: string;
  rol?: string;
  rolOperativo?: string;
  rol_operativo?: string;
  cargoId?: string;
  cargo?: string;
  telefono?: string;
  departamentoId?: string;
  departamento?: string;
  sede?: string;
  sedeId?: string;
  jefeId?: string;
  jefeNombre?: string;
  salarioBase?: number;
  empresaId?: string;
  activo?: boolean;
  estado_activo?: boolean;
  eliminado?: boolean;
  ultimoCheckIn?: string;
  createdAt?: string;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

/**
 * Describe la forma tipada DepartamentoCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type DepartamentoCatalogo = {
  id?: string;
  nombre?: string;
  sedeId?: string;
  sedeNombre?: string;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada SedeCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SedeCatalogo = {
  id?: string;
  nombre?: string;
  codigo?: string;
  ciudad?: string;
  activo?: boolean;
  activa?: boolean;
  empresaId?: string;
};

export type FilaImportacionEmpleado = {
  nombre_completo: string;
  usuario: string;
  password: string;
  cargo: string;
  departamento: string;
  sede: string;
  telefono: string;
  salario_base: string;
  rol_operativo: string;
  jefe_usuario: string;
};

export type ErrorImportacionEmpleado = {
  fila: number;
  nombre: string;
  usuario: string;
  error: string;
};

export type FilaValidaImportacion = Omit<FilaImportacionEmpleado, 'sede'> & {
  fila: number;
  usuarioNormalizado: string;
  salarioBaseNumero: number;
  sede: SedeCatalogo;
  jefe?: UsuarioPlantilla | null;
  jefeUsuarioNormalizado?: string;
  departamentoId?: string;
  cargoId?: string;
};

export type PreviewImportacionEmpleados = {
  total: number;
  validas: FilaValidaImportacion[];
  errores: ErrorImportacionEmpleado[];
  archivo: string;
};

export type ConfirmacionEliminacion = {
  titulo: string;
  mensaje: string;
  confirmar: () => Promise<void>;
};

/**
 * Describe la forma tipada CargoCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type CargoCatalogo = {
  id?: string;
  nombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  nivel?: string;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada RolCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type RolCatalogo = {
  id?: string;
  nombre?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada TareaPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type TareaPlantilla = {
  asignado_a?: string;
  estado?: string;
  prioridad?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada CheckInPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type CheckInPlantilla = {
  id?: string;
  userId?: string;
  fecha?: string;
  timestamp?: any;
  estres?: number;
  balanceEmocional?: number;
  cargaLaboral?: number;
  energia?: string;
  empresaId?: string;
  empresa_id?: string;
};

export type AsistenciaPlantilla = {
  id?: string;
  userId?: string;
  empresaId?: string;
  tipo?: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp?: any;
};

/**
 * Describe la forma tipada AusenciaPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AusenciaPlantilla = {
  usuario_id?: string;
  estado?: string;
  tipo?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada FiltroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type FiltroEstado = 'todos' | 'activos' | 'inactivos' | 'riesgo';
/**
 * Describe la forma tipada AlcanceTarea; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AlcanceTarea = 'sede' | 'departamento' | 'individual';
/**
 * Describe la forma tipada ModoFormulario; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type ModoFormulario = 'crear' | 'editar';
/**
 * Describe la forma tipada SelectorActivo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SelectorActivo = 'cargo' | 'departamento' | 'sede' | 'rol' | null;

/**
 * Describe la forma tipada FormularioEmpleado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type FormularioEmpleado = {
  nombre: string;
  usuarioInterno: string;
  contrasena: string;
  rol: string;
  cargoId: string;
  departamentoId: string;
  sedeId: string;
  jefeId: string;
  telefono: string;
  salarioBase: string;
};

/**
 * Describe la forma tipada FormularioTarea; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type FormularioTarea = {
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja' | 'Urgente';
  fecha_limite: string;
  sedeId: string;
  departamentoId: string;
  usuarioId: string;
};

/**
 * Declaracion formularioInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const formularioInicial: FormularioEmpleado = {
  nombre: '',
  usuarioInterno: '',
  contrasena: '',
  rol: 'empleado',
  cargoId: 'base',
  departamentoId: 'general',
  sedeId: 'global',
  jefeId: '',
  telefono: '',
  salarioBase: '',
};

/**
 * Declaracion formularioTareaInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const formularioTareaInicial: FormularioTarea = {
  titulo: '',
  descripcion: '',
  prioridad: 'Media',
  fecha_limite: '',
  sedeId: '',
  departamentoId: '',
  usuarioId: '',
};


export type CrearEmpleadoLocalInput = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  departamento_id?: string;
  empleado: Record<string, any>;
};
