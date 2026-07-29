import { useEffect, useMemo, useState } from "react";
import { MdOutlineAccessTime, MdOutlineWatchLater, MdOutlineLogout, MdOutlineTrendingUp } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";

import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import { subscribeAsistenciasHoy, subscribeEmpleados, subscribeConfiguracionEmpresa } from "services/adminRepository";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_CONFIG = { horaEntrada: "08:00", horaSalida: "17:00", toleranciaMinutos: 10, horasEsperadas: 8 };

const COLUMNS = [
  { Header: "Empleado", accessor: "empleado" },
  { Header: "Hora entrada", accessor: "horaEntrada" },
  { Header: "Hora salida", accessor: "horaSalida" },
  { Header: "Horas trabajadas", accessor: "horasTrabajadas" },
  { Header: "Tarde", accessor: "tarde" },
  { Header: "Horas extra", accessor: "horasExtra" },
];

// Convierte cualquier representacion de fecha que pueda traer un doc de Firestore
// (Timestamp, Date, string ISO, numero) a un objeto Date valido o null.
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatoHora(value) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
}

function minutosDesdeMedianoche(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHoraConfig(horaStr) {
  const [h, m] = String(horaStr || "0:0").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export default function GestionAsistencia() {
  const { empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneExportar = tieneFeature(planFeatures, "exports");

  const [fechaJornada, setFechaJornada] = useState(hoyISO());
  const [asistencias, setAsistencias] = useState(null);
  const [empleados, setEmpleados] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    setAsistencias(null);
    const unsubscribe = subscribeAsistenciasHoy(
      empresaId,
      fechaJornada,
      (docs) => setAsistencias(docs.map((d) => ({ id: d.id, ...d.data() }))),
      onErr
    );
    return () => unsubscribe();
  }, [empresaId, fechaJornada]);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))),
      onErr
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    const unsubscribe = subscribeConfiguracionEmpresa(
      empresaId,
      (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setConfig({ ...DEFAULT_CONFIG, ...(data?.asistencia || {}) });
      },
      onErr
    );
    return () => unsubscribe();
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map();
    (empleados || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [empleados]);

  const resumen = useMemo(() => {
    if (!asistencias) return [];

    const startMinutes = parseHoraConfig(config.horaEntrada);
    const endMinutes = parseHoraConfig(config.horaSalida);
    const tolerancia = config.toleranciaMinutos || 0;
    const horasEsperadas = config.horasEsperadas || 0;

    const porEmpleado = new Map();
    asistencias.forEach((a) => {
      const key = a.userId;
      if (!key) return;
      if (!porEmpleado.has(key)) porEmpleado.set(key, []);
      porEmpleado.get(key).push(a);
    });

    const filas = [];
    porEmpleado.forEach((eventos, userId) => {
      const ordenados = [...eventos].sort((a, b) => {
        const da = toDate(a.timestamp);
        const db_ = toDate(b.timestamp);
        return (da ? da.getTime() : 0) - (db_ ? db_.getTime() : 0);
      });

      const entrada = ordenados.find((e) => e.tipo === "entrada");
      const salidasDelDia = ordenados.filter((e) => e.tipo === "salida");
      const salida = salidasDelDia.length ? salidasDelDia[salidasDelDia.length - 1] : null;

      const entradaDate = entrada ? toDate(entrada.timestamp) : null;
      const salidaDate = salida ? toDate(salida.timestamp) : null;

      let horasTrabajadas = 0;
      if (typeof salida?.horasTrabajadas === "number") {
        horasTrabajadas = salida.horasTrabajadas;
      } else if (entradaDate && salidaDate) {
        horasTrabajadas = Math.max(0, (salidaDate.getTime() - entradaDate.getTime()) / 3600000);
      }

      let tarde = Boolean(entrada?.tarde);
      let minutosTarde = entrada?.minutosTarde;
      if (!("tarde" in (entrada || {})) && entradaDate) {
        minutosTarde = Math.max(0, minutosDesdeMedianoche(entradaDate) - startMinutes - tolerancia);
        tarde = minutosTarde > 0;
      }

      let salidaAnticipada = Boolean(salida?.salidaAnticipada);
      let minutosSalidaAnticipada = salida?.minutosSalidaAnticipada;
      if (!("salidaAnticipada" in (salida || {})) && salidaDate) {
        minutosSalidaAnticipada = Math.max(0, endMinutes - minutosDesdeMedianoche(salidaDate));
        salidaAnticipada = minutosSalidaAnticipada > 0;
      }

      const horasExtraRegistradas = ordenados.reduce(
        (sum, e) => sum + (typeof e.horas_extra_calculadas === "number" ? e.horas_extra_calculadas : 0),
        0
      );
      const horasExtra = horasExtraRegistradas > 0 ? horasExtraRegistradas : Math.max(0, horasTrabajadas - horasEsperadas);

      const empleado = empleadosPorId.get(userId);

      filas.push({
        id: userId,
        empleadoNombre: empleado?.nombre || userId,
        horaEntrada: entradaDate ? formatoHora(entradaDate) : "—",
        horaSalidaRaw: salidaDate,
        horaSalida: salidaDate ? formatoHora(salidaDate) : "—",
        horasTrabajadas,
        tarde,
        minutosTarde: minutosTarde || 0,
        salidaAnticipada,
        minutosSalidaAnticipada: minutosSalidaAnticipada || 0,
        horasExtra,
      });
    });

    return filas.sort((a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre));
  }, [asistencias, empleadosPorId, config]);

  const kpis = useMemo(() => {
    const horasTotales = resumen.reduce((sum, r) => sum + r.horasTrabajadas, 0);
    const llegadasTarde = resumen.filter((r) => r.tarde).length;
    const salidasAnticipadas = resumen.filter((r) => r.salidaAnticipada).length;
    const horasExtraTotales = resumen.reduce((sum, r) => sum + r.horasExtra, 0);
    return { horasTotales, llegadasTarde, salidasAnticipadas, horasExtraTotales };
  }, [resumen]);

  const filasTabla = useMemo(
    () =>
      resumen.map((r) => ({
        empleado: r.empleadoNombre,
        horaEntrada: r.horaEntrada,
        horaSalida: r.horaSalida,
        horasTrabajadas: r.horasTrabajadas.toFixed(2),
        tarde: r.tarde ? `Sí (${r.minutosTarde} min)` : "No",
        horasExtra: r.horasExtra.toFixed(2),
      })),
    [resumen]
  );

  const handleExportar = () => {
    const encabezados = ["Empleado", "Hora entrada", "Hora salida", "Horas trabajadas", "Tarde", "Minutos tarde", "Salida anticipada", "Horas extra"];
    const filas = resumen.map((r) => [
      r.empleadoNombre,
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
    link.download = `asistencia-${fechaJornada}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const widgets = [
    { icon: MdOutlineAccessTime, title: "Horas trabajadas totales", subtitle: kpis.horasTotales.toFixed(2) },
    { icon: MdOutlineWatchLater, title: "Llegadas tarde", subtitle: String(kpis.llegadasTarde) },
    { icon: MdOutlineLogout, title: "Salidas anticipadas", subtitle: String(kpis.salidasAnticipadas) },
    { icon: MdOutlineTrendingUp, title: "Horas extra totales", subtitle: kpis.horasExtraTotales.toFixed(2) },
  ];

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  const cargando = asistencias === null || empleados === null;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <NexxusCard extra="mb-5 w-full p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="fecha-jornada" className="text-sm font-medium text-gray-600 dark:text-white/70">
              Fecha
            </label>
            <input
              id="fecha-jornada"
              type="date"
              value={fechaJornada}
              onChange={(event) => setFechaJornada(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleExportar}
            disabled={cargando || resumen.length === 0 || !tieneExportar}
            title={!tieneExportar ? "Exportar datos está disponible desde el plan Business." : undefined}
            className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-40 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            {tieneExportar ? "Exportar CSV" : "Exportar CSV (plan Business+)"}
          </button>
        </div>
      </NexxusCard>

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando asistencia...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-8">
            {resumen.length === 0 ? (
              <NexxusCard extra="w-full p-6">
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                  Sin registros de asistencia para esta fecha.
                </p>
              </NexxusCard>
            ) : (
              <RecordsTable title="Resumen de asistencia" columnsData={COLUMNS} tableData={filasTabla} delay={100} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
