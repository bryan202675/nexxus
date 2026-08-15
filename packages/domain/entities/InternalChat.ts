export type ConversationType = 'directa' | 'equipo' | 'departamento';

export interface ChatParticipant {
  id: string;
  nombre: string;
  rol?: string;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
  avatarUrl?: string;
  foto?: string;
}

export interface Conversation {
  id: string;
  empresaId: string;
  tipo: ConversationType;
  titulo: string;
  participanteIds: string[];
  participantes: ChatParticipant[];
  ultimoMensaje?: string;
  ultimoMensajeAt?: string;
  ultimoMensajeRemitenteId?: string;
  ultimoMensajeRemitenteNombre?: string;
  creadoPor: string;
  fechaCreacion: string;
  imagenUrl?: string;
  eliminadoPor?: string[];
}

export interface ChatMessage {
  id: string;
  empresaId: string;
  conversacionId: string;
  remitenteId: string;
  remitenteNombre: string;
  texto: string;
  adjuntos: ChatAttachment[];
  leidoPor: string[];
  timestamp: string;
}

export interface ChatAttachment {
  tipo: 'imagen' | 'documento';
  nombre: string;
  url: string;
  mime: string;
  size: number;
  publicId?: string;
  assetId?: string;
}

export interface ChatUser {
  id: string;
  nombre: string;
  correo?: string;
  rol?: string;
  departamento?: string;
  departamentoId?: string;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
  avatarUrl?: string;
  foto?: string;
}

export interface CreateConversationInput {
  empresaId: string;
  tipo: ConversationType;
  titulo: string;
  participantes: ChatParticipant[];
  creadoPor: string;
}

export interface SendMessageInput {
  empresaId: string;
  conversacionId: string;
  remitenteId: string;
  remitenteNombre: string;
  texto: string;
  adjuntos?: ChatAttachment[];
}
