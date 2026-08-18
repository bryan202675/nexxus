import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
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
import { SOMBRAS } from '@/shared/constants/diseno';
import { getTenantId } from '@/shared/auth/tenant';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

const obtenerEmpresaId = (perfil: { empresaId?: string } | null) => getTenantId(perfil);

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
  const { t } = useTranslation();
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
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#3B82F6' }}>{t('chatInterno.readReceipt')}</Text>
    </Animated.View>
  );
};
const formatearHoraMensaje = (fechaIso?: string): string => {
  if (!fechaIso) return '';
  try {
    const fecha = new Date(fechaIso);
    if (isNaN(fecha.getTime())) return '';
    const ahora = new Date();
    const esHoy = fecha.toDateString() === ahora.toDateString();

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const esAyer = fecha.toDateString() === ayer.toDateString();

    if (esHoy) {
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (esAyer) {
      return 'Ayer';
    }
    if (fecha.getFullYear() === ahora.getFullYear()) {
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
    }
    return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear() % 100}`;
  } catch {
    return '';
  }
};

const formatearPreviewUltimoMensaje = (
  conv: Conversation,
  perfilId: string,
  usersList: ChatUser[]
): { emisor: string; texto: string } => {
  if (!conv.ultimoMensaje) {
    return { emisor: '', texto: 'Sin mensajes aún' };
  }

  // 1. ¿Lo envió el usuario actual?
  if (conv.ultimoMensajeRemitenteId && conv.ultimoMensajeRemitenteId === perfilId) {
    return { emisor: 'Tú: ', texto: conv.ultimoMensaje };
  }

  // 2. Si hay nombre guardado directamente
  if (conv.ultimoMensajeRemitenteNombre) {
    const primerNombre = conv.ultimoMensajeRemitenteNombre.trim().split(' ')[0];
    return { emisor: `${primerNombre}: `, texto: conv.ultimoMensaje };
  }

  // 3. Buscar por ID en lista de usuarios
  if (conv.ultimoMensajeRemitenteId) {
    const user = usersList.find((u) => u.id === conv.ultimoMensajeRemitenteId);
    if (user && user.nombre) {
      const primerNombre = user.nombre.trim().split(' ')[0];
      return { emisor: `${primerNombre}: `, texto: conv.ultimoMensaje };
    }
  }

  // 4. Si es conversación directa con otra persona
  if (conv.tipo === 'directa') {
    const otroId = conv.participanteIds?.find((id) => id !== perfilId);
    const otroUsuario = usersList.find((u) => u.id === otroId);
    const otroNombre = otroUsuario?.nombre || conv.participantes?.find((p) => p.id !== perfilId)?.nombre;
    if (otroNombre) {
      const primerNombre = otroNombre.trim().split(' ')[0];
      return { emisor: `${primerNombre}: `, texto: conv.ultimoMensaje };
    }
  }

  return { emisor: '', texto: conv.ultimoMensaje };
};

export default function ChatInterno() {
  const { t } = useTranslation();
  const { perfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [conteoNoLeidos, setConteoNoLeidos] = useState<Record<string, number>>({});
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'no_leidos' | 'directos' | 'grupos'>('todos');
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  // Modals / State for creating new chats
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');

  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.88)).current;

  const chatFadeAnim = useRef(new Animated.Value(0)).current;
  const chatSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (selectedConversationId) {
      chatFadeAnim.setValue(0);
      chatSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(chatFadeAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(chatSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (showNewChatModal) {
      modalFadeAnim.setValue(0);
      modalScaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showNewChatModal]);

  const cerrarNuevoChatModalConAnimacion = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(modalScaleAnim, {
        toValue: 0.88,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNewChatModal(false);
      setSelectedUserIds([]);
      setGroupName('');
      if (cb) cb();
    });
  };

  // Preferencias locales para silenciar, bloquear y menú de opciones
  const [mutedConvIds, setMutedConvIds] = useState<string[]>([]);
  const [blockedConvIds, setBlockedConvIds] = useState<string[]>([]);
  const [actionMenuConv, setActionMenuConv] = useState<Conversation | null>(null);
  const [deletingConv, setDeletingConv] = useState(false);

  // Modales y estados para renombrar y agregar miembros
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [targetConvToRename, setTargetConvToRename] = useState<Conversation | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [targetConvToAddMembers, setTargetConvToAddMembers] = useState<Conversation | null>(null);
  const [newMembersSelectedIds, setNewMembersSelectedIds] = useState<string[]>([]);

  const actionFadeAnim = useRef(new Animated.Value(0)).current;
  const actionScaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (actionMenuConv) {
      actionFadeAnim.setValue(0);
      actionScaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(actionFadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(actionScaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [actionMenuConv]);

  const cerrarActionMenuModalConAnimacion = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(actionFadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionScaleAnim, {
        toValue: 0.88,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActionMenuConv(null);
      if (cb) cb();
    });
  };

  const renameFadeAnim = useRef(new Animated.Value(0)).current;
  const renameScaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (showRenameModal) {
      renameFadeAnim.setValue(0);
      renameScaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(renameFadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(renameScaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showRenameModal]);

  const cerrarRenameModalConAnimacion = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(renameFadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(renameScaleAnim, {
        toValue: 0.88,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRenameModal(false);
      if (cb) cb();
    });
  };

  const addMembersFadeAnim = useRef(new Animated.Value(0)).current;
  const addMembersScaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (showAddMembersModal) {
      addMembersFadeAnim.setValue(0);
      addMembersScaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(addMembersFadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(addMembersScaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAddMembersModal]);

  const cerrarAddMembersModalConAnimacion = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(addMembersFadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(addMembersScaleAnim, {
        toValue: 0.88,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddMembersModal(false);
      if (cb) cb();
    });
  };

  // Message & attachments state (multiple attachments preview like WhatsApp)
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Async status
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');





  const scrollRef = useRef<ScrollView>(null);
  const empresaId = obtenerEmpresaId(perfil);



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
    const confirmMessage = t('chatInterno.alerts.leaveGroupMessage', { name: groupTitle });

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
      Alert.alert(t('chatInterno.alerts.leaveGroupTitle'), confirmMessage, [
        { text: t('chatInterno.common.cancel'), style: 'cancel' },
        { text: t('chatInterno.alerts.leaveGroupConfirm'), style: 'destructive', onPress: executeLeave },
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
          Alert.alert(t('chatInterno.alerts.permissionsTitle'), t('chatInterno.alerts.permissionsMessage'));
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
    const confirmMessage = t('chatInterno.alerts.deleteConvMessage', { name: convTitle });

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
      Alert.alert(t('chatInterno.alerts.deleteConvTitle'), confirmMessage, [
        { text: t('chatInterno.common.cancel'), style: 'cancel' },
        { text: t('chatInterno.alerts.deleteConfirm'), style: 'destructive', onPress: executeDelete },
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

  const totalNoLeidos = useMemo(
    () => Object.values(conteoNoLeidos).reduce((acc, curr) => acc + curr, 0),
    [conteoNoLeidos]
  );

  const userConversations = useMemo(() => {
    if (!perfil?.id) return [];
    return conversations.filter((c) =>
      Array.isArray(c.participanteIds) && c.participanteIds.includes(perfil.id)
    );
  }, [conversations, perfil?.id]);

  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return userConversations.filter((c) => {
      const unreadCount = conteoNoLeidos[c.id] || 0;
      if (filtroTipo === 'no_leidos' && unreadCount === 0) return false;
      if (filtroTipo === 'directos' && c.tipo !== 'directa') return false;
      if (filtroTipo === 'grupos' && c.tipo !== 'equipo') return false;

      if (!term) return true;
      const title = getTituloConversacion(c, perfil?.id || '', users).toLowerCase();
      const lastMsg = (c.ultimoMensaje || '').toLowerCase();
      return title.includes(term) || lastMsg.includes(term);
    });
  }, [userConversations, searchQuery, perfil?.id, users, filtroTipo, conteoNoLeidos]);

  const selectedUsers = useMemo(
    () =>
      selectedUserIds
        .map((id) => availableUsers.find((user) => user.id === id))
        .filter((user): user is ChatUser => Boolean(user)),
    [availableUsers, selectedUserIds]
  );

  // Subscribe to unread messages count across all conversations
  useEffect(() => {
    if (!perfil?.id || !empresaId) {
      setConteoNoLeidos({});
      return;
    }
    const unsubUnread = useCases.chat.internal.subscribeUnreadCounts(
      empresaId,
      perfil.id,
      setConteoNoLeidos
    );
    return () => {
      unsubUnread();
    };
  }, [empresaId, perfil?.id]);

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
    if (!perfil || !perfil.id) {
      setError('No se pudo identificar tu perfil de usuario.');
      return;
    }
    if (!empresaId) {
      setError('No se encontró el identificador de la empresa.');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un integrante para iniciar.');
      return;
    }

    setSending(true);
    setError('');
    try {
      if (selectedUsers.length === 1) {
        const other = selectedUsers[0];
        const existing = conversations.find(
          (c) =>
            c.tipo === 'directa' &&
            c.participanteIds?.includes(perfil.id) &&
            c.participanteIds?.includes(other.id)
        );
        if (existing) {
          setSelectedConversationId(existing.id);
        } else {
          const created = await useCases.chat.internal.createConversation({
            empresaId,
            tipo: 'directa',
            titulo: other.nombre || 'Chat Directo',
            creadoPor: perfil.id,
            participantes: [
              {
                id: perfil.id,
                nombre: perfil.nombre || 'Colaborador',
                rol: perfil.rol || 'Empleado',
                foto_perfil: (perfil as any).foto_perfil || (perfil as any).fotoPerfil || (perfil as any).photoURL || (perfil as any).avatarUrl,
              },
              {
                id: other.id,
                nombre: other.nombre || 'Colaborador',
                rol: other.rol || 'Empleado',
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
            { id: perfil.id, nombre: perfil.nombre || 'Colaborador', rol: perfil.rol || 'Empleado' },
            ...selectedUsers.map((item) => ({ id: item.id, nombre: item.nombre || 'Colaborador', rol: item.rol || 'Empleado' })),
          ],
        });
        setSelectedConversationId(created.id);
      }
      setSearchQuery('');
      cerrarNuevoChatModalConAnimacion();
    } catch (err: any) {
      console.error('[ChatInterno] Error al crear conversación:', err);
      const msg = err?.message || err?.error_description || err?.details || 'No se pudo crear la conversación.';
      setError(msg);
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
          // Fase 10: push real, en paralelo. Sin token registrado, la Edge Function no envía nada.
          useCases.push.send.execute(
            destinatarioId,
            perfil.nombre,
            input.trim() || 'Te envió un archivo adjunto.'
          ).catch((e) => console.error('Error enviando push:', e));
          // Nexxus Brain (Fase 14): registra que estas dos personas se conectan por chat directo.
          // Upsert con ignoreDuplicates -- reenviar mensajes entre las mismas dos personas no crea
          // un edge nuevo cada vez, solo confirma que la relación ya existe.
          useCases.graph.addRelation.execute({
            empresaId,
            origenTipo: 'usuario',
            origenId: perfil.id,
            relacionTipo: 'conversa_con',
            destinoTipo: 'usuario',
            destinoId: destinatarioId,
            metadata: {},
            creadoPor: perfil.id,
          }).catch((e) => console.error('Error registrando relación en Nexxus Brain:', e));
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

  // Modal Flotante Cristalino para Opciones de Conversación (Silenciar, Bloquear, Borrar, etc)
  const renderActionMenuModal = () => {
    if (!actionMenuConv) return null;

    return (
      <Modal
        visible={!!actionMenuConv}
        transparent
        animationType="none"
        onRequestClose={() => cerrarActionMenuModalConAnimacion()}
      >
        <Animated.View style={[styles.actionMenuOverlay, { opacity: actionFadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => cerrarActionMenuModalConAnimacion()}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          >
            <Animated.View
              style={[
                styles.actionMenuCard,
                {
                  backgroundColor: esOscuro ? 'rgba(20,20,32,0.96)' : 'rgba(255,255,255,0.96)',
                  borderColor: colores.borde,
                  opacity: actionFadeAnim,
                  transform: [{ scale: actionScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: colores.texto }]} numberOfLines={1}>
                    {getTituloConversacion(actionMenuConv, perfil?.id || '', users)}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarActionMenuModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Cambiar Nombre */}
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => cerrarActionMenuModalConAnimacion(() => openRenameModal(actionMenuConv!))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                    <MaterialIcons name="edit" size={20} color={colores.texto} />
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                      {t('chatInterno.actionMenu.renameTitle')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                      {actionMenuConv.tipo === 'equipo' ? t('chatInterno.actionMenu.renameSubGroup') : t('chatInterno.actionMenu.renameSubContact')}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Silenciar */}
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => toggleMuteConv(actionMenuConv!.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionMenuIconWrap,
                      { backgroundColor: mutedConvIds.includes(actionMenuConv.id) ? 'rgba(245,158,11,0.15)' : colores.vidrio },
                    ]}
                  >
                    <MaterialIcons
                      name={mutedConvIds.includes(actionMenuConv.id) ? 'notifications-active' : 'notifications-off'}
                      size={20}
                      color={mutedConvIds.includes(actionMenuConv.id) ? '#F59E0B' : colores.texto}
                    />
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                      {mutedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.muteOff') : t('chatInterno.actionMenu.muteOn')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                      {mutedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.muteOffSub') : t('chatInterno.actionMenu.muteOnSub')}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 3: Conditional (Grupo vs Directo) */}
                {actionMenuConv.tipo === 'equipo' ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => handleChangeGroupPhoto(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                        <MaterialIcons name="add-a-photo" size={20} color={colores.texto} />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                          {t('chatInterno.actionMenu.changePhoto')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                          {t('chatInterno.actionMenu.changePhotoSub')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => openAddMembersModal(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: colores.vidrio }]}>
                        <MaterialIcons name="person-add" size={20} color={colores.texto} />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                          {t('chatInterno.actionMenu.addPeople')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                          {t('chatInterno.actionMenu.addPeopleSub')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => handleLeaveGroup(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: '#EF4444' }]}>
                          {t('chatInterno.actionMenu.leaveGroup')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                          {t('chatInterno.actionMenu.leaveGroupSub')}
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
                    <View
                      style={[
                        styles.actionMenuIconWrap,
                        { backgroundColor: blockedConvIds.includes(actionMenuConv.id) ? 'rgba(239,68,68,0.15)' : colores.vidrio },
                      ]}
                    >
                      <MaterialIcons
                        name={blockedConvIds.includes(actionMenuConv.id) ? 'lock-open' : 'block'}
                        size={20}
                        color={blockedConvIds.includes(actionMenuConv.id) ? '#EF4444' : colores.texto}
                      />
                    </View>
                    <View style={styles.actionMenuTextWrap}>
                      <Text style={[styles.actionMenuItemText, { color: colores.texto }]}>
                        {blockedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.blockOff') : t('chatInterno.actionMenu.blockOn')}
                      </Text>
                      <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                        {blockedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.blockOffSub') : t('chatInterno.actionMenu.blockOnSub')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={[styles.actionMenuDivider, { backgroundColor: colores.borde }]} />

                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => cerrarActionMenuModalConAnimacion(() => handleDeleteConv(actionMenuConv!))}
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
                      {t('chatInterno.actionMenu.deleteConv')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: colores.textoSuave }]}>
                      {t('chatInterno.actionMenu.deleteConvSub')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  };

  // Modal Flotante Cristalino para Renombrar Conversación / Contacto
  const renderRenameModal = () => {
    if (!showRenameModal || !targetConvToRename) return null;

    return (
      <Modal
        visible={showRenameModal}
        transparent
        animationType="none"
        onRequestClose={() => cerrarRenameModalConAnimacion()}
      >
        <Animated.View style={[styles.actionMenuOverlay, { opacity: renameFadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => cerrarRenameModalConAnimacion()}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          >
            <Animated.View
              style={[
                styles.actionMenuCard,
                {
                  backgroundColor: esOscuro ? 'rgba(20,20,32,0.96)' : 'rgba(255,255,255,0.96)',
                  borderColor: colores.borde,
                  opacity: renameFadeAnim,
                  transform: [{ scale: renameScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: colores.texto, fontWeight: '900' }]}>
                    {targetConvToRename.tipo === 'equipo' ? t('chatInterno.rename.titleGroup') : t('chatInterno.rename.titleContact')}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarRenameModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, color: colores.textoSuave, marginTop: 2, marginBottom: 12 }}>
                  {t('chatInterno.rename.description')}
                </Text>

                <TextInput
                  value={renameInput}
                  onChangeText={setRenameInput}
                  placeholder={t('chatInterno.rename.placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  style={[
                    styles.groupInput,
                    {
                      color: colores.texto,
                      borderColor: colores.borde,
                      backgroundColor: colores.vidrio,
                      borderRadius: 20,
                      height: 48,
                      paddingHorizontal: 16,
                      marginBottom: 16,
                    },
                  ]}
                  autoFocus
                />

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                  <BotonAnimado
                    onPress={() => cerrarRenameModalConAnimacion()}
                    scaleTo={0.96}
                    style={[
                      styles.btnSecondary,
                      { borderColor: colores.borde, borderRadius: 16, height: 42, paddingHorizontal: 18 },
                    ]}
                  >
                    <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '800' }}>{t('chatInterno.common.cancel')}</Text>
                  </BotonAnimado>
                  <BotonAnimado
                    disabled={sending || !renameInput.trim()}
                    onPress={() => cerrarRenameModalConAnimacion(() => handleSaveRename())}
                    scaleTo={0.96}
                    style={[
                      styles.createBtn,
                      {
                        backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
                        borderRadius: 16,
                        height: 42,
                        paddingHorizontal: 20,
                      },
                      (sending || !renameInput.trim()) && { opacity: 0.5 },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={esOscuro ? '#000000' : '#FFFFFF'} />
                    ) : (
                      <Text style={{ color: esOscuro ? '#000000' : '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                        {t('chatInterno.common.saveChanges')}
                      </Text>
                    )}
                  </BotonAnimado>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  };

  // Modal Flotante Cristalino para Añadir Personas al Grupo
  const renderAddMembersModal = () => {
    if (!showAddMembersModal || !targetConvToAddMembers) return null;

    const availableUsers = users.filter((u) => !targetConvToAddMembers.participanteIds?.includes(u.id));

    return (
      <Modal
        visible={showAddMembersModal}
        transparent
        animationType="none"
        onRequestClose={() => cerrarAddMembersModalConAnimacion()}
      >
        <Animated.View style={[styles.actionMenuOverlay, { opacity: addMembersFadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => cerrarAddMembersModalConAnimacion()}
            style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}
          >
            <Animated.View
              style={[
                styles.actionMenuCard,
                {
                  backgroundColor: esOscuro ? 'rgba(20,20,32,0.96)' : 'rgba(255,255,255,0.96)',
                  borderColor: colores.borde,
                  maxHeight: '80%',
                  opacity: addMembersFadeAnim,
                  transform: [{ scale: addMembersScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: colores.texto, fontWeight: '900' }]}>
                    {t('chatInterno.addMembers.title')}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarAddMembersModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={colores.textoSuave} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
                  {availableUsers.length === 0 ? (
                    <Text style={[styles.noResultsText, { color: colores.textoSuave, textAlign: 'center', marginVertical: 16 }]}>
                      {t('chatInterno.addMembers.empty')}
                    </Text>
                  ) : (
                    availableUsers.map((u) => {
                      const selected = newMembersSelectedIds.includes(u.id);
                      return (
                        <TouchableOpacity
                          key={u.id}
                          onPress={() => toggleNewMemberSelection(u.id)}
                          style={[
                            styles.userOption,
                            selected && { backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                          ]}
                          activeOpacity={0.8}
                        >
                          <View style={styles.userAvatar}>
                            <Text style={styles.avatarLetter}>{(u.nombre || 'U').charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colores.texto, fontWeight: '800' }]} numberOfLines={1}>
                              {u.nombre}
                            </Text>
                            <Text style={[styles.userRole, { color: colores.textoSuave }]} numberOfLines={1}>
                              {u.correo || u.rol || 'Colaborador'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.checkbox,
                              selected && {
                                backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
                                borderColor: esOscuro ? '#FFFFFF' : '#000000',
                              },
                            ]}
                          >
                            {selected ? <MaterialIcons name="check" size={14} color={esOscuro ? '#000000' : '#FFFFFF'} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <BotonAnimado
                    onPress={() => cerrarAddMembersModalConAnimacion()}
                    scaleTo={0.96}
                    style={[
                      styles.btnSecondary,
                      { borderColor: colores.borde, borderRadius: 16, height: 42, paddingHorizontal: 18 },
                    ]}
                  >
                    <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '800' }}>{t('chatInterno.common.cancel')}</Text>
                  </BotonAnimado>
                  <BotonAnimado
                    disabled={sending || newMembersSelectedIds.length === 0}
                    onPress={() => cerrarAddMembersModalConAnimacion(() => handleSaveAddMembers())}
                    scaleTo={0.96}
                    style={[
                      styles.createBtn,
                      {
                        backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
                        borderRadius: 16,
                        height: 42,
                        paddingHorizontal: 20,
                      },
                      (sending || newMembersSelectedIds.length === 0) && { opacity: 0.5 },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={esOscuro ? '#000000' : '#FFFFFF'} />
                    ) : (
                      <Text style={{ color: esOscuro ? '#000000' : '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                        {t('chatInterno.addMembers.addCount', { count: newMembersSelectedIds.length })}
                      </Text>
                    )}
                  </BotonAnimado>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  };

  if (!perfil || !empresaId) {
    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: colores.fondo }]}>
        <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={styles.fondoAbsoluto}>
          <FondoMobilePremium />
        </View>
        <NavbarEnterprise titulo={t('chatInterno.navbar.unavailableTitle')} />
        <View style={styles.centerState}>
          <MaterialIcons name="business" size={44} color={colores.textoSuave} />
          <Text style={[styles.stateTitle, { color: colores.texto }]}>{t('chatInterno.unavailable.title')}</Text>
          <Text style={[styles.stateText, { color: colores.textoSuave }]}>
            {t('chatInterno.unavailable.message')}
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

        <Animated.View style={{ flex: 1, opacity: chatFadeAnim, transform: [{ translateY: chatSlideAnim }] }}>
          {/* Header de conversación activa utilizando el componente uniforme NavbarEnterprise */}
          <NavbarEnterprise
          titulo={activeTitle}
          subtitulo={selectedConversation.tipo === 'equipo' ? t('chatInterno.conversation.groupMembers', { count: selectedConversation.participantes?.length || 2 }) : t('chatInterno.conversation.directChat')}
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
                <Text style={[styles.emptyTitle, { color: colores.texto }]}>{t('chatInterno.conversation.emptyTitle')}</Text>
                <Text style={[styles.emptySub, { color: colores.textoSuave }]}>
                  {t('chatInterno.conversation.emptyMessage', { name: activeTitle })}
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
                        ? [styles.bubbleOwn, { backgroundColor: esOscuro ? '#FFFFFF' : '#000000', borderColor: esOscuro ? '#FFFFFF' : '#000000' }]
                        : [styles.bubbleOther, { backgroundColor: cardBg, borderColor: colores.borde }],
                    ]}
                  >
                    {!own ? (
                      <Text style={[styles.senderName, { color: colores.textoSecundario }]}>{senderName}</Text>
                    ) : null}
                    
                    {message.texto ? (
                      <Text style={own ? [styles.textOwn, { color: esOscuro ? '#000000' : '#FFFFFF' }] : [styles.textOther, { color: colores.texto }]}>
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
                          style={[styles.attachmentCard, { borderColor: own ? (esOscuro ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)') : colores.borde }]}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="picture-as-pdf" size={24} color={own ? (esOscuro ? '#000000' : '#FFFFFF') : '#EF4444'} />
                          <View style={styles.attachmentCopy}>
                            <Text style={[styles.attachmentName, { color: own ? (esOscuro ? '#000000' : '#FFFFFF') : colores.texto }]} numberOfLines={1}>
                              {attachment.nombre}
                            </Text>
                            <Text style={[styles.attachmentMeta, { color: own ? (esOscuro ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)') : colores.textoSuave }]}>
                              {formatBytes(attachment.size)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    <Text style={own ? [styles.timeOwn, { color: esOscuro ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)' }] : [styles.timeOther, { color: colores.textoSuave }]}>
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
                  {t('chatInterno.attachments.title', { count: pendingAttachments.length })}
                </Text>
                <TouchableOpacity
                  disabled={sending}
                  onPress={pickImageAttachment}
                  style={styles.addMoreBtn}
                >
                  <MaterialIcons name="add-photo-alternate" size={16} color={colores.primarioClaro} />
                  <Text style={[styles.addMoreText, { color: colores.primarioClaro }]}>{t('chatInterno.attachments.addMore')}</Text>
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
                  backgroundColor: esOscuro ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  borderRadius: 24,
                  padding: 16,
                  marginHorizontal: 16,
                  marginBottom: alturaTeclado > 0 ? alturaTeclado + 6 : (Platform.OS === 'ios' ? 88 : 78),
                  ...SOMBRAS.flotante,
                },
              ]}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <MaterialIcons name="security" size={22} color="#EF4444" />
              </View>

              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: colores.texto }}>
                  {t('chatInterno.blocked.title')}
                </Text>
                <Text style={{ fontSize: 12, color: colores.textoSuave, marginTop: 2 }} numberOfLines={1}>
                  {t('chatInterno.blocked.message')}
                </Text>
              </View>

              <BotonAnimado
                onPress={() => toggleBlockConv(selectedConversation.id)}
                scaleTo={0.96}
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: 16,
                  height: 40,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MaterialIcons name="lock-open" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{t('chatInterno.blocked.unblock')}</Text>
              </BotonAnimado>
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
              placeholder={t('chatInterno.input.placeholder')}
              placeholderTextColor={colores.textoSuave}
              style={[styles.textInput, { color: colores.texto }]}
              multiline
            />

            <TouchableOpacity
              disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
              onPress={sendMessage}
              style={[
                styles.sendBtn,
                { backgroundColor: esOscuro ? '#FFFFFF' : '#000000' },
                (sending || (!input.trim() && pendingAttachments.length === 0)) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={esOscuro ? '#000000' : '#FFFFFF'} />
              ) : (
                <MaterialIcons name="send" size={18} color={esOscuro ? '#000000' : '#FFFFFF'} />
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

        {/* Modales de opciones, renombrar y añadir integrantes dentro del chat activo */}
        {renderActionMenuModal()}
        {renderRenameModal()}
        {renderAddMembersModal()}
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
      <NavbarEnterprise titulo={t('chatInterno.navbar.title')} />

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
            placeholder={t('chatInterno.search.placeholder')}
            placeholderTextColor={colores.textoSuave}
            style={[styles.searchInput, { color: colores.texto }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colores.textoSuave} />
            </TouchableOpacity>
          ) : null}
        </View>

        <BotonAnimado
          onPress={() => {
            setSelectedUserIds([]);
            setGroupName('');
            setShowNewChatModal(true);
          }}
          scaleTo={0.92}
          style={[
            styles.newChatBtn,
            { backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A', borderColor: esOscuro ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          <MaterialIcons name="add-comment" size={20} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
        </BotonAnimado>
      </View>

      {/* Chips de filtrado rápido estilo cápsula con espaciado amplio */}
      <View style={styles.chipsFiltroRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsFiltroScroll}>
          {[
            { id: 'todos' as const, label: t('chatInterno.filters.all', { count: userConversations.length }), icono: 'forum' as const },
            { id: 'no_leidos' as const, label: t('chatInterno.filters.unread', { count: totalNoLeidos }), icono: 'mark-chat-unread' as const, badge: totalNoLeidos > 0 },
            { id: 'directos' as const, label: t('chatInterno.filters.direct'), icono: 'person' as const },
            { id: 'grupos' as const, label: t('chatInterno.filters.groups'), icono: 'group' as const },
          ].map((chip) => {
            const activo = filtroTipo === chip.id;
            return (
              <BotonAnimado
                key={chip.id}
                onPress={() => setFiltroTipo(chip.id)}
                scaleTo={0.94}
                style={[
                  styles.chipFiltroBtn,
                  {
                    backgroundColor: activo
                      ? (esOscuro ? '#FFFFFF' : '#0F172A')
                      : (esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)'),
                    borderColor: activo
                      ? (esOscuro ? '#FFFFFF' : '#0F172A')
                      : (chip.badge && !activo ? 'rgba(59,130,246,0.45)' : colores.borde),
                  },
                ]}
              >
                <MaterialIcons
                  name={chip.icono}
                  size={15}
                  color={
                    activo
                      ? (esOscuro ? '#0B0C1E' : '#FFFFFF')
                      : chip.badge
                      ? '#3B82F6'
                      : colores.textoSuave
                  }
                />
                <Text
                  style={[
                    styles.chipFiltroTexto,
                    {
                      color: activo
                        ? (esOscuro ? '#0B0C1E' : '#FFFFFF')
                        : chip.badge
                        ? (esOscuro ? '#93C5FD' : '#2563EB')
                        : colores.textoSuave,
                    },
                    activo && { fontWeight: '900' },
                  ]}
                >
                  {chip.label}
                </Text>
                {chip.badge && !activo && (
                  <View style={styles.chipPuntoAzul} />
                )}
              </BotonAnimado>
            );
          })}
        </ScrollView>
      </View>

      {/* Modal para iniciar nuevo chat / grupo */}
      {showNewChatModal ? (
        <Modal
          visible={showNewChatModal}
          transparent
          animationType="none"
          onRequestClose={() => cerrarNuevoChatModalConAnimacion()}
        >
          <Animated.View style={[styles.actionMenuOverlay, { opacity: modalFadeAnim }]}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => cerrarNuevoChatModalConAnimacion()}
              style={StyleSheet.absoluteFill}
            />

            <Animated.View
              style={[
                styles.actionMenuCard,
                {
                  backgroundColor: esOscuro ? 'rgba(10, 10, 24, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                  transform: [{ scale: modalScaleAnim }],
                  maxWidth: 440,
                  borderRadius: 32,
                  padding: 22,
                  maxHeight: '82%',
                },
              ]}
            >
              <View style={styles.actionMenuHeader}>
                <Text style={[styles.actionMenuTitle, { color: esOscuro ? '#FFFFFF' : '#000000', fontSize: 18, fontWeight: '900' }]}>
                  {t('chatInterno.newChat.title')}
                </Text>
                <TouchableOpacity onPress={() => cerrarNuevoChatModalConAnimacion()}>
                  <MaterialIcons name="close" size={22} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              {/* Búsqueda dentro del modal */}
              <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: colores.borde, marginVertical: 6, borderRadius: 20 }]}>
                <MaterialIcons name="search" size={18} color={colores.textoSuave} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('chatInterno.newChat.searchPlaceholder')}
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
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => toggleSelectedUser(user.id)}
                      style={[styles.userChip, { backgroundColor: esOscuro ? '#FFFFFF' : '#000000' }]}
                    >
                      <Text style={[styles.chipText, { color: esOscuro ? '#000000' : '#FFFFFF', fontWeight: '800' }]} numberOfLines={1}>
                        {user.nombre}
                      </Text>
                      <MaterialIcons name="close" size={14} color={esOscuro ? '#000000' : '#FFFFFF'} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}

              {/* Nombre de grupo si hay 2+ seleccionados */}
              {selectedUsers.length > 1 ? (
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder={t('chatInterno.newChat.groupNamePlaceholder')}
                  placeholderTextColor={colores.textoSuave}
                  style={[styles.groupInput, { backgroundColor: cardBg, borderColor: colores.borde, color: colores.texto }]}
                />
              ) : null}

              <Text style={[styles.sectionTitle, { color: colores.textoSuave, marginTop: 4 }]}>
                {t('chatInterno.newChat.availableMembers', { count: filteredUsers.length })}
              </Text>

              <ScrollView style={styles.userListScroll} showsVerticalScrollIndicator={false}>
                {filteredUsers.length === 0 ? (
                  <Text style={[styles.noResultsText, { color: colores.textoSuave }]}>
                    {t('chatInterno.newChat.noUsers')}
                  </Text>
                ) : (
                  filteredUsers.map((user) => {
                    const selected = selectedUserIds.includes(user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        onPress={() => toggleSelectedUser(user.id)}
                        style={[
                          styles.userOption,
                          selected && styles.userOptionSelected,
                          { backgroundColor: selected ? (esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' },
                        ]}
                      >
                        <View style={[styles.userAvatar, { backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                          {user.foto_perfil ? (
                            <Image source={{ uri: user.foto_perfil }} style={styles.convAvatarImage} resizeMode="cover" />
                          ) : (
                            <Text style={[styles.avatarLetter, { color: colores.texto }]}>
                              {(user.nombre || 'U').charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, { color: colores.texto }]}>{user.nombre}</Text>
                          <Text style={[styles.userRole, { color: colores.textoSuave }]}>
                            {user.rol || 'Colaborador'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            selected && styles.checkboxSelected,
                            { borderColor: selected ? (esOscuro ? '#FFFFFF' : '#000000') : colores.borde },
                          ]}
                        >
                          {selected ? <MaterialIcons name="check" size={14} color={esOscuro ? '#000000' : '#FFFFFF'} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Botón de acción para crear chat o grupo */}
              {selectedUsers.length > 0 ? (
                <BotonAnimado
                  disabled={sending}
                  onPress={handleStartConversation}
                  scaleTo={0.96}
                  style={[
                    styles.createBtn,
                    {
                      backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
                      borderRadius: 20,
                      height: 48,
                      marginTop: 10,
                    },
                    sending && { opacity: 0.8 },
                  ]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={esOscuro ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <MaterialIcons
                      name={selectedUsers.length > 1 ? 'group-add' : 'chat'}
                      size={19}
                      color={esOscuro ? '#000000' : '#FFFFFF'}
                    />
                  )}
                  <Text style={[styles.createBtnText, { color: esOscuro ? '#000000' : '#FFFFFF', fontWeight: '900', fontSize: 14 }]}>
                    {sending
                      ? t('chatInterno.newChat.creating')
                      : selectedUsers.length > 1
                      ? t('chatInterno.newChat.createGroup')
                      : t('chatInterno.newChat.startChat')}
                  </Text>
                </BotonAnimado>
              ) : null}
            </Animated.View>
          </Animated.View>
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
            <Text style={[styles.emptyTitle, { color: colores.texto }]}>{t('chatInterno.list.emptyTitle')}</Text>
            <Text style={[styles.emptySub, { color: colores.textoSuave }]}>
              {searchQuery
                ? t('chatInterno.list.emptySearch')
                : filtroTipo === 'no_leidos'
                ? t('chatInterno.list.emptyUnread')
                : t('chatInterno.list.emptyDefault')}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.tipo === 'equipo';
            const title = getTituloConversacion(conv, perfil.id, users);
            const photoUrl = getFotoConversacion(conv, perfil.id, users);
            const isMuted = mutedConvIds.includes(conv.id);
            const isBlocked = blockedConvIds.includes(conv.id);
            const unreadCount = conteoNoLeidos[conv.id] || 0;
            const hasUnread = unreadCount > 0;
            const timeStr = formatearHoraMensaje(conv.ultimoMensajeAt);
            const preview = formatearPreviewUltimoMensaje(conv, perfil?.id || '', users);

            return (
              <BotonAnimado
                key={conv.id}
                onPress={() => setSelectedConversationId(conv.id)}
                scaleTo={0.98}
                style={[
                  styles.convItem,
                  {
                    backgroundColor: hasUnread
                      ? (esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.04)')
                      : cardBg,
                    borderColor: hasUnread
                      ? (esOscuro ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.22)')
                      : colores.borde,
                  },
                  isBlocked && { opacity: 0.65 },
                ]}
              >
                <View style={[styles.convAvatar, isGroup && styles.convAvatarGroup]}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.convAvatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.avatarLetter}>{(title || 'C').charAt(0).toUpperCase()}</Text>
                  )}
                  {hasUnread && <View style={styles.avatarOnlineDot} />}
                </View>

                <View style={styles.convCopy}>
                  <View style={styles.convTopRow}>
                    <Text
                      style={[
                        styles.convTitle,
                        { color: colores.texto },
                        hasUnread && { fontWeight: '900' },
                      ]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    {isMuted ? (
                      <MaterialIcons name="notifications-off" size={14} color={colores.textoSuave} style={{ marginLeft: 4 }} />
                    ) : null}
                    {isBlocked ? (
                      <MaterialIcons name="block" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.convPreview,
                      { color: isBlocked ? '#EF4444' : hasUnread ? colores.texto : colores.textoSuave },
                      hasUnread && { fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {isBlocked ? (
                      t('chatInterno.blocked.previewText')
                    ) : (
                      <>
                        {preview.emisor ? (
                          <Text
                            style={{
                              color: preview.emisor === 'Tú: '
                                ? (hasUnread ? (esOscuro ? '#FFFFFF' : '#0F172A') : colores.textoSuave)
                                : (esOscuro ? '#60A5FA' : '#2563EB'),
                              fontWeight: '800',
                            }}
                          >
                            {preview.emisor}
                          </Text>
                        ) : null}
                        <Text style={{ fontWeight: hasUnread ? '700' : '400' }}>
                          {preview.texto}
                        </Text>
                      </>
                    )}
                  </Text>
                </View>

                <View style={styles.convMetaCol}>
                  {timeStr ? (
                    <Text
                      style={[
                        styles.convTimeText,
                        { color: hasUnread ? (esOscuro ? '#FFFFFF' : '#0F172A') : colores.textoSuave },
                        hasUnread && { fontWeight: '900' },
                      ]}
                    >
                      {timeStr}
                    </Text>
                  ) : (
                    <View style={{ height: 16 }} />
                  )}

                  <View style={styles.convMetaBottomRow}>
                    {hasUnread ? (
                      <View style={styles.unreadBadgeWhatsApp}>
                        <Text style={styles.unreadBadgeWhatsAppText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      onPress={(e) => {
                        (e as any)?.stopPropagation?.();
                        setActionMenuConv(conv);
                      }}
                      style={styles.convMenuBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialIcons name="more-vert" size={19} color={colores.textoSuave} />
                    </TouchableOpacity>
                  </View>
                </View>
              </BotonAnimado>
            );
          })
        )}
      </ScrollView>

      {/* Modales de opciones, renombrar y añadir integrantes */}
      {renderActionMenuModal()}
      {renderRenameModal()}
      {renderAddMembersModal()}
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  newChatBtnActive: {
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
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
  chipsFiltroRow: {
    marginTop: 4,
    marginBottom: 14,
  },
  chipsFiltroScroll: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipFiltroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipFiltroTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipPuntoAzul: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3B82F6',
    marginLeft: 2,
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  convAvatarGroup: {
    backgroundColor: 'rgba(59,130,246,0.18)',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#0B0C1E',
  },
  convCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convTitle: {
    fontSize: 15.5,
    fontWeight: '800',
  },
  convPreview: {
    fontSize: 13.5,
    marginTop: 2,
    lineHeight: 18,
  },
  convMetaCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  convTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  convMetaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  unreadBadgeWhatsApp: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    lineHeight: 14,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: '#0F172A',
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
    maxWidth: 440,
    borderRadius: 32,
    borderWidth: 1,
    padding: 22,
    gap: 12,
    ...SOMBRAS.flotante,
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
