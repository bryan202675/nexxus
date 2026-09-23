import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineAccessTime,
  MdOutlineSearch,
  MdOutlineCalendarToday,
  MdOutlineFileDownload,
  MdOutlineAdd,
  MdOutlineWarningAmber,
  MdOutlineClose,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import {
  subscribeAsistencias,
  subscribeEmpleados,
  subscribeConfiguracionEmpresa,
  subscribeCargos,
  subscribeDepartamentos,
} from "services/adminRepository";
import { formatoFecha } from "services/saFormat";
import AttendanceGeoPanel from "components/attendance/AttendanceGeoPanel";

const toLocalDateISO = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const hoyLocalISO = () => toLocalDateISO(new Date());

const DEFAULT_CONFIG = {
  horaEntrada: "08:00",
  horaSalida: "17:00",
  toleranciaMinutos: 10,
  horasEsperadas: 8,
};

function toDate(value: any) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractFechaRecord(a: any): string {
  if (a.fecha_jornada) return String(a.fecha_jornada).slice(0, 10);
  if (a.created_at) {
    const d = toDate(a.created_at);
    if (d) return toLocalDateISO(d);
  }
  if (a.entrada) {
    const d = toDate(a.entrada);
    if (d) return toLocalDateISO(d);
  }
  if (a.salida) {
    const d = toDate(a.salida);
    if (d) return toLocalDateISO(d);
  }
  return hoyLocalISO();
}

function formatoHora(value: any) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
}

