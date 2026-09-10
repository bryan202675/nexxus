// Logica de normalizacion/puntuacion de check-ins de bienestar, compartida entre
// WorkspaceCheckIn.tsx (vista del propio empleado) y las pantallas de admin/jefe
// (empresa-resumen, empresa-cuidado-equipo). Antes vivia duplicada -- ver historial
// de WorkspaceCheckIn.tsx y estresDeCheckIn() en empresa-resumen/index.tsx.
//
// Los campos reales de un check-in (energia, estres, calidadSueno, cargaLaboral,
// indicadoresRapidos, nota) viven dentro de la columna jsonb `checkins.datos`
// (ver apps/mobile/.../SupabaseCheckInRepository.ts); algunas filas antiguas los
// tienen como columnas planas o en snake_case, de ahi los fallbacks.

export type Energy = "bajo" | "medio" | "alto";
export type Stress = "bajo" | "moderado" | "alto" | "critico";
export type Severity = "ok" | "atencion" | "riesgo";

export const STRESS_LABELS: Record<Stress, string> = {
  bajo: "Bajo",
  moderado: "Moderado",
  alto: "Alto",
  critico: "Crítico",
};

export const ENERGY_LABELS: Record<Energy, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export type CheckInRow = {
  id: string;
  usuario_id?: string;
  created_at: string;
  datos?: Record<string, unknown> | null;
  energia?: unknown;
  balanceEmocional?: unknown;
  estres?: unknown;
  nivelEstres?: unknown;
  calidadSueno?: unknown;
  cargaLaboral?: unknown;
  indicadoresRapidos?: unknown;
  estado_animo?: unknown;
  nota?: unknown;
  nivel_estres?: unknown;
  calidad_sueno?: unknown;
  carga_laboral?: unknown;
  indicadores_rapidos?: unknown;
  [key: string]: unknown;
};

export type NormalizedCheckIn = {
  energy: Energy;
  mood: number;
  stress: Stress;
  sleep: number;
  workload: number;
  tags: string[];
  note: string;
};

export const STRESS_SCORE: Record<Stress, number> = { bajo: 1, moderado: 3, alto: 4, critico: 5 };

function nestedOrColumn(row: CheckInRow, key: keyof Omit<CheckInRow, "datos">) {
  const nested = row.datos?.[key as string];
  return nested !== undefined && nested !== null && nested !== "" ? nested : row[key];
}

function normalizeEnergy(value: unknown): Energy {
  const text = String(value || "").toLowerCase();
  return text === "alto" || text === "high" ? "alto" : text === "bajo" || text === "low" ? "bajo" : "medio";
}

function normalizeMood(value: unknown): number {
  const numeric = Number(value);
  if (numeric >= 1 && numeric <= 5) return Math.round(numeric);
  const text = String(value || "").toLowerCase();
  if (text.includes("excelente")) return 5;
  if (text === "bien" || text.includes("bueno")) return 4;
  if (text.includes("neutral")) return 3;
  if (text.includes("frustr") || text.includes("estres")) return 2;
  return 1;
}

function normalizeStress(value: unknown, numericValue: unknown): Stress {
  const text = String(value || "").toLowerCase();
  if (text.includes("crit")) return "critico";
  if (text.includes("alto") || text === "high") return "alto";
  if (text.includes("bajo") || text === "low") return "bajo";
  const numeric = Number(numericValue);
  return numeric >= 5 ? "critico" : numeric >= 4 ? "alto" : numeric === 1 ? "bajo" : "moderado";
}

function normalizeNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(5, Math.max(1, Math.round(numeric))) : fallback;
}

