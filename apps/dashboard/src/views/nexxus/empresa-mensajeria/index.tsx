import { useEffect, useMemo, useRef, useState } from "react";
import { MdAdd, MdSend, MdDeleteOutline, MdOutlineAttachFile } from "react-icons/md";
import { supabase } from "supabaseClient/supabaseConfig";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import InputField from "components/fields/InputField";
import Modal from "components/nexxus/Modal";
import { useAuth } from "context/AuthContext";
import { subscribeEmpleados } from "services/adminRepository";
import { subirAdjuntoChat, validarAdjuntoChat } from "services/chatUpload";

const textValue = (value, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const mapEmpleado = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, "Sin nombre"),
    foto: textValue(data.foto_perfil),
  };
};

const mapConversacion = (row) => ({
  id: row.id,
  titulo: row.datos?.titulo || "",
  tipo: row.datos?.tipo || "directa",
  participanteIds: Array.isArray(row.participante_ids) ? row.participante_ids : [],
  participantes: Array.isArray(row.datos?.participantes) ? row.datos.participantes : [],
  eliminadoPor: Array.isArray(row.datos?.eliminadoPor) ? row.datos.eliminadoPor : [],
  ultimoMensaje: row.ultimo_mensaje,
  ultimoMensajeAt: row.ultimo_mensaje_at,
});

const mapMensaje = (row) => ({
  id: row.id,
  remitenteId: row.remitente_id,
  remitenteNombre: row.datos?.remitenteNombre || "",
  texto: row.contenido || "",
  adjuntos: row.datos?.adjuntos || [],
  leidoPor: Array.isArray(row.leido_por) ? row.leido_por : [],
  timestamp: row.created_at,
});

const formatoHora = (valor) => {
  if (!valor) return "";
  try {
    const fecha = typeof valor === "string" ? new Date(valor) : valor.toDate?.() || new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();
    if (esHoy) {
      return fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    }
    return fecha.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
};

// Indicador de "no leído": mira el leidoPor real del último mensaje de la conversación
// (query directa a `mensajes`, no un campo desnormalizado que no existe en el doc de conversación).
function UnreadDot({ conversacionId, uid }) {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${conversacionId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId, uid]);

  if (!noLeido) return null;
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 dark:bg-brand-400" />;
}

