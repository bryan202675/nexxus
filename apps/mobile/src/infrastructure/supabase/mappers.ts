// Mapeos fila de Postgres (snake_case) <-> entidad de dominio (camelCase
// mixto, heredado de como creció el esquema de Firestore). El esquema nuevo
// de Supabase es más angosto que el de Firestore: campos de "perfil extendido"
// nunca usados server-side (kpis, habilidades, insignias, progreso_capacitacion,
// puntos_recompensa, historial_laboral, certificaciones, horario_laboral,
// dias_vacaciones_disponibles, documentos_url, dui/nit/nup/isss_numero) no
// tienen columna todavía -- quedan undefined hasta que se confirme qué
// pantallas los necesitan de verdad.
import { User } from 'domain/entities/User';

export function mapUserRow(row: Record<string, any>): User {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    departamento: row.departamento_nombre ?? '',
    departamentoId: row.departamento_id ?? undefined,
    empresaId: row.empresa_id ?? undefined,
    foto_perfil: row.foto_perfil ?? undefined,
    foto_public_id: row.foto_public_id ?? undefined,
    foto_hash: row.foto_hash ?? undefined,
    foto_size: row.foto_size ?? undefined,
    cargoId: row.cargo_id ?? undefined,
    telefono: row.telefono ?? undefined,
    sedeId: row.sede_id ?? undefined,
    salarioBase: row.salario_base ?? undefined,
    eliminado: row.eliminado ?? false,
    racha: row.racha ?? 0,
    ultimoCheckIn: row.ultimo_check_in ?? undefined,
    activo: row.estado_activo ?? true,
    estado_activo: row.estado_activo ?? true,
    estado_trabajo: row.estado_trabajo ?? undefined,
    createdAt: row.created_at ?? undefined,
    tipo_contrato: row.tipo_contrato ?? undefined,
    banco: row.banco ?? undefined,
    cuenta_bancaria: row.cuenta_bancaria ?? undefined,
    afp_pertenece: row.afp_pertenece ?? undefined,
    bonos_recurrentes: row.bonos_recurrentes ?? undefined,
    comisiones_recurrentes: row.comisiones_recurrentes ?? undefined,
    descuentos_recurrentes: row.descuentos_recurrentes ?? undefined,
    codigoEmpresa: row.codigo_empresa ?? undefined,
    usuarioInterno: row.usuario_interno ?? undefined,
    passwordInternoHash: row.password_interno_hash ?? undefined,
    passwordHashAlgorithm: row.password_hash_algorithm ?? undefined,
  };
}

// Convierte un Partial<User> (nombres de la entidad) a columnas de la tabla
// usuarios para updates -- solo incluye lo que vino en el patch.
export function userPatchToRow(patch: Record<string, any>): Record<string, any> {
  const map: Record<string, string> = {
    nombre: 'nombre', correo: 'correo', rol: 'rol',
    departamentoId: 'departamento_id', cargoId: 'cargo_id', sedeId: 'sede_id',
    empresaId: 'empresa_id', telefono: 'telefono',
    foto_perfil: 'foto_perfil',
    foto_public_id: 'foto_public_id', foto_hash: 'foto_hash', foto_size: 'foto_size',
    salarioBase: 'salario_base', eliminado: 'eliminado', racha: 'racha',
    ultimoCheckIn: 'ultimo_check_in', activo: 'estado_activo', estado_activo: 'estado_activo',
    estado_trabajo: 'estado_trabajo', tipo_contrato: 'tipo_contrato', banco: 'banco',
    cuenta_bancaria: 'cuenta_bancaria', afp_pertenece: 'afp_pertenece',
    bonos_recurrentes: 'bonos_recurrentes', comisiones_recurrentes: 'comisiones_recurrentes',
    descuentos_recurrentes: 'descuentos_recurrentes', codigoEmpresa: 'codigo_empresa',
    usuarioInterno: 'usuario_interno',
  };
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(patch)) {
    const column = map[key];
    if (column) row[column] = value;
  }
  return row;
}
