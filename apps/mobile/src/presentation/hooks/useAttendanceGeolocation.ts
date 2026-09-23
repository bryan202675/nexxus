import { useCallback, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/infrastructure/supabase/supabaseClient';

export type GeoAttendanceResult = {
  eventoId: string;
  asistenciaId: string | null;
  estado: 'validado' | 'fuera_de_zona' | 'precision_insuficiente' | 'sin_geocerca' | 'pendiente_revision';
  distanciaM: number | null;
  radioM: number | null;
  precisionM: number;
};

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number) => Promise.race<T>([
  promise,
  new Promise<T>((_, reject) => setTimeout(() => reject(new Error('No pudimos obtener una ubicación precisa a tiempo. Intenta salir a una zona con mejor señal.')), timeoutMs)),
]);
const newIdempotencyKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
  const value = Math.floor(Math.random() * 16);
  return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
});

/** Captura puntual de GPS para un fichaje. Nunca inicia seguimiento ni usa ubicación almacenada. */
export function useAttendanceGeolocation() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'capturing' | 'sending' | 'error'>('idle');
  const cancelled = useRef(false);

  const cancel = useCallback(() => { cancelled.current = true; setStatus('idle'); }, []);
  const register = useCallback(async (tipo: 'entrada' | 'salida'): Promise<GeoAttendanceResult> => {
    cancelled.current = false;
    if (AppState.currentState !== 'active') throw new Error('Vuelve a Nexxus para capturar la ubicación.');
    setStatus('requesting');
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) { setStatus('error'); throw new Error('Activa los servicios de ubicación para registrar la asistencia.'); }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') { setStatus('error'); throw new Error('Nexxus necesita ubicación solo mientras registras entrada o salida. Puedes habilitarla en Ajustes.'); }
    if (cancelled.current) throw new Error('Captura cancelada.');
    setStatus('capturing');
    const first = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }), 18_000);
    // Una segunda lectura breve reduce lecturas iniciales imprecisas sin dejar GPS activo.
    const second = first.coords.accuracy && first.coords.accuracy <= 100 ? first : await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }), 12_000);
    if (cancelled.current) throw new Error('Captura cancelada.');
    const accuracy = second.coords.accuracy;
    if (accuracy == null || !Number.isFinite(accuracy)) { setStatus('error'); throw new Error('El dispositivo no informó precisión GPS. Intenta de nuevo con señal despejada.'); }
    setStatus('sending');
    const { data, error } = await supabase.rpc('registrar_asistencia_geolocalizada', {
      p_tipo: tipo, p_latitud: second.coords.latitude, p_longitud: second.coords.longitude,
      p_precision_m: accuracy, p_captured_at: new Date(second.timestamp).toISOString(),
      p_idempotency_key: newIdempotencyKey(),
      p_proveedor: { platform: Platform.OS, altitude_accuracy: second.coords.altitudeAccuracy },
    });
    if (error) { setStatus('error'); throw new Error(error.message); }
    setStatus('idle');
    const row = data as Record<string, unknown>;
    return { eventoId: String(row.evento_id), asistenciaId: row.asistencia_id ? String(row.asistencia_id) : null, estado: String(row.estado) as GeoAttendanceResult['estado'], distanciaM: typeof row.distancia_m === 'number' ? row.distancia_m : null, radioM: typeof row.radio_metros === 'number' ? row.radio_metros : null, precisionM: accuracy };
  }, []);
  return { status, register, cancel };
}
