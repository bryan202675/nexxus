import { supabase } from './supabaseClient';

// Equivalente a onSnapshot(query(...)): en cada cambio en la tabla (insert/
// update/delete) que matchee el filtro, vuelve a correr `fetchData` y entrega
// el resultado completo al callback -- mismo contrato que el listener de
// Firestore que los use-cases ya esperan (payload completo en cada emision),
// en vez de parchear el estado incrementalmente en el cliente. T no tiene
// que ser un array: varios repos (SuperAdmin, Leader) entregan un snapshot
// compuesto (dashboard, PagedResult, etc.) en vez de una lista simple.
export function subscribeQuery<T>(
  table: string,
  filter: string | null,
  fetchData: () => Promise<T>,
  callback: (data: T) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;
  const run = () => {
    fetchData()
      .then((result) => {
        if (active) callback(result);
      })
      .catch((error) => {
        if (active && onError) onError(error instanceof Error ? error : new Error(String(error)));
      });
  };

  run();

  const channelName = `${table}:${filter || 'all'}:${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      run,
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
