import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { ChatAttachment, ChatMessage, ChatUser, Conversation } from 'domain/entities/InternalChat';
import { useCases } from '@/infrastructure/container';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import { formatBytes } from '@/infrastructure/storage/cloudinaryStorage';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@/infrastructure/storage/uploadLimits';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const obtenerEmpresaId = (perfil: { empresaId?: string } | null) => {
  const empresaId = perfil?.empresaId || '';
  return typeof empresaId === 'string' ? empresaId.trim() : '';
};

const getTituloConversacion = (conv: Conversation, userId: string, usersList: ChatUser[] = []): string => {
  if (conv.tipo === 'directa') {
    const otherId = conv.participanteIds?.find((id) => id !== userId);
    if (otherId) {
      const userFromList = usersList.find((u) => u.id === otherId);
      if (userFromList && userFromList.nombre) return userFromList.nombre;
    }
    const otherParticipant = conv.participantes?.find((p) => p.id !== userId);
    if (otherParticipant && otherParticipant.nombre) return otherParticipant.nombre;
  }
  return conv.titulo || 'Conversación';
};

const getNombreRemitente = (message: ChatMessage, usersList: ChatUser[] = []): string => {
  if (!message.remitenteId) return message.remitenteNombre || 'Colaborador';
  const userObj = usersList.find((u) => u.id === message.remitenteId);
  return userObj?.nombre || message.remitenteNombre || 'Colaborador';
};

const getFotoRemitente = (message: ChatMessage, usersList: ChatUser[] = []): string | undefined => {
  if (!message.remitenteId) return undefined;
  const userObj = usersList.find((u) => u.id === message.remitenteId);
  return userObj?.foto_perfil || userObj?.fotoPerfil || userObj?.photoURL || userObj?.avatarUrl || userObj?.foto;
};

const getFotoConversacion = (conv: Conversation, userId: string, usersList: ChatUser[] = []): string | undefined => {
  if (conv.tipo === 'directa') {
    const otherId = conv.participanteIds?.find((id) => id !== userId);
    if (otherId) {
      const userFromList = usersList.find((u) => u.id === otherId);
      const photo = userFromList?.foto_perfil || userFromList?.fotoPerfil || userFromList?.photoURL || userFromList?.avatarUrl || userFromList?.foto;
      if (photo) return photo;
    }
    const otherParticipant = conv.participantes?.find((p) => p.id !== userId);
    if (otherParticipant) {
      const photo = otherParticipant.foto_perfil || otherParticipant.fotoPerfil || otherParticipant.photoURL || otherParticipant.avatarUrl || otherParticipant.foto;
      if (photo) return photo;
    }
  }
  return conv.imagenUrl;
};

