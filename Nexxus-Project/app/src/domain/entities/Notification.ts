
export interface Notification {
  id: string;
  usuario_id: string;
  empresaId: string;
  titulo: string;
  mensaje: string;
  tipo: 'tarea' | 'anuncio' | 'privada' | 'info' | 'ausencia' | 'bienestar' | 'aprobacion';
  leida: boolean;
  fecha: string;
}
