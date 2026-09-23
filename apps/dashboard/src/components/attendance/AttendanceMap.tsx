import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "context/ThemeContext";
import Avatar from "components/nexxus/Avatar";
import {
  MdOutlineAccessTime,
  MdOutlineApartment,
  MdOutlineLocationOn,
  MdOutlineOpenInNew,
  MdOutlineRadar,
} from "react-icons/md";

export type AttendanceGeoLocation = {
  id: string;
  sede_id?: string;
  nombre: string;
  latitud: number;
  longitud: number;
  radio_metros: number;
  activa: boolean;
  tipos_evento: string[];
};

export type AttendanceGeoEvent = {
  id: string;
  latitud: number;
  longitud: number;
  precision_horizontal_m: number | null;
  tipo_evento: "entrada" | "salida";
  estado_validacion: string;
  estado_revision: string;
  distancia_m: number | null;
  captured_at: string;
  usuario?: { nombre?: string; foto_perfil?: string };
  sede?: { nombre?: string };
};

export const ESTADOS_MAPA: Record<
  string,
  { label: string; color: string; bg: string; border: string; pinColor: string }
> = {
  validado: {
    label: "Validado",
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-200 dark:border-white/10",
    pinColor: "#EA4335",
  },
  fuera_de_zona: {
    label: "Fuera de zona",
    color: "text-gray-900 dark:text-white font-bold",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-300 dark:border-white/20",
    pinColor: "#EA4335",
  },
  sin_geocerca: {
    label: "Sin geocerca",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-200 dark:border-white/10",
    pinColor: "#EA4335",
  },
  precision_insuficiente: {
    label: "Precisión baja",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-200 dark:border-white/10",
    pinColor: "#EA4335",
  },
  excepcion_aprobada: {
    label: "Excepción aprobada",
    color: "text-gray-700 dark:text-gray-300",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-200 dark:border-white/10",
    pinColor: "#EA4335",
  },
  excepcion_rechazada: {
    label: "Excepción rechazada",
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100/90 dark:bg-white/10",
    border: "border-gray-200 dark:border-white/10",
    pinColor: "#EA4335",
  },
};

/**
 * Crea el pin rojo oficial de Google Maps (#EA4335 con círculo interior #B31412 y sombra en la base)
 */
function createGoogleRedPinIcon(isSelected: boolean) {
  const w = isSelected ? 32 : 27;
  const h = isSelected ? 50 : 43;
  const anchorX = w / 2;
  const anchorY = h;

  const pulseRing = isSelected
    ? `<div style="position:absolute;bottom:0;left:50%;transform:translate(-50%, 50%);width:22px;height:22px;border-radius:9999px;border:3px solid #EA4335;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.85;"></div>`
    : "";

  return L.divIcon({
    className: "google-maps-red-pin",
    html: `
      <div style="position:relative;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform 0.2s ease;">
        ${pulseRing}
        <svg viewBox="0 0 27 43" width="${w}" height="${h}" style="display:block;transform:${isSelected ? "scale(1.15)" : "scale(1)"};filter:drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
          <!-- Sombra en la base -->
          <ellipse cx="13.5" cy="40" rx="6.5" ry="2" fill="rgba(0,0,0,0.3)" />
          <!-- Pin rojo característico de Google Maps -->
          <path d="M13.5 0C6.044 0 0 6.044 0 13.5c0 10.125 13.5 27 13.5 27S27 23.625 27 13.5C27 6.044 20.956 0 13.5 0z" fill="#EA4335" stroke="#C5221F" stroke-width="0.8"/>
          <!-- Círculo interior rojo oscuro característico -->
          <circle cx="13.5" cy="13.5" r="5.5" fill="#B31412"/>
        </svg>
      </div>
    `,
    iconSize: [w, h],
    iconAnchor: [anchorX, anchorY],
    popupAnchor: [0, -h],
  });
}