function normalizeTags(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function normalizeCheckIn(row: CheckInRow): NormalizedCheckIn {
  const rawStress = nestedOrColumn(row, "nivelEstres") ?? nestedOrColumn(row, "nivel_estres");
  const numericStress = nestedOrColumn(row, "estres");
  const rawMood = nestedOrColumn(row, "balanceEmocional") ?? row.estado_animo;
  return {
    energy: normalizeEnergy(nestedOrColumn(row, "energia")),
    mood: normalizeMood(rawMood),
    stress: normalizeStress(rawStress, numericStress),
    sleep: normalizeNumber(nestedOrColumn(row, "calidadSueno") ?? nestedOrColumn(row, "calidad_sueno"), 3),
    workload: normalizeNumber(nestedOrColumn(row, "cargaLaboral") ?? nestedOrColumn(row, "carga_laboral"), 3),
    tags: normalizeTags(nestedOrColumn(row, "indicadoresRapidos") ?? nestedOrColumn(row, "indicadores_rapidos")),
    note: String(nestedOrColumn(row, "nota") ?? row.nota ?? ""),
  };
}

export function calculatePulse(energy: Energy, sleep: number, mood: number, stress: Stress, workload: number) {
  const energyScore = energy === "alto" ? 5 : energy === "medio" ? 3 : 1;
  const stressScore = stress === "bajo" ? 5 : stress === "moderado" ? 3 : stress === "alto" ? 2 : 1;
  return Math.round(((energyScore + sleep + mood + stressScore + (6 - workload)) / 25) * 100);
}

export function getPulseState(pulse: number) {
  return pulse >= 75 ? "Estado Óptimo" : pulse >= 50 ? "Requiere Atención" : "Necesita Soporte";
}

export function getGuide(stress: Stress, workload: number) {
  if (stress === "critico") return "Nivel crítico detectado. Considera tomar un respiro o hablar con un líder.";
  if (workload >= 4) return "Carga elevada. Prioriza tareas esenciales y gestiona tu energía.";
  return "Tu pulso se mantiene equilibrado. Sigue así.";
}

export function calculateStreak(rows: Array<{ created_at: string }>) {
  if (!rows.length) return 0;
  let streak = 1;
  for (let index = 0; index < rows.length - 1; index += 1) {
    const current = new Date(rows[index].created_at);
    const previous = new Date(rows[index + 1].created_at);
    current.setHours(0, 0, 0, 0);
    previous.setHours(0, 0, 0, 0);
    const difference = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
    if (difference === 1) streak += 1;
    else if (difference === 0) continue;
    else break;
  }
  return streak;
}

// El nivel de estres de un check-in solo vive en el jsonb `datos` (no hay columna
// dedicada) -- version reducida de normalizeStress() usada por empresa-resumen para
// no alterar los numeros que ya muestra ese widget ("Prioridades").
export function estresDeCheckIn(c: CheckInRow): number | null {
  const raw = c.datos?.estres ?? c.datos?.nivelEstres ?? c.datos?.nivel_estres;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const texto = String(raw || "").toLowerCase();
  if (texto.includes("crit")) return 5;
  if (texto.includes("alto")) return 4;
  if (texto.includes("moderado")) return 3;
  if (texto.includes("bajo")) return 1;
  return null;
}

export function severityFromCheckIn(normalized: NormalizedCheckIn): Severity {
  if (normalized.stress === "critico" || normalized.workload >= 5) return "riesgo";
  if (normalized.stress === "alto" || normalized.workload >= 4 || normalized.energy === "bajo") return "atencion";
  return "ok";
}

export type TeamCheckInSummary = {
  usuarioId: string;
  nombre: string;
  departamento: string;
  checkIn: CheckInRow;
  normalized: NormalizedCheckIn;
  pulse: number;
  pulseState: string;
  severity: Severity;
  streak: number;
};

type Empleado = {
  id: string;
  nombre?: string;
  nombre_completo?: string;
  usuario_interno?: string;
  correo?: string;
  email?: string;
  departamento?: string;
  puesto?: string;
  cargo?: string;
  rol?: string;
  activo?: boolean;
  estado_activo?: boolean;
  [key: string]: unknown;
};

function capitalizarTexto(str: string): string {
  if (!str) return "";
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function resolverNombreEmpleado(empleado?: Empleado, checkIn?: CheckInRow): string {
  if (empleado) {
    if (empleado.nombre && empleado.nombre.trim() && empleado.nombre.trim().toLowerCase() !== "empleado") {
      return empleado.nombre.trim();
    }
    if (empleado.nombre_completo && empleado.nombre_completo.trim()) {
      return empleado.nombre_completo.trim();
    }
    if (empleado.usuario_interno && empleado.usuario_interno.trim()) {
      return capitalizarTexto(empleado.usuario_interno.replace(/[._-]/g, " "));
    }
    if (empleado.correo && empleado.correo.trim()) {
      const parteLocal = empleado.correo.split("@")[0];
      return capitalizarTexto(parteLocal.replace(/[._-]/g, " "));
    }
    if (empleado.email && empleado.email.trim()) {
      const parteLocal = empleado.email.split("@")[0];
      return capitalizarTexto(parteLocal.replace(/[._-]/g, " "));
    }
  }
  if (checkIn) {
    const d = (checkIn.datos || {}) as Record<string, unknown>;
    const posible =
      (d.nombre as string) ||
      (d.usuarioNombre as string) ||
      (d.usuario_nombre as string) ||
      (d.nombre_completo as string) ||
      (d.autor_nombre as string) ||
      (checkIn.nombre as string) ||
      (checkIn.usuario_nombre as string) ||
      (checkIn.usuarioNombre as string);
    if (posible && typeof posible === "string" && posible.trim() && posible.trim().toLowerCase() !== "empleado") {
      return posible.trim();
    }
    const correo = (d.correo as string) || (d.email as string) || (checkIn.correo as string) || (checkIn.email as string);
    if (correo && typeof correo === "string" && correo.trim()) {
      const parteLocal = correo.split("@")[0];
      return capitalizarTexto(parteLocal.replace(/[._-]/g, " "));
    }
  }
  return empleado?.nombre || "Colaborador";
}

function resolverDepartamento(empleado?: Empleado, checkIn?: CheckInRow): string {
  if (empleado) {
    if (empleado.departamento && String(empleado.departamento).trim()) return String(empleado.departamento).trim();
    if (empleado.puesto && String(empleado.puesto).trim()) return String(empleado.puesto).trim();
    if (empleado.cargo && String(empleado.cargo).trim()) return String(empleado.cargo).trim();
    if (empleado.rol && empleado.rol !== "empleado") return capitalizarTexto(String(empleado.rol).replace(/_/g, " "));
  }
  if (checkIn) {
    const d = (checkIn.datos || {}) as Record<string, unknown>;
    const dep = d.departamento || d.puesto || d.cargo || checkIn.departamento;
    if (dep && typeof dep === "string" && dep.trim()) return dep.trim();
  }
  return "General";
}

// Una fila por empleado (su check-in mas reciente), ordenados del mas critico al
// mas estable -- insumo directo de la tabla "atencion inmediata" de Cuidado del
// Equipo y de la deteccion de alertas de bienestar en el timbre/sidebar.
export function summarizeTeamCheckIns(checkIns: CheckInRow[], empleados: Empleado[]): TeamCheckInSummary[] {
  const porUsuario = new Map<string, CheckInRow[]>();
  for (const c of checkIns) {
    const uid =
      (c.usuario_id as string) ||
      (c.usuarioId as string) ||
      (c.userId as string) ||
      ((c.datos as any)?.usuario_id as string) ||
      ((c.datos as any)?.usuarioId as string) ||
      ((c.datos as any)?.userId as string);
    if (!uid) continue;
    const lista = porUsuario.get(uid) || [];
    lista.push(c);
    porUsuario.set(uid, lista);
  }

  const empleadosPorId = new Map<string, Empleado>();
  for (const e of empleados) {
    if (e.id) empleadosPorId.set(e.id, e);
    if ((e as any).usuario_id) empleadosPorId.set((e as any).usuario_id, e);
    if (e.usuario_interno) empleadosPorId.set(e.usuario_interno, e);
    if (e.correo) empleadosPorId.set(e.correo, e);
  }

  const resumenes: TeamCheckInSummary[] = [];
  for (const [usuarioId, lista] of porUsuario) {
    const ordenadas = [...lista].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const ultimo = ordenadas[0];
    if (!ultimo) continue;
    const normalized = normalizeCheckIn(ultimo);
    const pulse = calculatePulse(normalized.energy, normalized.sleep, normalized.mood, normalized.stress, normalized.workload);
    const empleado = empleadosPorId.get(usuarioId);
    resumenes.push({
      usuarioId,
      nombre: resolverNombreEmpleado(empleado, ultimo),
      departamento: resolverDepartamento(empleado, ultimo),
      checkIn: ultimo,
      normalized,
      pulse,
      pulseState: getPulseState(pulse),
      severity: severityFromCheckIn(normalized),
      streak: calculateStreak(ordenadas),
    });
  }

  const severityRank: Record<Severity, number> = { riesgo: 0, atencion: 1, ok: 2 };
  return resumenes.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.pulse - b.pulse);
}

export type TeamCareStats = {
  avgPulse: number;
  atRiskCount: number;
  atRiskPercent: number;
  avgWorkload: number;
  avgStress: number;
};

export function teamCareStats(summaries: TeamCheckInSummary[]): TeamCareStats {
  if (summaries.length === 0) {
    return { avgPulse: 0, atRiskCount: 0, atRiskPercent: 0, avgWorkload: 0, avgStress: 0 };
  }
  const avgPulse = Math.round(summaries.reduce((sum, s) => sum + s.pulse, 0) / summaries.length);
  const atRiskCount = summaries.filter((s) => s.severity === "riesgo").length;
  const avgWorkload = summaries.reduce((sum, s) => sum + s.normalized.workload, 0) / summaries.length;
  const avgStress = summaries.reduce((sum, s) => sum + STRESS_SCORE[s.normalized.stress], 0) / summaries.length;
  return {
    avgPulse,
    atRiskCount,
    atRiskPercent: Math.round((atRiskCount / summaries.length) * 100),
    avgWorkload: Math.round(avgWorkload * 10) / 10,
    avgStress: Math.round(avgStress * 10) / 10,
  };
}
