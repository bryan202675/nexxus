import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineCampaign,
  MdOutlineGroups,
  MdOutlinePriorityHigh,
  MdOutlineSearch,
  MdOutlineAdd,
  MdOutlineVisibility,
  MdOutlineDelete,
  MdOutlineCalendarMonth,
  MdOutlineHistory,
  MdOutlineNotificationImportant,
  MdOutlineSend,
  MdOutlineApartment,
  MdOutlineBadge,
  MdOutlinePerson,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import {
  subscribeAnnouncements,
  subscribeEmpleados,
  subscribeDepartamentos,
  subscribeSedes,
} from "services/adminRepository";
import { etiquetaRol, formatoFecha, formatoFechaHora, ROLE_OPTIONS } from "services/saFormat";

function mapAnuncioRow(row: any) {
  return {
    id: row.id,
    creadoPorId: row.autor_id,
    creadoPorNombre: row.datos?.creadoPorNombre || "Administrador",
    mensaje: row.contenido || "",
    prioridad: row.datos?.prioridad || "Normal",
    alcance: row.datos?.alcance || "todos",
    departamentoDestino: row.datos?.departamentoDestino || null,
    sedeDestino: row.datos?.sedeDestino || null,
    rolDestino: row.datos?.rolDestino || null,
    destinatarioIds: row.datos?.destinatarioIds || [],
    destinatariosTotal: Number(row.datos?.destinatariosTotal) || 0,
    fecha: row.created_at,
    datosRaw: row,
  };
}

const PRIORIDADES_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: any }> = {
  Normal: {
    label: "Normal",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
    icon: MdOutlineCampaign,
  },
  Alta: {
    label: "Alta Prioridad",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: MdOutlineNotificationImportant,
  },
  Urgente: {
    label: "Urgente",
    cls: "bg-rose-500/10 text-rose-600 font-black border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    dot: "bg-rose-500",
    icon: MdOutlinePriorityHigh,
  },
};

const ALCANCES = [
  { value: "todos", label: "Toda la Empresa" },
  { value: "departamento", label: "Departamento" },
  { value: "sede", label: "Sede de Trabajo" },
  { value: "rol", label: "Rol Específico" },
  { value: "privado", label: "Colaboradores Seleccionados" },
];

const PAGE_SIZE = 8;

const FORM_VACIO = {
  mensaje: "",
  prioridad: "Normal",
  alcance: "todos",
  departamentoId: "",
  sedeId: "",
  rol: "",
  empleadoIds: [] as string[],
};