function createSedeMarkerIcon(nombre: string, isPreview = false) {
  const bg = isPreview ? "#10B981" : "#1b254b";
  const shadow = "rgba(0, 0, 0, 0.25)";

  return L.divIcon({
    className: "custom-sede-marker",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="width:32px;height:32px;border-radius:9999px;background:${bg};color:#ffffff;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 3px 8px ${shadow};">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
            <path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function FitToData({
  locations,
  events,
  fitTrigger,
}: {
  locations: AttendanceGeoLocation[];
  events: AttendanceGeoEvent[];
  fitTrigger: number;
}) {
  const map = useMap();
  const points = useMemo(
    () => [
      ...locations.map((x) => [x.latitud, x.longitud] as [number, number]),
      ...events.map((x) => [x.latitud, x.longitud] as [number, number]),
    ],
    [locations, events]
  );

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 16, { animate: true });
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [map, points, fitTrigger]);

  return null;
}

function CenterOnSelected({ selectedEvent }: { selectedEvent?: AttendanceGeoEvent | null }) {
  const map = useMap();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedEvent && selectedEvent.latitud && selectedEvent.longitud) {
      if (lastIdRef.current !== selectedEvent.id) {
        lastIdRef.current = selectedEvent.id;
        map.flyTo([selectedEvent.latitud, selectedEvent.longitud], Math.max(map.getZoom(), 16), {
          duration: 0.8,
        });
      }
    }
  }, [map, selectedEvent]);

  return null;
}

function CenterOnTarget({ target }: { target?: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (target && target.lat && target.lng) {
      const key = `${target.lat}_${target.lng}`;
      if (lastTargetRef.current !== key) {
        lastTargetRef.current = key;
        map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
      }
    }
  }, [map, target]);

  return null;
}