const uploadChatAttachmentAsset = async (
  asset: ImagePicker.ImagePickerAsset,
  fallbackName: string,
  ownerId: string,
  empresaId: string
): Promise<{ url: string; publicId: string; size: number; mime: string; assetId?: string }> => {
  if (Platform.OS === 'web') {
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    const fileName = asset.fileName || fallbackName;
    try {
      Object.defineProperty(blob, 'name', { value: fileName, writable: true, configurable: true });
    } catch {
      (blob as any).name = fileName;
    }
    return uploadManagedFile(blob, {
      kind: 'chatAttachment',
      ownerId,
      empresaId,
    });
  }

  // Mobile Native (iOS / Android)
  let base64Data = asset.base64;
  if (!base64Data) {
    try {
      const FileSystem = require('expo-file-system');
      base64Data = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (e) {
      console.warn('[ChatInterno] Could not read file via FileSystem:', e);
    }
  }

  const mime = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = asset.fileName || fallbackName;
  const folder = `nexxus/chat/${empresaId}`;
  const publicId = `chat_${ownerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isRaw = mime.includes('pdf') || mime.includes('zip') || mime.includes('raw');

  const formData = new FormData();
  if (base64Data) {
    const dataUrl = base64Data.startsWith('data:')
      ? base64Data
      : `data:${mime};base64,${base64Data}`;
    formData.append('file', dataUrl);
  } else {
    formData.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mime,
    } as any);
  }

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${isRaw ? 'raw' : 'image'}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data?.error?.message || 'No se pudo subir el archivo.');
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id || publicId,
    size: data.bytes || asset.fileSize || 100000,
    mime: data.format ? `${isRaw ? 'application' : 'image'}/${data.format}` : mime,
  };
};

const AnimatedVistoBadge = ({ leido }: { leido: boolean }) => {
  const animScale = useRef(new Animated.Value(0.5)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (leido) {
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 6,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [leido]);

  if (!leido) return null;

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 3,
        marginTop: 3,
        marginRight: 4,
        opacity: animOpacity,
        transform: [{ scale: animScale }],
      }}
    >
      <MaterialIcons name="done-all" size={14} color="#3B82F6" />
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#3B82F6' }}>Visto</Text>
    </Animated.View>
  );
};

export default function ChatInterno() {
  const { perfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  // Modals / State for creating new chats
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');

  // Message & attachments state (multiple attachments preview like WhatsApp)
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Async status
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Preferencias locales para silenciar, bloquear y menú de opciones
  const [mutedConvIds, setMutedConvIds] = useState<string[]>([]);
  const [blockedConvIds, setBlockedConvIds] = useState<string[]>([]);
  const [actionMenuConv, setActionMenuConv] = useState<Conversation | null>(null);
  const [deletingConv, setDeletingConv] = useState(false);

  // Modales y estados para renombrar, abandonar y agregar miembros
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetConvToRename, setTargetConvToRename] = useState<Conversation | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [targetConvToAddMembers, setTargetConvToAddMembers] = useState<Conversation | null>(null);
  const [newMembersSelectedIds, setNewMembersSelectedIds] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const empresaId = obtenerEmpresaId(perfil);

  // Animaciones de entrada suave al chat
  const chatFadeAnim = useRef(new Animated.Value(0)).current;
  const chatSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (selectedConversationId) {
      chatFadeAnim.setValue(0);
      chatSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(chatFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(chatSlideAnim, {
          toValue: 0,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedConversationId]);

  const handleCloseChat = () => {
    Animated.parallel([
      Animated.timing(chatFadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(chatSlideAnim, {
        toValue: 24,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedConversationId('');
    });
  };

  useEffect(() => {
    if (!perfil?.id) return;
    AsyncStorage.getItem(`@nexxus_muted_chats_${perfil.id}`)
      .then((val) => {
        if (val) setMutedConvIds(JSON.parse(val));
      })
      .catch(() => {});
    AsyncStorage.getItem(`@nexxus_blocked_chats_${perfil.id}`)
      .then((val) => {
        if (val) setBlockedConvIds(JSON.parse(val));
      })
      .catch(() => {});
  }, [perfil?.id]);

  const toggleMuteConv = async (convId: string) => {
    if (!perfil?.id) return;
    const next = mutedConvIds.includes(convId)
      ? mutedConvIds.filter((id) => id !== convId)
      : [...mutedConvIds, convId];
    setMutedConvIds(next);
    await AsyncStorage.setItem(`@nexxus_muted_chats_${perfil.id}`, JSON.stringify(next));
    setActionMenuConv(null);
  };

  const toggleBlockConv = async (convId: string) => {
    if (!perfil?.id) return;
    const next = blockedConvIds.includes(convId)
      ? blockedConvIds.filter((id) => id !== convId)
      : [...blockedConvIds, convId];
    setBlockedConvIds(next);
    await AsyncStorage.setItem(`@nexxus_blocked_chats_${perfil.id}`, JSON.stringify(next));
    setActionMenuConv(null);
  };

  const openRenameModal = (conv: Conversation) => {
    setTargetConvToRename(conv);
    setRenameInput(getTituloConversacion(conv, perfil?.id || '', users));
    setShowRenameModal(true);
    setActionMenuConv(null);
  };

  const handleSaveRename = async () => {
    if (!targetConvToRename || !renameInput.trim()) return;
    setSending(true);
    try {
      await useCases.chat.internal.updateConversation(targetConvToRename.id, {
        titulo: renameInput.trim(),
      });
      setShowRenameModal(false);
      setTargetConvToRename(null);
    } catch (err) {
      console.error('[ChatInterno] Error renaming conversation:', err);
      setError('No se pudo cambiar el nombre.');
    } finally {
      setSending(false);
    }
  };

  const openAddMembersModal = (conv: Conversation) => {
    setTargetConvToAddMembers(conv);
    setNewMembersSelectedIds([]);
    setShowAddMembersModal(true);
    setActionMenuConv(null);
  };

  const toggleNewMemberSelection = (userId: string) => {
    setNewMembersSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveAddMembers = async () => {
    if (!targetConvToAddMembers || newMembersSelectedIds.length === 0) return;
    setSending(true);
    try {
      const newUsersToAdd = users.filter((u) => newMembersSelectedIds.includes(u.id));
      const currentParticipants = targetConvToAddMembers.participantes || [];
      const newParticipants = [
        ...currentParticipants,
        ...newUsersToAdd.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          rol: u.rol,
          foto_perfil: u.foto_perfil || u.fotoPerfil || u.photoURL || u.avatarUrl || u.foto,
        })),
      ];
      await useCases.chat.internal.updateConversation(targetConvToAddMembers.id, {
        participantes: newParticipants,
      });
      setShowAddMembersModal(false);
      setTargetConvToAddMembers(null);
      setNewMembersSelectedIds([]);
    } catch (err) {
      console.error('[ChatInterno] Error adding members:', err);
      setError('No se pudieron agregar los participantes.');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveGroup = async (conv: Conversation) => {
    if (!perfil || !empresaId) return;
    const groupTitle = getTituloConversacion(conv, perfil.id, users);
    const confirmMessage = `¿Estás seguro de abandonar el grupo "${groupTitle}"? Ya no tendrás acceso a este chat.`;

    const executeLeave = async () => {
      setSending(true);
      try {
        const remainingParticipants = (conv.participantes || []).filter((p) => p.id !== perfil.id);
        if (remainingParticipants.length === 0) {
          await useCases.chat.internal.deleteConversation(conv.id, empresaId);
        } else {
          await useCases.chat.internal.updateConversation(conv.id, {
            participantes: remainingParticipants,
          });
        }
        if (selectedConversationId === conv.id) {
          handleCloseChat();
        } else {
          setActionMenuConv(null);
        }
      } catch (err: any) {
        console.error('[ChatInterno] Error leaving group:', err);
        setError('No se pudo abandonar el grupo.');
      } finally {
        setSending(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
        await executeLeave();
      }
    } else {
      Alert.alert('Abandonar grupo', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abandonar', style: 'destructive', onPress: executeLeave },
      ]);
    }
  };

  const handleChangeGroupPhoto = async (conv: Conversation) => {
    if (!perfil || !empresaId) return;
    setActionMenuConv(null);

    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permisos requeridos', 'Se requieren permisos para acceder a las fotos de tu dispositivo.');
          return;
        }
      }

      setSending(true);
      setError('');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Group_${conv.id}_${Date.now()}.jpg`;
        const uploaded = await uploadChatAttachmentAsset(asset, fileName, perfil.id, empresaId);
        await useCases.chat.internal.updateConversation(conv.id, {
          imagenUrl: uploaded.url,
        });
      }
    } catch (err: any) {
      console.error('[ChatInterno] Error updating group photo:', err);
      setError(err?.message || 'No se pudo actualizar la foto del grupo.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConv = async (conv: Conversation) => {
    if (!perfil || !empresaId) return;
    const convTitle = getTituloConversacion(conv, perfil.id, users);
    const confirmMessage = `¿Estás seguro de eliminar la conversación "${convTitle}"? Se borrará el historial de mensajes.`;

    const executeDelete = async () => {
      setDeletingConv(true);
      try {
        await useCases.chat.internal.deleteConversation(conv.id, empresaId, perfil.id);
        if (selectedConversationId === conv.id) {
          handleCloseChat();
        } else {
          setActionMenuConv(null);
        }
      } catch (err: any) {
        console.error('[ChatInterno] Error deleting conversation:', err);
        setError('No se pudo eliminar la conversación.');
      } finally {
        setDeletingConv(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
        await executeDelete();
      }
    } else {
      Alert.alert('Eliminar conversación', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Se mide la altura REAL del teclado (e.endCoordinates.height) en vez de confiar únicamente en
  // KeyboardAvoidingView con behavior="padding": en esta pantalla, con SafeAreaView + un header
  // (NavbarEnterprise) + Animated.View envolviendo el contenido, ese comportamiento automático no
  // calculaba bien el offset y la barra de escribir terminaba oculta detrás del teclado. Aplicar
  // la altura medida directo como marginBottom es más confiable en este árbol de vistas.
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setTecladoVisible(true);
        setAlturaTeclado(e?.endCoordinates?.height || 0);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setTecladoVisible(false);
        setAlturaTeclado(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const availableUsers = useMemo(
    () =>
      users
        .filter((user) => user.id !== perfil?.id)
        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')),
    [perfil?.id, users]
  );

  const lastReadOwnMessageId = useMemo(() => {
    const ownReadMessages = messages.filter(
      (m) => m.remitenteId === perfil?.id && Array.isArray(m.leidoPor) && m.leidoPor.some((id) => id !== perfil?.id)
    );
    if (ownReadMessages.length === 0) return null;
    return ownReadMessages[ownReadMessages.length - 1].id;
  }, [messages, perfil?.id]);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return availableUsers;
    return availableUsers.filter((user) =>
      `${user.nombre || ''} ${user.correo || ''} ${user.rol || ''}`.toLowerCase().includes(term)
    );
  }, [availableUsers, searchQuery]);

  const userConversations = useMemo(() => {
    if (!perfil?.id) return [];
    return conversations.filter((c) =>
      Array.isArray(c.participanteIds) && c.participanteIds.includes(perfil.id)
    );
  }, [conversations, perfil?.id]);

  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return userConversations;
    return userConversations.filter((c) => {
      const title = getTituloConversacion(c, perfil?.id || '', users).toLowerCase();
      const lastMsg = (c.ultimoMensaje || '').toLowerCase();
      return title.includes(term) || lastMsg.includes(term);
    });
  }, [userConversations, searchQuery, perfil?.id, users]);

  const selectedUsers = useMemo(
    () =>
      selectedUserIds
        .map((id) => availableUsers.find((user) => user.id === id))
        .filter((user): user is ChatUser => Boolean(user)),
    [availableUsers, selectedUserIds]
  );

  // Subscribe to conversations & company users
  useEffect(() => {
    if (!perfil || !empresaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    const unsubConversations = useCases.chat.internal.subscribeConversations(
      empresaId,
      perfil.id,
      50,
      (items) => {
        setConversations(items);
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar las conversaciones.');
        setLoading(false);
      }
    );

    const unsubUsers = useCases.chat.internal.subscribeCompanyUsers(
      empresaId,
      120,
      setUsers,
      () => setError('No se pudo cargar el directorio interno.')
    );

    return () => {
      unsubConversations();
      unsubUsers();
    };
  }, [empresaId, perfil]);

  // Subscribe to messages when a conversation is active
  useEffect(() => {
    if (!empresaId || !selectedConversation?.id) {
      setMessages([]);
      return;
    }
    return useCases.chat.internal.subscribeMessages(
      empresaId,
      selectedConversation.id,
      100,
      (items) => {
        setMessages(items);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
        if (perfil?.id && selectedConversation?.id) {
          const hasUnread = items.some((m) => m.remitenteId !== perfil.id && !m.leidoPor?.includes(perfil.id));
          if (hasUnread) {
            useCases.chat.internal.markMessagesAsRead(selectedConversation.id, perfil.id);
          }
        }
      },
      () => setError('No se pudieron cargar los mensajes.')
    );
  }, [empresaId, selectedConversation?.id]);

  const toggleSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleStartConversation = async () => {
    if (!perfil || !empresaId || selectedUsers.length === 0) return;
    setSending(true);
    setError('');
    try {
      if (selectedUsers.length === 1) {
        const other = selectedUsers[0];
        const existing = conversations.find(
          (c) =>
            c.tipo === 'directa' &&
            c.participanteIds.includes(perfil.id) &&
            c.participanteIds.includes(other.id)
        );
        if (existing) {
          setSelectedConversationId(existing.id);
        } else {
          const created = await useCases.chat.internal.createConversation({
            empresaId,
            tipo: 'directa',
            titulo: other.nombre,
            creadoPor: perfil.id,
            participantes: [
              {
                id: perfil.id,
                nombre: perfil.nombre,
                rol: perfil.rol,
                foto_perfil: (perfil as any).foto_perfil || (perfil as any).fotoPerfil || (perfil as any).photoURL || (perfil as any).avatarUrl,
              },
              {
                id: other.id,
                nombre: other.nombre,
                rol: other.rol,
                foto_perfil: other.foto_perfil || other.fotoPerfil || other.photoURL || other.avatarUrl || other.foto,
              },
            ],
          });
          setSelectedConversationId(created.id);
        }
      } else {
        const title =
          groupName.trim() ||
          selectedUsers
            .slice(0, 3)
            .map((item) => (item.nombre || '').split(' ')[0])
            .join(', ');
        const created = await useCases.chat.internal.createConversation({
          empresaId,
          tipo: 'equipo',
          titulo: title,
          creadoPor: perfil.id,
          participantes: [
            { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol },
            ...selectedUsers.map((item) => ({ id: item.id, nombre: item.nombre, rol: item.rol })),
          ],
        });
        setSelectedConversationId(created.id);
      }
      setSelectedUserIds([]);
      setSearchQuery('');
      setShowNewChatModal(false);
      setGroupName('');
    } catch {
      setError('No se pudo crear la conversación.');
    } finally {
      setSending(false);
    }
  };

  const pickImageAttachment = async () => {
    if (!perfil || !empresaId) return;
    setSending(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments: ChatAttachment[] = [];
        for (const asset of result.assets) {
          const fileName = asset.fileName || `Imagen_${Date.now()}_${newAttachments.length}.jpg`;
          const uploaded = await uploadChatAttachmentAsset(asset, fileName, perfil.id, empresaId);

          const item: ChatAttachment = {
            tipo: 'imagen',
            nombre: fileName,
            url: uploaded.url,
            mime: uploaded.mime || 'image/jpeg',
            size: uploaded.size,
          };
          if (uploaded.publicId) item.publicId = uploaded.publicId;
          if (uploaded.assetId) item.assetId = uploaded.assetId;
          newAttachments.push(item);
        }
        setPendingAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (err: any) {
      console.error('[ChatInterno] Error picking image:', err);
      setError(err?.message || 'No se pudieron adjuntar las imágenes.');
    } finally {
      setSending(false);
    }
  };

  const pickDocumentAttachment = async () => {
    if (!perfil || !empresaId) return;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.multiple = true;
      picker.accept = 'application/pdf,.pdf,image/*';
      picker.onchange = async () => {
        const files = picker.files;
        if (!files || files.length === 0) return;
        setSending(true);
        setError('');
        try {
          const newAttachments: ChatAttachment[] = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const uploaded = await uploadManagedFile(file, {
              kind: 'chatAttachment',
              ownerId: perfil.id,
              empresaId,
            });
            const item: ChatAttachment = {
              tipo: uploaded.mime === 'application/pdf' ? 'documento' : 'imagen',
              nombre: file.name || `Archivo_${i + 1}.pdf`,
              url: uploaded.url,
              mime: uploaded.mime,
              size: uploaded.size,
            };
            if (uploaded.publicId) item.publicId = uploaded.publicId;
            if (uploaded.assetId) item.assetId = uploaded.assetId;
            newAttachments.push(item);
          }
          setPendingAttachments((prev) => [...prev, ...newAttachments]);
        } catch {
          setError('No se pudieron adjuntar los archivos.');
        } finally {
          setSending(false);
        }
      };
      picker.click();
      return;
    }

    setSending(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments: ChatAttachment[] = [];
        for (const asset of result.assets) {
          const fileName = asset.fileName || `Archivo_${Date.now()}_${newAttachments.length}`;
          const uploaded = await uploadChatAttachmentAsset(asset, fileName, perfil.id, empresaId);

          const item: ChatAttachment = {
            tipo: uploaded.mime === 'application/pdf' ? 'documento' : 'imagen',
            nombre: fileName,
            url: uploaded.url,
            mime: uploaded.mime || 'application/octet-stream',
            size: uploaded.size,
          };
          if (uploaded.publicId) item.publicId = uploaded.publicId;
          if (uploaded.assetId) item.assetId = uploaded.assetId;
          newAttachments.push(item);
        }
        setPendingAttachments((prev) => [...prev, ...newAttachments]);
      }
    } catch (err: any) {
      console.error('[ChatInterno] Error picking document:', err);
      setError(err?.message || 'No se pudieron adjuntar los archivos.');
    } finally {
      setSending(false);
    }
  };

  const removePendingAttachment = (indexToRemove: number) => {
    setPendingAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const sendMessage = async () => {
    if (!perfil || !empresaId || !selectedConversation || (!input.trim() && pendingAttachments.length === 0)) return;
    setSending(true);
    setError('');
    try {
      await useCases.chat.internal.sendMessage({
        empresaId,
        conversacionId: selectedConversation.id,
        remitenteId: perfil.id,
        remitenteNombre: perfil.nombre,
        texto: input.trim(),
        adjuntos: pendingAttachments,
      });
      // Bandeja Unificada (Fase 9): solo para chats directos (1:1) -- en chats de equipo/departamento
      // publicar por cada participante inundaría la bandeja de todos con cada mensaje del grupo.
      if (selectedConversation.tipo === 'directa') {
        const destinatarioId = selectedConversation.participanteIds?.find((id) => id !== perfil.id);
        if (destinatarioId) {
          useCases.inbox.add.execute({
            userId: destinatarioId,
            empresaId,
            origenRefId: selectedConversation.id,
            tipo: 'mensaje',
            prioridad: 'normal',
            estado: 'pendiente',
            titulo: perfil.nombre,
            mensaje: input.trim() || 'Te envió un archivo adjunto.',
          }).catch((e) => console.error('Error publicando en Bandeja Unificada:', e));
        }
      }
      setInput('');
      setPendingAttachments([]);
    } catch (err: any) {
      console.error('[ChatInterno] Error sending message:', err);
      setError(err?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  // Glass card helper styles
  const glassBg = esOscuro ? 'rgba(15,15,24,0.65)' : 'rgba(255,255,255,0.72)';
  const cardBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';

  if (!perfil || !empresaId) {
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={styles.fondoAbsoluto}>
          <FondoMobilePremium />
        </View>
        <NavbarEnterprise titulo="Mensajes" />
        <View style={styles.centerState}>
          <MaterialIcons name="business" size={44} color={colores.textoSuave} />
          <Text style={[styles.stateTitle, { color: colores.texto }]}>Chat no disponible</Text>
          <Text style={[styles.stateText, { color: colores.textoSuave }]}>
            Tu cuenta requiere una empresa activa para acceder a los chats de equipo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== VISTA 2: CONVERSACIÓN ACTIVA ====================
  if (selectedConversation) {
    const activeTitle = getTituloConversacion(selectedConversation, perfil.id, users);
    const otherId = selectedConversation.tipo === 'directa' ? selectedConversation.participanteIds?.find((id) => id !== perfil.id) : null;
    const userFromList = otherId ? (users.find((u) => u.id === otherId) as any) : null;
    const otherParticipant = selectedConversation.participantes?.find((p) => p.id !== perfil.id) as any;
    const activePhoto = userFromList?.fotoPerfil || userFromList?.foto || userFromList?.avatarUrl || otherParticipant?.fotoPerfil || otherParticipant?.foto || otherParticipant?.avatarUrl;

    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.fondo, paddingBottom: 0 }]}>
        <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={styles.fondoAbsoluto}>
          <FondoMobilePremium />
        </View>

        {/* Header de conversación activa utilizando el componente uniforme NavbarEnterprise */}
        <NavbarEnterprise
          titulo={activeTitle}
          subtitulo={selectedConversation.tipo === 'equipo' ? `${selectedConversation.participantes?.length || 2} miembros` : 'Chat directo'}
          mostrarAtras
          onBackPress={handleCloseChat}
          avatarUrl={activePhoto}
          avatarLetra={(activeTitle || 'C').charAt(0).toUpperCase()}
          ocultarAccionesDerechas
          accionDerecha={
            <TouchableOpacity
              onPress={() => setActionMenuConv(selectedConversation)}
              style={[styles.headerOptionBtn, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="more-vert" size={20} color={colores.texto} />
            </TouchableOpacity>
          }
        />

        {error ? (
          <TouchableOpacity onPress={() => setError('')} style={styles.errorCard} activeOpacity={0.8}>
            <MaterialIcons name="error-outline" size={18} color="#FCA5A5" />
            <Text style={styles.errorText}>{error}</Text>
            <MaterialIcons name="close" size={16} color="#FCA5A5" />
          </TouchableOpacity>
        ) : null}

        <Animated.View style={[styles.flex, { opacity: chatFadeAnim, transform: [{ translateY: chatSlideAnim }] }]}>
          <KeyboardAvoidingView behavior={undefined} style={styles.flex}>
          {/* Mensajes del chat */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 && !loading ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="chat-bubble-outline" size={40} color={colores.textoSuave} />
                <Text style={[styles.emptyTitle, { color: colores.texto }]}>Inicio de conversación</Text>
                <Text style={[styles.emptySub, { color: colores.textoSuave }]}>
                  Envía un mensaje para comenzar la comunicación con {activeTitle}.
                </Text>
              </View>
            ) : null}

            {messages.map((message) => {
              const own = message.remitenteId === perfil.id;
              const senderName = getNombreRemitente(message, users);
              const senderPhoto = getFotoRemitente(message, users);
              const senderInitial = (senderName || 'U').charAt(0).toUpperCase();

              return (
                <View key={message.id} style={[styles.messageRow, own ? styles.rowOwn : styles.rowOther]}>
                  {!own ? (
                    <View style={styles.senderAvatarWrap}>
                      {senderPhoto ? (
                        <Image source={{ uri: senderPhoto }} style={styles.senderAvatarImage} />
                      ) : (
                        <View style={[styles.senderAvatarFallback, { backgroundColor: colores.primarioClaro }]}>
                          <Text style={styles.senderAvatarInitial}>{senderInitial}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.messageBubble,
                      own
                        ? [styles.bubbleOwn, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.85)' : 'rgba(124,58,237,0.92)' }]
                        : [styles.bubbleOther, { backgroundColor: cardBg, borderColor: colores.borde }],
                    ]}
                  >
                    {!own ? (
                      <Text style={[styles.senderName, { color: colores.primarioClaro }]}>{senderName}</Text>
                    ) : null}
                    
                    {message.texto ? (
                      <Text style={own ? styles.textOwn : [styles.textOther, { color: colores.texto }]}>
                        {message.texto}
                      </Text>
                    ) : null}

                    {message.adjuntos?.map((attachment) => {
                      const isImage =
                        attachment.tipo === 'imagen' ||
                        (attachment.mime && attachment.mime.startsWith('image/')) ||
                        (attachment.url && (attachment.url.includes('/image/upload') || Boolean(attachment.url.match(/\.(jpg|jpeg|png|webp|gif)/i))));

                      if (isImage) {
                        return (
                          <TouchableOpacity
                            key={`${message.id}-${attachment.url}`}
                            onPress={() => setPreviewImageUrl(attachment.url)}
                            style={[styles.chatImageWrap, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                            activeOpacity={0.88}
                          >
                            <Image
                              source={{ uri: attachment.url }}
                              style={styles.chatImageLarge}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        );
                      }

                      return (
                        <TouchableOpacity
                          key={`${message.id}-${attachment.url}`}
                          onPress={() => {
                            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                              window.open(attachment.url, '_blank');
                            } else {
                              setPreviewImageUrl(attachment.url);
                            }
                          }}
                          style={[styles.attachmentCard, { borderColor: own ? 'rgba(255,255,255,0.2)' : colores.borde }]}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="picture-as-pdf" size={24} color={own ? '#FFFFFF' : '#EF4444'} />
                          <View style={styles.attachmentCopy}>
                            <Text style={[styles.attachmentName, { color: own ? '#FFFFFF' : colores.texto }]} numberOfLines={1}>
                              {attachment.nombre}
                            </Text>
                            <Text style={[styles.attachmentMeta, { color: own ? 'rgba(255,255,255,0.7)' : colores.textoSuave }]}>
                              {formatBytes(attachment.size)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    <Text style={own ? styles.timeOwn : [styles.timeOther, { color: colores.textoSuave }]}>
                      {new Date(message.timestamp).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {own && message.id === lastReadOwnMessageId ? (
                    <AnimatedVistoBadge leido={true} />
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          {/* Tray de vista previa estilo WhatsApp para adjuntos múltiples */}
          {pendingAttachments.length > 0 ? (
            <View style={[styles.pendingTray, { backgroundColor: glassBg, borderColor: colores.borde }]}>
              <View style={styles.pendingTrayHeader}>
                <Text style={[styles.pendingTrayTitle, { color: colores.texto }]}>
                  Adjuntos ({pendingAttachments.length})
                </Text>
                <TouchableOpacity
                  disabled={sending}
                  onPress={pickImageAttachment}
                  style={styles.addMoreBtn}
                >
                  <MaterialIcons name="add-photo-alternate" size={16} color={colores.primarioClaro} />
                  <Text style={[styles.addMoreText, { color: colores.primarioClaro }]}>Agregar más</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
                {pendingAttachments.map((att, idx) => (
                  <View key={`${att.url}-${idx}`} style={[styles.previewCard, { borderColor: colores.borde }]}>
                    {att.tipo === 'imagen' ? (
                      <Image source={{ uri: att.url }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <>
                        <View style={styles.previewDocIcon}>
                          <MaterialIcons name="picture-as-pdf" size={28} color="#EF4444" />
                        </View>
                        <View style={styles.previewMeta}>
                          <Text style={[styles.previewName, { color: colores.texto }]} numberOfLines={1}>
                            {att.nombre}
                          </Text>
                          <Text style={[styles.previewSize, { color: colores.textoSuave }]}>
                            {formatBytes(att.size)}
                          </Text>
                        </View>
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.removeAttBtn}
                      onPress={() => removePendingAttachment(idx)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="cancel" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Barra de entrada de mensaje o aviso de conversación bloqueada */}
          {blockedConvIds.includes(selectedConversation.id) ? (
            <View
              style={[
                styles.blockedBanner,
                {
                  backgroundColor: glassBg,
                  borderColor: '#EF4444',
                  marginBottom: alturaTeclado > 0 ? alturaTeclado + 6 : (Platform.OS === 'ios' ? 88 : 78),
                },
              ]}
            >
              <MaterialIcons name="block" size={20} color="#EF4444" />
              <Text style={[styles.blockedText, { color: colores.texto }]}>
                Esta conversación está bloqueada.
              </Text>
              <TouchableOpacity
                onPress={() => toggleBlockConv(selectedConversation.id)}
                style={styles.unblockBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.unblockText}>Desbloquear</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: glassBg,
                  borderColor: colores.borde,
                  marginBottom: alturaTeclado > 0 ? alturaTeclado + 6 : (Platform.OS === 'ios' ? 88 : 78),
                },
              ]}
            >
            <View style={styles.toolsWrap}>
              <TouchableOpacity disabled={sending} onPress={pickImageAttachment} style={styles.toolBtn}>
                <MaterialIcons name="image" size={20} color={colores.textoSuave} />
              </TouchableOpacity>
              <TouchableOpacity disabled={sending} onPress={pickDocumentAttachment} style={styles.toolBtn}>
                <MaterialIcons name="attach-file" size={20} color={colores.textoSuave} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colores.textoSuave}
              style={[styles.textInput, { color: colores.texto }]}
              multiline
            />

            <TouchableOpacity
              disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
              onPress={sendMessage}
              style={[
                styles.sendBtn,
                (sending || (!input.trim() && pendingAttachments.length === 0)) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          )}
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Modal para ver fotos en grande / pantalla completa (App y Web) */}
        {previewImageUrl ? (
          <Modal
            visible={!!previewImageUrl}
            transparent
            animationType="fade"
            onRequestClose={() => setPreviewImageUrl(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPreviewImageUrl(null)}
              style={[styles.modalOverlay, Platform.OS === 'web' && ({ cursor: 'pointer', zIndex: 99999 } as any)]}
            >
              <SafeAreaView style={styles.modalSafeArea}>
                <View style={styles.modalTopBar}>
                  <TouchableOpacity
                    onPress={(e) => {
                      (e as any)?.stopPropagation?.();
                      setPreviewImageUrl(null);
                    }}
                    style={[styles.modalCloseBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="close" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalCenterContent}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => (e as any)?.stopPropagation?.()}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Image
                      source={{ uri: previewImageUrl }}
                      style={styles.modalFullImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </TouchableOpacity>
          </Modal>
        ) : null}
      </SafeAreaView>
    );
  }

  // ==================== VISTA 1: LISTA DE CHATS (WhatsApp Style) ====================
  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={styles.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Navbar Superior consistente con el resto de pantallas */}
      <NavbarEnterprise titulo="Mensajes" />

      {error ? (
        <TouchableOpacity onPress={() => setError('')} style={styles.errorCard} activeOpacity={0.8}>
          <MaterialIcons name="error-outline" size={18} color="#FCA5A5" />
          <Text style={styles.errorText}>{error}</Text>
          <MaterialIcons name="close" size={16} color="#FCA5A5" />
        </TouchableOpacity>
      ) : null}

      {/* Barra de búsqueda y botón nuevo chat */}
      <View style={styles.actionHeader}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: colores.borde }]}>
          <MaterialIcons name="search" size={20} color={colores.textoSuave} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar conversación..."
            placeholderTextColor={colores.textoSuave}
            style={[styles.searchInput, { color: colores.texto }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colores.textoSuave} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectedUserIds([]);
            setGroupName('');
            setShowNewChatModal(true);
          }}
          style={styles.newChatBtn}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add-comment" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal para iniciar nuevo chat / grupo */}
      {showNewChatModal ? (
        <Modal
          visible={showNewChatModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowNewChatModal(false);
            setSelectedUserIds([]);
            setGroupName('');
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowNewChatModal(false)}
            style={styles.actionMenuOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => (e as any)?.stopPropagation?.()}
              style={[
                styles.actionMenuCard,
                { backgroundColor: esOscuro ? 'rgba(24,24,38,0.96)' : 'rgba(255,255,255,0.96)', borderColor: colores.borde, maxHeight: '85%' },
              ]}
            >
              <View style={styles.actionMenuHeader}>
                <Text style={[styles.actionMenuTitle, { color: colores.texto }]}>
                  Nueva conversación
                </Text>
                <TouchableOpacity onPress={() => setShowNewChatModal(false)}>
                  <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              {/* Búsqueda dentro del modal */}
              <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: colores.borde, marginVertical: 6 }]}>
                <MaterialIcons name="search" size={18} color={colores.textoSuave} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar integrantes..."
                  placeholderTextColor={colores.textoSuave}
                  style={[styles.searchInput, { color: colores.texto }]}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={16} color={colores.textoSuave} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Usuarios seleccionados en chips */}
              {selectedUsers.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
                  {selectedUsers.map((user) => (
                    <TouchableOpacity key={user.id} onPress={() => toggleSelectedUser(user.id)} style={styles.userChip}>
                      <Text style={styles.chipText} numberOfLines={1}>{user.nombre}</Text>
                      <MaterialIcons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}

              {/* Nombre de grupo si hay 2+ seleccionados */}
              {selectedUsers.length > 1 ? (
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Nombre del grupo (opcional)"
                  placeholderTextColor={colores.textoSuave}
                  style={[styles.groupInput, { color: colores.texto, borderColor: colores.borde, marginVertical: 6 }]}
                />
              ) : null}

              {/* Lista de integrantes */}
              <ScrollView style={{ maxHeight: 260, marginVertical: 6 }} nestedScrollEnabled showsVerticalScrollIndicator>
                {filteredUsers.length === 0 ? (
                  <Text style={[styles.noResultsText, { color: colores.textoSuave, textAlign: 'center', marginVertical: 16 }]}>
                    No se encontraron empleados.
                  </Text>
                ) : (
                  filteredUsers.map((user) => {
                    const selected = selectedUserIds.includes(user.id);
                    const photo = user.foto_perfil || user.fotoPerfil || user.photoURL || user.avatarUrl || user.foto;
                    return (
                      <TouchableOpacity
                        key={user.id}
                        onPress={() => toggleSelectedUser(user.id)}
                        style={[styles.userOption, selected && styles.userOptionSelected]}
                        activeOpacity={0.8}
                      >
                        <View style={styles.userAvatar}>
                          {photo ? (
                            <Image source={{ uri: photo }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                          ) : (
                            <Text style={styles.avatarLetter}>{(user.nombre || 'U').charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, { color: colores.texto }]} numberOfLines={1}>
                            {user.nombre}
                          </Text>
                          <Text style={[styles.userRole, { color: colores.textoSuave }]} numberOfLines={1}>
                            {user.correo || user.rol || 'Colaborador'}
                          </Text>
                        </View>
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                          {selected ? <MaterialIcons name="check" size={14} color="#FFFFFF" /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Botón de acción para crear chat o grupo */}
              {selectedUsers.length > 0 ? (
                <TouchableOpacity
                  disabled={sending}
                  onPress={handleStartConversation}
                  style={[styles.createBtn, { marginTop: 8 }]}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name={selectedUsers.length > 1 ? 'group-add' : 'chat'} size={18} color="#FFFFFF" />
                  <Text style={styles.createBtnText}>
                    {selectedUsers.length > 1 ? 'Crear chat de grupo' : 'Iniciar conversación'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}

      {/* Lista Principal de Conversaciones */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading && conversations.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colores.primarioClaro} />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="forum" size={44} color={colores.textoSuave} />
            <Text style={[styles.emptyTitle, { color: colores.texto }]}>No hay conversaciones</Text>
            <Text style={[styles.emptySub, { color: colores.textoSuave }]}>
              {searchQuery ? 'No se encontraron resultados para la búsqueda.' : 'Toca el botón "+" para iniciar un nuevo chat con tu equipo.'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.tipo === 'equipo';
            const title = getTituloConversacion(conv, perfil.id, users);
            const photoUrl = getFotoConversacion(conv, perfil.id, users);
            const isMuted = mutedConvIds.includes(conv.id);
            const isBlocked = blockedConvIds.includes(conv.id);

            return (
              <TouchableOpacity
                key={conv.id}
                onPress={() => setSelectedConversationId(conv.id)}
                style={[
                  styles.convItem,
                  { backgroundColor: cardBg, borderColor: colores.borde },
                  isBlocked && { opacity: 0.65 },
                ]}
                activeOpacity={0.78}
              >
                <View style={[styles.convAvatar, isGroup && styles.convAvatarGroup]}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.convAvatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.avatarLetter}>{(title || 'C').charAt(0).toUpperCase()}</Text>
                  )}
                </View>

                <View style={styles.convCopy}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convTitle, { color: colores.texto }]} numberOfLines={1}>
                      {title}
                    </Text>
                    {isMuted ? (
                      <MaterialIcons name="notifications-off" size={15} color={colores.textoSuave} style={{ marginLeft: 4 }} />
                    ) : null}
                    {isBlocked ? (
                      <MaterialIcons name="block" size={15} color="#EF4444" style={{ marginLeft: 4 }} />
                    ) : null}
                  </View>
                  <Text style={[styles.convPreview, { color: isBlocked ? '#EF4444' : colores.textoSuave }]} numberOfLines={1}>
                    {isBlocked ? 'Chat bloqueado' : (conv.ultimoMensaje || 'Sin mensajes aún')}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    setActionMenuConv(conv);
                  }}
                  style={styles.convMenuBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="more-vert" size={20} color={colores.textoSuave} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de opciones de conversación (Silenciar, Bloquear, Borrar) */}
      {actionMenuConv ? (
        <Modal
          visible={!!actionMenuConv}
          transparent
          animationType="fade"
          onRequestClose={() => setActionMenuConv(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setActionMenuConv(null)}
            style={styles.actionMenuOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => (e as any)?.stopPropagation?.()}
              style={[
                styles.actionMenuCard,
                { backgroundColor: esOscuro ? 'rgba(24,24,38,0.96)' : 'rgba(255,255,255,0.96)', borderColor: colores.borde },
              ]}
            >
              <View style={styles.actionMenuHeader}>
                <Text style={[styles.actionMenuTitle, { color: colores.texto }]} numberOfLines={1}>
                  {getTituloConversacion(actionMenuConv, perfil.id, users)}
                </Text>
                <TouchableOpacity onPress={() => setActionMenuConv(null)}>
                  <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              {/* Option 1: Cambiar Nombre */}
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => openRenameModal(actionMenuConv)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                  <MaterialIcons name="edit" size={20} color={colores.texto} />
                </View>
                <View style={styles.actionMenuTextWrap}>
                  <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                    Modificar nombre
                  </Text>
                  <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                    {actionMenuConv.tipo === 'equipo' ? 'Cambiar nombre del grupo' : 'Cambiar apodo del contacto'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Silenciar */}
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => toggleMuteConv(actionMenuConv.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionMenuIconWrap, { backgroundColor: mutedConvIds.includes(actionMenuConv.id) ? 'rgba(245,158,11,0.15)' : colores.vidrio }]}>
                  <MaterialIcons
                    name={mutedConvIds.includes(actionMenuConv.id) ? 'notifications-active' : 'notifications-off'}
                    size={20}
                    color={mutedConvIds.includes(actionMenuConv.id) ? '#F59E0B' : colores.texto}
                  />
                </View>
                <View style={styles.actionMenuTextWrap}>
                  <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                    {mutedConvIds.includes(actionMenuConv.id) ? 'Desactivar silencio' : 'Silenciar chat'}
                  </Text>
                  <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                    {mutedConvIds.includes(actionMenuConv.id) ? 'Recibir notificaciones' : 'Silenciar notificaciones de este chat'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Conditional (Grupo -> Cambiar Foto, Añadir miembros & Abandonar | Directo -> Bloquear) */}
              {actionMenuConv.tipo === 'equipo' ? (
                <>
                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleChangeGroupPhoto(actionMenuConv)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                      <MaterialIcons name="add-a-photo" size={20} color={colores.texto} />
                    </View>
                    <View style={styles.actionMenuTextWrap}>
                      <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                        Cambiar foto del grupo
                      </Text>
                      <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                        Actualizar la foto de perfil de este grupo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => openAddMembersModal(actionMenuConv)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                      <MaterialIcons name="person-add" size={20} color={colores.texto} />
                    </View>
                    <View style={styles.actionMenuTextWrap}>
                      <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                        Añadir personas
                      </Text>
                      <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                        Agregar más integrantes a este equipo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionMenuItem}
                    onPress={() => handleLeaveGroup(actionMenuConv)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionMenuIconWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                      <MaterialIcons name="logout" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.actionMenuTextWrap}>
                      <Text style={[styles.actionMenuItemText, { color: '#EF4444' }]}>
                        Abandonar grupo
                      </Text>
                      <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                        Salir de esta conversación de equipo
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => toggleBlockConv(actionMenuConv.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionMenuIconWrap, { backgroundColor: blockedConvIds.includes(actionMenuConv.id) ? 'rgba(239,68,68,0.15)' : colores.vidrio }]}>
                    <MaterialIcons
                      name={blockedConvIds.includes(actionMenuConv.id) ? 'lock-open' : 'block'}
                      size={20}
                      color={blockedConvIds.includes(actionMenuConv.id) ? '#EF4444' : colores.texto}
                    />
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                      {blockedConvIds.includes(actionMenuConv.id) ? 'Desbloquear chat' : 'Bloquear chat'}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                      {blockedConvIds.includes(actionMenuConv.id) ? 'Permitir enviar mensajes nuevamente' : 'Impedir el envío de nuevos mensajes'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={[styles.actionMenuDivider, { backgroundColor: colores.borde }]} />

              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handleDeleteConv(actionMenuConv)}
                activeOpacity={0.7}
                disabled={deletingConv}
              >
                <View style={[styles.actionMenuIconWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                  {deletingConv ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                  )}
                </View>
                <View style={styles.actionMenuTextWrap}>
                  <Text style={[styles.actionMenuItemText, { color: '#EF4444' }]}>
                    Borrar conversación
                  </Text>
                  <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                    Eliminar el historial completo de mensajes
                  </Text>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}

      {/* Modal para renombrar conversación o contacto */}
      {showRenameModal && targetConvToRename ? (
        <Modal
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowRenameModal(false)}
            style={styles.actionMenuOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => (e as any)?.stopPropagation?.()}
              style={[
                styles.actionMenuCard,
                { backgroundColor: esOscuro ? 'rgba(24,24,38,0.96)' : 'rgba(255,255,255,0.96)', borderColor: colores.borde },
              ]}
            >
              <View style={styles.actionMenuHeader}>
                <Text style={[styles.actionMenuTitle, { color: colores.texto }]}>
                  {targetConvToRename.tipo === 'equipo' ? 'Renombrar equipo' : 'Editar nombre de contacto'}
                </Text>
                <TouchableOpacity onPress={() => setShowRenameModal(false)}>
                  <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder="Nombre personalizado"
                placeholderTextColor={colores.textoSuave}
                style={[styles.groupInput, { color: colores.texto, borderColor: colores.borde, marginVertical: 12 }]}
                autoFocus
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowRenameModal(false)}
                  style={[styles.btnSecondary, { borderColor: colores.borde }]}
                >
                  <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={sending || !renameInput.trim()}
                  onPress={handleSaveRename}
                  style={[styles.createBtn, { flex: 0, paddingHorizontal: 16 }, (sending || !renameInput.trim()) && { opacity: 0.5 }]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}

      {/* Modal para añadir más personas al grupo */}
      {showAddMembersModal && targetConvToAddMembers ? (
        <Modal
          visible={showAddMembersModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddMembersModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowAddMembersModal(false)}
            style={styles.actionMenuOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => (e as any)?.stopPropagation?.()}
              style={[
                styles.actionMenuCard,
                { backgroundColor: esOscuro ? 'rgba(24,24,38,0.96)' : 'rgba(255,255,255,0.96)', borderColor: colores.borde, maxHeight: '80%' },
              ]}
            >
              <View style={styles.actionMenuHeader}>
                <Text style={[styles.actionMenuTitle, { color: colores.texto }]}>
                  Añadir personas al grupo
                </Text>
                <TouchableOpacity onPress={() => setShowAddMembersModal(false)}>
                  <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280, marginVertical: 8 }}>
                {users
                  .filter((u) => !targetConvToAddMembers.participanteIds?.includes(u.id))
                  .length === 0 ? (
                  <Text style={[styles.noResultsText, { color: colores.textoSuave, textAlign: 'center', marginVertical: 16 }]}>
                    Todos los integrantes ya pertenecen a este grupo.
                  </Text>
                ) : (
                  users
                    .filter((u) => !targetConvToAddMembers.participanteIds?.includes(u.id))
                    .map((u) => {
                      const selected = newMembersSelectedIds.includes(u.id);
                      return (
                        <TouchableOpacity
                          key={u.id}
                          onPress={() => toggleNewMemberSelection(u.id)}
                          style={[styles.userOption, selected && styles.userOptionSelected]}
                          activeOpacity={0.8}
                        >
                          <View style={styles.userAvatar}>
                            <Text style={styles.avatarLetter}>{(u.nombre || 'U').charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colores.texto }]} numberOfLines={1}>
                              {u.nombre}
                            </Text>
                            <Text style={[styles.userRole, { color: colores.textoSuave }]} numberOfLines={1}>
                              {u.correo || u.rol || 'Colaborador'}
                            </Text>
                          </View>
                          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                            {selected ? <MaterialIcons name="check" size={14} color="#FFFFFF" /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowAddMembersModal(false)}
                  style={[styles.btnSecondary, { borderColor: colores.borde }]}
                >
                  <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={sending || newMembersSelectedIds.length === 0}
                  onPress={handleSaveAddMembers}
                  style={[styles.createBtn, { flex: 0, paddingHorizontal: 16 }, (sending || newMembersSelectedIds.length === 0) && { opacity: 0.5 }]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Añadir ({newMembersSelectedIds.length})</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 70,
  },
  fondoAbsoluto: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  stateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  headerContainer: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 4 : 8,
    borderRadius: 28,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124,58,237,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  newChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(216,180,254,0.38)',
  },
  newChatBtnActive: {
    backgroundColor: '#6D28D9',
  },
  newChatCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    maxHeight: 320,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  selectedRow: {
    gap: 6,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.75)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 120,
  },
  groupInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  userListScroll: {
    maxHeight: 160,
  },
  noResultsText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 10,
  },
  userOptionSelected: {
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#D8B4FE',
    fontSize: 13,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 11,
    marginTop: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#A78BFA',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    height: 40,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarGroup: {
    backgroundColor: 'rgba(59,130,246,0.85)',
  },
  convCopy: {
    flex: 1,
    minWidth: 0,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  convPreview: {
    fontSize: 13,
    marginTop: 4,
  },
  errorCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#FECACA',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  messageRow: {
    width: '100%',
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  senderAvatarWrap: {
    marginRight: 8,
    marginBottom: 2,
  },
  senderAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  senderAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  senderAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 18,
    gap: 6,
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '900',
  },
  textOwn: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  textOther: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    alignSelf: 'flex-end',
  },
  timeOther: {
    fontSize: 10,
    fontWeight: '700',
    alignSelf: 'flex-end',
  },
  pendingTray: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  pendingTrayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pendingTrayTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pendingScroll: {
    gap: 10,
  },
  previewCard: {
    width: 100,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    position: 'relative',
    padding: 4,
    justifyContent: 'space-between',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  previewDocIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 4,
    zIndex: 2,
  },
  previewName: {
    fontSize: 10,
    fontWeight: '800',
  },
  previewSize: {
    fontSize: 9,
    marginTop: 1,
  },
  removeAttBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  inputContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolsWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  attachmentCard: {
    marginTop: 6,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  attachmentCopy: {
    flex: 1,
    minWidth: 0,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '800',
  },
  attachmentMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  chatImageWrap: {
    width: 220,
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  chatImageLarge: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafeArea: {
    flex: 1,
    width: '100%',
  },
  modalTopBar: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCenterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalFullImage: {
    width: '100%',
    height: '100%',
  },
  convAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  convMenuBtn: {
    padding: 6,
    borderRadius: 12,
  },
  headerOptionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  blockedBanner: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  unblockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenuCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  actionMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionMenuTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginRight: 10,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  actionMenuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuTextWrap: {
    flex: 1,
  },
  actionMenuItemText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionMenuItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionMenuDivider: {
    height: 1,
    marginVertical: 4,
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
