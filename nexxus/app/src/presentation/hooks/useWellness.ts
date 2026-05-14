import { useState, useCallback } from 'react';
import { useCases } from '@/infrastructure/firebase/container';
import { CreateCheckInDTO, WellnessMetricsDTO } from '@/application/dtos/CheckInDTO';

export function useWellness(userId?: string, userName?: string) {
  const [metrics, setMetrics] = useState<WellnessMetricsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!userId || !userName) return;
    setLoading(true);
    try {
      const data = await useCases.wellness.getMetrics.execute(userId, userName);
      setMetrics(data);
    } catch (err: any) {
      setError('Error al cargar métricas de bienestar');
    } finally {
      setLoading(false);
    }
  }, [userId, userName]);

  const recordCheckIn = async (dto: CreateCheckInDTO) => {
    if (!userId) return;
    setLoading(true);
    try {
      await useCases.wellness.recordCheckIn.execute(userId, dto);
      await fetchMetrics(); // Refrescar métricas después de un nuevo check-in
    } catch (err: any) {
      setError('Error al registrar check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    recordCheckIn
  };
}
