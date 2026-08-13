import { supabase } from './supabaseClient';
import {
  IAnnouncementRepository, CommunicationDirectory, PublishAnnouncementInput,
} from 'domain/repositories/IAnnouncementRepository';
import { Announcement } from 'domain/entities/Announcement';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): Announcement {
  return {
    ...(row.datos || {}),
    id: row.id,
    empresaId: row.empresa_id,
    creadoPorId: row.autor_id ?? '',
    creadoPorNombre: row.datos?.creadoPorNombre ?? '',
    departamentoDestino: row.datos?.departamentoDestino ?? 'Todos',
    prioridad: row.datos?.prioridad ?? 'Normal',
    mensaje: row.contenido ?? '',
    fecha: row.created_at,
  };
}

export class SupabaseAnnouncementRepository implements IAnnouncementRepository {
  async getAnnouncements(empresaId: string): Promise<Announcement[]> {
    const { data, error } = await supabase.from('anuncios').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string> {
    const { empresaId, creadoPorId, mensaje, ...extra } = announcement;
    const { data, error } = await supabase.from('anuncios').insert({
      empresa_id: empresaId, autor_id: creadoPorId || null, titulo: extra.departamentoDestino || 'Anuncio', contenido: mensaje, datos: extra,
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase.from('anuncios').delete().eq('id', id);
    if (error) throw error;
  }

  subscribeToAll(empresaId: string, callback: (announcements: Announcement[]) => void): () => void {
    return subscribeQuery('anuncios', `empresa_id=eq.${empresaId}`, () => this.getAnnouncements(empresaId), callback);
  }

  subscribeCommunicationDirectory(empresaId: string, callback: (directory: CommunicationDirectory) => void): () => void {
    const load = async (): Promise<CommunicationDirectory> => {
      const [{ data: usuarios }, { data: sedes }, { data: departamentos }, { data: cargos }, { data: notificaciones }] = await Promise.all([
        supabase.from('usuarios').select('id, nombre, correo, rol, foto_perfil').eq('empresa_id', empresaId),
        supabase.from('sedes').select('id, nombre').eq('empresa_id', empresaId),
        supabase.from('departamentos').select('id, nombre').eq('empresa_id', empresaId),
        supabase.from('cargos').select('id, titulo').eq('empresa_id', empresaId),
        supabase.from('notificaciones').select('id, usuario_id, leida').eq('empresa_id', empresaId),
      ]);
      return {
        usuarios: (usuarios || []).map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, foto_perfil: u.foto_perfil })),
        sedes: (sedes || []).map((s) => ({ id: s.id, nombre: s.nombre })),
        departamentos: (departamentos || []).map((d) => ({ id: d.id, nombre: d.nombre })),
        cargos: (cargos || []).map((c) => ({ id: c.id, nombre: c.titulo })),
        roles: [{ id: 'jefe', nombre: 'Jefe' }, { id: 'empleado', nombre: 'Empleado' }, { id: 'admin_empresa', nombre: 'Administrador' }],
        notificaciones: (notificaciones || []).map((n) => ({ id: n.id, usuarioId: n.usuario_id, leida: n.leida })),
      };
    };
    let active = true;
    load().then((d) => active && callback(d));
    return () => { active = false; };
  }

  async publishAnnouncement(input: PublishAnnouncementInput): Promise<string> {
    const id = await this.createAnnouncement({
      empresaId: input.announcement.empresaId,
      creadoPorId: input.actor.id,
      creadoPorNombre: input.actor.nombre,
      departamentoDestino: input.announcement.departamentoDestino,
      alcance: input.announcement.alcance,
      prioridad: input.announcement.prioridad,
      mensaje: input.announcement.mensaje,
      destinatariosTotal: input.recipients.length,
    } as any);

    if (input.recipients.length > 0) {
      await supabase.from('notificaciones').insert(input.recipients.map((r) => ({
        usuario_id: r.id,
        empresa_id: input.announcement.empresaId,
        titulo: 'Nuevo anuncio',
        cuerpo: input.announcement.mensaje,
        tipo: 'anuncio',
      })));
    }

    await supabase.from('audit_logs').insert({
      empresa_id: input.announcement.empresaId,
      actor_id: input.actor.id,
      accion: 'Publicación de anuncio',
      modulo: 'Comunicación',
      detalles: input.announcement.mensaje.slice(0, 160),
      target_id: id,
    });
    return id;
  }
}
