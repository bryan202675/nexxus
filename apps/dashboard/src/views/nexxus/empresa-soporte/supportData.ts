import {
  MdOutlineSecurity,
  MdOutlineSettings,
  MdOutlineBugReport,
  MdOutlineCreditCard,
  MdOutlineHelpOutline,
} from "react-icons/md";

export type SupportCategory = "acceso" | "configuracion" | "tecnico" | "facturacion" | "otro";
export type SupportPriority = "baja" | "media" | "alta" | "urgente";

export const SUPPORT_CATEGORIES: Array<{
  id: SupportCategory;
  label: string;
  description: string;
  icon: any;
  ticketCategory: "tecnico" | "incidente" | "otro";
}> = [
  {
    id: "acceso",
    label: "Acceso y seguridad",
    description: "Credenciales, permisos o acceso de administradores.",
    icon: MdOutlineSecurity,
    ticketCategory: "tecnico",
  },
  {
    id: "configuracion",
    label: "Configuración de empresa",
    description: "Usuarios, estructura, datos o puesta en marcha.",
    icon: MdOutlineSettings,
    ticketCategory: "tecnico",
  },
  {
    id: "tecnico",
    label: "Incidencia técnica",
    description: "Errores, fallos de sincronización o comportamiento inesperado.",
    icon: MdOutlineBugReport,
    ticketCategory: "incidente",
  },
  {
    id: "facturacion",
    label: "Facturación y plan",
    description: "Suscripción, pagos, plan contratado o cotizaciones.",
    icon: MdOutlineCreditCard,
    ticketCategory: "otro",
  },
  {
    id: "otro",
    label: "Otra consulta",
    description: "Requerimientos generales para el equipo Nexxus.",
    icon: MdOutlineHelpOutline,
    ticketCategory: "otro",
  },
];

export const SUPPORT_PRIORITIES: Array<{ id: SupportPriority; label: string; classes: string; dot: string }> = [
  {
    id: "baja",
    label: "Baja",
    classes: "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    id: "media",
    label: "Media",
    classes: "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    id: "alta",
    label: "Alta",
    classes: "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  {
    id: "urgente",
    label: "Urgente",
    classes: "border-rose-500 bg-rose-500/10 text-rose-600 font-bold dark:text-rose-300",
    dot: "bg-rose-500",
  },
];

export const STATUS_CLASSES: Record<string, { label: string; cls: string; dot: string }> = {
  abierto: {
    label: "Abierto",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  en_progreso: {
    label: "En Progreso",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  resuelto: {
    label: "Resuelto",
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  cerrado: {
    label: "Cerrado",
    cls: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    dot: "bg-gray-400",
  },
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
