import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  MdOutlineToday,
  MdOutlineDateRange,
  MdOutlinePeopleAlt,
  MdOutlineEvent,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import InputField from "components/fields/InputField";

import { useAuth } from "context/AuthContext";
import { db, subscribeCalendario, subscribeEmpleados } from "services/adminRepository";
import { formatoFechaHora } from "services/saFormat";

const TIPOS = [
  { value: "reunion", label: "Reunión", badge: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400" },
  { value: "recordatorio", label: "Recordatorio", badge: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400" },
  { value: "capacitacion", label: "Capacitación", badge: "bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400" },
  { value: "vacaciones", label: "Vacaciones", badge: "bg-green-50 text-green-600 dark:bg-green-400/10 dark:text-green-400" },
  { value: "turno", label: "Turno", badge: "bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400" },
  { value: "corporativo", label: "Corporativo", badge: "bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400" },
];

const tipoInfo = (tipo) => TIPOS.find((t) => t.value === tipo) || { label: tipo || "Evento", badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70" };

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toDatetimeLocal = (date) => {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const mismodia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const inicioSemana = (fecha) => {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 domingo .. 6 sabado
  const diff = dia === 0 ? -6 : 1 - dia; // llevar a lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const FORM_VACIO = { titulo: "", descripcion: "", tipo: "reunion", inicio: "", fin: "", empleadoIds: [] };

export default function CalendarioEmpresarial() {
  const { user, empresaId } = useAuth();

  const [eventos, setEventos] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
    const unsubs = [
      subscribeCalendario(empresaId, (docs) => setEventos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const eventosOrdenados = useMemo(() => {
    return [...(eventos || [])]
      .map((e) => ({ ...e, inicioFecha: toDate(e.inicio), finFecha: toDate(e.fin) }))
      .sort((a, b) => (a.inicioFecha?.getTime() || 0) - (b.inicioFecha?.getTime() || 0));
  }, [eventos]);

  const metricas = useMemo(() => {
    const lista = eventos || [];
    const hoy = new Date();
    const inicioSem = inicioSemana(hoy);
    const finSem = new Date(inicioSem);
    finSem.setDate(finSem.getDate() + 7);

    let eventosHoy = 0;
    let eventosSemana = 0;
    const empleadosSet = new Set();

    lista.forEach((e) => {
      const inicio = toDate(e.inicio);
      if (inicio) {
        if (mismodia(inicio, hoy)) eventosHoy += 1;
        if (inicio >= inicioSem && inicio < finSem) eventosSemana += 1;
      }
      (e.empleadoIds || []).forEach((id) => empleadosSet.add(id));
    });

    return { eventosHoy, eventosSemana, empleadosAsignados: empleadosSet.size, total: lista.length };
  }, [eventos]);

  const widgets = [
    { icon: MdOutlineToday, title: "Eventos hoy", subtitle: String(metricas.eventosHoy) },
    { icon: MdOutlineDateRange, title: "Eventos esta semana", subtitle: String(metricas.eventosSemana) },
    { icon: MdOutlinePeopleAlt, title: "Empleados con eventos", subtitle: String(metricas.empleadosAsignados) },
    { icon: MdOutlineEvent, title: "Total de eventos", subtitle: String(metricas.total) },
  ];

  const resetForm = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
  };

  const seleccionarEvento = (evento) => {
    setEditandoId(evento.id);
    setForm({
      titulo: evento.titulo || "",
      descripcion: evento.descripcion || "",
      tipo: evento.tipo || "reunion",
      inicio: toDatetimeLocal(toDate(evento.inicio)),
      fin: toDatetimeLocal(toDate(evento.fin)),
      empleadoIds: evento.empleadoIds || [],
    });
  };

  const toggleEmpleado = (id) => {
    setForm((f) => {
      const seleccionados = new Set(f.empleadoIds);
      if (seleccionados.has(id)) seleccionados.delete(id);
      else seleccionados.add(id);
      return { ...f, empleadoIds: [...seleccionados] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!empresaId || !user) return;
    if (!form.titulo.trim() || !form.inicio || !form.fin) {
      setError("Completa título, inicio y fin del evento.");
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
        inicio: new Date(form.inicio).toISOString(),
        fin: new Date(form.fin).toISOString(),
        empleadoIds: form.empleadoIds,
        empleadoNombres,
      };

      if (editandoId) {
        await updateDoc(doc(db, "calendario_empresarial", editandoId), {
          ...payload,
          actualizadoEn: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "calendario_empresarial"), {
          ...payload,
          empresaId,
          creadoPor: user.uid,
          creadoEn: serverTimestamp(),
        });
      }
      resetForm();
    } catch (err) {
      setError(err.message || "No se pudo guardar el evento.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!editandoId) return;
    if (!window.confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    setGuardando(true);
    setError("");
    try {
      await deleteDoc(doc(db, "calendario_empresarial", editandoId));
      resetForm();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el evento.");
    } finally {
      setGuardando(false);
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

      {eventos === null ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando calendario...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <NexxusCard extra="p-4" delay={100}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
                {editandoId ? "Editar evento" : "Crear evento"}
              </h4>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Título"
                  id="cal-titulo"
                  placeholder="Título del evento"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                />

                <div>
                  <label htmlFor="cal-descripcion" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Descripción
                  </label>
                  <textarea
                    id="cal-descripcion"
                    rows={3}
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:text-white"
                    placeholder="Detalles del evento (opcional)"
                  />
                </div>

                <div>
                  <label htmlFor="cal-tipo" className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                    Tipo
                  </label>
                  <select
                    id="cal-tipo"
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                    className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value} className="dark:bg-charcoal">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    label="Inicio"
                    id="cal-inicio"
                    type="datetime-local"
                    value={form.inicio}
                    onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
                  />
                  <InputField
                    label="Fin"
                    id="cal-fin"
                    type="datetime-local"
                    value={form.fin}
                    onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value }))}
                  />
                </div>

                <div>
                  <p className="ml-3 text-sm font-bold text-navy-700 dark:text-white">Empleados asignados</p>
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:!border-white/10">
                    {empleados.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-white/50">No hay empleados en esta empresa.</p>
                    ) : (
                      empleados.map((emp) => (
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

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex h-11 items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-medium text-white transition duration-250 disabled:opacity-40 dark:bg-brand-400"
                  >
                    {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear evento"}
                  </button>
                  {editandoId ? (
                    <>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={guardando}
                        className="flex h-11 items-center justify-center rounded-xl bg-lightPrimary px-6 text-sm font-medium text-brand-500 transition duration-250 disabled:opacity-40 dark:bg-charcoal-light dark:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleEliminar}
                        disabled={guardando}
                        className="flex h-11 items-center justify-center rounded-xl bg-red-50 px-6 text-sm font-medium text-red-500 transition duration-250 disabled:opacity-40 dark:bg-red-400/10 dark:text-red-400"
                      >
                        Eliminar
                      </button>
                    </>
                  ) : null}
                </div>
              </form>
            </NexxusCard>

            <NexxusCard extra="p-4" delay={150}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Próximos eventos</h4>
              {eventosOrdenados.length === 0 ? (
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">No hay eventos registrados.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {eventosOrdenados.map((evento) => {
                    const info = tipoInfo(evento.tipo);
                    return (
                      <button
                        key={evento.id}
                        type="button"
                        onClick={() => seleccionarEvento(evento)}
                        className={`flex flex-col gap-1 rounded-lg p-3 text-left transition-colors duration-250 hover:bg-gray-50 dark:hover:bg-charcoal-light ${
                          editandoId === evento.id ? "bg-gray-50 dark:bg-charcoal-light" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-navy-700 dark:text-white">{evento.titulo}</p>
                          <span className={`rounded-full px-2 py-1 text-xs font-bold ${info.badge}`}>{info.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-white/50">
                          {formatoFechaHora(evento.inicioFecha)} — {formatoFechaHora(evento.finFecha)}
                        </p>
                        {evento.empleadoNombres?.length ? (
                          <p className="text-xs text-gray-500 dark:text-white/50">
                            {evento.empleadoNombres.join(", ")}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </NexxusCard>
          </div>
        </>
      )}
    </div>
  );
}
