import { useEffect, useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import {
  MdOutlineFactCheck,
  MdOutlineToday,
  MdOutlineCategory,
  MdOutlinePeopleAlt,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";

import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import { subscribeAuditLogs, subscribeEmpleados } from "services/adminRepository";
import { formatoFechaHora } from "services/saFormat";

// audit_logs no tiene columna de estado/severidad (solo id, empresa_id, actor_id, accion,
// modulo, detalles, target_id, created_at), asi que no hay badge de Success/Warning/Error
// honesto que mostrar. En su lugar se muestran acción y módulo (datos reales) y se filtra por módulo.
const hoyISO = () => new Date().toISOString().slice(0, 10);

const COLUMNAS_AUDITORIA = [
  { Header: "Acción", accessor: "accion" },
  { Header: "Módulo", accessor: "modulo" },
  { Header: "Usuario", accessor: "usuario" },
  { Header: "Fecha", accessor: "fecha" },
];

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export default function AuditoriaAdmin() {
  const { empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneExportar = tieneFeature(planFeatures, "exports");

  const [registros, setRegistros] = useState(null);
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modulo, setModulo] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeAuditLogs(
      empresaId,
      (docs) => setRegistros(docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message || "No se pudo conectar con Firestore.")
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => setUsuarios(docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message || "No se pudo conectar con Firestore.")
    );
    return () => unsubscribe();
  }, [empresaId]);

  const usuariosPorId = useMemo(() => {
    const map = new Map();
    (usuarios || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [usuarios]);

  const modulosDisponibles = useMemo<string[]>(() => {
    const set = new Set<string>((registros || []).map((r) => String(r.modulo || "")).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    const lista = registros || [];
    const texto = busqueda.trim().toLowerCase();
    return lista
      .filter((registro) => (modulo ? registro.modulo === modulo : true))
      .filter((registro) => {
        if (!texto) return true;
        const nombreActor = usuariosPorId.get(registro.actor_id)?.nombre || "";
        const campos = [registro.accion, registro.modulo, nombreActor, registro.detalles];
        return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
      });
  }, [registros, busqueda, modulo, usuariosPorId]);

  const kpis = useMemo(() => {
    const lista = registros || [];
    const hoy = hoyISO();
    const total = lista.length;
    const hoyCount = lista.filter((r) => (r.created_at || "").slice(0, 10) === hoy).length;
    const modulosCount = new Set(lista.map((r) => r.modulo).filter(Boolean)).size;
    const usuariosCount = new Set(lista.map((r) => r.actor_id).filter(Boolean)).size;
    return { total, hoyCount, modulosCount, usuariosCount };
  }, [registros]);

  const filasTabla = useMemo(
    () =>
      registrosFiltrados.map((registro) => ({
        accion: registro.accion || "—",
        modulo: registro.modulo || "—",
        usuario: usuariosPorId.get(registro.actor_id)?.nombre || "—",
        fecha: formatoFechaHora(registro.created_at),
      })),
    [registrosFiltrados, usuariosPorId]
  );

  const handleExportar = () => {
    const encabezados = ["Acción", "Módulo", "Usuario", "Fecha", "Detalles"];
    const filas = registrosFiltrados.map((r) => [
      r.accion || "",
      r.modulo || "",
      usuariosPorId.get(r.actor_id)?.nombre || "",
      formatoFechaHora(r.created_at),
      r.detalles || "",
    ]);
    const csvContent = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "auditoria.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const widgets = [
    { icon: MdOutlineFactCheck, title: "Total eventos", subtitle: String(kpis.total) },
    { icon: MdOutlineToday, title: "Eventos hoy", subtitle: String(kpis.hoyCount) },
    { icon: MdOutlineCategory, title: "Módulos activos", subtitle: String(kpis.modulosCount) },
    { icon: MdOutlinePeopleAlt, title: "Usuarios activos", subtitle: String(kpis.usuariosCount) },
  ];

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  const cargando = registros === null;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando auditoría...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <NexxusCard extra="mb-5 mt-8 w-full p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-white/40" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por acción, módulo, usuario o detalles..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 pl-10 pr-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white dark:placeholder:text-white/40"
                />
              </div>
              <select
                value={modulo}
                onChange={(event) => setModulo(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white md:w-56"
              >
                <option value="" className="dark:bg-charcoal">Todos los módulos</option>
                {modulosDisponibles.map((m) => (
                  <option key={m} value={m} className="dark:bg-charcoal">
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportar}
                disabled={filasTabla.length === 0 || !tieneExportar}
                title={!tieneExportar ? "Exportar datos está disponible desde el plan Business." : undefined}
                className="h-11 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-40 dark:bg-brand-400 dark:hover:bg-brand-300"
              >
                {tieneExportar ? "Exportar CSV" : "Exportar CSV (plan Business+)"}
              </button>
            </div>
          </NexxusCard>

          {filasTabla.length === 0 ? (
            <NexxusCard extra="w-full p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                No hay registros de auditoría para esta empresa.
              </p>
            </NexxusCard>
          ) : (
            <RecordsTable title="Registro de auditoría" columnsData={COLUMNAS_AUDITORIA} tableData={filasTabla} delay={100} />
          )}
        </>
      )}
    </div>
  );
}
