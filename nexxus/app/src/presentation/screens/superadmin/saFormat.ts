export const formatoMoneda = (value: number) => `$${(value || 0).toLocaleString('es-SV', { maximumFractionDigits: 2 })}`;

export const formatoFecha = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: '2-digit' });
};

export const formatoFechaHora = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-SV', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const etiquetaRol = (rol: string) => {
  switch (rol) {
    case 'super_admin': return 'Super Admin';
    case 'admin_empresa': return 'Propietario';
    case 'jefe': return 'Jefe';
    case 'empleado': return 'Empleado';
    default: return rol || 'Sin rol';
  }
};

export const etiquetaEstadoEmpresa = (estado: string) => {
  switch (estado) {
    case 'active': return 'Activa';
    case 'grace_period': return 'Suspendida';
    case 'expired': return 'Expirada';
    case 'canceling': return 'Cancelando';
    default: return estado || 'Sin estado';
  }
};

export const etiquetaEstadoUsuario = (usuario: { activo: boolean; baneado: boolean; eliminado: boolean }) => {
  if (usuario.eliminado) return 'Eliminado';
  if (usuario.baneado) return 'Baneado';
  if (!usuario.activo) return 'Inactivo';
  return 'Activo';
};

export const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_empresa', label: 'Propietario' },
  { value: 'jefe', label: 'Jefe' },
  { value: 'empleado', label: 'Empleado' },
];
