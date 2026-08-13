import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import { MdOutlineCampaign, MdOutlineGroups, MdOutlinePriorityHigh } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RecordsTable from "views/nexxus/components/RecordsTable";
import Modal from "components/nexxus/Modal";

import { useAuth } from "context/AuthContext";
import {
  subscribeAnnouncements,
  subscribeEmpleados,
  subscribeDepartamentos,
  subscribeSedes,
} from "services/adminRepository";
import { etiquetaRol, formatoFechaHora, ROLE_OPTIONS } from "services/saFormat";

function mapAnuncioRow(row) {
  return {
    id: row.id,
    creadoPorId: row.autor_id,
    creadoPorNombre: row.datos?.creadoPorNombre || "",
    mensaje: row.contenido,
    prioridad: row.datos?.prioridad || "Normal",
    alcance: row.datos?.alcance || "todos",
    destinatarioIds: row.datos?.destinatarioIds || [],
    destinatariosTotal: row.datos?.destinatariosTotal || 0,
    fecha: row.created_at,
  };
}

const PRIORIDADES = ["Normal", "Alta", "Urgente"];

const ALCANCES = [
  { value: "todos", label: "Todos los empleados" },
  { value: "departamento", label: "Un departamento" },
  { value: "sede", label: "Una sede" },
  { value: "rol", label: "Un rol" },
  { value: "privado", label: "Empleados específicos" },
];

const columnsAnuncios = [
  { Header: "Fecha", accessor: "fechaTexto" },
  { Header: "Mensaje", accessor: "mensajeCorto" },
  { Header: "Alcance", accessor: "alcanceTexto" },
  { Header: "Prioridad", accessor: "prioridad" },
  { Header: "Destinatarios", accessor: "destinatarios" },
];

const FORM_VACIO = {
  mensaje: "",
  prioridad: "Normal",
  alcance: "todos",
  departamentoId: "",
  sedeId: "",
  rol: "",
  empleadoIds: [],
};

const truncar = (texto, max = 80) => {
  if (!texto) return "—";
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
};

async function logAudit({ empresaId, usuarioId, detalles }) {
  try {
    await supabase.from("audit_logs").insert({
      empresa_id: empresaId,
      actor_id: usuarioId,
      accion: "Publicó un anuncio",
      modulo: "Comunicación",
      detalles,
    });
  } catch {
    // El log de auditoría es un extra; nunca debe romper la operación principal.
  }
}

