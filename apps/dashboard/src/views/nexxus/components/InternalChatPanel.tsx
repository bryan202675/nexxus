import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAdd,
  MdSend,
  MdDeleteOutline,
  MdOutlineAttachFile,
  MdOutlineSearch,
  MdOutlineChatBubbleOutline,
  MdOutlineDoneAll,
  MdOutlineGroups,
  MdOutlinePerson,
  MdOutlineCheck,
} from "react-icons/md";
import { supabase } from "supabaseClient/supabaseConfig";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { subscribeEmpleados, subscribeDepartamentos } from "services/adminRepository";
import { subirAdjuntoChat, validarAdjuntoChat } from "services/chatUpload";

const textValue = (value: any, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const mapEmpleado = (docSnap: any) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    foto: textValue(data.foto_perfil || data.foto),
    departamentoId: data.departamento_id,
    cargo: data.cargo,
  };
};

const mapConversacion = (row: any) => ({
  id: row.id,
  titulo: row.datos?.titulo || "",
  tipo: row.datos?.tipo || "directa",
  participanteIds: Array.isArray(row.participante_ids) ? row.participante_ids : [],
  participantes: Array.isArray(row.datos?.participantes) ? row.datos.participantes : [],
  eliminadoPor: Array.isArray(row.datos?.eliminadoPor) ? row.datos.eliminadoPor : [],
  ultimoMensaje: row.ultimo_mensaje,
  ultimoMensajeAt: row.ultimo_mensaje_at,
});

const mapMensaje = (row: any) => ({
  id: row.id,
  remitenteId: row.remitente_id,
  remitenteNombre: row.datos?.remitenteNombre || "",
  texto: row.contenido || "",
  adjuntos: row.datos?.adjuntos || [],
  leidoPor: Array.isArray(row.leido_por) ? row.leido_por : [],
  timestamp: row.created_at,
});

