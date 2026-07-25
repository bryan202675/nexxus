import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { ChatMessage, ChatUser, Conversation, CreateConversationInput, SendMessageInput } from '@/domain/entities/InternalChat';
import { IInternalChatRepository } from '@/domain/repositories/IInternalChatRepository';
import { db } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const stringList = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : [];

const normalizeConversation = (id: string, data: Record<string, unknown>): Conversation => ({
  id,
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  tipo: data.tipo === 'equipo' || data.tipo === 'departamento' ? data.tipo : 'directa',
  titulo: textValue(data.titulo, 'Conversación'),
  participanteIds: stringList(data.participanteIds),
  participantes: Array.isArray(data.participantes) ? data.participantes.map((participant) => {
    const item = participant as Record<string, unknown>;
    const photo = textValue(item.foto_perfil) || textValue(item.fotoPerfil) || textValue(item.photoURL) || textValue(item.avatarUrl) || textValue(item.foto);
    return {
      id: textValue(item.id),
      nombre: textValue(item.nombre, 'Usuario'),
      rol: textValue(item.rol),
      foto_perfil: photo || undefined,
      fotoPerfil: photo || undefined,
      photoURL: photo || undefined,
      avatarUrl: photo || undefined,
      foto: photo || undefined,
    };
  }) : [],
  ultimoMensaje: textValue(data.ultimoMensaje),
  ultimoMensajeAt: textValue(data.ultimoMensajeAt),
  creadoPor: textValue(data.creadoPor),
  fechaCreacion: textValue(data.fechaCreacion, new Date().toISOString()),
  imagenUrl: textValue(data.imagenUrl),
  eliminadoPor: stringList(data.eliminadoPor),
});

const normalizeMessage = (id: string, data: Record<string, unknown>): ChatMessage => ({
  id,
  empresaId: textValue(data.empresaId, textValue(data.empresa_id)),
  conversacionId: textValue(data.conversacionId),
  remitenteId: textValue(data.remitenteId),
  remitenteNombre: textValue(data.remitenteNombre, 'Usuario'),
  texto: textValue(data.texto),
  adjuntos: Array.isArray(data.adjuntos) ? data.adjuntos.map((attachment) => {
    const item = attachment as Record<string, unknown>;
    return {
      tipo: item.tipo === 'documento' ? 'documento' : 'imagen',
      nombre: textValue(item.nombre, 'Adjunto'),
      url: textValue(item.url),
      mime: textValue(item.mime),
      size: typeof item.size === 'number' ? item.size : 0,
      publicId: textValue(item.publicId),
      assetId: textValue(item.assetId),
    };
  }) : [],
  leidoPor: stringList(data.leidoPor),
  timestamp: textValue(data.timestamp, new Date().toISOString()),
});

const normalizeUser = (id: string, data: Record<string, unknown>): ChatUser => {
  const photo = textValue(data.foto_perfil) || textValue(data.fotoPerfil) || textValue(data.photoURL) || textValue(data.avatarUrl) || textValue(data.foto);
  return {
    id,
    nombre: textValue(data.nombre, textValue(data.correo, 'Usuario')),
    correo: textValue(data.correo),
    rol: textValue(data.rol),
    departamento: textValue(data.departamento),
    departamentoId: textValue(data.departamentoId),
    foto_perfil: photo || undefined,
    fotoPerfil: photo || undefined,
    photoURL: photo || undefined,
    avatarUrl: photo || undefined,
    foto: photo || undefined,
  };
};