export default function ComunicacionAdmin() {
  const { user, perfil, empresaId } = useAuth();

  const [anuncios, setAnuncios] = useState(null);
  const [empleadosRaw, setEmpleadosRaw] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState(FORM_VACIO);
  const [publicando, setPublicando] = useState(false);
  const [showCrearAnuncio, setShowCrearAnuncio] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Supabase.");
    const unsubs = [
      subscribeAnnouncements(empresaId, (docs) => setAnuncios(docs.map((d) => mapAnuncioRow(d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleadosRaw(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSedes(empresaId, (docs) => setSedes(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const empleados = useMemo(() => {
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));
    const sedeMap = Object.fromEntries(sedes.map((s) => [s.id, s.nombre]));
    return empleadosRaw.map((u) => ({
      ...u,
      departamento: deptoMap[u.departamento_id] || "",
      sede: sedeMap[u.sede_id] || "",
      activo: u.estado_activo !== false,
    }));
  }, [empleadosRaw, departamentos, sedes]);

  const metricas = useMemo(() => {
    const lista = anuncios || [];
    const hoy = new Date();
    const esteMes = lista.filter((a) => {
      const fecha = new Date(a.fecha);
      return !Number.isNaN(fecha.getTime()) && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    }).length;

    const totalesDestinatarios = lista.reduce((sum, a) => sum + (a.destinatariosTotal || 0), 0);
    const alcancePromedio = lista.length > 0 ? Math.round(totalesDestinatarios / lista.length) : 0;

    const urgentes = lista.filter((a) => a.prioridad === "Urgente").length;

    return { esteMes, alcancePromedio, urgentes };
  }, [anuncios]);

  const widgets = [
    { icon: MdOutlineCampaign, title: "Anuncios este mes", subtitle: String(metricas.esteMes) },
    { icon: MdOutlineGroups, title: "Alcance promedio", subtitle: String(metricas.alcancePromedio) },
    { icon: MdOutlinePriorityHigh, title: "Anuncios urgentes", subtitle: String(metricas.urgentes) },
  ];

  const filasAnuncios = useMemo(
    () =>
      (anuncios || [])
        .slice()
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .map((a) => ({
          fechaTexto: formatoFechaHora(a.fecha),
          mensajeCorto: truncar(a.mensaje),
          alcanceTexto: ALCANCES.find((al) => al.value === a.alcance)?.label || a.alcance || "—",
          prioridad: a.prioridad || "Normal",
          destinatarios: String(a.destinatariosTotal ?? (a.destinatarioIds?.length || 0)),
        })),
    [anuncios]
  );

  const empleadosActivos = useMemo(
    () => empleados.filter((u) => u.activo !== false && u.estado_activo !== false),
    [empleados]
  );

  const toggleEmpleado = (id) => {
    setForm((f) => {
      const seleccionados = new Set(f.empleadoIds);
      if (seleccionados.has(id)) seleccionados.delete(id);
      else seleccionados.add(id);
      return { ...f, empleadoIds: [...seleccionados] };
    });
  };

  const resolverDestinatarios = () => {
    if (form.alcance === "todos") {
      return empleadosActivos;
    }
    if (form.alcance === "departamento") {
      const dep = departamentos.find((d) => d.id === form.departamentoId);
      const nombreDep = (dep?.nombre || "").trim().toLowerCase();
      if (!nombreDep) return [];
      return empleadosActivos.filter((u) => (u.departamento || "").trim().toLowerCase() === nombreDep);
    }
    if (form.alcance === "sede") {
      const sede = sedes.find((s) => s.id === form.sedeId);
      const nombreSede = (sede?.nombre || "").trim().toLowerCase();
      if (!nombreSede) return [];
      return empleadosActivos.filter((u) => (u.sede || "").trim().toLowerCase() === nombreSede);
    }
    if (form.alcance === "rol") {
      if (!form.rol) return [];
      return empleadosActivos.filter((u) => u.rol === form.rol);
    }
    if (form.alcance === "privado") {
      return empleadosActivos.filter((u) => form.empleadoIds.includes(u.id));
    }
    return [];
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    if (!empresaId || !user) return;
    if (!form.mensaje.trim()) {
      setError("Escribe el mensaje del anuncio.");
      return;
    }

    const destinatarios = resolverDestinatarios();
    if (destinatarios.length === 0) {
      setError("No hay destinatarios para el alcance seleccionado.");
      return;
    }

    if (
      !window.confirm(
        `Se enviará este anuncio a ${destinatarios.length} empleado(s). ¿Continuar?`
      )
    ) {
      return;
    }

    setPublicando(true);
    setError("");
    try {
      const dep = departamentos.find((d) => d.id === form.departamentoId);
      const sede = sedes.find((s) => s.id === form.sedeId);

      const { data: anuncio, error: insertError } = await supabase
        .from("anuncios")
        .insert({
          empresa_id: empresaId,
          autor_id: user.id,
          titulo: form.alcance,
          contenido: form.mensaje.trim(),
          datos: {
            creadoPorNombre: perfil?.nombre || user.email || "Admin",
            prioridad: form.prioridad,
            alcance: form.alcance,
            departamentoDestino: dep?.nombre || null,
            sedeDestino: sede?.nombre || null,
            rolDestino: form.alcance === "rol" ? form.rol : null,
            destinatarioIds: destinatarios.map((d) => d.id),
            destinatariosTotal: destinatarios.length,
          },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const { error: notifError } = await supabase.from("notificaciones").insert(
        destinatarios.map((dest) => ({
          empresa_id: empresaId,
          usuario_id: dest.id,
          tipo: "anuncio",
          titulo: "Nuevo anuncio",
          cuerpo: form.mensaje.trim(),
        }))
      );
      if (notifError) console.warn("No se pudieron crear todas las notificaciones", notifError);

      await logAudit({
        empresaId,
        usuarioId: user.id,
        detalles: `Anuncio enviado a ${destinatarios.length} empleado(s) (${form.alcance})`,
      });

      setForm(FORM_VACIO);
      setShowCrearAnuncio(false);
    } catch (err) {
      setError(err.message || "No se pudo publicar el anuncio.");
    } finally {
      setPublicando(false);
    }
  };

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {anuncios === null ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando comunicación...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Anuncios</h4>
            <button
              type="button"
              onClick={() => setShowCrearAnuncio(true)}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
            >
              Nuevo anuncio
            </button>
          </div>

          <Modal isOpen={showCrearAnuncio} onClose={() => setShowCrearAnuncio(false)} title="Nuevo anuncio">
            <div className="p-2">
              <form onSubmit={handlePublicar} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="com-mensaje" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Mensaje
                  </label>
                  <textarea
                    id="com-mensaje"
                    rows={4}
                    value={form.mensaje}
                    onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:text-white"
                    placeholder="Escribe el anuncio para tu equipo"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="com-prioridad" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                      Prioridad
                    </label>
                    <select
                      id="com-prioridad"
                      value={form.prioridad}
                      onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p} className="dark:bg-charcoal">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="com-alcance" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                      Alcance
                    </label>
                    <select
                      id="com-alcance"
                      value={form.alcance}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          alcance: e.target.value,
                          departamentoId: "",
                          sedeId: "",
                          rol: "",
                          empleadoIds: [],
                        }))
                      }
                      className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      {ALCANCES.map((a) => (
                        <option key={a.value} value={a.value} className="dark:bg-charcoal">
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.alcance === "departamento" ? (
                  <div>
                    <label htmlFor="com-departamento" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                      Departamento
                    </label>
                    <select
                      id="com-departamento"
                      value={form.departamentoId}
                      onChange={(e) => setForm((f) => ({ ...f, departamentoId: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      <option value="" className="dark:bg-charcoal">Selecciona un departamento</option>
                      {departamentos.map((dep) => (
                        <option key={dep.id} value={dep.id} className="dark:bg-charcoal">
                          {dep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {form.alcance === "sede" ? (
                  <div>
                    <label htmlFor="com-sede" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                      Sede
                    </label>
                    <select
                      id="com-sede"
                      value={form.sedeId}
                      onChange={(e) => setForm((f) => ({ ...f, sedeId: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      <option value="" className="dark:bg-charcoal">Selecciona una sede</option>
                      {sedes.map((sede) => (
                        <option key={sede.id} value={sede.id} className="dark:bg-charcoal">
                          {sede.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {form.alcance === "rol" ? (
                  <div>
                    <label htmlFor="com-rol" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                      Rol
                    </label>
                    <select
                      id="com-rol"
                      value={form.rol}
                      onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                      className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      <option value="" className="dark:bg-charcoal">Selecciona un rol</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value} className="dark:bg-charcoal">
                          {etiquetaRol(r.value)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {form.alcance === "privado" ? (
                  <div>
                    <p className="ml-3 text-sm font-bold text-navy-700 dark:text-white">Empleados destinatarios</p>
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:!border-white/10">
                      {empleadosActivos.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-white/50">No hay empleados activos en esta empresa.</p>
                      ) : (
                        empleadosActivos.map((emp) => (
                          <label key={emp.id} className="flex items-center gap-2 py-1 text-sm text-navy-700 dark:text-white">
                            <input
                              type="checkbox"
                              checked={form.empleadoIds.includes(emp.id)}
                              onChange={() => toggleEmpleado(emp.id)}
                            />
                            {emp.nombre || emp.id}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={publicando}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition duration-250 disabled:opacity-40 dark:bg-brand-400"
                  >
                    {publicando ? "Publicando..." : "Publicar anuncio"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCrearAnuncio(false)}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-100 px-6 text-sm font-medium text-gray-600 transition duration-250 dark:bg-white/5 dark:text-white/70"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <div className="mt-4">
            {filasAnuncios.length === 0 ? (
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">No hay anuncios registrados.</p>
            ) : (
              <RecordsTable
                title="Historial de anuncios"
                columnsData={columnsAnuncios}
                tableData={filasAnuncios}
                delay={150}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
