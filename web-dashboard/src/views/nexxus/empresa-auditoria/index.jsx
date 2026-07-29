import { useEffect, useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";
import {
  MdOutlineFactCheck,
  MdOutlineCheckCircle,
  MdOutlineWarningAmber,
  MdOutlineErrorOutline,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";

import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import { subscribeAuditLogs } from "services/adminRepository";
import { formatoFechaHora } from "services/saFormat";

// Mismo mapeo que AUDIT_STATUS_MAP en views/nexxus/auditoria/index.jsx (Super Admin): RecordsTable
// solo reconoce estos tres literales ("Approved" | "Disable" | "Error") para su columna "status".
const AUDIT_STATUS_MAP = { Success: "Approved", Warning: "Error", Error: "Disable" };

const ESTADO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "Success", label: "Success" },
  { value: "Warning", label: "Warning" },
  { value: "Error", label: "Error" },
];

const COLUMNAS_AUDITORIA = [
  { Header: "Acción", accessor: "accion" },
  { Header: "Módulo", accessor: "modulo" },
  { Header: "Usuario", accessor: "usuario" },
  { Header: "Fecha", accessor: "fecha" },
  { Header: "Estado", accessor: "status" },
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
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeAuditLogs(
      empresaId,
      (docs) => setRegistros(docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(err.message || "No se pudo conectar con Firestore.")
    );
    return () => unsubscribe();
  }, [empresaId]);

  const registrosFiltrados = useMemo(() => {
    const lista = registros || [];
    const texto = busqueda.trim().toLowerCase();
    return lista
      .filter((registro) => (estado ? registro.estado === estado : true))
      .filter((registro) => {
        if (!texto) return true;
        const campos = [registro.accion, registro.modulo, registro.usuarioNombre, registro.detalles];
        return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
      });
  }, [registros, busqueda, estado]);

  const kpis = useMemo(() => {
    const lista = registros || [];
    const total = lista.length;
    const exitos = lista.filter((r) => r.estado === "Success").length;
    const advertencias = lista.filter((r) => r.estado === "Warning").length;
    const errores = lista.filter((r) => r.estado === "Error").length;
    const porcentajeExito = total > 0 ? Math.round((exitos / total) * 100) : 0;
    return { total, porcentajeExito, advertencias, errores };
  }, [registros]);

  const filasTabla = useMemo(
    () =>
      registrosFiltrados.map((registro) => ({
        accion: registro.accion || "—",
        modulo: registro.modulo || "—",
        usuario: registro.usuarioNombre || "—",
        fecha: formatoFechaHora(registro.timestamp),
        status: AUDIT_STATUS_MAP[registro.estado] || "Approved",
      })),
    [registrosFiltrados]
  );

  const handleExportar = () => {
    const encabezados = ["Acción", "Módulo", "Usuario", "Fecha", "Estado", "Detalles"];
    const filas = registrosFiltrados.map((r) => [
      r.accion || "",
      r.modulo || "",
      r.usuarioNombre || "",
      formatoFechaHora(r.timestamp),
      r.estado || "",
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
    { icon: MdOutlineCheckCircle, title: "Éxito", subtitle: `${kpis.porcentajeExito}%` },
    { icon: MdOutlineWarningAmber, title: "Advertencias", subtitle: String(kpis.advertencias) },
    { icon: MdOutlineErrorOutline, title: "Errores", subtitle: String(kpis.errores) },
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
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white md:w-56"
              >
                {ESTADO_OPTIONS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value} className="dark:bg-charcoal">
                    {opcion.label}
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
