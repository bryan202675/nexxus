import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineToday,
  MdOutlineDateRange,
  MdOutlinePeopleAlt,
  MdOutlineEvent,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineAdd,
  MdOutlineAccessTime,
  MdOutlineCalendarMonth,
  MdOutlineFormatListBulleted,
  MdOutlineDelete,
  MdOutlineVideoCameraFront,
  MdOutlineLocationOn,
  MdOutlineClose,
  MdOutlineCheck,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { subscribeCalendario, subscribeEmpleados } from "services/adminRepository";
import { formatoFecha, formatoFechaHora } from "services/saFormat";

function mapEventoRow(row: any) {
  return {
    id: row.id,
    titulo: row.titulo || "Evento sin título",
    descripcion: row.descripcion || "",
    tipo: row.tipo || "reunion",
    inicio: row.fecha_inicio,
    fin: row.fecha_fin,
    ubicacion: row.datos?.ubicacion || row.ubicacion || "",
    link: row.datos?.link || row.link || "",
    empleadoIds: row.datos?.empleadoIds || [],
    empleadoNombres: row.datos?.empleadoNombres || [],
    datosRaw: row,
  };
}

const TIPOS = [
  {
    value: "reunion",
    label: "Reunión",
    badge: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
    barBg: "bg-blue-500",
  },
  {
    value: "capacitacion",
    label: "Capacitación",
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    dot: "bg-purple-500",
    barBg: "bg-purple-500",
  },
  {
    value: "vacaciones",
    label: "Vacaciones / Ausencia",
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
    barBg: "bg-emerald-500",
  },
  {
    value: "corporativo",
    label: "Corporativo / All-Hands",
    badge: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-400/20 dark:text-indigo-300",
    dot: "bg-indigo-500",
    barBg: "bg-indigo-500",
  },
  {
    value: "recordatorio",
    label: "Recordatorio / Cierre",
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
    barBg: "bg-amber-500",
  },
  {
    value: "turno",
    label: "Turno Especial",
    badge: "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300",
    dot: "bg-cyan-500",
    barBg: "bg-cyan-500",
  },
];

const tipoInfo = (tipo: string) =>
  TIPOS.find((t) => t.value === (tipo || "").toLowerCase()) || {
    value: "general",
    label: tipo || "Evento",
    badge: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    dot: "bg-gray-400",
    barBg: "bg-gray-400",
  };

