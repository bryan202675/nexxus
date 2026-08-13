import { useEffect, useMemo, useState } from "react";
import { MdLock } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import RecordsTable from "views/nexxus/components/RecordsTable";
import { subscribeSupportSessions, loadMoreCompanies } from "services/superAdminRepository";
import { formatoFechaHora } from "services/saFormat";

const COLUMNAS_SESIONES = [
  { Header: "Empresa", accessor: "empresaNombre" },
  { Header: "Usuario objetivo", accessor: "targetEmail" },
  { Header: "Rol", accessor: "targetRole" },
  { Header: "Iniciada por", accessor: "actorName" },
  { Header: "Estado", accessor: "estadoTexto" },
  { Header: "Creada", accessor: "creada" },
  { Header: "Expira", accessor: "expira" },
];

export default function Soporte() {
  const [sesiones, setSesiones] = useState([]);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [error, setError] = useState("");

  const [empresas, setEmpresas] = useState([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSupportSessions(
      (rows) => {
        if (!active) return;
        setSesiones(rows);
        setCargandoSesiones(false);
      },
      (err) => {
        if (!active) return;
        setError(err.message || "No se pudo conectar con Firestore.");
        setCargandoSesiones(false);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then((resultado) => {
        if (!active) return;
        setEmpresas(resultado.items);
        setCargandoEmpresas(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "No se pudieron cargar las empresas.");
        setCargandoEmpresas(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const empresasPorId = useMemo(() => {
    const map = new Map();
    empresas.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [empresas]);

  const filasSesiones = useMemo(
    () =>
      sesiones.map((sesion) => ({
        empresaNombre: empresasPorId.get(sesion.empresaId) || sesion.empresaId || "—",
        targetEmail: sesion.targetEmail || "—",
        targetRole: sesion.targetRole || "—",
        actorName: sesion.actorName || "—",
        estadoTexto: sesion.status || "—",
        creada: formatoFechaHora(sesion.createdAt),
        expira: formatoFechaHora(sesion.expiresAt),
      })),
    [sesiones, empresasPorId]
  );

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <NexxusCard extra="mb-5 w-full p-4">
        <div className="mb-3 text-lg font-bold text-navy-700 dark:text-white">
          Nueva sesión de soporte
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <select
            value={empresaSeleccionada}
            onChange={(event) => setEmpresaSeleccionada(event.target.value)}
            disabled={cargandoEmpresas}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:bg-charcoal dark:text-white md:w-72"
          >
            <option value="" className="dark:bg-charcoal">
              {cargandoEmpresas ? "Cargando empresas..." : "Selecciona una empresa"}
            </option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id} className="dark:bg-charcoal">
                {empresa.nombre}
              </option>
            ))}
          </select>

          <div className="group relative inline-flex w-full md:w-auto">
            <button
              type="button"
              disabled
              title="Requiere plan Blaze (Cloud Functions)"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white opacity-40 dark:bg-brand-400 md:w-auto"
            >
              Iniciar sesión de soporte
            </button>
          </div>

          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
            <MdLock className="text-sm" />
            Requiere plan Blaze (Cloud Functions)
          </span>
        </div>
      </NexxusCard>

      {cargandoSesiones ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">
          Cargando sesiones de soporte...
        </p>
      ) : filasSesiones.length === 0 ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">
          No hay sesiones de soporte registradas.
        </p>
      ) : (
        <RecordsTable
          title="Sesiones de soporte"
          columnsData={COLUMNAS_SESIONES}
          tableData={filasSesiones}
          delay={100}
        />
      )}
    </div>
  );
}