function MapClickCapture({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onMapClick?.(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

function EventMarkerItem({
  event,
  isSelected,
  direccion,
  onSelect,
}: {
  event: AttendanceGeoEvent & { displayLat: number; displayLng: number };
  isSelected: boolean;
  direccion: string;
  onSelect: (event: AttendanceGeoEvent) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const estadoCfg = ESTADOS_MAPA[event.estado_validacion] || ESTADOS_MAPA.precision_insuficiente;
  const isEntrada = event.tipo_evento === "entrada";
  const coordStr = `${event.latitud.toFixed(6)},  ${event.longitud.toFixed(6)}`;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[event.displayLat, event.displayLng]}
      icon={createGoogleRedPinIcon(isSelected)}
      eventHandlers={{
        click: () => onSelect(event),
      }}
    >
      <Popup>
        {/* Card detallada del popup de marcaje */}
        <div className="w-[305px] overflow-hidden rounded-[22px] p-5 text-xs select-none">
          {/* Fila 1: Header - Label COLABORADOR y Badge Salida/Entrada */}
          <div className="flex items-center justify-between pr-8">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Colaborador
            </span>
            <span className="rounded-full border border-gray-200/80 bg-gray-100 px-3 py-0.5 text-xs font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
              {isEntrada ? "Entrada" : "Salida"}
            </span>
          </div>

          {/* Fila 2: Nombre del Colaborador */}
          <div className="mt-1.5 flex items-center gap-2.5 pr-8">
            {event.usuario?.foto_perfil && (
              <Avatar
                src={event.usuario?.foto_perfil}
                name={event.usuario?.nombre}
                size={7}
                className="shrink-0"
              />
            )}
            <h4 className="truncate text-base font-bold text-navy-700 dark:text-white">
              {event.usuario?.nombre || "Colaborador"}
            </h4>
          </div>

          {/* Separador fino */}
          <div className="my-3 border-b border-gray-100 dark:border-charcoal-border" />

          {/* Fila 3: Badge de Estado y Hora oficial de El Salvador */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-xl border px-3 py-1 text-xs font-bold ${estadoCfg.bg} ${estadoCfg.color} ${estadoCfg.border}`}
            >
              {estadoCfg.label}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
              <MdOutlineAccessTime className="h-4 w-4 text-gray-400 dark:text-white/40 shrink-0" />
              <span>
                {new Date(event.captured_at).toLocaleTimeString("es-SV", {
                  timeZone: "America/El_Salvador",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </div>

          {/* Fila 4: Caja redondeada con Icono de Pin y Dirección de Marcaje */}
          <div className="mt-3.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-charcoal-border dark:bg-charcoal-light/60">
            <div className="flex items-start gap-2">
              <MdOutlineLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Dirección de marcaje
                </p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-700 dark:text-white/90">
                  {direccion}
                </p>
              </div>
            </div>
          </div>

          {/* Fila 5: Coordenadas GPS y Precisión en metros */}
          <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-400 dark:text-white/40">
            <span className="font-mono text-[11px]">{coordStr}</span>
            <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40">
              Precisión: ±{Math.round(event.precision_horizontal_m || 0)} m
            </span>
          </div>

          {/* Fila 6: Separador y Pie con Distancia y enlace para Abrir Mapa */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-charcoal-border">
            <span className="text-xs text-gray-400 dark:text-white/40">
              {event.distancia_m != null
                ? `${Math.round(event.distancia_m)} m de la sede`
                : "Sin geocerca vinculada"}
            </span>

            <a
              href={`https://www.google.com/maps?q=${event.latitud},${event.longitud}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-black hover:underline dark:text-white dark:hover:text-white/80"
            >
              <span>Abrir mapa</span>
              <MdOutlineOpenInNew className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function SedeItemWithPopup({
  location,
  dark,
}: {
  location: AttendanceGeoLocation;
  dark: boolean;
}) {
  const [address, setAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const coordStr = `${location.latitud.toFixed(6)},  ${location.longitud.toFixed(6)}`;

  const handleOpenPopup = () => {
    if (!address && !loadingAddress) {
      setLoadingAddress(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitud}&lon=${location.longitud}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setAddress(data.display_name || data.name || "Ubicación geográfica de la sede");
          } else {
            setAddress("Punto central autorizado para el registro de asistencia en sitio.");
          }
        })
        .catch(() => {
          setAddress("Punto central autorizado para el registro de asistencia en sitio.");
        })
        .finally(() => {
          setLoadingAddress(false);
        });
    }
  };

  const cardContent = (
    <div className="w-[305px] overflow-hidden rounded-[22px] p-5 text-xs select-none">
      {/* Fila 1: Header - Label SEDE AUTORIZADA y Badge Activa */}
      <div className="flex items-center justify-between pr-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
          Sede Autorizada
        </span>
        <span className="rounded-full border border-gray-200/80 bg-gray-100 px-3 py-0.5 text-xs font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
          Activa
        </span>
      </div>

      {/* Fila 2: Nombre de la Sede con espacio a la derecha para no solapar el botón cerrar */}
      <div className="mt-1.5 flex items-center gap-2.5 pr-8">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">
          <MdOutlineApartment className="h-4.5 w-4.5" />
        </div>
        <h4 className="truncate text-base font-bold text-navy-700 dark:text-white">
          {location.nombre}
        </h4>
      </div>

      {/* Separador fino */}
      <div className="my-3 border-b border-gray-100 dark:border-charcoal-border" />

      {/* Fila 3: Badge Geocerca oficial y Radio de cobertura */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-xl border border-gray-200/80 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
          Geocerca oficial
        </span>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
          <MdOutlineRadar className="h-4 w-4 text-gray-400 dark:text-white/40 shrink-0" />
          <span>Radio: {location.radio_metros} m</span>
        </div>
      </div>

      {/* Fila 4: Caja redondeada con Icono de Pin y Dirección de la Sede */}
      <div className="mt-3.5 rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-charcoal-border dark:bg-charcoal-light/60">
        <div className="flex items-start gap-2">
          <MdOutlineLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Dirección de la sede
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-gray-700 dark:text-white/90">
              {loadingAddress
                ? "Obteniendo dirección..."
                : address || "Punto central autorizado para validación y registro de asistencia."}
            </p>
          </div>
        </div>
      </div>

      {/* Fila 5: Coordenadas GPS y Perímetro */}
      <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-400 dark:text-white/40">
        <span className="font-mono text-[11px]">{coordStr}</span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-white/40">
          Cobertura: ±{location.radio_metros} m
        </span>
      </div>

      {/* Fila 6: Separador y Pie con Estado y enlace para Abrir Mapa */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-charcoal-border">
        <span className="text-xs text-gray-400 dark:text-white/40">
          Perímetro activo
        </span>

        <a
          href={`https://www.google.com/maps?q=${location.latitud},${location.longitud}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-black hover:underline dark:text-white dark:hover:text-white/80"
        >
          <span>Abrir mapa</span>
          <MdOutlineOpenInNew className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      <Circle
        center={[location.latitud, location.longitud]}
        radius={location.radio_metros}
        pathOptions={{
          color: dark ? "#ffffff" : "#1b254b",
          fillColor: dark ? "#ffffff" : "#1b254b",
          fillOpacity: dark ? 0.08 : 0.05,
          weight: 1.5,
          dashArray: "5, 5",
        }}
        eventHandlers={{
          click: handleOpenPopup,
        }}
      >
        <Popup>{cardContent}</Popup>
      </Circle>
      <Marker
        position={[location.latitud, location.longitud]}
        icon={createSedeMarkerIcon(location.nombre)}
        eventHandlers={{
          click: handleOpenPopup,
        }}
      >
        <Popup>{cardContent}</Popup>
      </Marker>
    </>
  );
}

export default function AttendanceMap({
  locations,
  events,
  selectedEvent,
  targetLocation,
  tempLocation,
  isSettingLocation = false,
  addresses = {},
  onEventSelect,
  onMapClick,
}: {
  locations: AttendanceGeoLocation[];
  events: AttendanceGeoEvent[];
  selectedEvent?: AttendanceGeoEvent | null;
  targetLocation?: { lat: number; lng: number } | null;
  tempLocation?: { lat: number; lng: number; radio: number } | null;
  isSettingLocation?: boolean;
  addresses?: Record<string, string>;
  onEventSelect?: (event: AttendanceGeoEvent) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const { dark } = useTheme();
  const initial: [number, number] = locations[0]
    ? [locations[0].latitud, locations[0].longitud]
    : [13.6929, -89.2182];

  const fitKey = useMemo(() => events.length + locations.length, [events.length, locations.length]);

  const processedEvents = useMemo(() => {
    const coordCount: Record<string, number> = {};
    return events.map((event) => {
      const key = `${event.latitud.toFixed(5)}_${event.longitud.toFixed(5)}`;
      const index = coordCount[key] || 0;
      coordCount[key] = index + 1;

      if (index === 0) {
        return { ...event, displayLat: event.latitud, displayLng: event.longitud };
      }

      const angle = (index * (2 * Math.PI)) / 6;
      const offset = 0.00007; // ~7 metros
      return {
        ...event,
        displayLat: event.latitud + Math.sin(angle) * offset,
        displayLng: event.longitud + Math.cos(angle) * offset,
      };
    });
  }, [events]);

  return (
    <div
      className={`attendance-map-container relative isolate z-0 h-[500px] w-full overflow-hidden rounded-[16px] border border-gray-100 bg-gray-100 shadow-xs dark:border-charcoal-border dark:bg-charcoal ${
        isSettingLocation ? "cursor-crosshair" : ""
      }`}
    >
      {/* Estilos encapsulados para Leaflet, Google Maps y popups con diseño Panorama General */}
      <style>{`
        .attendance-map-container .leaflet-pane {
          z-index: 10 !important;
        }
        .attendance-map-container .leaflet-top,
        .attendance-map-container .leaflet-bottom {
          z-index: 20 !important;
        }
        .attendance-map-container .leaflet-popup-content-wrapper {
          background: ${dark ? "#0a0a0a" : "#ffffff"} !important;
          color: ${dark ? "#ffffff" : "#1b254b"} !important;
          border-radius: 22px !important;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.22) !important;
          border: 1px solid ${dark ? "#242427" : "rgba(229, 231, 235, 0.8)"} !important;
          padding: 0px !important;
        }
        .attendance-map-container .leaflet-popup-tip {
          background: ${dark ? "#0a0a0a" : "#ffffff"} !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
        }
        .attendance-map-container .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .attendance-map-container a.leaflet-popup-close-button {
          top: 14px !important;
          right: 14px !important;
          width: 22px !important;
          height: 22px !important;
          line-height: 20px !important;
          text-align: center !important;
          border-radius: 9999px !important;
          color: ${dark ? "#a3aed0" : "#707eae"} !important;
          font-size: 18px !important;
          font-weight: 300 !important;
          text-decoration: none !important;
          transition: all 0.15s ease !important;
        }
        .attendance-map-container a.leaflet-popup-close-button:hover {
          background: ${dark ? "#242427" : "#f4f7fe"} !important;
          color: ${dark ? "#ffffff" : "#1b254b"} !important;
        }
        .attendance-map-container .leaflet-container {
          font-family: inherit !important;
        }
        .attendance-map-container .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .attendance-map-container .leaflet-control-zoom a {
          background-color: ${dark ? "#0a0a0a" : "#ffffff"} !important;
          color: ${dark ? "#ffffff" : "#1b254b"} !important;
          border-color: ${dark ? "#242427" : "#f0f0f0"} !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
        }
        .attendance-map-container .leaflet-control-zoom a:hover {
          background-color: ${dark ? "#18181b" : "#f4f7fe"} !important;
        }
        .attendance-map-container .leaflet-control-attribution {
          background: ${dark ? "rgba(10,10,10,0.85)" : "rgba(255,255,255,0.85)"} !important;
          color: ${dark ? "#a3aed0" : "#707eae"} !important;
          backdrop-filter: blur(4px);
          font-size: 10px !important;
          border-radius: 8px 0 0 0;
          padding: 2px 6px !important;
        }
        .attendance-map-container .leaflet-control-attribution a {
          color: inherit !important;
        }
        ${
          dark
            ? `.attendance-map-container .leaflet-tile-pane {
                filter: brightness(0.68) invert(1) contrast(2.5) hue-rotate(190deg) saturate(0.35) brightness(0.75);
              }`
            : ""
        }
      `}</style>

      <MapContainer
        center={initial}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Mapa de eventos de asistencia"
      >
        {/* Capa de teselas idéntica a Google Maps (sin API key, sin marcas de agua) */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["0", "1", "2", "3"]}
          maxZoom={20}
        />

        <FitToData locations={locations} events={events} fitTrigger={fitKey} />
        <CenterOnSelected selectedEvent={selectedEvent} />
        <CenterOnTarget target={targetLocation} />
        <MapClickCapture onMapClick={onMapClick} />

        {/* Sedes autorizadas y radios de geocerca con diseño idéntico al card de referencia */}
        {locations
          .filter((x) => x.activa)
          .map((location) => (
            <SedeItemWithPopup key={`loc-${location.id}`} location={location} dark={dark} />
          ))}

        {/* Vista previa temporal al fijar una nueva ubicación para la sede seleccionada */}
        {tempLocation && (
          <div>
            <Circle
              center={[tempLocation.lat, tempLocation.lng]}
              radius={tempLocation.radio}
              pathOptions={{
                color: "#10B981",
                fillColor: "#10B981",
                fillOpacity: 0.18,
                weight: 2,
                dashArray: "4, 4",
              }}
            />
            <Marker
              position={[tempLocation.lat, tempLocation.lng]}
              icon={createSedeMarkerIcon("Nueva ubicación", true)}
            >
              <Popup>
                <div className="w-[305px] overflow-hidden rounded-[22px] p-5 text-xs select-none">
                  {/* Fila 1: Header - Label y Badge */}
                  <div className="flex items-center justify-between pr-8">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Nueva Ubicación
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                      Vista Previa
                    </span>
                  </div>

                  {/* Fila 2: Título */}
                  <div className="mt-1.5 flex items-center gap-2.5 pr-8">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <MdOutlineApartment className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="truncate text-base font-bold text-navy-700 dark:text-white">
                      Posición Asignada
                    </h4>
                  </div>

                  {/* Separador fino */}
                  <div className="my-3 border-b border-gray-100 dark:border-charcoal-border" />

                  {/* Fila 3: Badge y Radio */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-xl border border-emerald-200/60 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300">
                      Por confirmar
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                      <MdOutlineRadar className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Radio: {tempLocation.radio} m</span>
                    </div>
                  </div>

                  {/* Fila 4: Mensaje de acción */}
                  <div className="mt-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-xs font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
                      Haz clic en «Confirmar y Guardar» en la barra superior para registrar permanentemente estas coordenadas.
                    </p>
                  </div>

                  {/* Fila 5: Coordenadas */}
                  <div className="mt-3 flex items-center justify-between px-1 text-xs text-gray-400 dark:text-white/40">
                    <span className="font-mono text-[11px]">
                      {tempLocation.lat.toFixed(6)},  {tempLocation.lng.toFixed(6)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ±{tempLocation.radio} m
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        )}

        {/* Todos los marcajes se renderizan directamente con el PIN ROJO estilo Google Maps */}
        {processedEvents.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          const direccion = addresses[event.id] || event.sede?.nombre || "Cargando dirección...";

          return (
            <EventMarkerItem
              key={event.id}
              event={event}
              isSelected={isSelected}
              direccion={direccion}
              onSelect={(e) => onEventSelect?.(e)}
            />
          );
        })}
      </MapContainer>

      {/* Indicador flotante en esquina inferior */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-navy-700 shadow-xs backdrop-blur-md dark:border-charcoal-border dark:bg-charcoal/95 dark:text-white">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#EA4335] shadow-xs" />
          <span>Fichajes de asistencia ({events.length})</span>
        </span>
        {locations.length > 0 && (
          <>
            <span className="text-gray-300 dark:text-white/20">•</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-navy-700 dark:bg-white shadow-xs" />
              <span>Sedes autorizadas ({locations.length})</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
