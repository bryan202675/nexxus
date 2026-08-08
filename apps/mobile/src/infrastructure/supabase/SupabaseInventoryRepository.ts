import { supabase } from './supabaseClient';
import { IInventoryRepository } from 'domain/repositories/IInventoryRepository';
import {
  InventoryAsset, InventoryIncident, CreateInventoryAssetInput, AssignInventoryAssetInput, ReportInventoryIncidentInput,
} from 'domain/entities/Inventory';
import { subscribeQuery } from './realtime';

function mapAssetRow(row: Record<string, any>): InventoryAsset {
  return {
    ...(row.datos || {}),
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    categoria: row.categoria ?? '',
    codigo: row.datos?.codigo ?? '',
    estado: row.estado,
    asignadoA: row.asignado_a ?? undefined,
    fechaCreacion: row.created_at,
    fechaActualizacion: row.datos?.fechaActualizacion ?? row.created_at,
  };
}

function mapIncidentRow(row: Record<string, any>): InventoryIncident {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    activoId: row.datos?.activoId ?? '',
    activoNombre: row.datos?.activoNombre ?? '',
    reportadoPor: row.reportado_por,
    reportadoNombre: row.datos?.reportadoNombre ?? '',
    descripcion: row.titulo,
    prioridad: row.datos?.prioridad ?? 'media',
    estado: row.estado,
    fechaCreacion: row.created_at,
  };
}

export class SupabaseInventoryRepository implements IInventoryRepository {
  subscribeCompanyAssets(empresaId: string, limitCount: number, callback: (assets: InventoryAsset[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('inventario_activos', `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from('inventario_activos').select('*').eq('empresa_id', empresaId).limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapAssetRow);
    }, callback, onError);
  }

  subscribeUserAssets(empresaId: string, userId: string, limitCount: number, callback: (assets: InventoryAsset[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('inventario_activos', `asignado_a=eq.${userId}`, async () => {
      const { data, error } = await supabase.from('inventario_activos').select('*').eq('empresa_id', empresaId).eq('asignado_a', userId).limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapAssetRow);
    }, callback, onError);
  }

  subscribeIncidents(empresaId: string, limitCount: number, callback: (incidents: InventoryIncident[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('incidencias', `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from('incidencias').select('*').eq('empresa_id', empresaId).limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapIncidentRow);
    }, callback, onError);
  }

  async createAsset(input: CreateInventoryAssetInput): Promise<InventoryAsset> {
    const { data, error } = await supabase.from('inventario_activos').insert({
      empresa_id: input.empresaId,
      nombre: input.nombre,
      categoria: input.categoria,
      estado: 'disponible',
      datos: { codigo: input.codigo, serie: input.serie, ubicacion: input.ubicacion, notas: input.notas, creadoPor: input.creadoPor, creadorNombre: input.creadorNombre },
    }).select('*').single();
    if (error) throw error;
    return mapAssetRow(data);
  }

  async assignAsset(input: AssignInventoryAssetInput): Promise<void> {
    const { error } = await supabase.from('inventario_activos').update({ asignado_a: input.empleadoId, estado: 'asignado' }).eq('id', input.activoId);
    if (error) throw error;
    await supabase.from('inventario_movimientos').insert({ empresa_id: input.empresaId, activo_id: input.activoId, tipo: 'asignacion', realizado_por: input.actorId });
  }

  async returnAsset(input: Omit<AssignInventoryAssetInput, 'empleadoId' | 'empleadoNombre'>): Promise<void> {
    const { error } = await supabase.from('inventario_activos').update({ asignado_a: null, estado: 'disponible' }).eq('id', input.activoId);
    if (error) throw error;
    await supabase.from('inventario_movimientos').insert({ empresa_id: input.empresaId, activo_id: input.activoId, tipo: 'devolucion', realizado_por: input.actorId });
  }

  async reportIncident(input: ReportInventoryIncidentInput): Promise<InventoryIncident> {
    const { data, error } = await supabase.from('incidencias').insert({
      empresa_id: input.empresaId,
      reportado_por: input.reportadoPor,
      titulo: input.descripcion,
      estado: 'abierta',
      datos: { activoId: input.activoId, activoNombre: input.activoNombre, reportadoNombre: input.reportadoNombre, prioridad: input.prioridad },
    }).select('*').single();
    if (error) throw error;
    return mapIncidentRow(data);
  }

  async resolveIncident(incidentId: string): Promise<void> {
    const { error } = await supabase.from('incidencias').update({ estado: 'resuelta' }).eq('id', incidentId);
    if (error) throw error;
  }
}
