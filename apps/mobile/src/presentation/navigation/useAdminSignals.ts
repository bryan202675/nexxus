/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/useAdminSignals.ts
 * Capa: presentacion.
 * Proposito: Hook que agrega senales en tiempo real (ausencias, solicitudes, inbox, auditoria) para el panel de admin.
 * Dependencias clave: supabase (realtime), SignalItem (adminNavigatorTypes).
 * Consideracion de mantenimiento: preservar la firma (user) => SignalItem[], la consume NavbarHeader via useAdminSignals(user).
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { obtenerEmpresaId } from './adminNavigatorHelpers';
import { SignalItem } from './adminNavigatorTypes';

/**
 * Hook useAdminSignals. Expone estado derivado y acciones reutilizables para componentes React.
 */
export function useAdminSignals(user: any) {
  // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresaId = obtenerEmpresaId(user);
  // Inicializa [items, setItems]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [items, setItems] = useState<SignalItem[]>([]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setItems([]);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara maps; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const maps = new Map<string, SignalItem[]>();
    // Declara publish; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const publish = () => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setItems(Array.from(maps.values()).flat().slice(0, 9));
    };

    // Se suscribe a una tabla filtrada por empresa_id y republica el estado agregado en cada cambio.
    const listen = (key: string, table: string, select: string, mapper: (row: any) => SignalItem | null) => {
      const run = async () => {
        const { data } = await supabase.from(table).select(select).eq('empresa_id', empresaId).limit(50);
        maps.set(key, (data || []).map(mapper).filter(Boolean) as SignalItem[]);
        publish();
      };
      run();
      const channel = supabase
        .channel(`admin-signals:${table}:${empresaId}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `empresa_id=eq.${empresaId}` }, run)
        .subscribe();
      return () => supabase.removeChannel(channel);
    };

    // Declara unsubscribers; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubscribers = [
      listen('ausencias', 'solicitudes_ausencia', 'id, tipo, motivo, estado, usuarios(nombre)', (doc) => doc.estado === 'pendiente' ? {
        id: `ausencia-${doc.id}`,
        title: doc.tipo || 'Ausencia pendiente',
        detail: doc.usuarios?.nombre || doc.motivo || 'Empleado',
        type: 'approval',
        tone: 'warning',
      } : null),
      listen('solicitudes', 'solicitudes_internas', 'id, tipo, detalle, estado', (doc) => doc.estado === 'pendiente' || doc.estado === 'revisado' ? {
        id: `solicitud-${doc.id}`,
        title: doc.tipo || 'Solicitud interna',
        detail: doc.detalle || 'Pendiente de revisión',
        type: 'approval',
        tone: 'warning',
      } : null),
      listen('inbox', 'inbox_unificado', 'id, origen, contenido', (doc) => ({
        id: `inbox-${doc.id}`,
        title: doc.origen || 'Alerta operativa',
        detail: doc.contenido || 'Requiere atención',
        type: 'alert',
        tone: 'info',
      })),
      listen('audit', 'audit_logs', 'id, accion, modulo', (doc) => ({
        id: `audit-${doc.id}`,
        title: doc.accion || 'Evento de auditoría',
        detail: doc.modulo || 'Sistema',
        type: 'audit',
        tone: 'success',
      })),
    ];

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [empresaId]);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return items;
}
