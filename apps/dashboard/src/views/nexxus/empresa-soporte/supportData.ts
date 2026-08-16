export type SupportCategory = "acceso" | "configuracion" | "tecnico" | "facturacion" | "otro";
export type SupportPriority = "baja" | "media" | "alta" | "urgente";

export const SUPPORT_CATEGORIES: Array<{
  id: SupportCategory;
  label: string;
  description: string;
  ticketCategory: "tecnico" | "incidente" | "otro";
}> = [
  { id: "acceso", label: "Acceso y seguridad", description: "Credenciales, permisos o acceso de administradores.", ticketCategory: "tecnico" },
  { id: "configuracion", label: "Configuración de empresa", description: "Usuarios, estructura, datos o puesta en marcha.", ticketCategory: "tecnico" },
  { id: "tecnico", label: "Incidencia técnica", description: "Errores, fallos de sincronización o comportamiento inesperado.", ticketCategory: "incidente" },
  { id: "facturacion", label: "Facturación y plan", description: "Suscripción, pagos, plan contratado o cotizaciones.", ticketCategory: "otro" },
  { id: "otro", label: "Otra consulta", description: "Requerimientos generales para el equipo Nexxus.", ticketCategory: "otro" },
];

export const SUPPORT_PRIORITIES: Array<{ id: SupportPriority; label: string; classes: string }> = [
  { id: "baja", label: "Baja", classes: "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  { id: "media", label: "Media", classes: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  { id: "alta", label: "Alta", classes: "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300" },
  { id: "urgente", label: "Urgente", classes: "border-red-500 bg-red-500/10 text-red-600 dark:text-red-300" },
];

export const STATUS_CLASSES: Record<string, string> = {
  abierto: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  en_progreso: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  resuelto: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  cerrado: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export function formatSupportDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("es-SV", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function categoryLabel(category: string) {
  return SUPPORT_CATEGORIES.find((item) => item.ticketCategory === category)?.label || category.replace(/_/g, " ");
}
