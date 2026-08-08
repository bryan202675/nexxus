import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineDescription,
  MdOutlineStorage,
  MdOutlineMarkEmailUnread,
  MdOutlineCalendarMonth,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DataTable from "views/nexxus/components/DataTable";

import { useAuth } from "context/AuthContext";
import { subscribeDocumentos, subscribeEmpleados } from "services/adminRepository";

function mapDocumentoRow(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    tipo: row.categoria,
    size: row.tamano_bytes,
    fechaSubida: row.created_at,
    leido: row.leido,
    createdBy: row.usuario_id,
  };
}

const TIPO_LABEL = {
  nomina: "Nómina",
  contrato: "Contrato",
  rrhh: "RRHH",
  certificado: "Certificado",
  evaluacion: "Evaluación",
  otro: "Otro",
};

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)));
  const size = value / 1024 ** exponent;
  return `${exponent === 0 ? size : size.toFixed(1)} ${units[exponent]}`;
}

function formatoFechaCorta(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-SV", { year: "numeric", month: "short", day: "2-digit" });
}

export default function GestionDocumentos() {
  const { empresaId } = useAuth();

  const [documentos, setDocumentos] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Supabase.");
    const unsubs = [
      subscribeDocumentos(empresaId, (docs) => setDocumentos(docs.map((d) => mapDocumentoRow(d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map();
    empleados.forEach((e) => map.set(e.id, e));
    return map;
  }, [empleados]);

  const stats = useMemo(() => {
    const lista = documentos || [];
    const totalBytes = lista.reduce((sum, d) => sum + (Number(d.size) || 0), 0);
    const uploadCount = lista.length;
    const sinLeer = lista.filter((d) => !d.leido).length;

    const ahora = new Date();
    const esteMes = lista.filter((d) => {
      const fecha = new Date(d.fechaSubida);
      if (Number.isNaN(fecha.getTime())) return false;
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
    }).length;

    const porUsuario = new Map();
    lista.forEach((d) => {
      const userId = d.createdBy || d.userId || "desconocido";
      const size = Number(d.size) || 0;
      porUsuario.set(userId, (porUsuario.get(userId) || 0) + size);
    });
    const topUsuarios = [...porUsuario.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, bytes]) => ({
        userId,
        nombre: empleadosPorId.get(userId)?.nombre || userId,
        bytes,
      }));

    return { totalBytes, uploadCount, sinLeer, esteMes, topUsuarios };
  }, [documentos, empleadosPorId]);

  async function handleToggleLeido(documento) {
    setBusyId(documento.id);
    setError("");
    try {
      const { error } = await supabase.from("documentos").update({ leido: !documento.leido }).eq("id", documento.id);
      if (error) throw error;
    } catch (err) {
      setError(err.message || "No se pudo actualizar el documento.");
    } finally {
      setBusyId("");
    }
  }

  async function handleEliminar(documento) {
    if (!window.confirm(`¿Eliminar el documento "${documento.titulo || documento.id}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusyId(documento.id);
    setError("");
    try {
      const { error } = await supabase.from("documentos").delete().eq("id", documento.id);
      if (error) throw error;
    } catch (err) {
      setError(err.message || "No se pudo eliminar el documento.");
    } finally {
      setBusyId("");
    }
  }

  const columnasDocumentos = [
    { Header: "Título", accessor: "titulo" },
    { Header: "Tipo", accessor: "tipo" },
    { Header: "Tamaño", accessor: "tamano" },
    { Header: "Fecha", accessor: "fecha" },
    { Header: "Leído", accessor: "leidoToggle" },
    { Header: "Acciones", accessor: "acciones" },
  ];

  const filasDocumentos = useMemo(
    () =>
      (documentos || []).map((documento) => {
        const busy = busyId === documento.id;
        return {
          id: documento.id,
          titulo: documento.titulo || "—",
          tipo: TIPO_LABEL[documento.tipo] || documento.tipo || "—",
          tamano: formatBytes(documento.size),
          fecha: formatoFechaCorta(documento.fechaSubida),
          leidoToggle: (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleToggleLeido(documento)}
              className={`rounded-full px-3 py-1 text-xs font-bold disabled:opacity-40 ${
                documento.leido
                  ? "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
              }`}
            >
              {busy ? "..." : documento.leido ? "Leído" : "Sin leer"}
            </button>
          ),
          acciones: (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleEliminar(documento)}
              className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-500 disabled:opacity-40 dark:bg-red-400/10 dark:text-red-400"
            >
              Eliminar
            </button>
          ),
        };
      }),
    [documentos, busyId]
  );

  const widgets = [
    { icon: MdOutlineDescription, title: "Total documentos", subtitle: String(stats.uploadCount) },
    { icon: MdOutlineStorage, title: "Espacio usado", subtitle: formatBytes(stats.totalBytes) },
    { icon: MdOutlineMarkEmailUnread, title: "Sin leer", subtitle: String(stats.sinLeer) },
    { icon: MdOutlineCalendarMonth, title: "Documentos este mes", subtitle: String(stats.esteMes) },
  ];

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  const cargando = documentos === null;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando documentos...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <NexxusCard extra="mt-8 w-full p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-bold text-navy-700 dark:text-white">Subir documento</h4>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Sube documentos desde la app principal por ahora.
                </p>
              </div>
              <div className="group relative inline-flex w-fit">
                <button
                  type="button"
                  disabled
                  title="Sube documentos desde la app principal por ahora"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white opacity-40 dark:bg-brand-400"
                >
                  Subir documento
                </button>
              </div>
            </div>
          </NexxusCard>

          {filasDocumentos.length === 0 ? (
            <NexxusCard extra="mt-8 w-full p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                No hay documentos registrados para esta empresa.
              </p>
            </NexxusCard>
          ) : (
            <div className="mt-8">
              <DataTable title="Documentos" columnsData={columnasDocumentos} tableData={filasDocumentos} delay={100} />
            </div>
          )}

          {stats.topUsuarios.length > 0 ? (
            <NexxusCard extra="mt-8 w-full p-4">
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Mayor uso de espacio</h4>
              <div className="flex flex-col gap-3">
                {stats.topUsuarios.map((u) => (
                  <div key={u.userId} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-charcoal-light">
                    <p className="text-sm font-bold text-navy-700 dark:text-white">{u.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-white/50">{formatBytes(u.bytes)}</p>
                  </div>
                ))}
              </div>
            </NexxusCard>
          ) : null}
        </>
      )}
    </div>
  );
}