export default function MensajeriaInternaAdmin() {
  const { user, perfil, empresaId } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(true);
  const [error, setError] = useState("");

  const [empleados, setEmpleados] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [mensajesError, setMensajesError] = useState("");

  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef(null);

  const [showNuevo, setShowNuevo] = useState(false);
  const [seleccionIds, setSeleccionIds] = useState([]);
  const [tituloNuevo, setTituloNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const [creandoError, setCreandoError] = useState("");
  const [expandedImage, setExpandedImage] = useState(null);

  const mensajesFinRef = useRef(null);

  // --- Lista de conversaciones donde participa el admin ---
  useEffect(() => {
    if (!empresaId || !user?.id) return undefined;
    setCargandoConversaciones(true);
    setError("");
    const load = async () => {
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
    };
    load();
    const channel = supabase
      .channel(`conversaciones:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversaciones", filter: `empresa_id=eq.${empresaId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, user?.id]);

  // --- Empleados de la empresa, para el selector de nueva conversación ---
  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => setEmpleados(docs.map(mapEmpleado).filter((e) => e.id !== user?.id)),
      (err) => setError(err.message || "No se pudieron cargar los empleados.")
    );
    return () => unsubscribe();
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
      .on("postgres_changes", { event: "*", schema: "public", table: "mensajes", filter: `conversacion_id=eq.${selectedId}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // --- Marcar como leídos los mensajes no leídos por el admin al abrir la conversación ---
  useEffect(() => {
    if (!selectedId || !user?.id || mensajes.length === 0) return;
    mensajes
      .filter((m) => !m.leidoPor.includes(user.id))
      .forEach((m) => {
        supabase.from("mensajes").update({ leido_por: [...m.leidoPor, user.id] }).eq("id", m.id).then(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mensajes.length, user?.id]);

  useEffect(() => {
    mensajesFinRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length, selectedId]);

  const conversacionSeleccionada = useMemo(
    () => conversaciones.find((c) => c.id === selectedId) || null,
    [conversaciones, selectedId]
  );

  // La foto guardada en conversaciones/{id}.participantes[].foto es una foto capturada al crear
  // la conversación -- si el empleado no tenía foto en ese momento (o la cambió después), queda
  // vacía o desactualizada para siempre ahí. Este mapa hace la búsqueda en vivo contra la lista
  // de empleados ya suscrita, para no depender de ese snapshot congelado.
  const fotoPorEmpleadoId = useMemo(() => {
    const map = new Map();
    empleados.forEach((emp) => { if (emp.foto) map.set(emp.id, emp.foto); });
    return map;
  }, [empleados]);

  const tituloConversacion = (c) => {
    if (textValue(c.titulo)) return c.titulo;
    const otros = (c.participantes || []).filter((p) => p.id !== user?.id);
    if (otros.length > 0) return otros.map((p) => p.nombre).join(", ");
    return "Conversación";
  };

  const handleSeleccionarConversacion = (id) => {
    setSelectedId(id);
  };

  const handleEnviarMensaje = async (e?: any, adjuntosForzados?: any) => {
    e?.preventDefault?.();
    const contenido = texto.trim();
    const adjuntos = adjuntosForzados || [];
    if ((!contenido && adjuntos.length === 0) || !selectedId || enviando) return;
    setEnviando(true);
    try {
      const { error: insertError } = await supabase.from("mensajes").insert({
        empresa_id: empresaId,
        conversacion_id: selectedId,
        remitente_id: user.id,
        contenido,
        leido_por: [user.id],
        datos: { remitenteNombre: perfil?.nombre || user.email, adjuntos },
      });
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
    } catch (err) {
      setMensajesError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  // El botón de adjuntar estaba deshabilitado ("Adjuntos próximamente"), aunque el hilo de
  // mensajes ya sabe renderizar adjuntos (ver m.adjuntos abajo). Sube directo a Cloudinary sin
  // Cloud Functions (mismo preset "unsigned" que usa la app móvil, ver services/chatUpload.js) y
  // envía el archivo como su propio mensaje apenas termina de subir.
  const handleSeleccionarArchivo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedId) return;
    const error = validarAdjuntoChat(file);
    if (error) {
      setMensajesError(error);
      return;
    }
    setSubiendoArchivo(true);
    setMensajesError("");
    try {
      const subido = await subirAdjuntoChat(file, empresaId);
      // La app móvil (ChatInterno.tsx) espera cada adjunto como OBJETO { url, tipo, mime, nombre }
      // -- se estaba mandando el array como puros strings de URL, y attachment.url sobre un
      // string es undefined, así que la imagen nunca se detectaba ni se renderizaba del otro lado.
      await handleEnviarMensaje(null, [{
        url: subido.url,
        tipo: subido.mime === "application/pdf" ? "documento" : "imagen",
        mime: subido.mime,
        nombre: subido.nombre,
      }]);
    } catch (err) {
      setMensajesError(err.message || "No se pudo subir el archivo.");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const handleKeyDownTextarea = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCrearConversacion = async (e) => {
    e.preventDefault();
    if (seleccionIds.length === 0 || creando) return;
    setCreando(true);
    setCreandoError("");
    try {
      const participantesSeleccionados = empleados.filter((emp) => seleccionIds.includes(emp.id));
      const participantes = [
        { id: user.id, nombre: perfil?.nombre || user.email || "Yo", foto: textValue(perfil?.foto_perfil) },
        ...participantesSeleccionados.map((emp) => ({ id: emp.id, nombre: emp.nombre, foto: emp.foto })),
      ];
      const tipo = seleccionIds.length === 1 ? "directa" : "equipo";
      const { data: nueva, error: insertError } = await supabase
        .from("conversaciones")
        .insert({
          empresa_id: empresaId,
          participante_ids: [user.id, ...seleccionIds],
          creado_por: user.id,
          ultimo_mensaje: "",
          ultimo_mensaje_at: new Date().toISOString(),
          datos: { tipo, titulo: textValue(tituloNuevo), participantes },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      setShowNuevo(false);
      setSeleccionIds([]);
      setTituloNuevo("");
      setSelectedId(nueva.id);
    } catch (err) {
      setCreandoError(err.message || "No se pudo crear la conversación.");
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarConversacion = async (id) => {
    if (!window.confirm("¿Ocultar esta conversación de tu bandeja? Los demás participantes seguirán viéndola.")) {
      return;
    }
    try {
      const conversacion = conversaciones.find((c) => c.id === id);
      const eliminadoPor = [...(conversacion?.eliminadoPor || []), user.id];
      const { data: current } = await supabase.from("conversaciones").select("datos").eq("id", id).maybeSingle();
      const { error: updateError } = await supabase
        .from("conversaciones")
        .update({ datos: { ...(current?.datos || {}), eliminadoPor } })
        .eq("id", id);
      if (updateError) throw updateError;
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar la conversación.");
    }
  };

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        {/* Panel izquierdo: conversaciones */}
        <NexxusCard extra="flex h-[70vh] flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-700 dark:text-white">Conversaciones</h2>
            <button
              type="button"
              onClick={() => {
                setShowNuevo((prev) => !prev);
                setCreandoError("");
              }}
              className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
            >
              <MdAdd className="h-4 w-4" /> Nueva
            </button>
          </div>

          {showNuevo ? (
            <form
              onSubmit={handleCrearConversacion}
              className="mb-3 rounded-xl border border-gray-200 p-3 dark:border-white/10"
            >
              <InputField
                variant="auth"
                label="Título (opcional)"
                id="nueva-conv-titulo"
                extra="mb-3"
                value={tituloNuevo}
                onChange={(e) => setTituloNuevo(e.target.value)}
                placeholder="Ej. Equipo de ventas"
              />
              <p className="ml-1.5 mb-1 text-sm font-medium text-navy-700 dark:text-white">
                Participantes
              </p>
              <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-gray-100 dark:border-white/10">
                {empleados.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500 dark:text-white/50">
                    No hay otros empleados en tu empresa.
                  </p>
                ) : (
                  empleados.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-lightPrimary dark:hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={seleccionIds.includes(emp.id)}
                        onChange={() => toggleSeleccion(emp.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Avatar src={emp.foto} name={emp.nombre} size={8} />
                      <span className="text-navy-700 dark:text-white">{emp.nombre}</span>
                    </label>
                  ))
                )}
              </div>
              {creandoError ? (
                <p className="mb-2 text-xs font-medium text-red-500 dark:text-red-400">{creandoError}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={seleccionIds.length === 0 || creando}
                  className="flex-1 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-brand-400"
                >
                  {creando ? "Creando..." : "Crear conversación"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNuevo(false)}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 dark:bg-white/5 dark:text-white/70"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {cargandoConversaciones ? (
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                Cargando conversaciones...
              </p>
            ) : conversaciones.length === 0 ? (
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                Aún no tienes conversaciones. Inicia una nueva.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {conversaciones.map((c) => {
                  const otros = (c.participantes || []).filter((p) => p.id !== user?.id);
                  const fotoPreview = (otros[0] && fotoPorEmpleadoId.get(otros[0].id)) || otros[0]?.foto;
                  const activa = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSeleccionarConversacion(c.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleSeleccionarConversacion(c.id)}
                        className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                          activa
                            ? "bg-lightPrimary dark:bg-white/10"
                            : "hover:bg-lightPrimary/60 dark:hover:bg-white/5"
                        }`}
                      >
                        <Avatar src={fotoPreview} name={tituloConversacion(c)} size={10} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                              {tituloConversacion(c)}
                            </p>
                            <span className="shrink-0 text-[11px] text-gray-500 dark:text-white/50">
                              {formatoHora(c.ultimoMensajeAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-gray-500 dark:text-white/50">
                            {c.ultimoMensaje || "Sin mensajes todavía"}
                          </p>
                        </div>
                        <UnreadDot conversacionId={c.id} uid={user?.id} />
                        <button
                          type="button"
                          title="Eliminar de mi bandeja"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarConversacion(c.id);
                          }}
                          className="hidden shrink-0 text-gray-400 hover:text-red-500 group-hover:block dark:text-white/40"
                        >
                          <MdDeleteOutline className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </NexxusCard>

        {/* Panel derecho: hilo de mensajes */}
        <NexxusCard extra="flex h-[70vh] flex-col p-4">
          {!conversacionSeleccionada ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                Selecciona una conversación para ver los mensajes.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
                <Avatar
                  src={(() => {
                    const otro = (conversacionSeleccionada.participantes || []).find((p) => p.id !== user?.id);
                    return (otro && fotoPorEmpleadoId.get(otro.id)) || otro?.foto;
                  })()}
                  name={tituloConversacion(conversacionSeleccionada)}
                  size={10}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                    {tituloConversacion(conversacionSeleccionada)}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-white/50">
                    {(conversacionSeleccionada.participantes || []).map((p) => p.nombre).join(", ")}
                  </p>
                </div>
              </div>

              {mensajesError ? (
                <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
                  {mensajesError}
                </p>
              ) : null}

              <div className="flex-1 overflow-y-auto px-1">
                {cargandoMensajes ? (
                  <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                    Cargando mensajes...
                  </p>
                ) : mensajes.length === 0 ? (
                  <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                    No hay mensajes en esta conversación todavía.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {mensajes.map((m) => {
                      const esMio = m.remitenteId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] ${esMio ? "items-end" : "items-start"} flex flex-col`}>
                            {!esMio ? (
                              <span className="mb-0.5 ml-1 text-[11px] font-medium text-gray-500 dark:text-white/50">
                                {m.remitenteNombre}
                              </span>
                            ) : null}
                            <div
                              className={`flex flex-col gap-2 rounded-2xl px-4 py-2 text-sm ${
                                esMio
                                  ? "rounded-tr-sm bg-brand-500 text-white dark:bg-brand-400"
                                  : "rounded-tl-sm bg-lightPrimary text-navy-700 dark:bg-white/10 dark:text-white"
                              }`}
                            >
                              {(() => {
                                const imgs = [];
                                const add = (v) => {
                                  if (typeof v === "string") imgs.push(v);
                                  else if (v && typeof v === "object" && v.url) imgs.push(v.url);
                                };
                                if (Array.isArray(m.adjuntos)) m.adjuntos.forEach(add);
                                else add(m.adjuntos);
                                add(m.image);
                                add(m.imageUrl);
                                add(m.image_url);
                                add(m.imagen);
                                
                                const validImages = imgs.filter(url => typeof url === "string" && url.trim() !== "");

                                return (
                                  <>
                                    {validImages.map((imgUrl, i) => (
                                      <img
                                        key={i}
                                        src={imgUrl}
                                        alt="Adjunto"
                                        className="max-h-48 cursor-pointer rounded-lg object-cover hover:opacity-90 transition-opacity"
                                        onClick={() => setExpandedImage(imgUrl)}
                                      />
                                    ))}
                                    {m.texto && <span>{m.texto}</span>}
                                  </>
                                );
                              })()}
                            </div>
                            <span className="mt-0.5 text-[10px] text-gray-400 dark:text-white/40">
                              {formatoHora(m.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={mensajesFinRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleEnviarMensaje} className="mt-3 flex items-end gap-2">
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
                  title="Adjuntar imagen o PDF"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                >
                  {subiendoArchivo ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <MdOutlineAttachFile className="h-5 w-5" />
                  )}
                </button>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDownTextarea}
                  rows={1}
                  placeholder="Escribe un mensaje..."
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-white/0 p-3 text-sm text-navy-700 outline-none dark:!border-white/10 dark:bg-navy-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!texto.trim() || enviando}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-brand-400"
                >
                  <MdSend className="h-4 w-4" /> Enviar
                </button>
              </form>
            </>
          )}
        </NexxusCard>
      </div>

      <Modal isOpen={!!expandedImage} onClose={() => setExpandedImage(null)} title="Visor de imagen">
        {expandedImage ? (
          <div className="flex items-center justify-center p-2">
            <img src={expandedImage} alt="Ampliada" className="max-h-[70vh] rounded-xl object-contain" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
