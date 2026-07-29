import { useEffect, useMemo, useState } from "react";
import { MdSearch } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import RecordsTable from "views/nexxus/components/RecordsTable";
import { subscribeAuditGlobal, loadMoreAuditGlobal, loadMoreCompanies } from "services/superAdminRepository";
import { formatoFechaHora } from "services/saFormat";

const LIMITE = 25;

// Mismo mapeo que AUDIT_STATUS_MAP en superadmin-dashboard/index.jsx: RecordsTable solo
// reconoce estos tres literales para su columna "status".
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
  { Header: "Empresa", accessor: "empresaNombre" },
  { Header: "Usuario", accessor: "actorNombre" },
  { Header: "Fecha", accessor: "fecha" },
  { Header: "Estado", accessor: "status" },
];

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then((res) => active && setCompanies(res.items || []))
      .catch(() => active && setCompanies([]));
    return () => {
      active = false;
    };
  }, []);

  // audit_logs no siempre guarda empresaNombre denormalizado (p.ej. aiAssistant.js solo guarda
  // empresaId) -- sin este mapa, "Empresa" salía vacía para casi todos los registros.
  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map();
    companies.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [companies]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAuditGlobal(
      LIMITE,
      (snapshot) => {
        if (!active) return;
        setRegistros(snapshot.items);
        setCursor(snapshot.cursor);
        setHayMas(snapshot.hayMas);
        setCargando(false);
      },
      (err) => {
        if (!active) return;
        setError(err.message || "No se pudo conectar con Firestore.");
        setCargando(false);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleCargarMas = async () => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    setError("");
    try {
      const siguiente = await loadMoreAuditGlobal(LIMITE, cursor);
      setRegistros((prev) => [...prev, ...siguiente.items]);
      setCursor(siguiente.cursor);
      setHayMas(siguiente.hayMas);
    } catch (err) {
      setError(err.message || "No se pudieron cargar más registros.");
    } finally {
      setCargandoMas(false);
    }
  };

  const filaVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return registros
      .filter((registro) => (estado ? registro.estado === estado : true))
      .filter((registro) => {
        if (!texto) return true;
        const campos = [
          registro.accion,
          registro.modulo,
          registro.empresaNombre,
          registro.actorNombre,
          registro.detalles,
        ];
        return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
      })
      .map((registro) => ({
        accion: registro.accion,
        modulo: registro.modulo,
        empresaNombre: registro.empresaNombre || nombreEmpresaPorId.get(registro.empresaId) || "—",
        actorNombre: registro.actorNombre || "—",
        fecha: formatoFechaHora(registro.timestamp),
        status: AUDIT_STATUS_MAP[registro.estado] || "Approved",
      }));
  }, [registros, busqueda, estado, nombreEmpresaPorId]);

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <NexxusCard extra="mb-5 w-full p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MdSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-white/40" />
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por acción, módulo, empresa, usuario o detalles..."
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
        </div>
      </NexxusCard>

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando auditoría...</p>
      ) : (
        <>
          <RecordsTable
            title="Registro de auditoría"
            columnsData={COLUMNAS_AUDITORIA}
            tableData={filaVisibles}
            delay={100}
          />

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={handleCargarMas}
              disabled={!hayMas || cargandoMas}
              className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white transition duration-250 hover:bg-brand-600 disabled:opacity-40 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              {cargandoMas ? "Cargando..." : hayMas ? "Cargar más" : "No hay más registros"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