export class FirebaseInternalChatRepository implements IInternalChatRepository {
  subscribeConversations(
    empresaId: string,
    userId: string,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let unsubFallback: (() => void) | null = null;

    const primaryQuery = query(
      collection(db, 'conversaciones'),
      where('empresaId', '==', empresaId),
      where('participanteIds', 'array-contains', userId),
      orderBy('ultimoMensajeAt', 'desc'),
      limit(limitCount)
    );

    const unsubPrimary = onSnapshot(
      primaryQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((entry) => normalizeConversation(entry.id, entry.data()))
          .filter((conv) => !conv.eliminadoPor?.includes(userId));
        callback(items);
      },
      (error) => {
        console.warn('[FirebaseInternalChatRepository] Primary conversations query failed (likely missing index), using fallback:', error);
        const fallbackQuery = query(
          collection(db, 'conversaciones'),
          where('empresaId', '==', empresaId),
          where('participanteIds', 'array-contains', userId),
          limit(limitCount)
        );
        unsubFallback = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            const items = snapshot.docs
              .map((entry) => normalizeConversation(entry.id, entry.data()))
              .filter((conv) => !conv.eliminadoPor?.includes(userId));
            items.sort((a, b) => new Date(b.ultimoMensajeAt || b.fechaCreacion).getTime() - new Date(a.ultimoMensajeAt || a.fechaCreacion).getTime());
            callback(items);
          },
          (fallbackErr) => {
            console.error('[FirebaseInternalChatRepository] Fallback conversations query failed:', fallbackErr);
            onError(fallbackErr);
          }
        );
      }
    );

    return () => {
      unsubPrimary();
      if (unsubFallback) unsubFallback();
    };
  }

  subscribeAdminConversations(
    empresaId: string,
    superAdmin: boolean,
    limitCount: number,
    callback: (conversations: Conversation[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let unsubFallback: (() => void) | null = null;

    const baseQuery = superAdmin
      ? query(collection(db, 'conversaciones'), orderBy('ultimoMensajeAt', 'desc'), limit(limitCount))
      : query(collection(db, 'conversaciones'), where('empresaId', '==', empresaId), orderBy('ultimoMensajeAt', 'desc'), limit(limitCount));

    const unsubPrimary = onSnapshot(
      baseQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => normalizeConversation(entry.id, entry.data()));
        callback(items);
      },
      (error) => {
        console.warn('[FirebaseInternalChatRepository] Primary admin conversations query failed, using fallback:', error);
        const fallbackQuery = superAdmin
          ? query(collection(db, 'conversaciones'), limit(limitCount))
          : query(collection(db, 'conversaciones'), where('empresaId', '==', empresaId), limit(limitCount));

        unsubFallback = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            const items = snapshot.docs.map((entry) => normalizeConversation(entry.id, entry.data()));
            items.sort((a, b) => new Date(b.ultimoMensajeAt || b.fechaCreacion).getTime() - new Date(a.ultimoMensajeAt || a.fechaCreacion).getTime());
            callback(items);
          },
          (fallbackErr) => onError(fallbackErr)
        );
      }
    );

    return () => {
      unsubPrimary();
      if (unsubFallback) unsubFallback();
    };
  }

  subscribeMessages(
    empresaId: string,
    conversationId: string,
    limitCount: number,
    callback: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let unsubFallback: (() => void) | null = null;

    const primaryQuery = query(
      collection(db, 'mensajes'),
      where('empresaId', '==', empresaId),
      where('conversacionId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubPrimary = onSnapshot(
      primaryQuery,
      (snapshot) => {
        const items = snapshot.docs.map((entry) => normalizeMessage(entry.id, entry.data())).reverse();
        callback(items);
      },
      (error) => {
        console.warn('[FirebaseInternalChatRepository] Primary messages query failed, using fallback:', error);
        const fallbackQuery = query(
          collection(db, 'mensajes'),
          where('empresaId', '==', empresaId),
          where('conversacionId', '==', conversationId),
          limit(limitCount)
        );
        unsubFallback = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            const items = snapshot.docs.map((entry) => normalizeMessage(entry.id, entry.data()));
            items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            callback(items);
          },
          (fallbackErr) => {
            console.error('[FirebaseInternalChatRepository] Fallback messages query failed:', fallbackErr);
            onError(fallbackErr);
          }
        );
      }
    );

    return () => {
      unsubPrimary();
      if (unsubFallback) unsubFallback();
    };
  }

  subscribeCompanyUsers(
    empresaId: string,
    limitCount: number,
    callback: (users: ChatUser[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return onSnapshot(
      query(collection(db, 'usuarios'), where('empresaId', '==', empresaId), limit(limitCount)),
      (snapshot) => callback(snapshot.docs.map((entry) => normalizeUser(entry.id, entry.data()))),
      onError
    );
  }

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const fechaCreacion = new Date().toISOString();
    const participanteIds = Array.from(new Set(input.participantes.map((participant) => participant.id).filter(Boolean)));
    const docData = {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      tipo: input.tipo,
      titulo: input.titulo,
      participantes: input.participantes.filter((participant) => participanteIds.includes(participant.id)),
      participanteIds,
      creadoPor: input.creadoPor,
      fechaCreacion,
      ultimoMensaje: 'Conversación creada',
      ultimoMensajeAt: fechaCreacion,
    };
    const docRef = await addDoc(collection(db, 'conversaciones'), docData);
    return normalizeConversation(docRef.id, docData);
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const timestamp = new Date().toISOString();
    const texto = input.texto.trim();
    const adjuntos = (input.adjuntos || []).map((att) => {
      const clean: Record<string, any> = {
        tipo: att.tipo,
        nombre: att.nombre || 'Adjunto',
        url: att.url,
        mime: att.mime || 'application/octet-stream',
        size: att.size || 0,
      };
      if (att.publicId) clean.publicId = att.publicId;
      if (att.assetId) clean.assetId = att.assetId;
      return clean;
    });
    if (!texto && adjuntos.length === 0) return;
    await addDoc(collection(db, 'mensajes'), {
      empresaId: input.empresaId,
      empresa_id: input.empresaId,
      conversacionId: input.conversacionId,
      remitenteId: input.remitenteId,
      remitenteNombre: input.remitenteNombre,
      texto,
      adjuntos,
      leidoPor: [input.remitenteId],
      timestamp,
    });
    await updateDoc(doc(db, 'conversaciones', input.conversacionId), {
      ultimoMensaje: texto || (adjuntos[0]?.tipo === 'documento' ? 'Documento adjunto' : 'Imagen adjunta'),
      ultimoMensajeAt: timestamp,
      eliminadoPor: [],
    });
  }

  async updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.participantes !== undefined) {
      updateData.participantes = data.participantes;
      updateData.participanteIds = Array.from(new Set(data.participantes.map((p) => p.id).filter(Boolean)));
    }
    if ((data as any).imagenUrl !== undefined) {
      updateData.imagenUrl = (data as any).imagenUrl;
    }
    if (Object.keys(updateData).length === 0) return;
    await updateDoc(doc(db, 'conversaciones', conversationId), updateData);
  }

  async deleteConversation(conversationId: string, empresaId: string, userId?: string): Promise<void> {
    if (userId) {
      await updateDoc(doc(db, 'conversaciones', conversationId), {
        eliminadoPor: arrayUnion(userId),
      });
      return;
    }

    let hasMore = true;
    while (hasMore) {
      const snapshot = await getDocs(query(
        collection(db, 'mensajes'),
        where('empresaId', '==', empresaId),
        where('conversacionId', '==', conversationId),
        limit(450)
      ));
      if (snapshot.empty) {
        hasMore = false;
      } else {
        const batch = writeBatch(db);
        snapshot.docs.forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'conversaciones', conversationId));
  }

  async markMessagesAsRead(conversacionId: string, userId: string): Promise<void> {
    if (!conversacionId || !userId) return;
    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'mensajes'),
          where('conversacionId', '==', conversacionId),
          limit(60)
        )
      );
      const unreadDocs = snapshot.docs.filter((docSnap) => {
        const data = docSnap.data();
        const leidoPor = stringList(data.leidoPor);
        return data.remitenteId !== userId && !leidoPor.includes(userId);
      });

      if (unreadDocs.length === 0) return;
      const batch = writeBatch(db);
      unreadDocs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          leidoPor: arrayUnion(userId),
        });
      });
      await batch.commit();
    } catch (err) {
      console.warn('[FirebaseInternalChatRepository] markMessagesAsRead failed:', err);
    }
  }
}
