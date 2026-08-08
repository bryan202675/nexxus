import { supabase } from './supabaseClient';
import { IDocumentoRepository, Documento, DocumentStorageStats } from 'domain/entities/Documento';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): Documento {
  return {
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    titulo: row.titulo,
    tipo: row.categoria ?? row.datos?.tipo ?? 'otro',
    url: row.datos?.url ?? row.storage_path,
    publicId: row.datos?.publicId,
    hash: row.datos?.hash,
    size: row.tamano_bytes ?? undefined,
    mime: row.mime_type ?? undefined,
    createdBy: row.datos?.createdBy,
    fechaSubida: row.created_at,
    leido: row.leido,
    categoria: row.categoria ?? undefined,
  };
}

export class SupabaseDocumentoRepository implements IDocumentoRepository {
  async getByUser(userId: string): Promise<Documento[]> {
    const { data, error } = await supabase.from('documentos').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getByCompany(empresaId: string): Promise<Documento[]> {
    const { data, error } = await supabase.from('documentos').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByCompany(empresaId: string, callback: (documentos: Documento[]) => void): () => void {
    return subscribeQuery('documentos', `empresa_id=eq.${empresaId}`, () => this.getByCompany(empresaId), callback);
  }

  async create(documento: Omit<Documento, 'id'>): Promise<string> {
    const { data, error } = await supabase.from('documentos').insert({
      usuario_id: documento.userId,
      empresa_id: documento.empresaId,
      titulo: documento.titulo,
      categoria: documento.tipo,
      storage_path: documento.url,
      mime_type: documento.mime ?? null,
      tamano_bytes: documento.size ?? null,
      leido: documento.leido,
      datos: { url: documento.url, publicId: documento.publicId, hash: documento.hash, createdBy: documento.createdBy },
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async delete(documentoId: string): Promise<void> {
    const { error } = await supabase.from('documentos').delete().eq('id', documentoId);
    if (error) throw error;
  }

  async deleteWithAsset(documento: Pick<Documento, 'id' | 'publicId'>): Promise<void> {
    if (documento.publicId) {
      await supabase.functions.invoke('delete-cloudinary-asset', { body: { publicId: documento.publicId } }).catch(() => {});
    }
    await this.delete(documento.id);
  }

  async markAsRead(documentoId: string): Promise<void> {
    const { error } = await supabase.from('documentos').update({ leido: true }).eq('id', documentoId);
    if (error) throw error;
  }

  async getStorageStats(empresaId: string): Promise<DocumentStorageStats> {
    const { data, error } = await supabase.functions.invoke('get-storage-stats-by-company', { body: { empresaId } });
    if (error) throw error;
    return data as DocumentStorageStats;
  }
}
