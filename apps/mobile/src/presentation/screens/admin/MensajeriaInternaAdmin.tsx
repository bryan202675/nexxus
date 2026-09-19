import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ChatAttachment, ChatMessage, ChatUser, Conversation } from 'domain/entities/InternalChat';
import { useCases } from '@/infrastructure/container';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import { formatBytes } from '@/infrastructure/storage/cloudinaryStorage';
import { useAuth } from '@/presentation/hooks/useAuth';
import { isSuperAdminRole } from '@/shared/auth/roles';
import { ADMIN, useAdminAppearance, sombraAdmin } from './adminTheme';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type ChatUserConFoto = ChatUser & { fotoPerfil?: string; foto?: string };

const obtenerFotoUsuario = (usuario: ChatUser): string | undefined => {
  const usuarioConFoto = usuario as ChatUserConFoto;
  return usuarioConFoto.fotoPerfil || usuarioConFoto.foto;
};

export default function MensajeriaInternaAdmin() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isPhone = width < 900;
  const styles = useMemo(() => crearEstilos(theme, isPhone, theme.isDark), [theme, isPhone]);
  const superAdmin = isSuperAdminRole(user?.rol);
  const empresaId = obtenerEmpresaIdAdmin(user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState<string[]>([]);
  const [nombreEspacio, setNombreEspacio] = useState('');
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // States for WhatsApp-like features
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalConversacionAbierto, setModalConversacionAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // 3-dots options menu states
  const [menuOpcionesChatAbierto, setMenuOpcionesChatAbierto] = useState(false);
  const [modalEditarNombreAbierto, setModalEditarNombreAbierto] = useState(false);
  const [nuevoNombreChat, setNuevoNombreChat] = useState('');
  const [modalConfirmacionEliminar, setModalConfirmacionEliminar] = useState(false);
  const [modalConfirmacionAbandonar, setModalConfirmacionAbandonar] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );
  const canWriteSelectedConversation = Boolean(
    user &&
    selectedConversation &&
    (!superAdmin || selectedConversation.participanteIds.includes(user.id))
  );

  const usuariosDisponibles = useMemo(
    () => users.filter((item) => item.id !== user?.id).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [user?.id, users]
  );

  const usuariosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return usuariosDisponibles;
    return usuariosDisponibles.filter((item) => `${item.nombre} ${item.correo || ''} ${item.rol || ''}`.toLowerCase().includes(term));
  }, [busqueda, usuariosDisponibles]);

  const destinatarios = useMemo(
    () => destinatariosSeleccionados.map((id) => usuariosDisponibles.find((item) => item.id === id)).filter((item): item is ChatUser => Boolean(item)),
    [destinatariosSeleccionados, usuariosDisponibles]
  );

  useEffect(() => {
    if (!user || (!empresaId && !superAdmin)) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    const unsubscribe = useCases.chat.internal.subscribeAdminConversations(
      empresaId,
      superAdmin,
      superAdmin ? 200 : 80,
      (items) => {
        setConversations(items);
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar las conversaciones.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [empresaId, superAdmin, user]);

  useEffect(() => {
    if (!empresaId || superAdmin) return () => {};
    return useCases.chat.internal.subscribeCompanyUsers(empresaId, 160, setUsers, () => setError('No se pudo cargar el directorio.'));
  }, [empresaId, superAdmin]);

  useEffect(() => {
    const conversationEmpresaId = selectedConversation?.empresaId || empresaId;
    if (!conversationEmpresaId || !selectedConversation?.id) {
      setMessages([]);
      return () => {};
    }
    return useCases.chat.internal.subscribeMessages(
      conversationEmpresaId,
      selectedConversation.id,
      120,
      (items) => {
        setMessages(items);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
        if (user?.id && selectedConversation?.id) {
          const hasUnread = items.some((m) => m.remitenteId !== user.id && !m.leidoPor?.includes(user.id));
          if (hasUnread) {
            useCases.chat.internal.markMessagesAsRead(selectedConversation.id, user.id);
          }
        }
      },
      () => setError('No se pudieron cargar los mensajes.')
    );
  }, [empresaId, selectedConversation?.empresaId, selectedConversation?.id]);

  const alternarDestinatario = (userId: string) => {
    setDestinatariosSeleccionados((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const limpiarSelectorConversacion = () => {
    setModalConversacionAbierto(false);
    setBusqueda('');
    setNombreEspacio('');
    setDestinatariosSeleccionados([]);
  };

  const lastReadOwnMessageIdWeb = useMemo(() => {
    const ownReadMessages = messages.filter(
      (m) => m.remitenteId === user?.id && Array.isArray(m.leidoPor) && m.leidoPor.some((id) => id !== user?.id)
    );
    if (ownReadMessages.length === 0) return null;
    return ownReadMessages[ownReadMessages.length - 1].id;
  }, [messages, user?.id]);

  const crearConversacionSeleccionada = async () => {
    if (!user || !empresaId || destinatarios.length === 0) return;
    setBusy(true);
    setError('');
    try {
      if (destinatarios.length === 1) {
        const other = destinatarios[0];
        const existing = conversations.find((conversation) => (
          conversation.tipo === 'directa' &&
          conversation.participanteIds.includes(user.id) &&
          conversation.participanteIds.includes(other.id)
        ));
        if (existing) {
          setSelectedConversationId(existing.id);
        } else {
          const created = await useCases.chat.internal.createConversation({
            empresaId,
            tipo: 'directa',
            titulo: other.nombre,
            creadoPor: user.id,
            participantes: [
              { id: user.id, nombre: user.nombre, rol: user.rol },
              { id: other.id, nombre: other.nombre, rol: other.rol },
            ],
          });
          setConversations((prev) => prev.some((c) => c.id === created.id) ? prev : [created, ...prev]);
          setSelectedConversationId(created.id);
        }
      } else {
        const created = await useCases.chat.internal.createConversation({
          empresaId,
          tipo: 'equipo',
          titulo: nombreEspacio.trim() || destinatarios.slice(0, 3).map((item) => item.nombre.split(' ')[0]).join(', '),
          creadoPor: user.id,
          participantes: [
            { id: user.id, nombre: user.nombre, rol: user.rol },
            ...destinatarios.map((item) => ({ id: item.id, nombre: item.nombre, rol: item.rol })),
          ],
        });
        setConversations((prev) => prev.some((c) => c.id === created.id) ? prev : [created, ...prev]);
        setSelectedConversationId(created.id);
      }
      limpiarSelectorConversacion();
    } catch {
      setError('No se pudo crear la conversación.');
    } finally {
      setBusy(false);
    }
  };

  // Options Menu actions
  const guardarNuevoNombre = async () => {
    if (!selectedConversation || !nuevoNombreChat.trim()) return;
    setBusy(true);
    setError('');
    try {
      await useCases.chat.internal.updateConversation(selectedConversation.id, {
        titulo: nuevoNombreChat.trim(),
      });
      setModalEditarNombreAbierto(false);
      setNuevoNombreChat('');
      setMenuOpcionesChatAbierto(false);
    } catch {
      setError('No se pudo actualizar el nombre.');
    } finally {
      setBusy(false);
    }
  };

  const pickGroupImageWeb = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !user || !selectedConversation) {
      setError('La carga de imágenes está disponible desde web.');
      return;
    }
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      const uploadEmpresaId = selectedConversation?.empresaId || empresaId;
      if (!file || !uploadEmpresaId) return;
      setBusy(true);
      setError('');
      try {
        const uploaded = await uploadManagedFile(file, { kind: 'chatAttachment', ownerId: user.id, empresaId: uploadEmpresaId });
        await useCases.chat.internal.updateConversation(selectedConversation.id, {
          imagenUrl: uploaded.url,
        } as any);
        setMenuOpcionesChatAbierto(false);
      } catch {
        setError('No se pudo subir la imagen.');
      } finally {
        setBusy(false);
      }
    };
    picker.click();
  };

  const abandonarGrupo = async () => {
    if (!selectedConversation || !user) return;
    setBusy(true);
    setError('');
    try {
      const nuevosParticipantes = selectedConversation.participantes.filter((p) => p.id !== user.id);
      await useCases.chat.internal.updateConversation(selectedConversation.id, {
        participantes: nuevosParticipantes,
      });
      setSelectedConversationId('');
      setModalConfirmacionAbandonar(false);
      setMenuOpcionesChatAbierto(false);
    } catch {
      setError('No se pudo abandonar el grupo.');
    } finally {
      setBusy(false);
    }
  };

  const eliminarConversacion = async () => {
    if (!selectedConversation) return;
    setBusy(true);
    setError('');
    try {
      await useCases.chat.internal.deleteConversation(selectedConversation.id, selectedConversation.empresaId, user?.id);
      setSelectedConversationId('');
      setModalConfirmacionEliminar(false);
      setMenuOpcionesChatAbierto(false);
    } catch {
      setError('No se pudo eliminar el chat.');
    } finally {
      setBusy(false);
    }
  };

  const pickAttachmentWeb = (accept: string) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !user) {
      setError('La carga de adjuntos está disponible desde web en esta versión.');
      return;
    }
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = accept;
    picker.onchange = async () => {
      const file = picker.files?.[0];
      const uploadEmpresaId = selectedConversation?.empresaId || empresaId;
      if (!file || !uploadEmpresaId) return;
      setBusy(true);
      setError('');
      try {
        const uploaded = await uploadManagedFile(file, { kind: 'chatAttachment', ownerId: user.id, empresaId: uploadEmpresaId });
        setPendingAttachment({
          tipo: uploaded.mime === 'application/pdf' ? 'documento' : 'imagen',
          nombre: file.name || 'Adjunto',
          url: uploaded.url,
          mime: uploaded.mime,
          size: uploaded.size,
          publicId: uploaded.publicId,
          assetId: uploaded.assetId,
        });
      } catch {
        setError('No se pudo adjuntar. Usa PDF menor a 5 MB.');
      } finally {
        setBusy(false);
      }
    };
    picker.click();
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !canWriteSelectedConversation || (!input.trim() && !pendingAttachment)) return;
    setBusy(true);
    setError('');
    try {
      await useCases.chat.internal.sendMessage({
        empresaId: selectedConversation.empresaId,
        conversacionId: selectedConversation.id,
        remitenteId: user.id,
        remitenteNombre: user.nombre,
        texto: input,
        adjuntos: pendingAttachment ? [pendingAttachment] : [],
      });
      setInput('');
      setPendingAttachment(null);
    } catch {
      setError('No se pudo enviar el mensaje.');
    } finally {
      setBusy(false);
    }
  };

  const obtenerFotoConversacion = (conv: Conversation) => {
    if (conv.tipo === 'directa') {
      const otherId = conv.participanteIds?.find((id) => id !== user?.id);
      const userFromList = otherId ? users.find((u) => u.id === otherId) : null;
      const otherParticipant = conv.participantes?.find((p) => p.id !== user?.id);
      return (
        userFromList?.foto_perfil ||
        userFromList?.fotoPerfil ||
        userFromList?.photoURL ||
        userFromList?.avatarUrl ||
        userFromList?.foto ||
        otherParticipant?.foto_perfil ||
        otherParticipant?.fotoPerfil ||
        otherParticipant?.photoURL ||
        otherParticipant?.avatarUrl ||
        otherParticipant?.foto ||
        conv.imagenUrl ||
        conv.foto
      );
    }
    return conv.imagenUrl || conv.foto;
  };

  const selectedConversationHeaderPhoto = useMemo(() => {
    if (!selectedConversation) return undefined;
    return obtenerFotoConversacion(selectedConversation);
  }, [selectedConversation, user?.id, users]);

  const renderConversationItem = (conversation: Conversation) => {
    const active = selectedConversationId === conversation.id;
    const initials = conversation.titulo ? conversation.titulo.charAt(0).toUpperCase() : '?';
    const photo = obtenerFotoConversacion(conversation);
    const isGroup = conversation.tipo === 'equipo';

    return (
      <TouchableOpacity key={conversation.id} onPress={() => setSelectedConversationId(conversation.id)} style={[styles.conversation, active && styles.conversationActive]} activeOpacity={0.9}>
        {active ? <View style={styles.activeIndicator} /> : null}
        <View style={styles.conversationRow}>
          <View style={[styles.convAvatar, active && styles.convAvatarActive]}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : isGroup ? (
              <MaterialIcons name="groups" size={22} color={active ? '#FFFFFF' : '#6B7280'} />
            ) : (
              <Text style={styles.convAvatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.convDetails}>
            <View style={styles.convHeader}>
              <Text style={styles.conversationTitle} numberOfLines={1}>{conversation.titulo}</Text>
              {conversation.tipo === 'equipo' ? (
                <Text style={styles.conversationMeta} numberOfLines={1}>
                  {conversation.participantes.length} miembros
                </Text>
              ) : null}
            </View>
            <Text style={[styles.conversationText, active && styles.conversationTextActive]} numberOfLines={1}>{conversation.ultimoMensaje || 'Sin mensajes'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isGroupOwner = selectedConversation && selectedConversation.tipo === 'equipo' && selectedConversation.creadoPor === user?.id;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mensajería Interna</Text>
          <Text style={styles.subtitle}>Comunícate en tiempo real con tu equipo y colaboradores</Text>
        </View>

        <TouchableOpacity onPress={() => setModalConversacionAbierto(true)} style={styles.primaryButton} activeOpacity={0.85}>
          <MaterialIcons name="add-comment" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Nueva conversación</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ position: 'absolute', right: isPhone ? 14 : 24, top: isPhone ? 20 : 138, zIndex: 999 }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : null}

      {error ? (
        <View style={styles.error}>
          <MaterialIcons name="error-outline" size={18} color={theme.danger || ADMIN.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!superAdmin ? (
        <View style={styles.creator}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleScroller}>
            {/* WhatsApp-like plus button inside avatar bubble */}
            <TouchableOpacity onPress={() => setMenuAbierto(!menuAbierto)} style={styles.contactItem} activeOpacity={0.8}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#FFFFFF" />
                </Svg>
              </View>
              <Text style={styles.contactName} numberOfLines={1}>Nuevo</Text>
            </TouchableOpacity>

            {/* Render Recent Chats in the bubbles row */}
            {conversations.map((conv) => {
              const active = selectedConversationId === conv.id;
              const initials = conv.titulo ? conv.titulo.substring(0, 2).toUpperCase() : '?';
              const photo = obtenerFotoConversacion(conv);
              return (
                <TouchableOpacity key={conv.id} onPress={() => setSelectedConversationId(conv.id)} style={styles.contactItem} activeOpacity={0.85}>
                  <View style={[styles.avatarCircle, active && styles.avatarCircleActive]}>
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{initials}</Text>
                    )}
                    {active ? (
                      <View style={styles.selectedBadge}>
                        <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#FFFFFF" />
                        </Svg>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.contactName, active && styles.contactNameActive]} numberOfLines={1}>{conv.titulo}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.layout, isPhone && styles.layoutPhone]}>
        <View style={[styles.list, isPhone && styles.listPhone]}>
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {conversations.length === 0 && !loading ? <Empty theme={theme} title="Sin conversaciones" text="Cuando existan mensajes internos aparecerán aquí." /> : null}
            {conversations.map(renderConversationItem)}
          </ScrollView>
        </View>

        <View style={styles.chat}>
          {selectedConversation ? (
            <>
              {/* Active Chat Header Bar */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <View style={styles.chatHeaderAvatar}>
                    {selectedConversationHeaderPhoto ? (
                      <Image source={{ uri: selectedConversationHeaderPhoto }} style={styles.avatarImage} />
                    ) : selectedConversation.tipo === 'equipo' ? (
                      <MaterialIcons name="groups" size={24} color="#6B7280" />
                    ) : (
                      <Text style={styles.chatHeaderAvatarText}>
                        {selectedConversation.titulo ? selectedConversation.titulo.charAt(0).toUpperCase() : '?'}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.chatHeaderTitle} numberOfLines={1}>{selectedConversation.titulo}</Text>
                    <Text style={styles.chatHeaderSub} numberOfLines={1}>
                      {selectedConversation.tipo === 'directa' ? 'Chat privado' : `${selectedConversation.participantes.length} miembros`}
                    </Text>
                  </View>
                </View>
                
                {/* 3-dots action options button */}
                <TouchableOpacity onPress={() => setMenuOpcionesChatAbierto(!menuOpcionesChatAbierto)} style={styles.optionsBtn} activeOpacity={0.8}>
                  <MaterialIcons name="more-vert" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
                {messages.map((message) => {
                  const own = message.remitenteId === user?.id;
                  
                  // DYNAMIC NAME CHANGE UPDATE FOR CHAT DISPLAY NAMES
                  const senderName = (selectedConversation.tipo === 'directa' && !own)
                    ? selectedConversation.titulo
                    : message.remitenteNombre;

                  const senderUser = users.find((u) => u.id === message.remitenteId);
                  const senderPhoto = senderUser ? obtenerFotoUsuario(senderUser) : undefined;

                  return (
                    <View key={message.id} style={[styles.message, own ? styles.own : styles.other]}>
                      {!own ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          {senderPhoto ? (
                            <Image source={{ uri: senderPhoto }} style={{ width: 18, height: 18, borderRadius: 9 }} />
                          ) : null}
                          <Text style={styles.sender}>{senderName}</Text>
                        </View>
                      ) : null}
                      {message.texto ? <Text style={own ? styles.ownText : styles.otherText}>{message.texto}</Text> : null}
                      {message.adjuntos.map((attachment) => <Attachment key={`${message.id}-${attachment.url}`} attachment={attachment} onPreview={setPreviewImageUrl} styles={styles} />)}
                      {own && message.id === lastReadOwnMessageIdWeb ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 4 }}>
                          <MaterialIcons name="done-all" size={13} color="#3B82F6" />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#3B82F6' }}>Visto</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.inputRow}>
                <TouchableOpacity disabled={busy || !canWriteSelectedConversation} onPress={() => pickAttachmentWeb('image/jpeg,image/png,image/webp')} style={styles.toolButton} activeOpacity={0.8}><MaterialIcons name="image" size={18} color={theme.muted} /></TouchableOpacity>
                <TouchableOpacity disabled={busy || !canWriteSelectedConversation} onPress={() => pickAttachmentWeb('application/pdf,.pdf')} style={styles.toolButton} activeOpacity={0.8}><MaterialIcons name="attach-file" size={18} color={theme.muted} /></TouchableOpacity>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  editable={canWriteSelectedConversation}
                  placeholder={canWriteSelectedConversation ? 'Escribe un mensaje...' : 'Modo lectura global del super admin'}
                  placeholderTextColor={theme.soft}
                  style={styles.input}
                />
                {/* Send Button with Inline White SVG Icon to avoid light theme black color override */}
                <TouchableOpacity disabled={busy || !canWriteSelectedConversation || (!input.trim() && !pendingAttachment)} onPress={sendMessage} style={[styles.sendButton, (busy || !canWriteSelectedConversation || (!input.trim() && !pendingAttachment)) && styles.disabled]} activeOpacity={0.8}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#FFFFFF" />
                  </Svg>
                </TouchableOpacity>
              </View>
              {pendingAttachment ? (
                <View style={styles.pending}>
                  <MaterialIcons name={pendingAttachment.tipo === 'documento' ? 'picture-as-pdf' : 'image'} size={18} color={theme.primary} />
                  <Text style={styles.pendingText} numberOfLines={1}>{pendingAttachment.nombre} · {formatBytes(pendingAttachment.size)}</Text>
                  <TouchableOpacity onPress={() => setPendingAttachment(null)} activeOpacity={0.8}><MaterialIcons name="close" size={18} color={theme.muted} /></TouchableOpacity>
                </View>
              ) : null}
            </>
          ) : (
            <NoChatSelected theme={theme} />
          )}
        </View>
      </View>

      {/* Floating Action Menu dropdown */}
      {menuAbierto && (
        <>
          <TouchableOpacity
            style={styles.scrimMenu}
            activeOpacity={1}
            onPress={() => setMenuAbierto(false)}
          />
          <View style={[styles.menuFlotante, { left: isPhone ? 16 : 24, top: isPhone ? 175 : 380 }]}>
            <TouchableOpacity
              onPress={() => { setMenuAbierto(false); setModalConversacionAbierto(true); }}
              style={styles.menuItem}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={theme.primary} />
                </Svg>
              </View>
              <Text style={styles.menuItemText}>Nuevo chat o grupo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 3-dots Conversation Options Floating Menu */}
      {menuOpcionesChatAbierto && selectedConversation && (
        <>
          <TouchableOpacity
            style={styles.scrimMenu}
            activeOpacity={1}
            onPress={() => setMenuOpcionesChatAbierto(false)}
          />
          <View style={[styles.menuChatOpciones, { right: isPhone ? 16 : 24, top: isPhone ? 180 : 320 }]}>
            {/* Edit chat / contact / group name */}
            <TouchableOpacity
              onPress={() => { setNuevoNombreChat(selectedConversation.titulo); setModalEditarNombreAbierto(true); }}
              style={styles.menuItem}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={18} color={theme.primary} />
              <Text style={styles.menuItemText}>Cambiar nombre</Text>
            </TouchableOpacity>

            {/* Change group image */}
            {selectedConversation.tipo === 'equipo' && (
              <>
                <View style={styles.menuDivisor} />
                <TouchableOpacity
                  onPress={pickGroupImageWeb}
                  style={styles.menuItem}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="photo-camera" size={18} color={theme.primary} />
                  <Text style={styles.menuItemText}>Cambiar imagen</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Leave group */}
            {selectedConversation.tipo === 'equipo' && (
              <>
                <View style={styles.menuDivisor} />
                <TouchableOpacity
                  onPress={() => setModalConfirmacionAbandonar(true)}
                  style={styles.menuItem}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="exit-to-app" size={18} color={theme.danger || ADMIN.error} />
                  <Text style={[styles.menuItemText, { color: theme.danger || ADMIN.error }]}>Abandonar grupo</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Delete group or direct conversation */}
            <View style={styles.menuDivisor} />
            <TouchableOpacity
              onPress={() => setModalConfirmacionEliminar(true)}
              style={styles.menuItem}
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete" size={18} color={theme.danger || ADMIN.error} />
              <Text style={[styles.menuItemText, { color: theme.danger || ADMIN.error }]}>
                {selectedConversation.tipo === 'equipo' ? 'Eliminar grupo' : 'Eliminar conversación'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal: Editar Nombre Chat */}
      {modalEditarNombreAbierto && selectedConversation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar nombre</Text>
              <TouchableOpacity onPress={() => { setModalEditarNombreAbierto(false); setNuevoNombreChat(''); }} style={styles.closeBtn} activeOpacity={0.8}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              value={nuevoNombreChat}
              onChangeText={setNuevoNombreChat}
              placeholder="Nombre del chat..."
              placeholderTextColor={theme.soft}
              style={[styles.modalInput, { outlineStyle: 'none' } as any]}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={() => { setModalEditarNombreAbierto(false); setNuevoNombreChat(''); }} 
                style={styles.btnSecondary}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={!nuevoNombreChat.trim() || busy} 
                onPress={guardarNuevoNombre} 
                style={[styles.btnPrimary, (!nuevoNombreChat.trim() || busy) && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal: Confirmación Eliminar */}
      {modalConfirmacionEliminar && selectedConversation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Eliminar chat?</Text>
            <Text style={[styles.emptyText, { textAlign: 'left', marginVertical: 12, color: theme.text }]}>
              Se eliminará permanentemente la conversación y todos sus mensajes para siempre. Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={() => setModalConfirmacionEliminar(false)} 
                style={styles.btnSecondary}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={busy} 
                onPress={eliminarConversacion} 
                style={[styles.btnPrimary, { backgroundColor: theme.danger || ADMIN.error }, busy && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal: Confirmación Abandonar */}
      {modalConfirmacionAbandonar && selectedConversation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Abandonar grupo?</Text>
            <Text style={[styles.emptyText, { textAlign: 'left', marginVertical: 12, color: theme.text }]}>
              Dejarás de ser participante del grupo y ya no recibirás ni podrás enviar más mensajes en este hilo.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={() => setModalConfirmacionAbandonar(false)} 
                style={styles.btnSecondary}
                activeOpacity={0.8}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={busy} 
                onPress={abandonarGrupo} 
                style={[styles.btnPrimary, { backgroundColor: theme.danger || ADMIN.error }, busy && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>Abandonar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal: Nueva Conversación */}
      {modalConversacionAbierto && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo chat o grupo</Text>
              <TouchableOpacity onPress={limpiarSelectorConversacion} style={styles.closeBtn} activeOpacity={0.8}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Añade a 1 o más personas"
              placeholderTextColor={theme.soft}
              style={[styles.modalSearch, { outlineStyle: 'none' } as any]}
            />

            {destinatarios.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedPeople}>
                {destinatarios.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => alternarDestinatario(item.id)} style={styles.selectedPersonChip} activeOpacity={0.84}>
                    <Text style={styles.selectedPersonText} numberOfLines={1}>{item.nombre}</Text>
                    <MaterialIcons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {destinatarios.length > 1 ? (
              <TextInput
                value={nombreEspacio}
                onChangeText={setNombreEspacio}
                placeholder="Nombre del espacio o grupo (opcional)"
                placeholderTextColor={theme.soft}
                style={[styles.modalInput, { outlineStyle: 'none' } as any]}
              />
            ) : null}
            
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {usuariosFiltrados.length === 0 ? (
                <Text style={styles.emptyText}>Sin colaboradores encontrados.</Text>
              ) : usuariosFiltrados
                .map((u) => {
                  const initials = u.nombre ? u.nombre.substring(0, 2).toUpperCase() : '?';
                  const photo = obtenerFotoUsuario(u);
                  const isSelected = destinatariosSeleccionados.includes(u.id);
                  return (
                    <TouchableOpacity key={u.id} onPress={() => alternarDestinatario(u.id)} style={[styles.modalUserRow, isSelected && styles.modalUserRowSelected]} activeOpacity={0.84}>
                      <View style={styles.modalUserInfo}>
                        <View style={styles.modalUserAvatar}>
                          {photo ? (
                            <Image source={{ uri: photo }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.modalUserAvatarText}>{initials}</Text>
                          )}
                        </View>
                        <View style={styles.modalUserCopy}>
                          <Text style={styles.modalUserName} numberOfLines={1}>{u.nombre}</Text>
                          <Text style={styles.modalUserRole} numberOfLines={1}>{u.correo || u.rol || 'Colaborador'}</Text>
                        </View>
                      </View>
                      <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxSelected]}>
                        {isSelected && (
                          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#FFFFFF" />
                          </Svg>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={limpiarSelectorConversacion} style={styles.btnSecondary} activeOpacity={0.8}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={destinatarios.length === 0 || busy}
                onPress={crearConversacionSeleccionada}
                style={[styles.btnPrimary, (destinatarios.length === 0 || busy) && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPrimaryText}>{destinatarios.length > 1 ? 'Crear grupo' : 'Iniciar chat'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal para ver fotos en grande en Web (LightBox con backdrop click y boton X) */}
      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPreviewImageUrl(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View style={{ width: '100%', maxWidth: 900, height: '85%', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => setPreviewImageUrl(null)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {previewImageUrl ? (
              <TouchableOpacity activeOpacity={1} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Image
                  source={{ uri: previewImageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Attachment({ attachment, onPreview, styles }: { attachment: ChatAttachment; onPreview: (url: string) => void; styles: any }) {
  if (attachment.tipo === 'imagen') {
    return (
      <TouchableOpacity
        onPress={() => onPreview(attachment.url)}
        style={{ width: 240, height: 200, borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 4, cursor: 'pointer' }}
        activeOpacity={0.9}
      >
        <Image source={{ uri: attachment.url }} style={{ width: '100%', height: '100%', borderRadius: 14 }} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(attachment.url, '_blank');
      }}
      style={styles.attachment}
      activeOpacity={0.8}
    >
      <MaterialIcons name="picture-as-pdf" size={22} color={ADMIN.error} />
      <View style={styles.attachmentCopy}>
        <Text style={styles.attachmentName} numberOfLines={1}>{attachment.nombre}</Text>
        <Text style={styles.attachmentMeta}>{formatBytes(attachment.size)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Empty({ theme, title, text }: { theme: any; title: string; text: string }) {
  return (
    <View style={crearEstilos(theme, false, theme.isDark).empty}>
      <MaterialIcons name="chat-bubble-outline" size={28} color={theme.muted} />
      <Text style={crearEstilos(theme, false, theme.isDark).emptyTitle}>{title}</Text>
      <Text style={crearEstilos(theme, false, theme.isDark).emptyText}>{text}</Text>
    </View>
  );
}

function NoChatSelected({ theme }: { theme: any }) {
  const isDark = theme.isDark;
  
  return (
    <View style={crearEstilos(theme, false, theme.isDark).emptyContainer}>
      <View style={crearEstilos(theme, false, theme.isDark).illustrationWrapper}>
        <Svg width={240} height={200} viewBox="0 0 240 200" fill="none">
          <Defs>
            <LinearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.15} />
              <Stop offset="100%" stopColor={theme.purple} stopOpacity={0.02} />
            </LinearGradient>
            <LinearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
              <Stop offset="100%" stopColor={theme.purple} stopOpacity={0.8} />
            </LinearGradient>
            <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.blue} stopOpacity={0.4} />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Background Glow */}
          <Circle cx={120} cy={100} r={70} fill="url(#glowGrad)" />

          {/* Large Speech Bubble Outline */}
          <Path
            d="M 60,60 C 60,45 75,30 100,30 H 160 C 185,30 200,45 200,60 V 110 C 200,125 185,140 160,140 H 105 L 80,165 V 140 C 68,140 60,132 60,120 Z"
            fill="url(#bubbleGrad)"
            stroke={theme.border}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Solid Chat Bubble Overlay */}
          <Path
            d="M 40,80 C 40,68 52,56 68,56 H 132 C 148,56 160,68 160,80 V 112 C 160,124 148,136 132,136 H 90 L 68,154 V 136 C 54,136 40,126 40,112 Z"
            fill={isDark ? "rgba(20, 16, 43, 0.6)" : "rgba(255, 255, 255, 0.8)"}
            stroke={theme.borderStrong}
            strokeWidth={2}
          />

          {/* Lines inside solid bubble */}
          <Rect x={60} y={80} width={60} height={4} rx={2} fill={theme.muted} opacity={0.6} />
          <Rect x={60} y={92} width={80} height={4} rx={2} fill={theme.muted} opacity={0.6} />
          <Rect x={60} y={104} width={40} height={4} rx={2} fill={theme.muted} opacity={0.6} />

          {/* Hand/Pointer Icon representation */}
          <G transform="translate(145, 100)">
            <Circle cx={15} cy={15} r={22} fill={isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)"} stroke={theme.primary} strokeWidth={1} />
            <Path
              d="M 11,8 L 11,18 M 15,6 L 15,18 M 19,8 L 19,18 M 7,12 L 7,18 C 7,22 10,24 15,24 C 20,24 23,22 23,18 L 23,14 C 23,11.5 20.5,11.5 19,13.5"
              stroke={theme.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>

          {/* Document Attachment Floating Card */}
          <G transform="translate(130, 25)">
            <Rect x={0} y={0} width={50} height={60} rx={8} fill={isDark ? "rgba(13, 11, 30, 0.9)" : "rgba(255, 255, 255, 0.95)"} stroke={theme.border} strokeWidth={1.5} />
            <Path d="M 10,12 H 40 M 10,22 H 30 M 10,32 H 35 M 10,42 H 25" stroke={theme.muted} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
            {/* Folder/Document Color Badge */}
            <Circle cx={40} cy={12} r={3} fill={theme.blue} />
          </G>

          {/* Decorative Elements */}
          <Circle cx={35} cy={45} r={5} fill={theme.purple} opacity={0.7} />
          <Circle cx={210} cy={150} r={8} fill={theme.success} opacity={0.6} />
          <Circle cx={190} cy={60} r={4} fill={theme.warning} opacity={0.8} />

          {/* Small Floating Chat Indicator */}
          <G transform="translate(15, 115)">
            <Circle cx={10} cy={10} r={14} fill="url(#accentGrad)" />
            <Path d="M 7,8 H 13 M 7,11 H 11 M 7,14 H 10" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
          </G>
        </Svg>
      </View>
      <Text style={[crearEstilos(theme, false, theme.isDark).emptyTitle, { color: theme.text, fontSize: 18, marginTop: 16 }]}>
        No hay conversaciones seleccionadas
      </Text>
      <Text style={[crearEstilos(theme, false, theme.isDark).emptyText, { color: theme.muted, fontSize: 13, lineHeight: 20, maxWidth: 320, marginTop: 8 }]}>
        Selecciona una conversación de la lista de la izquierda para comenzar a chatear o inicia una nueva conversación con un colaborador.
      </Text>
    </View>
  );
}

const crearEstilos = (theme: any, isPhone: boolean, isDark: boolean) => StyleSheet.create({
  // paddingTop set to 260 on desktop to perfectly match the purple BannerPantalla and avoid layout overlaps
  screen: { flex: 1, backgroundColor: theme.bg, padding: isPhone ? 14 : 24, paddingTop: isPhone ? 90 : 260, gap: 14, position: 'relative' },
  header: { flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12 },
  title: { color: theme.text, fontSize: isPhone ? 24 : 28, fontWeight: '900' },
  subtitle: { color: theme.muted, fontSize: 13, fontWeight: '700', marginTop: 5 },
  error: { minHeight: 42, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.24)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 4 },
  errorText: { color: theme.danger || ADMIN.error, fontSize: 12, fontWeight: '800', flex: 1 },
  creator: { gap: 10, backgroundColor: theme.panel, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.border },
  peopleScroller: { gap: 12, paddingRight: 8, paddingVertical: 4 },
  
  contactItem: { alignItems: 'center', gap: 6, minWidth: 64, paddingHorizontal: 4 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.chip, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.border, position: 'relative', overflow: 'hidden' },
  avatarCircleActive: { borderColor: theme.primary, backgroundColor: 'rgba(124,58,237,0.15)' },
  avatarText: { color: theme.text, fontSize: 14, fontWeight: '900' },
  selectedBadge: { position: 'absolute', right: -3, bottom: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.bg },
  contactName: { color: theme.muted, fontSize: 11, fontWeight: '800', maxWidth: 64, textAlign: 'center' },
  contactNameActive: { color: theme.text },

  primaryButton: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 13, backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  layout: { flex: 1, flexDirection: 'row', gap: 16 },
  layoutPhone: { flexDirection: 'column' },
  list: { width: 310, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, overflow: 'hidden' },
  listPhone: { width: '100%', maxHeight: 160 },
  listContent: { padding: 10, gap: 8 },
  
  conversation: { minHeight: 74, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 10, position: 'relative', overflow: 'hidden' },
  conversationActive: { borderColor: theme.borderStrong, backgroundColor: 'rgba(124, 58, 237, 0.10)' },
  activeIndicator: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 4, borderRadius: 2, backgroundColor: theme.primary },
  conversationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  convAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.chipStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  convAvatarActive: { borderColor: theme.primary, backgroundColor: 'rgba(124, 58, 237, 0.2)' },
  convAvatarText: { color: theme.text, fontSize: 14, fontWeight: '900' },
  convDetails: { flex: 1, minWidth: 0, gap: 2 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  conversationTitle: { color: theme.text, fontSize: 13, fontWeight: '900', flex: 1 },
  conversationMeta: { color: theme.muted, fontSize: 10, fontWeight: '800' },
  conversationText: { color: theme.muted, fontSize: 12 },
  conversationTextActive: { color: theme.text },
 
  chat: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, overflow: 'hidden' },
  messages: { padding: 16, gap: 12, minHeight: 320 },
  message: { maxWidth: '75%', borderRadius: 16, padding: 12, gap: 4 },
  
  own: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderTopRightRadius: 4 },
  other: { alignSelf: 'flex-start', backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, borderTopLeftRadius: 4 },
  
  sender: { color: theme.purple, fontSize: 11, fontWeight: '900' },
  ownText: { color: '#FFFFFF', fontSize: 13, lineHeight: 19, fontWeight: '500' },
  otherText: { color: theme.text, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  
  inputRow: { borderTopWidth: 1, borderTopColor: theme.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' },
  toolButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border },
  input: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, color: theme.text, paddingHorizontal: 14, fontSize: 13 },
  sendButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.borderStrong },
  disabled: { opacity: 0.5 },
  pending: { borderTopWidth: 1, borderTopColor: theme.border, minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingText: { flex: 1, minWidth: 0, color: theme.muted, fontSize: 12, fontWeight: '800' },
 
  attachment: { marginTop: 6, minWidth: 210, maxWidth: 280, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachmentImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: theme.bg },
  attachmentCopy: { flex: 1, minWidth: 0 },
  attachmentName: { color: theme.text, fontSize: 12, fontWeight: '900' },
  attachmentMeta: { color: theme.muted, fontSize: 11, marginTop: 2 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  emptyTitle: { color: theme.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: theme.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
 
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 350 },
  illustrationWrapper: { opacity: 0.9, alignItems: 'center', justifyContent: 'center' },

  // WhatsApp-like Styles
  scrimMenu: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent', zIndex: 1000 },
  menuFlotante: { position: 'absolute', width: 220, borderRadius: 16, backgroundColor: theme.panelStrong, borderWidth: 1, borderColor: theme.borderStrong, padding: 6, ...sombraAdmin, zIndex: 1010 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  menuItemText: { color: theme.text, fontSize: 13, fontWeight: '700' },
  menuDivisor: { height: 1, backgroundColor: theme.border, marginVertical: 4 },
  menuIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)', alignItems: 'center', justifyContent: 'center' },
  
  // 3-dots menu options style
  menuChatOpciones: { position: 'absolute', width: 220, borderRadius: 16, backgroundColor: theme.panelStrong, borderWidth: 1, borderColor: theme.borderStrong, padding: 6, ...sombraAdmin, zIndex: 1010 },

  modalOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: 16 },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '80%', borderRadius: 20, backgroundColor: theme.panelStrong, borderWidth: 1, borderColor: theme.borderStrong, padding: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border },
  
  modalSearch: { height: 40, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, color: theme.text, paddingHorizontal: 12, fontSize: 13, marginBottom: 12 },
  modalInput: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, color: theme.text, paddingHorizontal: 14, fontSize: 13, marginBottom: 12 },
  
  modalList: { flex: 1, marginBottom: 16 },
  modalUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 10 },
  modalUserRowSelected: { backgroundColor: theme.isDark ? 'rgba(124,58,237,0.16)' : 'rgba(124,58,237,0.08)', borderRadius: 12, paddingHorizontal: 8 },
  modalUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  modalUserAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.chipStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  modalUserAvatarText: { color: theme.text, fontSize: 12, fontWeight: '900' },
  modalUserCopy: { flex: 1, minWidth: 0 },
  modalUserName: { color: theme.text, fontSize: 13, fontWeight: '900' },
  modalUserRole: { color: theme.muted, fontSize: 11, fontWeight: '700', marginTop: 1 },
  
  modalActionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.primary },
  modalActionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  
  modalCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  modalCheckboxSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  selectedPeople: { gap: 8, paddingBottom: 10 },
  selectedPersonChip: { maxWidth: 190, minHeight: 32, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.borderStrong },
  selectedPersonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
  btnSecondary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  btnSecondaryText: { color: theme.text, fontSize: 12, fontWeight: '800' },
  btnPrimary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: theme.primary },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },

  // Chat Header Bar Styles
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.panel },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.chipStrong, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  chatHeaderAvatarText: { color: theme.text, fontSize: 14, fontWeight: '900' },
  chatHeaderTitle: { color: theme.text, fontSize: 14, fontWeight: '900', maxWidth: 200 },
  chatHeaderSub: { color: theme.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  optionsBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});