const formatoHoraMensaje = (valor: any) => {
  if (!valor) return "";
  try {
    const fecha = typeof valor === "string" ? new Date(valor) : valor.toDate?.() || new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    return fecha.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatoFechaConversacion = (valor: any) => {
  if (!valor) return "";
  try {
    const fecha = typeof valor === "string" ? new Date(valor) : valor.toDate?.() || new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return fecha.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
    }
    if (fecha.toDateString() === ayer.toDateString()) {
      return "Ayer";
    }
    return fecha.toLocaleDateString("es-SV", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
};

const formatoSeparadorFecha = (valor: any) => {
  if (!valor) return "";
  try {
    const fecha = typeof valor === "string" ? new Date(valor) : valor.toDate?.() || new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
    if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
    return fecha.toLocaleDateString("es-SV", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
};

function UnreadBadge({ conversacionId, uid }: { conversacionId: string; uid?: string }) {
  const [noLeido, setNoLeido] = useState(false);

  useEffect(() => {
    if (!conversacionId || !uid) return undefined;
    const load = async () => {
      const { data } = await supabase
        .from("mensajes")
        .select("remitente_id, leido_por")
        .eq("conversacion_id", conversacionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) {
        setNoLeido(false);
        return;
      }
      const leidoPor = Array.isArray(data.leido_por) ? data.leido_por : [];
      setNoLeido(data.remitente_id !== uid && !leidoPor.includes(uid));
    };
    load();
    const channel = supabase
      .channel(`unread:${conversacionId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${conversacionId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId, uid]);

  if (!noLeido) return null;
  return (
    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[9.5px] font-black text-white shadow-xs animate-pulse">
      Nuevo
    </span>
  );
}

export default function InternalChatPanel({
  title = "Mensajería & Chat Corporativo",
  description = "Comunícate en tiempo real con colaboradores, equipos y líderes de departamento.",
}: {
  title?: string;
  description?: string;
}) {
  const { user, perfil, empresaId } = useAuth();

  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(true);
  const [error, setError] = useState("");

  const [empleados, setEmpleados] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);

  // Filtros de conversaciones
  const [busquedaConv, setBusquedaConv] = useState("");
  const [filtroTipoConv, setFiltroTipoConv] = useState<"todas" | "directas" | "grupos">("todas");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [mensajesError, setMensajesError] = useState("");

  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Nueva Conversación
  const [showNuevo, setShowNuevo] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");
  const [seleccionIds, setSeleccionIds] = useState<string[]>([]);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [creandoError, setCreandoError] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const mensajesFinRef = useRef<HTMLDivElement | null>(null);

  // --- Lista de conversaciones donde participa el usuario ---
  useEffect(() => {
    if (!empresaId || !user?.id) return undefined;
    const load = async (isInitial = false) => {
      if (isInitial) setCargandoConversaciones(true);
      const { data, error: loadError } = await supabase
        .from("conversaciones")
        .select("*")
        .eq("empresa_id", empresaId)
        .contains("participante_ids", [user.id])
        .order("ultimo_mensaje_at", { ascending: false });
      if (loadError) {
        setError(loadError.message || "No se pudieron cargar las conversaciones.");
        setCargandoConversaciones(false);
        return;
      }
      const filas = (data || []).map(mapConversacion).filter((c) => !c.eliminadoPor.includes(user.id));
      setConversaciones(filas);
      setCargandoConversaciones(false);

      if (filas.length > 0 && !selectedId) {
        setSelectedId(filas[0].id);
      }
    };
    load(true);
    const channel = supabase
      .channel(`conversaciones:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversaciones", filter: `empresa_id=eq.${empresaId}` },
        () => load(false)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, user?.id]);

  // --- Compañeros de la empresa ---
  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubs = [
      subscribeEmpleados(
        empresaId,
        (docs) => setEmpleados(docs.map(mapEmpleado).filter((e) => e.id !== user?.id)),
        (err) => setError(err.message || "No se pudieron cargar los compañeros.")
      ),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId, user?.id]);

  // --- Mensajes de la conversación seleccionada ---
  useEffect(() => {
    if (!selectedId) {
      setMensajes([]);
      return undefined;
    }
    setCargandoMensajes(true);
    setMensajesError("");
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", selectedId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (loadError) {
        setMensajesError(loadError.message || "No se pudieron cargar los mensajes.");
        setCargandoMensajes(false);
        return;
      }
      setMensajes((data || []).map(mapMensaje));
      setCargandoMensajes(false);
    };
    load();
    const channel = supabase
      .channel(`mensajes:${selectedId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${selectedId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // --- Marcar como leídos los mensajes ---
  useEffect(() => {
    if (!selectedId || !user?.id || mensajes.length === 0) return;
    mensajes
      .filter((m) => !m.leidoPor.includes(user.id))
      .forEach((m) => {
        supabase
          .from("mensajes")
          .update({ leido_por: [...m.leidoPor, user.id] })
          .eq("id", m.id)
          .then(({ error }) => {
            if (error) console.error("Error al marcar mensaje como leído:", error);
          });
      });
  }, [selectedId, mensajes, user?.id]);

  useEffect(() => {
    mensajesFinRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes.length, selectedId]);

  const fotoPorEmpleadoId = useMemo(() => {
    const map = new Map<string, string>();
    empleados.forEach((emp) => {
      if (emp.foto) map.set(emp.id, emp.foto);
    });
    return map;
  }, [empleados]);

  const empleadoPorId = useMemo(() => {
    const map = new Map<string, any>();
    empleados.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [empleados]);

  const conversacionSeleccionada = useMemo(
    () => conversaciones.find((c) => c.id === selectedId) || null,
    [conversaciones, selectedId]
  );

  const esGrupoConv = (c: any) => {
    if (!c) return false;
    if (c.tipo === "equipo" || c.tipo === "grupo") return true;
    if (textValue(c.titulo)) return true;
    if (Array.isArray(c.participanteIds) && c.participanteIds.length > 2) return true;
    if (Array.isArray(c.participantes) && c.participantes.length > 2) return true;
    return false;
  };

  const obtenerParticipantesDeConv = (c: any) => {
    if (!c) return [];
    if (Array.isArray(c.participantes) && c.participantes.length > 0) {
      return c.participantes.map((p: any) => ({
        ...p,
        nombre: p.nombre || empleadoPorId.get(p.id)?.nombre || "Colaborador",
        foto: fotoPorEmpleadoId.get(p.id) || p.foto || empleadoPorId.get(p.id)?.foto || "",
      }));
    }
    return (c.participanteIds || []).map((id: string) => {
      if (id === user?.id) {
        return { id: user.id, nombre: perfil?.nombre || user?.email || "Yo", foto: textValue(perfil?.foto_perfil) };
      }
      const emp = empleadoPorId.get(id);
      return {
        id,
        nombre: emp?.nombre || "Colaborador",
        foto: emp?.foto || "",
      };
    });
  };

  const tituloConversacion = (c: any) => {
    if (textValue(c.titulo)) return c.titulo;
    const participantesCalculados = obtenerParticipantesDeConv(c);
    const otros = participantesCalculados.filter((p: any) => p.id !== user?.id);
    if (otros.length > 0) return otros.map((p: any) => p.nombre).join(", ");
    return "Conversación";
  };

  // Filtrado de conversaciones: Directas excluye estrictamente los grupos
  const conversacionesFiltradas = useMemo(() => {
    const q = busquedaConv.toLowerCase().trim();
    return conversaciones.filter((c) => {
      const esGrupo = esGrupoConv(c);

      if (filtroTipoConv === "directas" && esGrupo) return false;
      if (filtroTipoConv === "grupos" && !esGrupo) return false;

      if (!q) return true;
      const title = tituloConversacion(c).toLowerCase();
      const last = (c.ultimoMensaje || "").toLowerCase();
      return title.includes(q) || last.includes(q);
    });
  }, [conversaciones, busquedaConv, filtroTipoConv, empleados]);

  const conteosFiltros = useMemo(() => {
    let directas = 0;
    let grupos = 0;
    conversaciones.forEach((c) => {
      if (esGrupoConv(c)) grupos += 1;
      else directas += 1;
    });
    return { todas: conversaciones.length, directas, grupos };
  }, [conversaciones]);

  const handleEnviarMensaje = async (e?: any, adjuntosForzados?: any) => {
    e?.preventDefault?.();
    const contenido = texto.trim();
    const adjuntos = adjuntosForzados || [];
    if ((!contenido && adjuntos.length === 0) || !selectedId || enviando) return;
    setEnviando(true);
    setMensajesError("");
    try {
      const payload = {
        empresa_id: empresaId,
        conversacion_id: selectedId,
        remitente_id: user?.id,
        contenido,
        leido_por: [user?.id],
        datos: { remitenteNombre: perfil?.nombre || user?.email, adjuntos },
      };
      let { error: insertError } = await supabase.from("mensajes").insert(payload);

      if (insertError && (insertError.message?.includes("datos") || insertError.code === "PGRST204")) {
        delete (payload as any).datos;
        const retry = await supabase.from("mensajes").insert(payload);
        insertError = retry.error;
      }

      if (insertError) throw insertError;
      const { error: updateError } = await supabase
        .from("conversaciones")
        .update({
          ultimo_mensaje: contenido ? contenido.slice(0, 120) : "📎 Adjunto",
          ultimo_mensaje_at: new Date().toISOString(),
        })
        .eq("id", selectedId);
      if (updateError) throw updateError;
      setTexto("");
    } catch (err: any) {
      setMensajesError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  const handleSeleccionarArchivo = async (event: any) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedId) return;
    const err = validarAdjuntoChat(file);
    if (err) {
      setMensajesError(err);
      return;
    }
    setSubiendoArchivo(true);
    setMensajesError("");
    try {
      const subido = await subirAdjuntoChat(file, empresaId);
      await handleEnviarMensaje(null, [
        {
          url: subido.url,
          tipo: subido.mime === "application/pdf" ? "documento" : "imagen",
          mime: subido.mime,
          nombre: subido.nombre,
        },
      ]);
    } catch (err: any) {
      setMensajesError(err.message || "No se pudo subir el archivo.");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const handleKeyDownTextarea = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  const toggleSeleccion = (id: string) => {
    setSeleccionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCrearConversacion = async (e: any) => {
    e.preventDefault();
    if (seleccionIds.length === 0 || creando) return;
    setCreando(true);
    setCreandoError("");
    try {
      const participantesSeleccionados = empleados.filter((emp) => seleccionIds.includes(emp.id));
      const participantes = [
        { id: user?.id, nombre: perfil?.nombre || user?.email || "Yo", foto: textValue(perfil?.foto_perfil) },
        ...participantesSeleccionados.map((emp) => ({ id: emp.id, nombre: emp.nombre, foto: emp.foto })),
      ];
      const tipo = seleccionIds.length === 1 ? "directa" : "equipo";
      const payload = {
        empresa_id: empresaId,
        participante_ids: [user?.id, ...seleccionIds],
        creado_por: user?.id,
        ultimo_mensaje: "",
        ultimo_mensaje_at: new Date().toISOString(),
        datos: { tipo, titulo: textValue(tituloNuevo), participantes },
      };
      let { data: nueva, error: insertError } = await supabase
        .from("conversaciones")
        .insert(payload)
        .select("id")
        .single();

      if (insertError && (insertError.message?.includes("datos") || insertError.code === "PGRST204")) {
        delete (payload as any).datos;
        const retry = await supabase.from("conversaciones").insert(payload).select("id").single();
        nueva = retry.data;
        insertError = retry.error;
      }

      if (insertError) throw insertError;
      setShowNuevo(false);
      setSeleccionIds([]);
      setTituloNuevo("");
      setSelectedId(nueva.id);
    } catch (err: any) {
      setCreandoError(err.message || "No se pudo crear la conversación.");
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarConversacion = async (id: string) => {
    if (!window.confirm("¿Ocultar esta conversación de tu bandeja?")) return;
    try {
      const conversacion = conversaciones.find((c) => c.id === id);
      const eliminadoPor = [...(conversacion?.eliminadoPor || []), user?.id];
      const { data: current } = await supabase.from("conversaciones").select("datos").eq("id", id).maybeSingle();
      const { error: updateError } = await supabase
        .from("conversaciones")
        .update({ datos: { ...(current?.datos || {}), eliminadoPor } })
        .eq("id", id);
      if (updateError) throw updateError;
      if (selectedId === id) setSelectedId(null);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar la conversación.");
    }
  };

  const empleadosModalFiltrados = useMemo(() => {
    const q = busquedaModal.toLowerCase().trim();
    if (!q) return empleados;
    return empleados.filter(
      (emp) => emp.nombre.toLowerCase().includes(q) || (emp.cargo || "").toLowerCase().includes(q)
    );
  }, [empleados, busquedaModal]);

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Cabecera de Sección */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSeleccionIds([]);
            setTituloNuevo("");
            setCreandoError("");
            setBusquedaModal("");
            setShowNuevo(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
        >
          <MdAdd className="h-4 w-4" />
          <span>Nueva Conversación</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid Principal: Sidebar de Conversaciones + Chat */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <NexxusCard extra="flex h-[calc(100vh-230px)] min-h-[580px] flex-col p-4">
          {/* Buscador de conversaciones */}
          <div className="relative mb-3">
            <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/50" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={busquedaConv}
              onChange={(e) => setBusquedaConv(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white"
            />
          </div>

          {/* Filtros: Todos / Directos / Grupos con exclusión estricta */}
          <div className="mb-3 flex items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setFiltroTipoConv("todas")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                filtroTipoConv === "todas"
                  ? "bg-white text-navy-700 shadow-xs dark:bg-charcoal dark:text-white"
                  : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Todas ({conteosFiltros.todas})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoConv("directas")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                filtroTipoConv === "directas"
                  ? "bg-white text-navy-700 shadow-xs dark:bg-charcoal dark:text-white"
                  : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Directas ({conteosFiltros.directas})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipoConv("grupos")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                filtroTipoConv === "grupos"
                  ? "bg-white text-navy-700 shadow-xs dark:bg-charcoal dark:text-white"
                  : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
              }`}
            >
              Grupos ({conteosFiltros.grupos})
            </button>
          </div>

          {/* Lista scrolleable de chats */}
          <div className="flex-1 overflow-y-auto pr-1">
            {cargandoConversaciones ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="text-xs text-gray-400 dark:text-white/40">Cargando bandeja...</p>
              </div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MdOutlineChatBubbleOutline className="h-8 w-8 text-gray-300 dark:text-white/30" />
                <p className="mt-2 text-xs font-bold text-navy-700 dark:text-white">Sin conversaciones</p>
                <p className="text-[11px] text-gray-400 dark:text-white/40">
                  {filtroTipoConv === "grupos"
                    ? "No hay chats grupales iniciados."
                    : filtroTipoConv === "directas"
                    ? "No hay chats directos individuales."
                    : "Inicia una nueva con el botón superior."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {conversacionesFiltradas.map((c) => {
                  const esGrupo = esGrupoConv(c);
                  const participantes = obtenerParticipantesDeConv(c);
                  const otros = participantes.filter((p: any) => p.id !== user?.id);
                  const fotoPreview = otros[0]?.foto;
                  const titulo = tituloConversacion(c);
                  const activa = c.id === selectedId;

                  return (
                    <div
                      key={c.id}
                      className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition ${
                        activa
                          ? "bg-brand-500/10 dark:bg-brand-400/20 border border-brand-500/20 dark:border-brand-400/30"
                          : "hover:bg-gray-50/80 dark:hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                      <div className="relative shrink-0">
                        {esGrupo ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/25 dark:text-indigo-200">
                            <MdOutlineGroups className="h-5 w-5" />
                          </div>
                        ) : (
                          <Avatar src={fotoPreview} name={titulo} size={10} />
                        )}
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-charcoal" />
                      </div>

                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`truncate text-xs font-bold ${
                              activa ? "text-brand-500 dark:text-brand-300" : "text-navy-700 dark:text-white"
                            }`}
                          >
                            {titulo}
                          </p>
                          <span className="shrink-0 text-[10.5px] font-semibold text-gray-400 dark:text-white/40">
                            {formatoFechaConversacion(c.ultimoMensajeAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className="truncate text-[11.5px] font-medium text-gray-500 dark:text-white/60">
                            {c.ultimoMensaje || "Conversación iniciada"}
                          </p>
                          <UnreadBadge conversacionId={c.id} uid={user?.id} />
                        </div>
                      </div>

                      {/* Botón eliminar al hacer hover */}
                      <button
                        type="button"
                        title="Ocultar conversación"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarConversacion(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition"
                      >
                        <MdDeleteOutline className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </NexxusCard>

        <NexxusCard extra="flex h-[calc(100vh-230px)] min-h-[580px] flex-col p-0 overflow-hidden">
          {!conversacionSeleccionada ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                <MdOutlineChatBubbleOutline className="h-8 w-8" />
              </div>
              <h4 className="mt-4 text-base font-bold text-navy-700 dark:text-white">
                Bandeja de Mensajería Nexxus
              </h4>
              <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-sm">
                Selecciona una conversación del panel izquierdo o inicia un nuevo chat con cualquier colaborador.
              </p>
            </div>
          ) : (
            <>
              {/* Header de la conversación */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 dark:border-white/5 dark:bg-charcoal">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {esGrupoConv(conversacionSeleccionada) ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/25 dark:text-indigo-200">
                        <MdOutlineGroups className="h-5 w-5" />
                      </div>
                    ) : (
                      <Avatar
                        src={(() => {
                          const otros = obtenerParticipantesDeConv(conversacionSeleccionada).filter(
                            (p: any) => p.id !== user?.id
                          );
                          return otros[0]?.foto;
                        })()}
                        name={tituloConversacion(conversacionSeleccionada)}
                        size={10}
                      />
                    )}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-charcoal" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-black text-navy-700 dark:text-white">
                      {tituloConversacion(conversacionSeleccionada)}
                    </h4>
                    <p className="truncate text-[11px] font-medium text-gray-500 dark:text-white/60">
                      {obtenerParticipantesDeConv(conversacionSeleccionada)
                        .map((p: any) => p.nombre)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {mensajesError && (
                <div className="m-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {mensajesError}
                </div>
              )}

              {/* Cuerpo del chat / Mensajes con Tipografía Ampliada y Legible */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cargandoMensajes ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Inicio de la conversación</p>
                    <p className="text-xs text-gray-400 dark:text-white/50 mt-1">
                      Envía un mensaje para comenzar a chatear.
                    </p>
                  </div>
                ) : (
                  (() => {
                    let lastDateStr = "";
                    return mensajes.map((m) => {
                      const esMio = m.remitenteId === user?.id;
                      const empInfo = empleadoPorId.get(m.remitenteId);
                      const remitenteNombre = empInfo?.nombre || m.remitenteNombre || "Colaborador";
                      const remitenteFoto = fotoPorEmpleadoId.get(m.remitenteId) || empInfo?.foto || "";

                      const fechaSeparador = formatoSeparadorFecha(m.timestamp);
                      const showDateDivider = fechaSeparador !== lastDateStr;
                      if (showDateDivider) lastDateStr = fechaSeparador;

                      return (
                        <div key={m.id} className="space-y-3">
                          {showDateDivider && (
                            <div className="flex items-center justify-center my-3">
                              <span className="rounded-full bg-gray-100 px-3.5 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-white/70 shadow-2xs">
                                {fechaSeparador}
                              </span>
                            </div>
                          )}

                          <div className={`flex items-end gap-2.5 ${esMio ? "justify-end" : "justify-start"}`}>
                            {!esMio && <Avatar src={remitenteFoto} name={remitenteNombre} size={9} />}

                            <div className={`max-w-[75%] flex flex-col ${esMio ? "items-end" : "items-start"}`}>
                              {!esMio && (
                                <span className="mb-1 ml-1 text-xs font-bold text-gray-700 dark:text-white/80">
                                  {remitenteNombre}
                                </span>
                              )}

                              <div
                                className={`rounded-2xl px-4.5 py-3 text-[13.5px] font-medium leading-relaxed shadow-xs ${
                                  esMio
                                    ? "rounded-br-xs bg-brand-500 text-white"
                                    : "rounded-bl-xs bg-gray-100 text-navy-700 dark:bg-white/10 dark:text-white"
                                }`}
                              >
                                {/* Adjuntos */}
                                {(() => {
                                  const imgs: string[] = [];
                                  const add = (v: any) => {
                                    if (typeof v === "string") imgs.push(v);
                                    else if (v && typeof v === "object" && v.url) imgs.push(v.url);
                                  };
                                  if (Array.isArray(m.adjuntos)) m.adjuntos.forEach(add);
                                  else if (m.adjuntos) add(m.adjuntos);

                                  return imgs.length > 0 ? (
                                    <div className="flex flex-col gap-2 mb-2">
                                      {imgs.map((imgUrl, idx) => (
                                        <img
                                          key={idx}
                                          src={imgUrl}
                                          alt="Adjunto"
                                          className="max-h-60 cursor-pointer rounded-xl object-cover transition hover:opacity-95 shadow-sm"
                                          onClick={() => setExpandedImage(imgUrl)}
                                        />
                                      ))}
                                    </div>
                                  ) : null;
                                })()}

                                {m.texto && <span className="whitespace-pre-wrap">{m.texto}</span>}
                              </div>

                              <div className="flex items-center gap-1 mt-1 text-[10.5px] font-medium text-gray-400 dark:text-white/40 px-1">
                                <span>{formatoHoraMensaje(m.timestamp)}</span>
                                {esMio && <MdOutlineDoneAll className="h-4 w-4 text-brand-500 dark:text-brand-300" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
                <div ref={mensajesFinRef} />
              </div>

              {/* Barra de Entrada de Mensajes */}
              <div className="border-t border-gray-100 bg-white p-3 dark:border-white/5 dark:bg-charcoal">
                <form onSubmit={handleEnviarMensaje} className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleSeleccionarArchivo}
                  />

                  <button
                    type="button"
                    disabled={subiendoArchivo || enviando}
                    title="Adjuntar imagen o archivo"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
                  >
                    {subiendoArchivo ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    ) : (
                      <MdOutlineAttachFile className="h-5 w-5" />
                    )}
                  </button>

                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={handleKeyDownTextarea}
                    rows={1}
                    placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para salto de línea)"
                    className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 px-3.5 text-[13.5px] font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white placeholder:text-xs"
                  />

                  <button
                    type="submit"
                    disabled={!texto.trim() || enviando}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-500 px-4.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-40 dark:bg-brand-400"
                  >
                    <MdSend className="h-4 w-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </NexxusCard>
      </div>

      <Modal
        isOpen={showNuevo}
        onClose={() => setShowNuevo(false)}
        title="Iniciar Nueva Conversación"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleCrearConversacion} className="flex flex-col gap-4">
            {/* Nombre del Grupo si hay más de 1 participante seleccionado */}
            {seleccionIds.length > 1 && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70" htmlFor="conv-titulo">
                  Nombre del Grupo (opcional)
                </label>
                <input
                  id="conv-titulo"
                  type="text"
                  placeholder="Ej. Proyecto Innovación 2026"
                  value={tituloNuevo}
                  onChange={(e) => setTituloNuevo(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    Seleccionar Destinatarios
                  </p>
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10.5px] font-black text-brand-600 dark:text-brand-300">
                    {seleccionIds.length} seleccionados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSeleccionIds(
                        seleccionIds.length === empleados.length ? [] : empleados.map((e) => e.id)
                      )
                    }
                    className="text-[11px] font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition"
                  >
                    {seleccionIds.length === empleados.length ? "Desmarcar todos" : "Seleccionar todos"}
                  </button>
                </div>
              </div>

              {/* Buscador dentro del modal */}
              <div className="relative mb-2">
                <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/50" />
                <input
                  type="text"
                  placeholder="Buscar colaborador por nombre o cargo..."
                  value={busquedaModal}
                  onChange={(e) => setBusquedaModal(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 pl-9 pr-3.5 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/40 p-2.5 dark:border-white/10 dark:bg-charcoal">
                {empleadosModalFiltrados.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center">No se encontraron colaboradores.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {empleadosModalFiltrados.map((emp) => {
                      const isChecked = seleccionIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex cursor-pointer items-center justify-between p-2.5 rounded-xl transition border ${
                            isChecked
                              ? "border-brand-500/30 bg-brand-500/10 dark:border-brand-400/30 dark:bg-brand-500/15"
                              : "border-transparent bg-white/60 hover:bg-white dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={emp.foto} name={emp.nombre} size={9} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                {emp.nombre}
                              </p>
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/50">
                                {emp.cargo || "Colaborador"}
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSeleccion(emp.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {creandoError && <p className="text-xs font-bold text-red-500">{creandoError}</p>}

            <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3.5 dark:border-white/10 mt-1">
              <button
                type="button"
                onClick={() => setShowNuevo(false)}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={seleccionIds.length === 0 || creando}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50 dark:bg-brand-400"
              >
                <MdOutlineCheck className="h-4 w-4" />
                <span>{creando ? "Iniciando..." : "Comenzar Chat"}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Visor de imagen ampliada */}
      <Modal isOpen={!!expandedImage} onClose={() => setExpandedImage(null)} title="Visor de Imagen" width="max-w-xl">
        {expandedImage ? (
          <div className="flex items-center justify-center p-2">
            <img src={expandedImage} alt="Ampliada" className="max-h-[70vh] rounded-2xl object-contain shadow-lg" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