function minutosDesdeMedianoche(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHoraConfig(horaStr: string) {
  const [h, m] = String(horaStr || "0:0").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function csvEscape(value: any) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const PAGE_SIZE = 10;

export default function GestionAsistencia() {
  const { user, perfil, empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneExportar = tieneFeature(planFeatures, "exports");

  // Filtros de fecha: "hoy", "7dias", "30dias", "todos", "personalizado"
  const [modoFecha, setModoFecha] = useState<"hoy" | "7dias" | "30dias" | "todos" | "personalizado">("hoy");
  const [fechaPersonalizada, setFechaPersonalizada] = useState(hoyLocalISO);

  const [asistencias, setAsistencias] = useState<any[] | null>(null);
  const [empleados, setEmpleados] = useState<any[] | null>(null);
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Búsqueda y filtros rápidos
  const [busqueda, setBusqueda] = useState("");
  const [filtroPuntualidad, setFiltroPuntualidad] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualForm, setManualForm] = useState({
    usuarioId: "",
    fechaJornada: hoyLocalISO(),
    horaEntrada: "08:00",
    horaSalida: "17:00",
    horasExtra: "0",
    observaciones: "",
  });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [manualError, setManualError] = useState("");

  const [selectedAsistencia, setSelectedAsistencia] = useState<any | null>(null);

  // 1. Carga reactiva de metadatos organizacionales
  useEffect(() => {
    if (!empresaId) return undefined;
    const onMetaErr = (err: any) => {
      console.warn("Error cargando empleados/metadatos:", err);
      setEmpleados((prev) => prev ?? []);
    };

    const unsubs = [
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onMetaErr),
      subscribeCargos(empresaId, (docs) => setCargos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
      subscribeConfiguracionEmpresa(
        empresaId,
        (snap) => {
          const data = snap.exists ? snap.data() : null;
          setConfig({ ...DEFAULT_CONFIG, ...(data?.asistencia || {}) });
        },
        () => {}
      ),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  // 2. Carga reactiva de asistencias
  useEffect(() => {
    if (!empresaId) return undefined;
    setError("");

    const onAsistenciaErr = (err: any) => {
      const msg = String(err?.message || "");
      setError(msg || "No se pudo conectar con el servidor de asistencias.");
      setAsistencias((prev) => prev ?? []);
    };

    const unsub = subscribeAsistencias(
      empresaId,
      (docs) => {
        setError("");
        setAsistencias(docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      onAsistenciaErr,
      { limite: 1500 }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [empresaId, retryCount]);

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    const cargoMap = Object.fromEntries(cargos.map((c) => [c.id, c.nombre || c.titulo]));
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));

    (empleados || []).forEach((u) => {
      map.set(u.id, {
        ...u,
        cargoLabel: cargoMap[u.cargo_id] || u.cargo || "Especialista",
        departamentoLabel: deptoMap[u.departamento_id] || u.departamento || "General",
      });
    });
    return map;
  }, [empleados, cargos, departamentos]);

  // Agrupación y cálculo de asistencias
  const registrosProcesados = useMemo(() => {
    if (!asistencias) return [];

    const startMinutes = parseHoraConfig(config.horaEntrada);
    const endMinutes = parseHoraConfig(config.horaSalida);
    const tolerancia = config.toleranciaMinutos || 10;
    const horasEsperadas = config.horasEsperadas || 8;

    const porUsuarioFecha = new Map<string, any[]>();
    asistencias.forEach((a) => {
      const uId = a.usuario_id;
      if (!uId) return;
      const fecha = extractFechaRecord(a);
      const clave = `${uId}__${fecha}`;
      if (!porUsuarioFecha.has(clave)) porUsuarioFecha.set(clave, []);
      porUsuarioFecha.get(clave)!.push({ ...a, resolvedFecha: fecha });
    });

    const filas: any[] = [];
    porUsuarioFecha.forEach((eventos, clave) => {
      const [userId, fecha] = clave.split("__");
      const ordenados = [...eventos].sort((a, b) => {
        const da = toDate(a.entrada || a.salida || a.created_at);
        const db = toDate(b.entrada || b.salida || b.created_at);
        return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
      });

      const entrada = ordenados.find((e) => e.tipo === "entrada" || e.entrada);
      const salidasDelDia = ordenados.filter((e) => e.tipo === "salida" || e.salida);
      const salida = salidasDelDia.length ? salidasDelDia[salidasDelDia.length - 1] : null;

      const entradaDate = entrada ? toDate(entrada.entrada || entrada.created_at) : null;
      const salidaDate = salida ? toDate(salida.salida || salida.created_at) : null;

      let horasTrabajadas = 0;
      if (typeof salida?.horas_trabajadas === "number") {
        horasTrabajadas = salida.horas_trabajadas;
      } else if (typeof entrada?.horas_trabajadas === "number") {
        horasTrabajadas = entrada.horas_trabajadas;
      } else if (entradaDate && salidaDate) {
        horasTrabajadas = Math.max(0, (salidaDate.getTime() - entradaDate.getTime()) / 3600000);
      } else if (entradaDate && !salidaDate) {
        horasTrabajadas = Math.max(0, (Date.now() - entradaDate.getTime()) / 3600000);
      }

      let tarde = Boolean(entrada?.tarde);
      let minutosTarde = Number(entrada?.minutos_tarde) || 0;
      if (!("tarde" in (entrada || {})) && entradaDate) {
        minutosTarde = Math.max(0, minutosDesdeMedianoche(entradaDate) - startMinutes - tolerancia);
        tarde = minutosTarde > 0;
      }

      let salidaAnticipada = Boolean(salida?.salida_anticipada);
      let minutosSalidaAnticipada = Number(salida?.minutos_salida_anticipada) || 0;
      if (!("salida_anticipada" in (salida || {})) && salidaDate) {
        minutosSalidaAnticipada = Math.max(0, endMinutes - minutosDesdeMedianoche(salidaDate));
        salidaAnticipada = minutosSalidaAnticipada > 0;
      }

      const horasExtraRegistradas = ordenados.reduce(
        (sum, e) => sum + (typeof e.horas_extra === "number" ? e.horas_extra : 0),
        0
      );
      const horasExtra =
        horasExtraRegistradas > 0 ? horasExtraRegistradas : Math.max(0, horasTrabajadas - horasEsperadas);

      const empleado = empleadosPorId.get(userId);
      const enJornadaActiva = Boolean(entradaDate && !salidaDate);

      filas.push({
        id: ordenados[0]?.id || clave,
        usuarioId: userId,
        fechaJornada: fecha,
        empleadoNombre: empleado?.nombre || empleado?.correo || `Colaborador (${String(userId || "").slice(0, 6)}...)`,
        fotoPerfil: empleado?.foto_perfil || empleado?.foto,
        cargoLabel: empleado?.cargoLabel || "Colaborador",
        departamentoLabel: empleado?.departamentoLabel || "General",
        horaEntrada: entradaDate ? formatoHora(entradaDate) : "—",
        horaSalida: salidaDate ? formatoHora(salidaDate) : enJornadaActiva ? "En Jornada Activa" : "—",
        entradaDate,
        salidaDate,
        horasTrabajadas,
        tarde,
        minutosTarde,
        salidaAnticipada,
        minutosSalidaAnticipada,
        horasExtra,
        enJornadaActiva,
        ubicacion: entrada?.ubicacion_entrada || salida?.ubicacion_salida || "Oficina Central",
        eventosRaw: ordenados,
      });
    });

    return filas.sort((a, b) => (b.fechaJornada || "").localeCompare(a.fechaJornada || ""));
  }, [asistencias, empleadosPorId, config]);

  // Conteo de fechas dinámico para los botones
  const dateCounts = useMemo(() => {
    const hoy = hoyLocalISO();
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const limit7 = toLocalDateISO(d7);

    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const limit30 = toLocalDateISO(d30);

    let hoyCount = 0;
    let d7Count = 0;
    let d30Count = 0;

    registrosProcesados.forEach((r) => {
      if (r.fechaJornada === hoy) hoyCount++;
      if (r.fechaJornada >= limit7) d7Count++;
      if (r.fechaJornada >= limit30) d30Count++;
    });

    return {
      hoy: hoyCount,
      d7: d7Count,
      d30: d30Count,
      todos: registrosProcesados.length,
    };
  }, [registrosProcesados]);

  // Filtro por fecha seleccionada
  const registrosFiltradosPorFecha = useMemo(() => {
    const hoy = hoyLocalISO();
    if (modoFecha === "hoy") {
      return registrosProcesados.filter((r) => r.fechaJornada === hoy);
    }
    if (modoFecha === "personalizado") {
      return registrosProcesados.filter((r) => r.fechaJornada === fechaPersonalizada);
    }
    if (modoFecha === "7dias") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const limit = toLocalDateISO(d);
      return registrosProcesados.filter((r) => r.fechaJornada >= limit);
    }
    if (modoFecha === "30dias") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const limit = toLocalDateISO(d);
      return registrosProcesados.filter((r) => r.fechaJornada >= limit);
    }
    return registrosProcesados; // "todos"
  }, [registrosProcesados, modoFecha, fechaPersonalizada]);

  // Filtro por texto y estado de puntualidad
  const registrosFinales = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return registrosFiltradosPorFecha.filter((r) => {
      if (filtroPuntualidad === "puntuales" && (r.tarde || r.salidaAnticipada)) return false;
      if (filtroPuntualidad === "tardes" && !r.tarde) return false;
      if (filtroPuntualidad === "horasExtra" && r.horasExtra <= 0) return false;
      if (filtroPuntualidad === "activas" && !r.enJornadaActiva) return false;

      if (!q) return true;
      const campos = [r.empleadoNombre, r.cargoLabel, r.departamentoLabel, r.fechaJornada, r.ubicacion];
      return campos.some((c) => (c || "").toLowerCase().includes(q));
    });
  }, [registrosFiltradosPorFecha, busqueda, filtroPuntualidad]);

  const totalPaginas = Math.max(1, Math.ceil(registrosFinales.length / PAGE_SIZE));
  const registrosPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return registrosFinales.slice(start, start + PAGE_SIZE);
  }, [registrosFinales, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroPuntualidad, modoFecha, fechaPersonalizada]);

  // KPIs
  const kpis = useMemo(() => {
    const fuente = registrosFiltradosPorFecha;
    const horasTotales = fuente.reduce((sum, r) => sum + r.horasTrabajadas, 0);
    const llegadasTarde = fuente.filter((r) => r.tarde).length;
    const salidasAnticipadas = fuente.filter((r) => r.salidaAnticipada).length;
    const horasExtraTotales = fuente.reduce((sum, r) => sum + r.horasExtra, 0);
    const activosAhora = fuente.filter((r) => r.enJornadaActiva).length;
    const conHorasExtra = fuente.filter((r) => r.horasExtra > 0).length;
    const puntuales = fuente.filter((r) => !r.tarde && !r.salidaAnticipada).length;
    const puntualidad = fuente.length > 0 ? Math.round((puntuales / fuente.length) * 100) : 100;

    return {
      horasTotales,
      llegadasTarde,
      salidasAnticipadas,
      horasExtraTotales,
      activosAhora,
      conHorasExtra,
      puntuales,
      puntualidad,
    };
  }, [registrosFiltradosPorFecha]);

  const handleExportar = () => {
    const encabezados = [
      "Fecha",
      "Empleado",
      "Cargo",
      "Departamento",
      "Hora Entrada",
      "Hora Salida",
      "Horas Trabajadas",
      "Tarde",
      "Minutos Tarde",
      "Salida Anticipada",
      "Horas Extra",
    ];
    const filas = registrosFinales.map((r) => [
      r.fechaJornada,
      r.empleadoNombre,
      r.cargoLabel,
      r.departamentoLabel,
      r.horaEntrada,
      r.horaSalida,
      r.horasTrabajadas.toFixed(2),
      r.tarde ? "Sí" : "No",
      r.minutosTarde,
      r.salidaAnticipada ? "Sí" : "No",
      r.horasExtra.toFixed(2),
    ]);
    const csvContent = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencias_${modoFecha}_${hoyLocalISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCrearAsistenciaManual = async (e: any) => {
    e.preventDefault();
    if (!manualForm.usuarioId) {
      setManualError("Selecciona un colaborador.");
      return;
    }
    setGuardandoManual(true);
    setManualError("");

    try {
      const entradaTimestamp = new Date(`${manualForm.fechaJornada}T${manualForm.horaEntrada}:00`).toISOString();
      const salidaTimestamp = new Date(`${manualForm.fechaJornada}T${manualForm.horaSalida}:00`).toISOString();

      const start = new Date(entradaTimestamp).getTime();
      const end = new Date(salidaTimestamp).getTime();
      const horasTrabajadas = Math.max(0, (end - start) / 3600000);
      const horasExtra = Number(manualForm.horasExtra) || Math.max(0, horasTrabajadas - 8);

      const payload = {
        empresa_id: empresaId,
        usuario_id: manualForm.usuarioId,
        fecha_jornada: manualForm.fechaJornada,
        tipo: "entrada",
        entrada: entradaTimestamp,
        salida: salidaTimestamp,
        horas_trabajadas: Number(horasTrabajadas.toFixed(2)),
        horas_extra: Number(horasExtra.toFixed(2)),
        tarde: false,
        minutos_tarde: 0,
        observaciones: manualForm.observaciones || "Registro manual por administrador",
      };

      const { error: insertErr } = await supabase.from("asistencias").insert(payload);
      if (insertErr) throw insertErr;

      setShowManualCreate(false);
      setManualForm({
        usuarioId: "",
        fechaJornada: hoyLocalISO(),
        horaEntrada: "08:00",
        horaSalida: "17:00",
        horasExtra: "0",
        observaciones: "",
      });
    } catch (err: any) {
      setManualError(err.message || "No se pudo registrar la asistencia.");
    } finally {
      setGuardandoManual(false);
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

  const cargando = asistencias === null || empleados === null;

  const modoFechaLabel =
    modoFecha === "hoy"
      ? `Hoy (${hoyLocalISO()})`
      : modoFecha === "7dias"
      ? "Últimos 7 días"
      : modoFecha === "30dias"
      ? "Últimos 30 días"
      : modoFecha === "personalizado"
      ? `Fecha: ${fechaPersonalizada}`
      : "Todo el Historial";

  // Contexto temporal según filtro para mensajes contextuales
  const periodoContexto =
    modoFecha === "hoy" || modoFecha === "personalizado"
      ? "este día"
      : modoFecha === "7dias"
      ? "esta semana"
      : modoFecha === "30dias"
      ? "este mes"
      : "en el historial";

  return (
    <div className="flex flex-col gap-6 pb-6">
      <AttendanceGeoPanel />
      {/* Banner de error */}
      {error && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRetryCount((prev) => prev + 1)}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 active:scale-95 transition dark:border-red-500/30 dark:bg-charcoal dark:text-red-300"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Control de Asistencia & Jornadas
            </h2>
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              {modoFechaLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
            Monitoreo en tiempo real de marcaciones, retardos, jornadas activas y horas extras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowManualCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-lightPrimary px-4 py-2.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-500/10 active:scale-95 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
          >
            <MdOutlineAdd className="h-4 w-4" />
            <span>Registrar Asistencia Manual</span>
          </button>

          <button
            type="button"
            onClick={handleExportar}
            disabled={registrosFinales.length === 0 || !tieneExportar}
            title={!tieneExportar ? "La exportación de datos está disponible desde el plan Business." : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            <MdOutlineFileDownload className="h-4 w-4" />
            <span>{tieneExportar ? "Exportar CSV" : "Exportar CSV (Business+)"}</span>
          </button>
        </div>
      </div>

      {/* Grid Asimétrico: Hero Card (7 cols) + Right Stack (5 cols) */}
      {(() => {
        const total = Math.max(registrosFiltradosPorFecha.length, 1);
        const hayRegistros = registrosFiltradosPorFecha.length > 0 && kpis.horasTotales > 0;
        const puntualesPct = Math.round((kpis.puntuales / total) * 100);
        const tardesPct = Math.round((kpis.llegadasTarde / total) * 100);
        const salidasPct = Math.round((kpis.salidasAnticipadas / total) * 100);
        const extraPct = Math.round((kpis.conHorasExtra / total) * 100);

        return (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Hero Card Principal (7 cols) */}
            <div className="lg:col-span-7">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-navy-700 dark:text-white">
                        Horas Totales Computadas
                      </span>
                      <span className="ml-2 text-xs font-medium text-gray-400 dark:text-white/40">
                        · {modoFechaLabel}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        kpis.activosAhora > 0
                          ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                          : hayRegistros
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60"
                      }`}
                    >
                      {kpis.activosAhora > 0
                        ? `${kpis.activosAhora} activos ahora`
                        : hayRegistros
                        ? "Jornada registrada"
                        : "Sin marcaciones"}
                    </span>
                  </div>

                  {/* Número Principal / Mensaje Contextual Sin Gráfica */}
                  <div className="mt-4">
                    {hayRegistros ? (
                      <div>
                        <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-navy-700 dark:text-white truncate">
                          {kpis.horasTotales.toFixed(1)}{" "}
                          <span className="text-2xl sm:text-3xl font-bold text-gray-400 dark:text-white/50">hrs</span>
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>{kpis.puntualidad}% de puntualidad general</span>
                          <span className="font-normal text-gray-400 dark:text-white/40">
                            · {registrosFiltradosPorFecha.length} jornadas computadas
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                          Sin horas registradas {periodoContexto}
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-white/50">
                          No se han detectado marcaciones de entrada o salida para este período.
                        </p>
                      </div>
                    )}

                    {hayRegistros && (
                      <p className="mt-2 text-xs font-medium text-gray-500 dark:text-white/60">
                        {kpis.puntuales} marcaciones a tiempo · {kpis.activosAhora} colaboradores en turno en tiempo real
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {/* Barra de Distribución Proporcional */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                    {hayRegistros ? (
                      <>
                        <div
                          style={{ width: `${Math.max(puntualesPct, 5)}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500"
                          title={`Puntuales: ${kpis.puntuales}`}
                        />
                        <div
                          style={{ width: `${tardesPct}%` }}
                          className="h-full bg-amber-500 transition-all duration-500"
                          title={`Llegadas Tarde: ${kpis.llegadasTarde}`}
                        />
                        <div
                          style={{ width: `${salidasPct}%` }}
                          className="h-full bg-rose-500 transition-all duration-500"
                          title={`Salidas Anticipadas: ${kpis.salidasAnticipadas}`}
                        />
                        <div
                          style={{ width: `${extraPct}%` }}
                          className="h-full bg-indigo-500 transition-all duration-500"
                          title={`Con Horas Extra: ${kpis.conHorasExtra}`}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-gray-200/50 dark:bg-white/5" />
                    )}
                  </div>

                  {/* Leyenda con Métricas */}
                  {hayRegistros ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {kpis.puntuales}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Puntuales ({puntualesPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {kpis.llegadasTarde}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Retardos ({tardesPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {kpis.salidasAnticipadas}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Salidas Antic. ({salidasPct}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-navy-700 dark:text-white">
                            {kpis.conHorasExtra}
                          </p>
                          <p className="truncate text-[10px] text-gray-400 dark:text-white/40">
                            Horas Extra ({extraPct}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
                      0 jornadas registradas para este filtro
                    </p>
                  )}
                </div>
              </NexxusCard>
            </div>

            {/* Right Stack of 3 Cards (5 cols) - Alineadas a la izquierda */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {/* Card 1: Llegadas Tarde */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Llegadas Tarde & Retardos
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      kpis.llegadasTarde > 0
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                    }`}
                  >
                    {kpis.llegadasTarde > 0 ? `${kpis.llegadasTarde} con retraso` : "100% puntual"}
                  </span>
                </div>
                <div className="mt-2 text-left">
                  {kpis.llegadasTarde > 0 ? (
                    <>
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                        {kpis.llegadasTarde}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                        Tolerancia configurada: {config.toleranciaMinutos} min
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                        Sin llegadas tarde {periodoContexto}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                        Tolerancia: {config.toleranciaMinutos} min · Todos a tiempo
                      </p>
                    </>
                  )}
                </div>
              </NexxusCard>

              {/* Card 2: Horas Extra */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Horas Extra Acumuladas
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      kpis.horasExtraTotales > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60"
                    }`}
                  >
                    {kpis.horasExtraTotales > 0 ? "Bonificable" : "Jornada regular"}
                  </span>
                </div>
                <div className="mt-2 text-left">
                  {kpis.horasExtraTotales > 0 ? (
                    <>
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                        {kpis.horasExtraTotales.toFixed(1)}{" "}
                        <span className="text-lg font-bold text-gray-400 dark:text-white/40">hrs</span>
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                        {kpis.conHorasExtra} colaboradores con tiempo extra
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                        Sin horas extra acumuladas {periodoContexto}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                        Jornadas dentro del horario regular laboral
                      </p>
                    </>
                  )}
                </div>
              </NexxusCard>

              {/* Card 3: Activos Ahora */}
              <NexxusCard extra="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-white/50">
                    Colaboradores en Jornada Activa
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      kpis.activosAhora > 0
                        ? "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60"
                    }`}
                  >
                    {kpis.activosAhora > 0 ? "En vivo" : "Jornada cerrada"}
                  </span>
                </div>
                <div className="mt-2 text-left">
                  {kpis.activosAhora > 0 ? (
                    <>
                      <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                        {kpis.activosAhora}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                        Turno en curso en tiempo real
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base sm:text-lg font-bold tracking-tight text-navy-700 dark:text-white">
                        Sin colaboradores en jornada activa
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                        Salida esperada: {config.horaSalida} hrs
                      </p>
                    </>
                  )}
                </div>
              </NexxusCard>
            </div>
          </div>
        );
      })()}

      {/* Contenedor Principal: Filtros y Tabla */}
      <NexxusCard extra="p-6 flex flex-col gap-5">
        {/* Fila 1: Filtros de Fecha y Buscador */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModoFecha("hoy")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                modoFecha === "hoy"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
              }`}
            >
              Hoy ({dateCounts.hoy})
            </button>
            <button
              type="button"
              onClick={() => setModoFecha("7dias")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                modoFecha === "7dias"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
              }`}
            >
              Últimos 7 días ({dateCounts.d7})
            </button>
            <button
              type="button"
              onClick={() => setModoFecha("30dias")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                modoFecha === "30dias"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
              }`}
            >
              Últimos 30 días ({dateCounts.d30})
            </button>
            <button
              type="button"
              onClick={() => setModoFecha("todos")}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                modoFecha === "todos"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
              }`}
            >
              Todo el Historial ({dateCounts.todos})
            </button>

            {/* Selector de fecha personalizada */}
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-1.5 dark:border-white/15 dark:bg-charcoal">
              <MdOutlineCalendarToday className="text-gray-400 dark:text-white/50 text-xs" />
              <input
                type="date"
                value={fechaPersonalizada}
                onChange={(e) => {
                  setFechaPersonalizada(e.target.value);
                  setModoFecha("personalizado");
                }}
                className="bg-transparent text-xs font-bold text-navy-700 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/50" />
            <input
              type="text"
              placeholder="Buscar por colaborador o cargo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-8 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <MdOutlineClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Chips de Puntualidad */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setFiltroPuntualidad("todos")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              filtroPuntualidad === "todos"
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
            }`}
          >
            Todos ({registrosFiltradosPorFecha.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroPuntualidad("puntuales")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              filtroPuntualidad === "puntuales"
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
            }`}
          >
            Puntuales ({kpis.puntuales})
          </button>
          <button
            type="button"
            onClick={() => setFiltroPuntualidad("tardes")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              filtroPuntualidad === "tardes"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
            }`}
          >
            Llegadas Tarde ({kpis.llegadasTarde})
          </button>
          <button
            type="button"
            onClick={() => setFiltroPuntualidad("horasExtra")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              filtroPuntualidad === "horasExtra"
                ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
            }`}
          >
            Con Horas Extra ({kpis.conHorasExtra})
          </button>
          {kpis.activosAhora > 0 && (
            <button
              type="button"
              onClick={() => setFiltroPuntualidad("activas")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                filtroPuntualidad === "activas"
                  ? "bg-purple-500 text-white shadow-sm shadow-purple-500/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>En Jornada Activa ({kpis.activosAhora})</span>
            </button>
          )}
        </div>

        {/* Tabla de Asistencias */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando asistencias de la base de datos...
            </p>
          </div>
        ) : registrosFinales.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineAccessTime className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              Sin registros de asistencia {periodoContexto}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-sm">
              {modoFecha !== "todos" && registrosProcesados.length > 0 ? (
                <span>
                  Hay {registrosProcesados.length} registros en otras fechas.{" "}
                  <button
                    type="button"
                    onClick={() => setModoFecha("todos")}
                    className="font-bold text-brand-500 underline hover:text-brand-600"
                  >
                    Ver todo el historial
                  </button>
                </span>
              ) : (
                "Puedes registrar una asistencia manual con el botón superior o esperar marcaciones desde la app móvil."
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.04]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Colaborador
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Fecha Jornada
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Entrada
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Salida
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Horas Computadas
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Puntualidad
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Horas Extra
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {registrosPaginados.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedAsistencia(r)}
                    className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.04]"
                  >
                    {/* Colaborador */}
                    <td className="min-w-[200px] px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={r.fotoPerfil} name={r.empleadoNombre} size={8} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                            {r.empleadoNombre}
                          </p>
                          <p className="truncate text-[10.5px] font-medium text-gray-500 dark:text-white/70">
                            {r.cargoLabel} · {r.departamentoLabel}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-gray-700 dark:text-white/80">
                      {formatoFecha(r.fechaJornada)}
                    </td>

                    {/* Entrada */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="text-xs font-bold text-navy-700 dark:text-white">
                        {r.horaEntrada}
                      </span>
                    </td>

                    {/* Salida */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {r.enJornadaActiva ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-400/20 dark:text-purple-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                          En Jornada
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-navy-700 dark:text-white">
                          {r.horaSalida}
                        </span>
                      )}
                    </td>

                    {/* Horas Computadas */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="text-xs font-black text-navy-700 dark:text-white">
                        {r.horasTrabajadas.toFixed(2)} hrs
                      </span>
                    </td>

                    {/* Puntualidad */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {r.tarde ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/25 dark:text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Tarde ({r.minutosTarde} min)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Puntual
                        </span>
                      )}
                    </td>

                    {/* Horas Extra */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {r.horasExtra > 0 ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                          +{r.horasExtra.toFixed(2)} hrs
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 dark:text-white/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {registrosFinales.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {registrosFinales.length} jornadas en total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      {/* Modal: Asistencia Manual */}
      <Modal
        isOpen={showManualCreate}
        onClose={() => setShowManualCreate(false)}
        title="Registrar Asistencia Manual"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleCrearAsistenciaManual} className="flex flex-col gap-4">
            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                htmlFor="manual-colaborador"
              >
                Colaborador *
              </label>
              <select
                id="manual-colaborador"
                value={manualForm.usuarioId}
                onChange={(e) => setManualForm((f) => ({ ...f, usuarioId: e.target.value }))}
                className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                <option value="">Selecciona un colaborador...</option>
                {(empleados || [])
                  .filter((e) => !e.eliminado && e.activo !== false)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} ({e.usuario_interno ? `@${e.usuario_interno}` : e.correo})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="manual-fecha"
                >
                  Fecha
                </label>
                <input
                  id="manual-fecha"
                  type="date"
                  value={manualForm.fechaJornada}
                  onChange={(e) => setManualForm((f) => ({ ...f, fechaJornada: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                />
              </div>

              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="manual-entrada"
                >
                  Hora Entrada
                </label>
                <input
                  id="manual-entrada"
                  type="time"
                  value={manualForm.horaEntrada}
                  onChange={(e) => setManualForm((f) => ({ ...f, horaEntrada: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                />
              </div>

              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                  htmlFor="manual-salida"
                >
                  Hora Salida
                </label>
                <input
                  id="manual-salida"
                  type="time"
                  value={manualForm.horaSalida}
                  onChange={(e) => setManualForm((f) => ({ ...f, horaSalida: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50"
                htmlFor="manual-observaciones"
              >
                Observaciones / Motivo
              </label>
              <input
                id="manual-observaciones"
                type="text"
                placeholder="Ej. Marcación justificada por soporte en sitio..."
                value={manualForm.observaciones}
                onChange={(e) => setManualForm((f) => ({ ...f, observaciones: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            {manualError && <p className="text-xs font-bold text-red-500">{manualError}</p>}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowManualCreate(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoManual}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
              >
                {guardandoManual ? "Guardando..." : "Guardar Asistencia"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Detalle de Jornada */}
      <Modal
        isOpen={!!selectedAsistencia}
        onClose={() => setSelectedAsistencia(null)}
        title="Detalle de Jornada de Asistencia"
        width="max-w-lg"
      >
        {selectedAsistencia ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={selectedAsistencia.fotoPerfil} name={selectedAsistencia.empleadoNombre} size={10} />
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedAsistencia.empleadoNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {selectedAsistencia.cargoLabel} · {selectedAsistencia.departamentoLabel}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-white/60">
                {formatoFecha(selectedAsistencia.fechaJornada)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40">Entrada</p>
                <p className="mt-1 text-sm font-black text-navy-700 dark:text-white">
                  {selectedAsistencia.horaEntrada}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40">Salida</p>
                <p className="mt-1 text-sm font-black text-navy-700 dark:text-white">
                  {selectedAsistencia.horaSalida}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40">Horas</p>
                <p className="mt-1 text-sm font-black text-navy-700 dark:text-white">
                  {selectedAsistencia.horasTrabajadas.toFixed(2)}h
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40">Horas Extra</p>
                <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {selectedAsistencia.horasExtra.toFixed(2)}h
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAsistencia(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