const toDate = (value: any) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toDatetimeLocal = (date: Date | null) => {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mismodia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const inicioSemana = (fecha: Date) => {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 domingo .. 6 sabado
  const diff = dia === 0 ? -6 : 1 - dia; // llevar a lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const construirGrillaMes = (mesRef: Date, eventos: any[]) => {
  const primerDiaMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const inicioGrilla = inicioSemana(primerDiaMes);
  const celdas = [];
  for (let i = 0; i < 42; i += 1) {
    const fecha = new Date(inicioGrilla);
    fecha.setDate(inicioGrilla.getDate() + i);
    const eventosDia = eventos
      .filter((e) => e.inicioFecha && mismodia(e.inicioFecha, fecha))
      .sort((a, b) => (a.inicioFecha?.getTime() || 0) - (b.inicioFecha?.getTime() || 0));
    celdas.push({
      fecha,
      enMesActual: fecha.getMonth() === mesRef.getMonth(),
      eventos: eventosDia,
    });
  }
  return celdas;
};

const FORM_VACIO = {
  titulo: "",
  descripcion: "",
  tipo: "reunion",
  inicio: "",
  fin: "",
  ubicacion: "",
  link: "",
  empleadoIds: [] as string[],
};

export default function CalendarioEmpresarial() {
  const { user, empresaId } = useAuth();

  const [eventos, setEventos] = useState<any[] | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [vista, setVista] = useState<"mes" | "agenda">("mes");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mesRef, setMesRef] = useState(() => new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con Supabase.");
    const unsubs = [
      subscribeCalendario(empresaId, (docs) => setEventos(docs.map((d) => mapEventoRow(d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    empleados.forEach((e) => map.set(e.id, e));
    return map;
  }, [empleados]);

  const eventosOrdenados = useMemo(() => {
    return [...(eventos || [])]
      .map((e) => ({ ...e, inicioFecha: toDate(e.inicio), finFecha: toDate(e.fin) }))
      .filter((e) => {
        if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
        return true;
      })
      .sort((a, b) => (a.inicioFecha?.getTime() || 0) - (b.inicioFecha?.getTime() || 0));
  }, [eventos, filtroTipo]);

  const grillaMes = useMemo(
    () => construirGrillaMes(mesRef, eventosOrdenados),
    [mesRef, eventosOrdenados]
  );

  const metricas = useMemo(() => {
    const lista = eventos || [];
    const hoy = new Date();
    const inicioSem = inicioSemana(hoy);
    const finSem = new Date(inicioSem);
    finSem.setDate(finSem.getDate() + 7);

    let eventosHoy = 0;
    let eventosSemana = 0;
    const empleadosSet = new Set<string>();

    lista.forEach((e) => {
      const inicio = toDate(e.inicio);
      if (inicio) {
        if (mismodia(inicio, hoy)) eventosHoy += 1;
        if (inicio >= inicioSem && inicio < finSem) eventosSemana += 1;
      }
      (e.empleadoIds || []).forEach((id: string) => empleadosSet.add(id));
    });

    return { eventosHoy, eventosSemana, empleadosAsignados: empleadosSet.size, total: lista.length };
  }, [eventos]);

  // Conteo por tipo de evento
  const tipoCounts = useMemo(() => {
    const lista = eventos || [];
    const counts: Record<string, number> = {
      reunion: 0,
      capacitacion: 0,
      vacaciones: 0,
      corporativo: 0,
      recordatorio: 0,
      turno: 0,
    };
    lista.forEach((e) => {
      const t = (e.tipo || "").toLowerCase();
      if (counts[t] !== undefined) counts[t]++;
      else if (t.includes("reun")) counts.reunion++;
      else if (t.includes("cap")) counts.capacitacion++;
      else if (t.includes("vaca") || t.includes("ausen")) counts.vacaciones++;
      else if (t.includes("corp") || t.includes("hand")) counts.corporativo++;
      else if (t.includes("rec") || t.includes("cierr")) counts.recordatorio++;
      else if (t.includes("turn")) counts.turno++;
    });
    return counts;
  }, [eventos]);

  const resetForm = (fechaDefecto?: Date) => {
    const start = fechaDefecto || new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setForm({
      ...FORM_VACIO,
      inicio: toDatetimeLocal(start),
      fin: toDatetimeLocal(end),
    });
    setEditandoId(null);
  };

  const seleccionarEvento = (evento: any) => {
    setEditandoId(evento.id);
    setForm({
      titulo: evento.titulo || "",
      descripcion: evento.descripcion || "",
      tipo: evento.tipo || "reunion",
      inicio: toDatetimeLocal(toDate(evento.inicio)),
      fin: toDatetimeLocal(toDate(evento.fin)),
      ubicacion: evento.ubicacion || "",
      link: evento.link || "",
      empleadoIds: evento.empleadoIds || [],
    });
    setShowModal(true);
  };

  const toggleEmpleado = (id: string) => {
    setForm((f) => {
      const seleccionados = new Set(f.empleadoIds);
      if (seleccionados.has(id)) seleccionados.delete(id);
      else seleccionados.add(id);
      return { ...f, empleadoIds: [...seleccionados] };
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!empresaId || !user) return;
    if (!form.titulo.trim() || !form.inicio || !form.fin) {
      setError("Completa título, fecha de inicio y finalización del evento.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const empleadoNombres = form.empleadoIds
        .map((id) => empleados.find((emp) => emp.id === id)?.nombre)
        .filter(Boolean);

      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tipo: form.tipo,
        fecha_inicio: new Date(form.inicio).toISOString(),
        fecha_fin: new Date(form.fin).toISOString(),
        datos: {
          empleadoIds: form.empleadoIds,
          empleadoNombres,
          ubicacion: form.ubicacion.trim() || null,
          link: form.link.trim() || null,
        },
      };

      if (editandoId) {
        const { error: updateError } = await supabase.from("calendario_empresarial").update(payload).eq("id", editandoId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("calendario_empresarial").insert({
          ...payload,
          empresa_id: empresaId,
        });
        if (insertError) throw insertError;
      }
      resetForm();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el evento.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!editandoId) return;
    if (!window.confirm("¿Eliminar este evento de la agenda? Esta acción no se puede deshacer.")) return;
    setGuardando(true);
    setError("");
    try {
      const { error } = await supabase.from("calendario_empresarial").delete().eq("id", editandoId);
      if (error) throw error;
      resetForm();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el evento.");
    } finally {
      setGuardando(false);
    }
  };

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          No se pudo determinar la empresa asociada a este usuario.
        </p>
      </div>
    );
  }

  const cargando = eventos === null;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header & Acciones Rápidas */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Calendario & Agenda Corporativa
            </h2>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              {metricas.total} eventos agendados
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
            Planificación de reuniones, capacitaciones, all-hands corporativos, feriados y vacaciones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vista */}
          <div className="flex items-center rounded-xl bg-gray-100/80 p-1 dark:bg-charcoal">
            <button
              type="button"
              onClick={() => setVista("mes")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                vista === "mes"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
              }`}
            >
              <MdOutlineCalendarMonth className="h-4 w-4" />
              <span>Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setVista("agenda")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                vista === "agenda"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
              }`}
            >
              <MdOutlineFormatListBulleted className="h-4 w-4" />
              <span>Agenda</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
          >
            <MdOutlineAdd className="h-4 w-4" />
            <span>Crear Evento</span>
          </button>
        </div>
      </div>

      {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
      {(() => {
        const total = Math.max(metricas.total, 1);
        const hayEventos = metricas.total > 0;
        const reunionPct = Math.round((tipoCounts.reunion / total) * 100);
        const capPct = Math.round((tipoCounts.capacitacion / total) * 100);
        const vacPct = Math.round((tipoCounts.vacaciones / total) * 100);
        const corpPct = Math.round((tipoCounts.corporativo / total) * 100);
        const recPct = Math.round((tipoCounts.recordatorio / total) * 100);
        const turnoPct = Math.round((tipoCounts.turno / total) * 100);

        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Hero Card Principal (7 cols) */}
            <div className="lg:col-span-7">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-navy-700 dark:text-white">
                        Planificación & Agenda Corporativa
                      </span>
                      <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                        · Actividad Empresarial
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        metricas.eventosHoy > 0
                          ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                          : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                      }`}
                    >
                      {metricas.eventosHoy > 0 ? `${metricas.eventosHoy} citas hoy` : "Sin eventos hoy"}
                    </span>
                  </div>

                  {/* Número Principal */}
                  <div className="mt-4">
                    {metricas.eventosSemana > 0 ? (
                      <div>
                        <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-700 dark:text-white truncate">
                          {metricas.eventosSemana}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <span>Eventos programados para los próximos 7 días</span>
                          <span className="font-normal text-gray-400 dark:text-white/40">
                            · {metricas.empleadosAsignados} colaboradores convocados
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                          Sin eventos esta semana
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                          Agenda despejada para los próximos 7 días. Puedes crear nuevas sesiones.
                        </p>
                      </div>
                    )}

                    <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                      {metricas.total} eventos totales en el sistema · {metricas.eventosHoy} agendados para hoy
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {/* Barra de Distribución Proporcional */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    {hayEventos ? (
                      <>
                        <div
                          style={{ width: `${Math.max(reunionPct, 4)}%` }}
                          className="h-full bg-blue-500 transition-all duration-500"
                          title={`Reuniones: ${tipoCounts.reunion}`}
                        />
                        <div
                          style={{ width: `${capPct}%` }}
                          className="h-full bg-purple-500 transition-all duration-500"
                          title={`Capacitaciones: ${tipoCounts.capacitacion}`}
                        />
                        <div
                          style={{ width: `${vacPct}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500"
                          title={`Vacaciones / Ausencias: ${tipoCounts.vacaciones}`}
                        />
                        <div
                          style={{ width: `${corpPct}%` }}
                          className="h-full bg-indigo-500 transition-all duration-500"
                          title={`Corporativo: ${tipoCounts.corporativo}`}
                        />
                        <div
                          style={{ width: `${recPct}%` }}
                          className="h-full bg-amber-500 transition-all duration-500"
                          title={`Recordatorios: ${tipoCounts.recordatorio}`}
                        />
                        <div
                          style={{ width: `${turnoPct}%` }}
                          className="h-full bg-cyan-500 transition-all duration-500"
                          title={`Turnos Especiales: ${tipoCounts.turno}`}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-gray-200/50 dark:bg-white/5" />
                    )}
                  </div>

                  {/* Leyenda con Métricas */}
                  {hayEventos ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {tipoCounts.reunion}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Reuniones ({reunionPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {tipoCounts.capacitacion}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Capacitaciones ({capPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {tipoCounts.vacaciones}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Ausencias ({vacPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {tipoCounts.corporativo}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Corporativo ({corpPct}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
                      Sin eventos registrados en el calendario
                    </p>
                  )}
                </div>
              </NexxusCard>
            </div>

            {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Card 1: Eventos Hoy */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Eventos para Hoy
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      metricas.eventosHoy > 0
                        ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                    }`}
                  >
                    {metricas.eventosHoy > 0 ? "Jornada activa" : "Sin citas hoy"}
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.eventosHoy > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                      {metricas.eventosHoy} <span className="text-xs font-medium text-gray-400">citas programadas</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Sin compromisos en agenda hoy
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Reuniones, llamadas y capacitaciones para la jornada en curso.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 2: Colaboradores Convocados */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Colaboradores Convocados
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      metricas.empleadosAsignados > 0
                        ? "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40"
                    }`}
                  >
                    {metricas.empleadosAsignados > 0 ? "Participación activa" : "Sin convocatorias"}
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.empleadosAsignados > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                      {metricas.empleadosAsignados} <span className="text-xs font-medium text-gray-400">integrantes</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400 dark:text-white/50">
                      Sin colaboradores convocados
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Equipo convocado a sesiones de trabajo y eventos.
                  </p>
                </div>
              </NexxusCard>

              {/* Card 3: Total Agendados */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Total Agendados
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                    Historial en sistema
                  </span>
                </div>
                <div className="mt-3">
                  {metricas.total > 0 ? (
                    <p className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                      {metricas.total} <span className="text-xs font-medium text-gray-400">eventos</span>
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400 dark:text-white/50">
                      Sin eventos registrados
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-white/40">
                    Historial completo de eventos corporativos pasados y futuros.
                  </p>
                </div>
              </NexxusCard>
            </div>
          </div>
        );
      })()}

      {/* Tarjeta de Calendario Principal */}
      <NexxusCard extra="p-5 sm:p-6 flex flex-col gap-5" delay={100}>
        {/* Controles de Navegación del Mes & Filtros */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <h4 className="text-xl font-bold capitalize tracking-tight text-navy-700 dark:text-white">
              {NOMBRES_MES[mesRef.getMonth()]} {mesRef.getFullYear()}
            </h4>
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/60 p-1 dark:border-white/10 dark:bg-charcoal">
              <button
                type="button"
                onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white active:scale-95 dark:text-white/70 dark:hover:bg-white/10"
                title="Mes anterior"
              >
                <MdChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMesRef(new Date())}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-navy-700 transition hover:bg-white active:scale-95 dark:text-white dark:hover:bg-white/10"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setMesRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white active:scale-95 dark:text-white/70 dark:hover:bg-white/10"
                title="Mes siguiente"
              >
                <MdChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Chips de Filtro por Categoría */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-charcoal">
            <button
              type="button"
              onClick={() => setFiltroTipo("todos")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroTipo === "todos"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Todos</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroTipo === "todos"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {metricas.total}
              </span>
            </button>
            {TIPOS.map((t) => {
              const count = tipoCounts[t.value] || 0;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFiltroTipo(t.value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    filtroTipo === t.value
                      ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                      : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
                  }`}
                >
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        filtroTipo === t.value
                          ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                          : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {cargando ? (
          <div className="flex h-72 w-full flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Cargando calendario...
            </p>
          </div>
        ) : vista === "mes" ? (
          /* ========================================================================= */
          /* VISTA GRILLA MENSUAL */
          /* ========================================================================= */
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm dark:border-white/5 dark:bg-white/5">
            {/* Cabecera de días */}
            <div className="grid grid-cols-7 gap-px border-b border-gray-100 bg-gray-50/80 dark:border-white/10 dark:bg-charcoal">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="p-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas de la grilla */}
            <div className="grid grid-cols-7 gap-px bg-gray-200/80 dark:bg-white/5">
              {grillaMes.map((celda) => {
                const hoy = mismodia(celda.fecha, new Date());

                return (
                  <div
                    key={celda.fecha.toISOString()}
                    className={`group relative min-h-[115px] bg-white p-2 transition hover:bg-brand-50/20 dark:bg-charcoal dark:hover:bg-white/[0.02] ${
                      celda.enMesActual ? "" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                          hoy
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/30 dark:bg-brand-400"
                            : "text-navy-700 dark:text-white group-hover:text-brand-500"
                        }`}
                      >
                        {celda.fecha.getDate()}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          resetForm(celda.fecha);
                          setShowModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/10 transition"
                        title="Agregar evento en esta fecha"
                      >
                        <MdOutlineAdd size={14} />
                      </button>
                    </div>

                    <div className="mt-1.5 flex flex-col gap-1">
                      {celda.eventos.slice(0, 3).map((evento) => {
                        const info = tipoInfo(evento.tipo);
                        return (
                          <button
                            key={evento.id}
                            type="button"
                            onClick={() => seleccionarEvento(evento)}
                            title={`${evento.titulo} · ${formatoFechaHora(evento.inicioFecha)}`}
                            className={`flex w-full items-center gap-1.5 truncate rounded-lg px-2 py-0.5 text-left text-[11px] font-semibold transition hover:brightness-95 ${info.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${info.dot}`} />
                            <span className="truncate">{evento.titulo}</span>
                          </button>
                        );
                      })}
                      {celda.eventos.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setDiaSeleccionado(celda)}
                          className="w-full truncate rounded px-1.5 py-0.5 text-left text-[10.5px] font-bold text-gray-500 hover:text-brand-500 hover:underline dark:text-white/50"
                        >
                          +{celda.eventos.length - 3} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VISTA AGENDA / LISTA */
          /* ========================================================================= */
          <div className="flex flex-col gap-3">
            {eventosOrdenados.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
                <MdOutlineEvent className="h-10 w-10 text-gray-400 dark:text-white/40" />
                <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                  No hay eventos programados
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                  Agrega tu primer evento con el botón 'Crear Evento'.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-white/5 dark:border-white/5">
                {eventosOrdenados.map((evento) => {
                  const info = tipoInfo(evento.tipo);
                  return (
                    <div
                      key={evento.id}
                      className="flex flex-col justify-between gap-3 p-4 transition hover:bg-gray-50/70 sm:flex-row sm:items-center dark:hover:bg-white/[0.02]"
                    >
                      <button
                        type="button"
                        onClick={() => seleccionarEvento(evento)}
                        className="flex flex-1 items-start gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                          <MdOutlineEvent className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-navy-700 dark:text-white">
                              {evento.titulo}
                            </p>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${info.badge}`}>
                              {info.label}
                            </span>
                          </div>
                          {evento.descripcion && (
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
                              {evento.descripcion}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-white/40">
                            <span className="flex items-center gap-1">
                              <MdOutlineAccessTime className="h-3.5 w-3.5" />
                              {formatoFechaHora(evento.inicioFecha)} — {formatoFechaHora(evento.finFecha)}
                            </span>
                            {evento.ubicacion && (
                              <span className="flex items-center gap-1">
                                <MdOutlineLocationOn className="h-3.5 w-3.5" />
                                {evento.ubicacion}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        {evento.empleadoNombres.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {evento.empleadoNombres.slice(0, 4).map((nombre: string, i: number) => (
                              <Avatar key={i} name={nombre} size={7} />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            seleccionarEvento(evento);
                          }}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </NexxusCard>

      {/* Modal Eventos del día */}
      <Modal
        isOpen={Boolean(diaSeleccionado)}
        onClose={() => setDiaSeleccionado(null)}
        title={diaSeleccionado ? formatoFecha(diaSeleccionado.fecha) : "Eventos del día"}
        width="max-w-md"
      >
        <div className="flex flex-col gap-2 py-2">
          {(diaSeleccionado?.eventos || []).map((evento: any) => {
            const info = tipoInfo(evento.tipo);
            return (
              <button
                key={evento.id}
                type="button"
                onClick={() => {
                  setDiaSeleccionado(null);
                  seleccionarEvento(evento);
                }}
                className="flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3 text-left transition hover:border-brand-500 hover:bg-white dark:border-white/5 dark:bg-charcoal dark:hover:border-brand-400"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-navy-700 dark:text-white">{evento.titulo}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${info.badge}`}>{info.label}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-white/50">
                  {formatoFechaHora(evento.inicioFecha)} — {formatoFechaHora(evento.finFecha)}
                </p>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Modal Crear / Editar Evento */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editandoId ? "Editar Evento" : "Crear Nuevo Evento"}
        width="max-w-xl"
      >
        <div className="py-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-titulo">
                Título del Evento *
              </label>
              <input
                id="cal-titulo"
                type="text"
                required
                placeholder="Ej. Reunión semanal de Finanzas"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              />
            </div>

            {/* Tipo de Evento (Selector de Chips Visuales) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                Tipo de Evento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIPOS.map((t) => {
                  const seleccionado = form.tipo === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tipo: t.value }))}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all text-left ${
                        seleccionado
                          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20 ring-2 ring-brand-500/30"
                          : "border border-gray-200/80 bg-gray-50/50 text-gray-700 hover:bg-gray-100/80 dark:border-white/10 dark:bg-charcoal dark:text-white/80 dark:hover:bg-white/10"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          seleccionado ? "bg-white ring-2 ring-white/40" : t.dot
                        }`}
                      />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha & Hora Inicio / Fin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-inicio">
                  Fecha & Hora Inicio *
                </label>
                <input
                  id="cal-inicio"
                  type="datetime-local"
                  required
                  value={form.inicio}
                  onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-fin">
                  Fecha & Hora Fin *
                </label>
                <input
                  id="cal-fin"
                  type="datetime-local"
                  required
                  value={form.fin}
                  onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>
            </div>

            {/* Ubicación y Enlace de Videollamada */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-ubicacion">
                  Ubicación o Sala
                </label>
                <div className="relative">
                  <MdOutlineLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                  <input
                    id="cal-ubicacion"
                    type="text"
                    placeholder="Ej. Sala de Juntas / Remoto"
                    value={form.ubicacion}
                    onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-link">
                  Enlace de Videollamada
                </label>
                <div className="relative">
                  <MdOutlineVideoCameraFront className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
                  <input
                    id="cal-link"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                  />
                </div>
              </div>
            </div>

            {/* Descripción del Evento */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="cal-descripcion">
                Descripción del Evento (opcional)
              </label>
              <textarea
                id="cal-descripcion"
                rows={2}
                placeholder="Orden del día, notas o temario del evento..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B] resize-none"
              />
            </div>

            {/* Convocados y Asignación de colaboradores */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                    Convocados
                  </p>
                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10.5px] font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                    {form.empleadoIds.length} seleccionados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        empleadoIds:
                          f.empleadoIds.length === empleados.length
                            ? []
                            : empleados.map((emp) => emp.id),
                      }))
                    }
                    className="text-[11px] font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition"
                  >
                    {form.empleadoIds.length === empleados.length ? "Desmarcar todos" : "Seleccionar todos"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-2.5 dark:border-white/10 dark:bg-charcoal">
                {empleados.length === 0 ? (
                  <p className="p-3 text-center text-xs text-gray-400">No hay colaboradores registrados en el equipo.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {empleados.map((emp) => {
                        const isChecked = form.empleadoIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            className={`flex items-center gap-2.5 rounded-xl p-2 transition cursor-pointer border ${
                              isChecked
                                ? "border-brand-500/30 bg-brand-500/10 dark:border-brand-400/30 dark:bg-brand-500/15"
                                : "border-transparent bg-white/60 hover:bg-white dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEmpleado(emp.id)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                            />
                            <Avatar name={emp.nombre} size={7} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                {emp.nombre}
                              </p>
                              {emp.cargo && (
                                <p className="truncate text-[10px] text-gray-400 dark:text-white/50">
                                  {emp.cargo}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 dark:border-white/10 mt-1">
              {editandoId ? (
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={guardando}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 active:scale-95 disabled:opacity-50"
                >
                  <MdOutlineDelete className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                >
                  <MdOutlineCheck className="h-4 w-4" />
                  <span>{guardando ? "Guardando..." : editandoId ? "Actualizar Evento" : "Crear Evento"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
