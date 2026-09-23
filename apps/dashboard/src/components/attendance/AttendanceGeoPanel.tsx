import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineAccessTime,
  MdOutlineAddLocationAlt,
  MdOutlineCheck,
  MdOutlineClose,
  MdOutlineContentCopy,
  MdOutlineDelete,
  MdOutlineLocationOn,
  MdOutlineMyLocation,
  MdOutlineOpenInNew,
  MdOutlineWarningAmber,
} from "react-icons/md";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import { subscribeSedes } from "services/adminRepository";
import Avatar from "components/nexxus/Avatar";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { routeUrl } from "utils/routePath";
import AttendanceMap, {
  AttendanceGeoEvent,
  AttendanceGeoLocation,
  ESTADOS_MAPA,
} from "./AttendanceMap";

type Sede = { id: string; nombre: string };

/**
 * Obtiene la fecha actual en la zona horaria oficial de El Salvador (America/El_Salvador, UTC-6).
 */
const getElSalvadorTodayISO = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

export default function AttendanceGeoPanel() {
  const navigate = useNavigate();
  const { empresaId, rol } = useAuth();
  const canManage = ["admin", "admin_empresa", "super_admin"].includes(rol);

  const [locations, setLocations] = useState<AttendanceGeoLocation[]>([]);
  const [events, setEvents] = useState<AttendanceGeoEvent[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sedeId, setSedeId] = useState("");
  const [date, setDate] = useState(getElSalvadorTodayISO);
  const [status, setStatus] = useState("todos");
  const [selected, setSelected] = useState<AttendanceGeoEvent | null>(null);
  const [error, setError] = useState("");

  // Estado para enfocar una sede en el mapa
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Estado para fijar/poner en el mapa la ubicación de la sede seleccionada
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number; radio: number } | null>(null);
  const [tempRadio, setTempRadio] = useState(100);
  const [savingLocation, setSavingLocation] = useState(false);

  // Caché de direcciones obtenidas por geocodificación inversa
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [loadingAddress, setLoadingAddress] = useState<Record<string, boolean>>({});
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sede seleccionada y su ubicación si existe
  const selectedSedeObj = useMemo(() => sedes.find((s) => s.id === sedeId), [sedes, sedeId]);
  const sedeSeleccionadaLocation = useMemo(
    () => locations.find((l) => l.sede_id === sedeId || l.id === sedeId),
    [locations, sedeId]
  );

  // Función para obtener la dirección física en base a coordenadas (Nominatim OSM)
  const resolveAddress = async (event: AttendanceGeoEvent) => {
    if (addresses[event.id] || loadingAddress[event.id]) return;

    setLoadingAddress((prev) => ({ ...prev, [event.id]: true }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${event.latitud}&lon=${event.longitud}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const display = data.display_name || data.name || "Dirección no identificada";
        setAddresses((prev) => ({ ...prev, [event.id]: display }));
      } else {
        setAddresses((prev) => ({
          ...prev,
          [event.id]: event.sede?.nombre || "Ubicación registrada",
        }));
      }
    } catch {
      setAddresses((prev) => ({
        ...prev,
        [event.id]: event.sede?.nombre || "Ubicación registrada",
      }));
    } finally {
      setLoadingAddress((prev) => ({ ...prev, [event.id]: false }));
    }
  };

  const handleSelectEvent = (event: AttendanceGeoEvent) => {
    setSelected(event);
    void resolveAddress(event);
  };

  // Cargar sedes activas de la empresa
  useEffect(() => {
    if (!empresaId) return;
    const unsubscribe = subscribeSedes(
      empresaId,
      (rows: any[]) => setSedes(rows.map((r) => ({ id: r.id, nombre: r.data().nombre }))),
      () => setError("No se pudieron cargar las sedes de la empresa.")
    );
    return unsubscribe;
  }, [empresaId]);

  // Cargar eventos geográficos y ubicaciones autorizadas
  useEffect(() => {
    if (!empresaId) return;
    let active = true;

    const load = async () => {
      const [loc, evt] = await Promise.all([
        supabase.from("ubicaciones_asistencia").select("*").eq("empresa_id", empresaId),
        supabase
          .from("eventos_geograficos_asistencia")
          .select(
            "*, usuario:usuarios!eventos_geograficos_asistencia_usuario_id_fkey(nombre,foto_perfil), sede:sedes(nombre)"
          )
          .eq("empresa_id", empresaId)
          .gte("captured_at", `${date}T00:00:00-06:00`)
          .lt("captured_at", `${date}T23:59:59.999-06:00`)
          .order("captured_at", { ascending: false })
          .limit(1000),
      ]);

      if (!active) return;

      if (loc.error || evt.error) {
        setError("No se pudo cargar la información geográfica de asistencia.");
      } else {
        setLocations(loc.data || []);
        setEvents(evt.data || []);
        setError("");
      }
    };

    void load();

    const channel = supabase
      .channel(`attendance-geo:${empresaId}:${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eventos_geograficos_asistencia",
          filter: `empresa_id=eq.${empresaId}`,
        },
        load
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ubicaciones_asistencia",
          filter: `empresa_id=eq.${empresaId}`,
        },
        load
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [empresaId, date]);

  // Filtrado de eventos visibles
  const visibleEvents = useMemo(() => {
    return events.filter(
      (e: any) =>
        (!sedeId || e.sede_id === sedeId) &&
        (status === "todos" || e.estado_validacion === status)
    );
  }, [events, sedeId, status]);

  // Sedes visibles
  const visibleLocations = useMemo(() => {
    return locations.filter((l: any) => !sedeId || l.sede_id === sedeId);
  }, [locations, sedeId]);

  // Conteo estadístico
  const counts = useMemo(
    () => ({
      total: visibleEvents.length,
      entradas: visibleEvents.filter((e) => e.tipo_evento === "entrada").length,
      salidas: visibleEvents.filter((e) => e.tipo_evento === "salida").length,
      review: visibleEvents.filter(
        (e) => e.estado_revision === "pendiente" || e.estado_validacion === "fuera_de_zona"
      ).length,
    }),
    [visibleEvents]
  );

  // Centrar el mapa en la sede seleccionada
  const handleCentrarSede = () => {
    if (sedeSeleccionadaLocation) {
      setTargetLocation({
        lat: sedeSeleccionadaLocation.latitud,
        lng: sedeSeleccionadaLocation.longitud,
      });
    }
  };

  // Cuando cambia la sede en el selector, si tiene ubicación, podemos enfocarla o prepararla
  const handleCambioSede = (nuevaSedeId: string) => {
    setSedeId(nuevaSedeId);
    setIsSettingLocation(false);
    setTempLocation(null);
    if (nuevaSedeId) {
      const loc = locations.find((l) => l.sede_id === nuevaSedeId || l.id === nuevaSedeId);
      if (loc) {
        setTargetLocation({ lat: loc.latitud, lng: loc.longitud });
      }
    }
  };

  // Activar modo para poner/fijar la ubicación de la sede en el mapa
  const handleIniciarPonerSede = () => {
    if (!sedeId) return;
    setIsSettingLocation((prev) => !prev);
    if (!isSettingLocation) {
      if (sedeSeleccionadaLocation) {
        setTempLocation({
          lat: sedeSeleccionadaLocation.latitud,
          lng: sedeSeleccionadaLocation.longitud,
          radio: sedeSeleccionadaLocation.radio_metros || 100,
        });
        setTempRadio(sedeSeleccionadaLocation.radio_metros || 100);
        setTargetLocation({
          lat: sedeSeleccionadaLocation.latitud,
          lng: sedeSeleccionadaLocation.longitud,
        });
      } else {
        setTempLocation(null);
      }
    } else {
      setTempLocation(null);
    }
  };

  // Captura del clic en el mapa cuando se está fijando la sede
  const handleMapClick = (lat: number, lng: number) => {
    if (isSettingLocation) {
      setTempLocation({ lat, lng, radio: tempRadio });
    }
  };

  // Guardar ubicación de la sede en la base de datos
  const handleGuardarUbicacionSede = async () => {
    if (!empresaId || !sedeId || !tempLocation) return;
    setSavingLocation(true);
    try {
      const sedeObj = sedes.find((s) => s.id === sedeId);
      const existing = locations.find((l) => l.sede_id === sedeId);

      if (existing) {
        const { error: updErr } = await supabase
          .from("ubicaciones_asistencia")
          .update({
            latitud: tempLocation.lat,
            longitud: tempLocation.lng,
            radio_metros: tempRadio,
            nombre: sedeObj?.nombre || existing.nombre,
            activa: true,
          })
          .eq("id", existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from("ubicaciones_asistencia")
          .insert({
            empresa_id: empresaId,
            sede_id: sedeId,
            nombre: sedeObj?.nombre || "Sede autorizada",
            latitud: tempLocation.lat,
            longitud: tempLocation.lng,
            radio_metros: tempRadio,
            activa: true,
            es_predeterminada: true,
            tipos_evento: ["entrada", "salida"],
          });
        if (insErr) throw insErr;
      }

      // Recargar ubicaciones
      const { data: updatedLocs } = await supabase
        .from("ubicaciones_asistencia")
        .select("*")
        .eq("empresa_id", empresaId);
      if (updatedLocs) setLocations(updatedLocs);

      setTargetLocation({ lat: tempLocation.lat, lng: tempLocation.lng });
      setIsSettingLocation(false);
      setTempLocation(null);
    } catch (err: any) {
      setError("Error al guardar la ubicación de la sede: " + (err.message || "Error"));
    } finally {
      setSavingLocation(false);
    }
  };

  const copiarCoordenadas = (lat: number, lng: number) => {
    const texto = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    });
  };

  // Eliminar marcaje geográfico (solo administradores)
  const handleEliminarMarcaje = async (eventId: string) => {
    if (!canManage) return;
    setDeletingId(eventId);
    try {
      // Intentar primero con la función RPC para eliminación limpia en cascada
      const { data, error: rpcErr } = await supabase.rpc("eliminar_evento_geografico_asistencia", {
        p_evento_id: eventId,
      });

      if (rpcErr) {
        // Fallback a eliminación directa sobre eventos_geograficos_asistencia
        const { error: delErr } = await supabase
          .from("eventos_geograficos_asistencia")
          .delete()
          .eq("id", eventId);
        if (delErr) throw delErr;
      } else if (data && (data as any).success === false) {
        throw new Error((data as any).message || "No se pudo eliminar el marcaje");
      }

      // Actualizar estado local inmediatamente para reflejo instantáneo en mapa y lista
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      if (selected?.id === eventId) {
        setSelected(null);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError("Error al eliminar el marcaje: " + (err.message || "Error desconocido"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!empresaId) return null;

  return (
    <div className="relative isolate z-0 flex flex-col gap-6">
      {/* 1. Header Superior alineado con Panorama General */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 sm:text-3xl dark:text-white">
            Control de Asistencia Georreferenciada
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-medium text-gray-400 dark:text-white/50">
            Resumen operativo · Eventos de geolocalización al registrar jornada en El Salvador
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(routeUrl("/admin", "empresa-estructura"))}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
            >
              <span>Gestionar Sedes</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition duration-150 hover:bg-navy-800 active:scale-[0.98] dark:bg-white dark:text-navy-700 dark:hover:bg-gray-100"
            >
              <span>Ver Plantilla</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Barra de Telemetría Operativa Continua */}
      <NexxusCard extra="p-0 overflow-hidden shadow-xs" delay={100}>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-white/[0.08]">
          {/* Telemetría 1: Total Eventos */}
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Jornada del Día</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {counts.total}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                fichajes totales
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
              Hora oficial de El Salvador
            </p>
          </div>

          {/* Telemetría 2: Entradas */}
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Entradas Registradas</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {counts.entradas}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                al inicio de jornada
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
              {counts.entradas > 0 ? "Fichajes recibidos hoy" : "Sin entradas registradas"}
            </p>
          </div>

          {/* Telemetría 3: Salidas */}
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Salidas Registradas</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {counts.salidas}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                al cierre de turno
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
              {counts.salidas > 0 ? "Fichajes completados" : "Sin salidas registradas"}
            </p>
          </div>

          {/* Telemetría 4: Requieren Atención */}
          <div className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Requieren Atención</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {counts.review}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                pendientes o fuera de zona
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
              {counts.review > 0 ? `${counts.review} requieren validación` : "Sin incidencias críticas"}
            </p>
          </div>
        </div>
      </NexxusCard>

      {/* 3. Barra de Filtros con botón para PONER Y ENFOCAR la ubicación de la sede */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Sede */}
          <select
            value={sedeId}
            onChange={(e) => handleCambioSede(e.target.value)}
            className="rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-navy-700 shadow-xs transition hover:border-gray-300 focus:border-brand-500 focus:outline-hidden dark:border-white/10 dark:bg-charcoal dark:text-white"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>

          {/* Botón para enfocar la sede seleccionada en el mapa */}
          {sedeSeleccionadaLocation && (
            <button
              type="button"
              onClick={handleCentrarSede}
              title="Centrar y ver en el mapa la ubicación de la sede seleccionada"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
            >
              <MdOutlineMyLocation className="h-4 w-4 text-gray-500 dark:text-white/70" />
              <span>Centrar sede en el mapa</span>
            </button>
          )}

          {/* Botón principal para PONER EN EL MAPA LA UBICACIÓN DE LA SEDE SELECCIONADA */}
          {canManage && sedeId && (
            <button
              type="button"
              onClick={handleIniciarPonerSede}
              title="Fijar o reubicar en el mapa las coordenadas y radio de esta sede"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs transition active:scale-95 ${
                isSettingLocation
                  ? "bg-navy-700 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-700"
                  : sedeSeleccionadaLocation
                  ? "border border-gray-200/80 bg-white text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                  : "bg-navy-700 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-700"
              }`}
            >
              <MdOutlineAddLocationAlt className="h-4 w-4" />
              <span>
                {isSettingLocation
                  ? "Cancelar edición"
                  : sedeSeleccionadaLocation
                  ? "Reubicar sede en el mapa"
                  : "Poner en el mapa ubicación de sede"}
              </span>
            </button>
          )}

          {/* Selector de Fecha */}
          <input
            aria-label="Fecha de asistencia"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-navy-700 shadow-xs transition hover:border-gray-300 focus:border-brand-500 focus:outline-hidden dark:border-white/10 dark:bg-charcoal dark:text-white"
          />

          {/* Botón rápido Hoy */}
          <button
            type="button"
            onClick={() => setDate(getElSalvadorTodayISO())}
            title="Ir a la fecha de hoy"
            className="rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white"
          >
            Hoy
          </button>

          {/* Selector de Estado */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-navy-700 shadow-xs transition hover:border-gray-300 focus:border-brand-500 focus:outline-hidden dark:border-white/10 dark:bg-charcoal dark:text-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="validado">Validados</option>
            <option value="fuera_de_zona">Fuera de zona</option>
            <option value="sin_geocerca">Sin geocerca</option>
            <option value="precision_insuficiente">Precisión baja</option>
            <option value="excepcion_aprobada">Excepción aprobada</option>
            <option value="excepcion_rechazada">Excepción rechazada</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-white/50">
            Mostrando <strong>{visibleEvents.length}</strong> {visibleEvents.length === 1 ? "registro" : "registros"}
          </span>
        </div>
      </div>

      {/* Banner interactivo cuando está activo el modo "Poner en el mapa la ubicación de la sede" */}
      {isSettingLocation && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <MdOutlineAddLocationAlt className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                Fijar ubicación en el mapa: <span className="underline">{selectedSedeObj?.nombre}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-300/80">
                {tempLocation
                  ? `Posición fijada: ${tempLocation.lat.toFixed(6)}, ${tempLocation.lng.toFixed(6)}. Ajusta el radio si lo deseas y confirma.`
                  : "Haz clic en cualquier punto del mapa para colocar el centro de la sede autorizada."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tempLocation && (
              <label className="flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy-700 dark:border-white/10 dark:bg-charcoal dark:text-white">
                <span>Radio geocerca:</span>
                <input
                  type="number"
                  min={25}
                  max={3000}
                  step={25}
                  value={tempRadio}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setTempRadio(r);
                    if (tempLocation) setTempLocation({ ...tempLocation, radio: r });
                  }}
                  className="w-16 rounded-md border border-gray-200 px-1.5 py-0.5 text-center text-xs font-bold text-brand-600 dark:border-charcoal-border dark:bg-charcoal-light dark:text-brand-300"
                />
                <span>m</span>
              </label>
            )}

            {tempLocation && (
              <button
                type="button"
                onClick={handleGuardarUbicacionSede}
                disabled={savingLocation}
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50 active:scale-95"
              >
                {savingLocation ? "Guardando..." : "Confirmar y Guardar"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSettingLocation(false);
                setTempLocation(null);
              }}
              className="rounded-xl border border-gray-300/80 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Alerta de error si ocurre */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <MdOutlineWarningAmber className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Bloque Principal: Mapa (2/3) + Lista de Marcajes (1/3) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
        {/* Mapa Interactivo */}
        <div className="xl:col-span-2 flex flex-col h-full">
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={120}>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy-700 dark:text-white">
                    Geolocalización en Tiempo de Registro
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-white/50">
                    Puntos capturados al fichar entrada o salida con Google Maps
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white/80">
                  Google Maps Roadmap
                </span>
              </div>

              {/* Contenedor del Mapa */}
              <AttendanceMap
                locations={visibleLocations}
                events={visibleEvents}
                selectedEvent={selected}
                targetLocation={targetLocation}
                tempLocation={tempLocation}
                isSettingLocation={isSettingLocation}
                addresses={addresses}
                onEventSelect={handleSelectEvent}
                onMapClick={handleMapClick}
              />
            </div>
          </NexxusCard>
        </div>

        {/* Panel Lateral de Marcajes Registrados */}
        <div className="xl:col-span-1 flex flex-col h-full">
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={150}>
            <div>
              {/* Encabezado del panel lateral */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-navy-700 dark:text-white">
                    Marcajes Registrados
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-white/50">
                    Historial del día en El Salvador
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white/80">
                  {visibleEvents.length}
                </span>
              </div>

              {/* Lista scrolleable con diseño discreto y elegante */}
              <div className="mt-3 space-y-2 overflow-y-auto max-h-[440px] pr-1 sidebar-scroll">
                {visibleEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MdOutlineLocationOn className="h-8 w-8 text-gray-300 dark:text-white/20 mb-2" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-white/50">
                      No hay eventos registrados
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">
                      Prueba seleccionando otra fecha.
                    </p>
                  </div>
                ) : (
                  visibleEvents.map((event) => {
                    const isSelected = selected?.id === event.id;
                    const isEntrada = event.tipo_evento === "entrada";
                    const estadoCfg =
                      ESTADOS_MAPA[event.estado_validacion] || ESTADOS_MAPA.precision_insuficiente;

                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSelectEvent(event);
                          }
                        }}
                        className={`w-full rounded-2xl p-3 text-left transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-gray-100 dark:bg-white/10 ring-1 ring-gray-300 dark:ring-white/20"
                            : "hover:bg-gray-50/80 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={event.usuario?.foto_perfil}
                            name={event.usuario?.nombre}
                            size={10}
                            className="shrink-0"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                              {event.usuario?.nombre || "Colaborador"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-white/50">
                              {event.sede?.nombre || "Sin sede"} •{" "}
                              {new Date(event.captured_at).toLocaleTimeString("es-SV", {
                                timeZone: "America/El_Salvador",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Pill de estado y acción eliminar discreta */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full border border-gray-200/80 bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                              {isEntrada ? "Entrada" : "Salida"}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.2 text-[9px] font-semibold border ${estadoCfg.bg} ${estadoCfg.color} ${estadoCfg.border}`}
                            >
                              {estadoCfg.label}
                            </span>
                          </div>

                          {canManage && (
                            <div
                              className="flex items-center"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {deleteConfirmId === event.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarMarcaje(event.id)}
                                    disabled={deletingId === event.id}
                                    title="Confirmar eliminación"
                                    className="rounded-lg bg-navy-700 px-2 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-black disabled:opacity-50 dark:bg-white dark:text-navy-700 dark:hover:bg-gray-200"
                                  >
                                    {deletingId === event.id ? "..." : "Borrar"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    title="Cancelar"
                                    className="rounded-lg border border-gray-200/80 bg-white px-1.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white/80"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(event.id)}
                                  title="Eliminar marcaje"
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white transition active:scale-95"
                                >
                                  <MdOutlineDelete className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pie del card */}
            <div className="border-t border-gray-100 pt-3 dark:border-white/10">
              <span className="text-xs font-medium text-gray-400 dark:text-white/40 flex items-center justify-center gap-1">
                <span>Haz clic en un registro o pin para ver detalles</span>
              </span>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* 5. Card Detallada del Marcaje Seleccionado */}
      {selected && (
        <NexxusCard extra="p-6 border border-gray-200/80 dark:border-white/10 shadow-xs" delay={50}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Información del empleado y estado */}
            <div className="flex items-start gap-4">
              <Avatar
                src={selected.usuario?.foto_perfil}
                name={selected.usuario?.nombre}
                size={14}
                className="shrink-0 ring-1 ring-gray-200 dark:ring-white/10"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                    {selected.usuario?.nombre || "Colaborador"}
                  </h3>
                  <span className="rounded-full border border-gray-200/80 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                    {selected.tipo_evento === "entrada" ? "Entrada registrada" : "Salida registrada"}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      (ESTADOS_MAPA[selected.estado_validacion] || ESTADOS_MAPA.precision_insuficiente).bg
                    } ${
                      (ESTADOS_MAPA[selected.estado_validacion] || ESTADOS_MAPA.precision_insuficiente).color
                    } ${
                      (ESTADOS_MAPA[selected.estado_validacion] || ESTADOS_MAPA.precision_insuficiente).border
                    }`}
                  >
                    {(ESTADOS_MAPA[selected.estado_validacion] || ESTADOS_MAPA.precision_insuficiente).label}
                  </span>
                </div>

                {/* Dirección completa obtenida */}
                <div className="mt-2.5 flex items-start gap-1.5 text-xs text-gray-700 dark:text-white/90">
                  <MdOutlineLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium leading-relaxed">
                    {addresses[selected.id] ||
                      (loadingAddress[selected.id]
                        ? "Obteniendo dirección exacta..."
                        : selected.sede?.nombre || "Dirección no disponible")}
                  </span>
                </div>

                {/* Metadatos */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-white/50">
                  {selected.sede?.nombre && (
                    <span>
                      <strong className="text-navy-700 dark:text-white">Sede asignada:</strong> {selected.sede.nombre}
                    </span>
                  )}
                  <span>
                    <strong className="text-navy-700 dark:text-white">Distancia:</strong>{" "}
                    {selected.distancia_m != null
                      ? `${Math.round(selected.distancia_m)} m del punto autorizado`
                      : "Sin geocerca vinculada"}
                  </span>
                  <span>
                    <strong className="text-navy-700 dark:text-white">Precisión GPS:</strong> ±
                    {Math.round(selected.precision_horizontal_m || 0)} m
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-white/70 font-semibold">
                    <MdOutlineAccessTime className="h-3.5 w-3.5 text-gray-400" />
                    <span>
                      {new Date(selected.captured_at).toLocaleTimeString("es-SV", {
                        timeZone: "America/El_Salvador",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones del detalle */}
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-white/10 lg:border-t-0 lg:pt-0">
              {/* Botón copiar coordenadas */}
              <button
                type="button"
                onClick={() => copiarCoordenadas(selected.latitud, selected.longitud)}
                title="Copiar coordenadas al portapapeles"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-xs font-mono text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                {copiedCoords ? (
                  <>
                    <MdOutlineCheck className="h-4 w-4 text-gray-700 dark:text-white" />
                    <span className="font-sans font-bold text-gray-900 dark:text-white">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <MdOutlineContentCopy className="h-3.5 w-3.5 text-gray-400" />
                    <span>
                      {selected.latitud.toFixed(5)}, {selected.longitud.toFixed(5)}
                    </span>
                  </>
                )}
              </button>

              {/* Botón abrir en Google Maps */}
              <a
                href={`https://www.google.com/maps?q=${selected.latitud},${selected.longitud}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                <span>Google Maps</span>
                <MdOutlineOpenInNew className="h-3.5 w-3.5" />
              </a>

              {/* Botón eliminar marcaje (solo administradores) */}
              {canManage && (
                deleteConfirmId === selected.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={deletingId === selected.id}
                      onClick={() => handleEliminarMarcaje(selected.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-navy-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-black active:scale-95 disabled:opacity-50 dark:bg-white dark:text-navy-700 dark:hover:bg-gray-200"
                    >
                      <MdOutlineDelete className="h-4 w-4" />
                      <span>{deletingId === selected.id ? "Eliminando..." : "Confirmar eliminación"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === selected.id}
                      onClick={() => setDeleteConfirmId(null)}
                      className="rounded-xl border border-gray-200/80 bg-white px-2.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(selected.id)}
                    title="Eliminar este marcaje"
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-100 hover:text-black active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <MdOutlineDelete className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>Eliminar marcaje</span>
                  </button>
                )
              )}

              {/* Botón cerrar detalle */}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                <MdOutlineClose className="h-4 w-4" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </NexxusCard>
      )}
    </div>
  );
}
