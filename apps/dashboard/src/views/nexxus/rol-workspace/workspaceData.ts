import {
  MdOutlineAccessTime, MdOutlineAssignment, MdOutlineCalendarMonth,
  MdOutlineDescription, MdOutlineEmojiEvents, MdOutlineEventAvailable,
  MdOutlineFeedback, MdOutlineFolderShared, MdOutlineGroups, MdOutlineInbox,
  MdOutlineInventory2, MdOutlineLocalLibrary, MdOutlineMonetizationOn, MdOutlineNotifications,
  MdOutlinePendingActions, MdOutlinePsychology, MdOutlineRequestPage, MdOutlineTrackChanges,
  MdOutlineWorkHistory,
} from "react-icons/md";

export const MODULES = {
  // prioridad va capitalizada ("Alta", no "alta") -- es la convención real de tareas.prioridad en
  // todo el resto del código (empresa-plantilla/index.tsx del dashboard y prácticamente todo
  // mobile: CentroTareas, ContextoUsuario, DashboardAdmin, ChatIAAdmin, SupabaseTaskRepository).
  // Con minúsculas, una tarea creada aquí como "urgente" no aparecía en ningún filtro/KPI/resumen
  // de IA que compara contra "Urgente".
  tareas: { title: "Mis tareas", table: "tareas", icon: MdOutlineAssignment, filter: "asignado_a", columns: ["titulo", "estado", "prioridad", "fecha_limite", "created_at"], form: [{ key: "titulo", label: "Título", required: true }, { key: "descripcion", label: "Descripción", type: "textarea" }, { key: "prioridad", label: "Prioridad", type: "select", options: ["Baja", "Media", "Alta", "Urgente"] }, { key: "fecha_limite", label: "Fecha límite", type: "date" }] },
  asistencia: { title: "Control de asistencia", table: "asistencias", icon: MdOutlineAccessTime, filter: "usuario_id", columns: ["tipo", "fecha_jornada", "entrada", "salida", "horas_trabajadas", "horas_extra", "tarde"], form: [] },
  checkins: { title: "Check-in y bienestar", table: "checkins", icon: MdOutlinePsychology, filter: "usuario_id", columns: ["estado_animo", "nota", "created_at"], form: [{ key: "estado_animo", label: "¿Cómo te sientes?", type: "select", options: ["excelente", "bien", "neutral", "estresado", "agotado"], required: true }, { key: "nota", label: "Nota", type: "textarea" }] },
  solicitudes: { title: "Solicitudes de ausencia", table: "solicitudes_ausencia", icon: MdOutlineRequestPage, filter: "usuario_id", columns: ["tipo", "fecha_inicio", "fecha_fin", "estado"], form: [{ key: "tipo", label: "Tipo", required: true }, { key: "fecha_inicio", label: "Desde", type: "date", required: true }, { key: "fecha_fin", label: "Hasta", type: "date", required: true }, { key: "motivo", label: "Motivo", type: "textarea" }] },
  internas: { title: "Solicitudes internas", table: "solicitudes_internas", icon: MdOutlinePendingActions, filter: "usuario_id", columns: ["tipo", "detalle", "estado", "created_at"], form: [{ key: "tipo", label: "Tipo", required: true }, { key: "detalle", label: "Detalle", type: "textarea", required: true }] },
  documentos: { title: "Centro de documentos", table: "documentos", icon: MdOutlineDescription, columns: ["titulo", "categoria", "leido", "created_at"], form: [] },
  calendario: { title: "Calendario laboral", table: "calendario_empresarial", icon: MdOutlineCalendarMonth, columns: ["titulo", "tipo", "fecha_inicio", "fecha_fin"], form: [] },
  objetivos: { title: "Mis objetivos y OKR", table: "objetivos", icon: MdOutlineTrackChanges, filter: "usuario_id", select: "*, objetivo_resultados_clave(*)", columns: ["titulo", "ciclo", "estado", "updated_at"], form: [{ key: "titulo", label: "Objetivo", required: true }, { key: "descripcion", label: "Descripción", type: "textarea" }, { key: "ciclo", label: "Ciclo", required: true }] },
  logros: { title: "Mis logros", table: "logros_usuario", icon: MdOutlineEmojiEvents, filter: "usuario_id", order: "fecha_obtenida", columns: ["codigo_logro", "fecha_obtenida"], form: [] },
  aprendizaje: { title: "Centro de aprendizaje", table: "cursos", icon: MdOutlineLocalLibrary, columns: ["titulo", "descripcion", "created_at"], form: [] },
  bandeja: { title: "Bandeja unificada", table: "inbox_unificado", icon: MdOutlineInbox, filter: "usuario_id", columns: ["origen", "contenido", "created_at"], form: [] },
  notificaciones: { title: "Notificaciones", table: "notificaciones", icon: MdOutlineNotifications, filter: "usuario_id", columns: ["titulo", "cuerpo", "leida", "created_at"], form: [] },
  anuncios: { title: "Comunicación y anuncios", table: "anuncios", icon: MdOutlineFolderShared, columns: ["titulo", "contenido", "created_at"], form: [{ key: "titulo", label: "Título", required: true }, { key: "contenido", label: "Mensaje", type: "textarea", required: true }] },
  activos: { title: "Mis activos", table: "inventario_activos", icon: MdOutlineInventory2, filter: "asignado_a", columns: ["nombre", "categoria", "estado", "created_at"], form: [] },
  salario: { title: "Mi salario", table: "payments", icon: MdOutlineMonetizationOn, filter: "usuario_id", columns: ["monto", "moneda", "metodo", "estado", "referencia_externa", "created_at"], form: [] },
  citas: { title: "Reserva de sesión", table: "citas", icon: MdOutlineEventAvailable, filter: "usuario_id", columns: ["especialista", "fecha", "estado", "created_at"], form: [{ key: "especialista", label: "Especialista", required: true }, { key: "fecha", label: "Fecha", type: "datetime-local", required: true }, { key: "especialidad", label: "Especialidad" }, { key: "horario", label: "Horario" }] },
  feedback: { title: "Centro de apoyo", table: "feedbacks", icon: MdOutlineFeedback, filter: "usuario_id", columns: ["categoria", "contenido", "created_at"], form: [{ key: "categoria", label: "Categoría", required: true }, { key: "contenido", label: "Mensaje", type: "textarea", required: true }] },
  tickets: { title: "Tickets de soporte", table: "tickets", icon: MdOutlineFeedback, filter: "creado_por", columns: ["titulo", "categoria", "prioridad", "estado", "created_at"], form: [{ key: "titulo", label: "Título", required: true }, { key: "descripcion", label: "Descripción", type: "textarea", required: true }, { key: "categoria", label: "Categoría", type: "select", options: ["tecnico", "incidente", "otro"], required: true }, { key: "prioridad", label: "Prioridad", type: "select", options: ["baja", "media", "alta", "urgente"], required: true }] },
  historial: { title: "Historial de actividad", table: "audit_logs", icon: MdOutlineWorkHistory, filter: "actor_id", columns: ["accion", "modulo", "created_at"], form: [] },
  equipo: { title: "Equipo directo", table: "usuarios", icon: MdOutlineGroups, columns: ["nombre", "correo", "rol", "estado_trabajo"], form: [] },
};

export function readField(row, key) {
  if (key === "contenido" && row.contenido && typeof row.contenido === "object") return row.contenido.titulo || row.contenido.mensaje || JSON.stringify(row.contenido);
  if (key === "datos" && row.datos) return JSON.stringify(row.datos);
  if ((row[key] === undefined || row[key] === null || row[key] === "") && row.datos && row.datos[key] !== undefined) return row.datos[key];
  return row[key];
}

export function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });
  return String(value).replace(/_/g, " ");
}
