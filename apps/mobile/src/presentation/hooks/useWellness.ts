/**
 * Documentacion Nexxus - apps/mobile/src/presentation/hooks/useWellness.ts
 * Capa: presentacion.
 * Proposito: Hook de presentacion. Expone estado y acciones reutilizables para componentes React sin duplicar logica.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { useState, useCallback } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { useState, useCallback } from 'react';
// Importa { useCases }; contenedor de DI ya resuelto sobre Supabase.
import { useCases } from '@/infrastructure/container';
// Importa { CreateCheckInDTO, WellnessMetricsDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { CreateCheckInDTO, WellnessMetricsDTO } from 'domain/application/dtos/CheckInDTO';

/**
 * Hook useWellness. Expone estado derivado y acciones reutilizables para componentes React.
 */
export function useWellness(userId?: string, userName?: string) {
  // Inicializa [metrics, setMetrics]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [metrics, setMetrics] = useState<WellnessMetricsDTO | null>(null);
  // Inicializa [loading, setLoading]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [loading, setLoading] = useState(false);
  // Inicializa [error, setError]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [error, setError] = useState<string | null>(null);

  // Inicializa fetchMetrics; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fetchMetrics = useCallback(async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!userId || !userName) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLoading(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const data = await useCases.wellness.getMetrics.execute(userId, userName);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setMetrics(data);
    } catch (err: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setError('Error al cargar métricas de bienestar');
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLoading(false);
    }
  }, [userId, userName]);

  // Declara recordCheckIn; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const recordCheckIn = async (dto: CreateCheckInDTO) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!userId) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLoading(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.wellness.recordCheckIn.execute(userId, dto);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await fetchMetrics(); // Refrescar métricas después de un nuevo check-in
    } catch (err: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setError('Error al registrar check-in');
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw err;
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLoading(false);
    }
  };

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    recordCheckIn
  };
}