export default function ComunicacionAdmin() {
  const { user, perfil, empresaId } = useAuth();

  const [anuncios, setAnuncios] = useState<any[] | null>(null);
  const [empleadosRaw, setEmpleadosRaw] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todos");
  const [filtroAlcance, setFiltroAlcance] = useState("todos");
  const [pagina, setPagina] = useState(1);

  // Modales
  const [showCrearAnuncio, setShowCrearAnuncio] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [publicando, setPublicando] = useState(false);
  const [crearError, setCrearError] = useState("");
  const [selectedAnuncio, setSelectedAnuncio] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con Supabase.");
    const unsubs = [
      subscribeAnnouncements(empresaId, (docs) => setAnuncios(docs.map((d) => mapAnuncioRow(d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleadosRaw(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSedes(empresaId, (docs) => setSedes(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
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

  const empleadosActivos = useMemo(
    () => empleados.filter((u) => u.activo !== false && u.estado_activo !== false),
    [empleados]
  );

  const metricas = useMemo(() => {
    const lista = anuncios || [];
    const hoy = new Date();
    const esteMes = lista.filter((a) => {
      const fecha = new Date(a.fecha);
      return (
        !Number.isNaN(fecha.getTime()) &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    }).length;

    const totalesDestinatarios = lista.reduce(
      (sum, a) => sum + (a.destinatariosTotal || a.destinatarioIds?.length || empleadosActivos.length || 0),
      0
    );
    const alcancePromedio = lista.length > 0 ? Math.round(totalesDestinatarios / lista.length) : empleadosActivos.length;
    const urgentes = lista.filter((a) => a.prioridad === "Urgente").length;

    return { esteMes, total: lista.length, alcancePromedio, urgentes };
  }, [anuncios, empleadosActivos]);

  // Filtrado
  const anunciosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (anuncios || [])
      .slice()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .filter((a) => {
        if (filtroPrioridad !== "todos" && a.prioridad !== filtroPrioridad) return false;
        if (filtroAlcance !== "todos" && a.alcance !== filtroAlcance) return false;

        if (!q) return true;
        const campos = [a.mensaje, a.creadoPorNombre, a.alcance, a.prioridad, a.departamentoDestino, a.sedeDestino];
        return campos.some((c) => (c || "").toLowerCase().includes(q));
      });
  }, [anuncios, busqueda, filtroPrioridad, filtroAlcance]);

  const totalPaginas = Math.max(1, Math.ceil(anunciosFiltrados.length / PAGE_SIZE));
  const anunciosPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return anunciosFiltrados.slice(start, start + PAGE_SIZE);
  }, [anunciosFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroPrioridad, filtroAlcance]);

  const toggleEmpleado = (id: string) => {
    setForm((f) => {
      const seleccionados = new Set(f.empleadoIds);
      if (seleccionados.has(id)) seleccionados.delete(id);
      else seleccionados.add(id);
      return { ...f, empleadoIds: [...seleccionados] };
    });
  };

  const resolverDestinatarios = () => {
    if (form.alcance === "todos") return empleadosActivos;
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

  const handlePublicar = async (e: any) => {
    e.preventDefault();
    if (!empresaId || !user) return;
    if (!form.mensaje.trim()) {
      setCrearError("Escribe el contenido del anuncio.");
      return;
    }

    const destinatarios = resolverDestinatarios();
    if (destinatarios.length === 0) {
      setCrearError("No hay destinatarios encontrados para el alcance seleccionado.");
      return;
    }

    setPublicando(true);
    setCrearError("");
    try {
      const dep = departamentos.find((d) => d.id === form.departamentoId);
      const sede = sedes.find((s) => s.id === form.sedeId);

      const { error: insertError } = await supabase.from("anuncios").insert({
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
      });
      if (insertError) throw insertError;

      // Generar notificaciones en segundo plano
      try {
        await supabase.from("notificaciones").insert(
          destinatarios.map((dest) => ({
            empresa_id: empresaId,
            usuario_id: dest.id,
            tipo: "anuncio",
            titulo: form.prioridad === "Urgente" ? "⚠️ Anuncio Urgente" : "Nuevo anuncio corporativo",
            cuerpo: form.mensaje.trim().slice(0, 150),
          }))
        );
      } catch {
        // Notificación auxiliar
      }

      await supabase.from("audit_logs").insert({
        empresa_id: empresaId,
        actor_id: user.id,
        accion: "Publicó un anuncio",
        modulo: "Comunicación",
        detalles: `Anuncio enviado a ${destinatarios.length} colaborador(es) (${form.alcance})`,
      });

      setForm(FORM_VACIO);
      setShowCrearAnuncio(false);
    } catch (err: any) {
      setCrearError(err.message || "No se pudo publicar el anuncio.");
    } finally {
      setPublicando(false);
    }
  };

  const handleEliminarAnuncio = async (anuncio: any) => {
    if (!window.confirm("¿Eliminar este anuncio del historial corporativo?")) return;
    setBusyId(anuncio.id);
    setError("");
    try {
      const { error: delError } = await supabase.from("anuncios").delete().eq("id", anuncio.id);
      if (delError) throw delError;
      if (selectedAnuncio?.id === anuncio.id) setSelectedAnuncio(null);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el anuncio.");
    } finally {
      setBusyId("");
    }
  };

  const cargando = anuncios === null;

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          No se pudo determinar la empresa asociada a este usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Comunicación Interna & Novedades
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Emisión de comunicados oficiales, avisos urgentes y novedades para la organización.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCrearError("");
            setForm(FORM_VACIO);
            setShowCrearAnuncio(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
        >
          <MdOutlineAdd className="h-4 w-4" />
          <span>Nuevo Anuncio</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Anuncios este Mes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metricas.esteMes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCampaign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Período actual</span>
            <span className="font-bold text-emerald-600">Al día</span>
          </div>
        </NexxusCard>

        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Alcance Promedio
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {metricas.alcancePromedio}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineGroups className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Colaboradores por emisión</span>
            <span className="font-bold text-blue-600">Audiencia activa</span>
          </div>
        </NexxusCard>

        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Anuncios Urgentes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {metricas.urgentes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlinePriorityHigh className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Alertas de máxima prioridad</span>
            <span className={metricas.urgentes > 0 ? "font-bold text-amber-600" : "font-bold text-gray-400"}>
              {metricas.urgentes > 0 ? "Atención activa" : "Sin alertas"}
            </span>
          </div>
        </NexxusCard>

        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total Histórico
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {metricas.total}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlineHistory className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Historial indexado</span>
            <span className="font-bold text-purple-600">Registro</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Historial de Comunicados
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {anunciosFiltrados.length} anuncios registrados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por mensaje, autor o alcance..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroPrioridad("todos")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroPrioridad === "todos"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Todos ({anuncios?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFiltroPrioridad("Normal")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroPrioridad === "Normal"
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setFiltroPrioridad("Alta")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroPrioridad === "Alta"
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Alta Prioridad
            </button>
            <button
              type="button"
              onClick={() => setFiltroPrioridad("Urgente")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroPrioridad === "Urgente"
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Urgente ({metricas.urgentes})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroAlcance}
              onChange={(e) => setFiltroAlcance(e.target.value)}
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todos">Todos los alcances</option>
              {ALCANCES.map((alc) => (
                <option key={alc.value} value={alc.value}>
                  {alc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando comunicados...
            </p>
          </div>
        ) : anunciosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineCampaign className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron comunicados
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {busqueda || filtroPrioridad !== "todos" || filtroAlcance !== "todos"
                ? "Prueba a cambiar los filtros o el término de búsqueda."
                : "Publica tu primer anuncio corporativo con el botón 'Nuevo Anuncio'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Mensaje / Comunicado
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Alcance
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Prioridad
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Destinatarios
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha de Emisión
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {anunciosPaginados.map((anuncio) => {
                  const prioInfo = PRIORIDADES_CONFIG[anuncio.prioridad] || PRIORIDADES_CONFIG.Normal;
                  const Icon = prioInfo.icon;
                  const isBusy = busyId === anuncio.id;
                  const alcanceLabel =
                    ALCANCES.find((al) => al.value === anuncio.alcance)?.label || anuncio.alcance || "Toda la Empresa";

                  return (
                    <tr
                      key={anuncio.id}
                      onClick={() => setSelectedAnuncio(anuncio)}
                      className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Mensaje */}
                      <td className="min-w-[260px] max-w-md px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-bold text-navy-700 dark:text-white">
                              {anuncio.mensaje}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-gray-400 dark:text-white/50">
                              Por {anuncio.creadoPorNombre}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Alcance */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white/70">
                          {anuncio.departamentoDestino || anuncio.sedeDestino || alcanceLabel}
                        </span>
                      </td>

                      {/* Prioridad */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${prioInfo.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${prioInfo.dot}`} />
                          {prioInfo.label}
                        </span>
                      </td>

                      {/* Destinatarios */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-white/70">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineGroups className="h-4 w-4 text-gray-400" />
                          <span>
                            {anuncio.destinatariosTotal || anuncio.destinatarioIds?.length || empleadosActivos.length}{" "}
                            colaboradores
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
                        {formatoFechaHora(anuncio.fecha)}
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAnuncio(anuncio)}
                            className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-2.5 py-1.5 text-xs font-bold text-brand-500 transition hover:bg-brand-500/10 dark:bg-white/5 dark:text-brand-300"
                          >
                            <MdOutlineVisibility className="h-3.5 w-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleEliminarAnuncio(anuncio)}
                            className="inline-flex items-center rounded-xl p-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            title="Eliminar anuncio"
                          >
                            <MdOutlineDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {anunciosFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {anunciosFiltrados.length} anuncios en total
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

      <Modal
        isOpen={showCrearAnuncio}
        onClose={() => setShowCrearAnuncio(false)}
        title="Publicar Nuevo Comunicado"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handlePublicar} className="flex flex-col gap-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-mensaje">
                Contenido del Anuncio *
              </label>
              <textarea
                id="anuncio-mensaje"
                rows={4}
                placeholder="Escribe el mensaje o circular para tu equipo de trabajo..."
                value={form.mensaje}
                onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-prioridad">
                  Nivel de Prioridad
                </label>
                <select
                  id="anuncio-prioridad"
                  value={form.prioridad}
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta Prioridad</option>
                  <option value="Urgente">Urgente / Crítico</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-alcance">
                  Alcance / Destinatarios
                </label>
                <select
                  id="anuncio-alcance"
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
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  {ALCANCES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condicionales por Alcance */}
            {form.alcance === "departamento" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-depto">
                  Seleccionar Departamento
                </label>
                <select
                  id="anuncio-depto"
                  value={form.departamentoId}
                  onChange={(e) => setForm((f) => ({ ...f, departamentoId: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="">Selecciona un departamento...</option>
                  {departamentos.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "sede" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-sede">
                  Seleccionar Sede de Trabajo
                </label>
                <select
                  id="anuncio-sede"
                  value={form.sedeId}
                  onChange={(e) => setForm((f) => ({ ...f, sedeId: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="">Selecciona una sede...</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "rol" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="anuncio-rol">
                  Seleccionar Rol Destinatario
                </label>
                <select
                  id="anuncio-rol"
                  value={form.rol}
                  onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className="mt-1 flex h-9.5 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="">Selecciona un rol...</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {etiquetaRol(r.value)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.alcance === "privado" && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 mb-1">
                  Colaboradores Destinatarios ({form.empleadoIds.length} seleccionados)
                </p>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2 dark:border-white/10 dark:bg-charcoal">
                  {empleadosActivos.length === 0 ? (
                    <p className="p-2 text-xs text-gray-400">No hay colaboradores activos.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {empleadosActivos.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-white cursor-pointer dark:hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={form.empleadoIds.includes(emp.id)}
                            onChange={() => toggleEmpleado(emp.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                          />
                          <span className="truncate text-xs font-semibold text-navy-700 dark:text-white">
                            {emp.nombre}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {crearError && <p className="text-xs font-bold text-red-500">{crearError}</p>}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCrearAnuncio(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={publicando}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
              >
                <MdOutlineSend className="h-3.5 w-3.5" />
                <span>{publicando ? "Emitiendo..." : "Publicar Anuncio"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedAnuncio}
        onClose={() => setSelectedAnuncio(null)}
        title="Detalle del Comunicado"
        width="max-w-md"
      >
        {selectedAnuncio ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineCampaign className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedAnuncio.creadoPorNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {formatoFechaHora(selectedAnuncio.fecha)}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (PRIORIDADES_CONFIG[selectedAnuncio.prioridad] || PRIORIDADES_CONFIG.Normal).cls
                }`}
              >
                {(PRIORIDADES_CONFIG[selectedAnuncio.prioridad] || PRIORIDADES_CONFIG.Normal).label}
              </span>
            </div>

            {/* Mensaje Completo */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">
                Mensaje Oficial
              </p>
              <p className="text-xs leading-relaxed text-navy-700 dark:text-white/90 font-medium whitespace-pre-wrap">
                {selectedAnuncio.mensaje}
              </p>
            </div>

            {/* Alcance y Destinatarios */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/60 px-1">
              <span>
                Alcance:{" "}
                <strong className="text-navy-700 dark:text-white">
                  {selectedAnuncio.departamentoDestino ||
                    selectedAnuncio.sedeDestino ||
                    ALCANCES.find((a) => a.value === selectedAnuncio.alcance)?.label ||
                    "Toda la Empresa"}
                </strong>
              </span>
              <span>
                {selectedAnuncio.destinatariosTotal ||
                  selectedAnuncio.destinatarioIds?.length ||
                  empleadosActivos.length}{" "}
                destinatarios
              </span>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAnuncio(null)}
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
