import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View} from 'react-native';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
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

export const isRemoteUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:')
  );
};

export const isGroupConv = (conv: Conversation | null | undefined): boolean => {
  if (!conv) return false;
  if (conv.tipo === 'equipo' || conv.tipo === 'grupo' || conv.tipo === 'departamento') return true;
  if (Array.isArray(conv.participanteIds) && conv.participanteIds.length > 2) return true;
  if (Array.isArray(conv.participantes) && conv.participantes.length > 2) return true;
  if (typeof conv.titulo === 'string' && conv.titulo.trim().length > 0 && conv.titulo !== 'Chat Directo') {
    return true;
  }
  if (conv.foto || conv.imagenUrl) return true;
  return false;
};

const getTituloConversacion = (
  conv: Conversation | null | undefined,
  userId: string,
  usersList: ChatUser[] = [],
  customNames?: Record<string, string>
): string => {
  if (!conv) return '';
  if (customNames && customNames[conv.id]) {
    return customNames[conv.id];
  }
  if (conv.nombresPersonalizados && userId && conv.nombresPersonalizados[userId]) {
    return conv.nombresPersonalizados[userId];
  }
  if (conv.titulo && conv.titulo.trim().length > 0 && conv.titulo !== 'Chat Directo') {
    return conv.titulo;
  }
  const isGroup = isGroupConv(conv);
  if (isGroup) {
    const otherParticipants = (conv.participantes || []).filter((p) => p.id !== userId);
    if (otherParticipants.length > 0) {
      return otherParticipants.map((p) => p.nombre || 'Colaborador').slice(0, 3).join(', ');
    }
    return 'Grupo de conversación';
  }
  const otherId = conv.participanteIds?.find((id) => id !== userId);
  if (otherId) {
    const userFromList = usersList.find((u) => u.id === otherId);
    if (userFromList && userFromList.nombre) return userFromList.nombre;
  }
  const otherParticipant = conv.participantes?.find((p) => p.id !== userId);
  if (otherParticipant && otherParticipant.nombre) return otherParticipant.nombre;
  return 'Chat Directo';
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

const getFotoConversacion = (
  conv: Conversation | null | undefined,
  userId: string,
  usersList: ChatUser[] = [],
  customPhotos?: Record<string, string>
): string | undefined => {
  if (!conv) return undefined;
  if (customPhotos && customPhotos[conv.id] && isRemoteUrl(customPhotos[conv.id])) {
    return customPhotos[conv.id];
  }
  if (conv.fotosPersonalizadas && userId && conv.fotosPersonalizadas[userId] && isRemoteUrl(conv.fotosPersonalizadas[userId])) {
    return conv.fotosPersonalizadas[userId];
  }
  const globalPhoto = conv.foto || conv.imagenUrl;
  if (globalPhoto && isRemoteUrl(globalPhoto)) {
    return globalPhoto;
  }
  const isGroup = isGroupConv(conv);
  if (isGroup) {
    return undefined;
  }
  const otherId = conv.participanteIds?.find((id) => id !== userId);
  if (otherId) {
    const userFromList = usersList.find((u) => u.id === otherId);
    const photo = userFromList?.foto_perfil || userFromList?.fotoPerfil || userFromList?.photoURL || userFromList?.avatarUrl || userFromList?.foto;
    if (photo && isRemoteUrl(photo)) return photo;
  }
  const otherParticipant = conv.participantes?.find((p) => p.id !== userId);
  if (otherParticipant) {
    const photo = otherParticipant.foto_perfil || otherParticipant.fotoPerfil || otherParticipant.photoURL || otherParticipant.avatarUrl || otherParticipant.foto;
    if (photo && isRemoteUrl(photo)) return photo;
  }
  return undefined;
};

const uploadChatAttachmentAsset = async (
  asset: ImagePicker.ImagePickerAsset,
  fallbackName: string,
  ownerId: string,
  empresaId: string
): Promise<{ url: string; publicId: string; size: number; mime: string; assetId?: string }> => {
  const mime = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const fileName = asset.fileName || fallbackName;
  const folder = `nexxus/chat/${empresaId}`;
  const publicId = `chat_${ownerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isRaw = mime.includes('pdf') || mime.includes('zip') || mime.includes('raw');
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${isRaw ? 'raw' : 'image'}/upload`;

  if (Platform.OS === 'web') {
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      try {
        Object.defineProperty(blob, 'name', { value: fileName, writable: true, configurable: true });
      } catch {
        (blob as any).name = fileName;
      }
      return await uploadManagedFile(blob, {
        kind: 'chatAttachment',
        ownerId,
        empresaId,
      });
    } catch {
      return {
        url: asset.uri,
        publicId,
        size: asset.fileSize || 100000,
        mime,
      };
    }
  }

  // Mobile Native (iOS / Android)
  try {
    const uploadResult = await FileSystem.uploadAsync(endpoint, asset.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        upload_preset: CLOUDINARY_UPLOAD_PRESET,
        folder,
      },
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      const data = JSON.parse(uploadResult.body || '{}');
      if (data.secure_url || data.url) {
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id || publicId,
          size: data.bytes || asset.fileSize || 100000,
          mime: data.format ? `${isRaw ? 'application' : 'image'}/${data.format}` : mime,
        };
      }
    } else {
      console.warn('[ChatInterno] FileSystem.uploadAsync non-2xx status:', uploadResult.status, uploadResult.body);
    }
  } catch (nativeUploadErr) {
    console.warn('[ChatInterno] FileSystem.uploadAsync warning, attempting fallback:', nativeUploadErr);
  }

  // Fallback con base64/fetch si uploadAsync no estuvo disponible
  try {
    let base64Data = asset.base64;
    if (!base64Data) {
      base64Data = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    if (base64Data) {
      const dataUrl = base64Data.startsWith('data:') ? base64Data : `data:${mime};base64,${base64Data}`;
      const formData = new FormData();
      formData.append('file', dataUrl);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && !data.error && (data.secure_url || data.url)) {
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id || publicId,
          size: data.bytes || asset.fileSize || 100000,
          mime: data.format ? `${isRaw ? 'application' : 'image'}/${data.format}` : mime,
        };
      }
    }
  } catch (fallbackErr) {
    console.warn('[ChatInterno] Fallback direct fetch warning:', fallbackErr);
  }

  // Fallback con uploadManagedFile en base64
  try {
    let base64Data = asset.base64;
    if (!base64Data) {
      base64Data = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    if (base64Data) {
      const dataUrl = base64Data.startsWith('data:') ? base64Data : `data:${mime};base64,${base64Data}`;
      const res = await uploadManagedFile(dataUrl, {
        kind: 'chatAttachment',
        ownerId,
        empresaId,
      });
      if (res?.url) {
        return {
          url: res.url,
          publicId: res.publicId || publicId,
          size: res.size || asset.fileSize || 100000,
          mime: res.mime || mime,
        };
      }
    }
  } catch (managedErr) {
    console.warn('[ChatInterno] uploadManagedFile fallback error:', managedErr);
  }

  // Si no hay red o Cloudinary no responde, devolver URI local seguro para no bloquear la app
  return {
    url: asset.uri,
    publicId,
    size: asset.fileSize || 100000,
    mime,
  };
};

const AnimatedVistoBadge = ({ leido }: { leido: boolean }) => {
  const { t } = useTranslation();
  const animScale = useRef(new Animated.Value(0.84)).current;
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
      <MaterialIcons name="done-all" size={14} color="#8B5CF6" />
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#8B5CF6' }}>{t('chatInterno.readReceipt')}</Text>
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
  if (!isGroupConv(conv)) {
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
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { perfil } = useContextoUsuario();
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => crearEstilos(pulse, esOscuro), [pulse, esOscuro]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [conteoNoLeidos, setConteoNoLeidos] = useState<Record<string, number>>({});
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'no_leidos' | 'directos' | 'grupos'>('todos');
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  // Nombres y fotos personalizados locales
  const [localCustomNames, setLocalCustomNames] = useState<Record<string, string>>({});
  const [localCustomPhotos, setLocalCustomPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!perfil?.id) return;
    AsyncStorage.getItem(`@nexxus_custom_chat_names_${perfil.id}`)
      .then((data) => {
        if (data) {
          try {
            setLocalCustomNames(JSON.parse(data));
          } catch (e) {}
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(`@nexxus_custom_chat_photos_${perfil.id}`)
      .then((data) => {
        if (data) {
          try {
            setLocalCustomPhotos(JSON.parse(data));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [perfil?.id]);

  // Modals / State for creating new chats
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');

  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;

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
      modalScaleAnim.setValue(0.95);
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
    setShowNewChatModal(false);
    setSelectedUserIds([]);
    setGroupName('');
    setSearchQuery('');
    if (cb) cb();
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
  const actionScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (actionMenuConv) {
      actionFadeAnim.setValue(0);
      actionScaleAnim.setValue(0.95);
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
        toValue: 0.95,
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
  const renameScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (showRenameModal) {
      renameFadeAnim.setValue(0);
      renameScaleAnim.setValue(0.95);
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
        toValue: 0.95,
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
  const addMembersScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (showAddMembersModal) {
      addMembersFadeAnim.setValue(0);
      addMembersScaleAnim.setValue(0.95);
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
        toValue: 0.95,
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
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  
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
    setRenameInput(getTituloConversacion(conv, perfil?.id || '', users, localCustomNames));
    setShowRenameModal(true);
    setActionMenuConv(null);
  };

  const handleSaveRename = async () => {
    if (!targetConvToRename || !renameInput.trim()) return;
    const newName = renameInput.trim();
    const targetId = targetConvToRename.id;
    const isGroup = isGroupConv(targetConvToRename);
    const currentNombres = targetConvToRename.nombresPersonalizados || {};
    const nextNombres = {
      ...currentNombres,
      ...(perfil?.id ? { [perfil.id]: newName } : {}),
    };

    cerrarRenameModalConAnimacion();

    // 1. Guardar en almacenamiento local persistente (AsyncStorage) y React state
    setLocalCustomNames((prev) => {
      const updated = { ...prev, [targetId]: newName };
      if (perfil?.id) {
        AsyncStorage.setItem(`@nexxus_custom_chat_names_${perfil.id}`, JSON.stringify(updated)).catch(() => {});
      }
      return updated;
    });

    // 2. Actualizar lista de conversaciones optimísticamente
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              titulo: isGroup ? newName : (c.titulo || newName),
              tipo: isGroup ? 'equipo' : c.tipo,
              nombresPersonalizados: nextNombres,
            }
          : c
      )
    );

    setSending(true);
    try {
      // 3. Guardar en backend (Supabase)
      await useCases.chat.internal.updateConversation(targetId, {
        titulo: newName,
        tipo: isGroup ? 'equipo' : targetConvToRename.tipo,
        nombresPersonalizados: nextNombres,
      });
    } catch (err) {
      console.error('[ChatInterno] Error renaming conversation:', err);
    } finally {
      setSending(false);
      setTargetConvToRename(null);
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
      const newParticipantIds = Array.from(new Set(newParticipants.map((p) => p.id)));
      await useCases.chat.internal.updateConversation(targetConvToAddMembers.id, {
        participantes: newParticipants,
        participanteIds: newParticipantIds,
        tipo: 'equipo',
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
    const groupTitle = getTituloConversacion(conv, perfil.id, users, localCustomNames);
    const confirmMessage = t('chatInterno.alerts.leaveGroupMessage', { name: groupTitle });

    const executeLeave = async () => {
      setSending(true);
      try {
        const remainingParticipants = (conv.participantes || []).filter((p) => p.id !== perfil.id);
        const remainingParticipantIds = (conv.participanteIds || []).filter((id) => id !== perfil.id);
        if (remainingParticipants.length === 0) {
          await useCases.chat.internal.deleteConversation(conv.id, empresaId);
        } else {
          await useCases.chat.internal.updateConversation(conv.id, {
            participantes: remainingParticipants,
            participanteIds: remainingParticipantIds,
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
    if (!conv || !perfil || !empresaId) return;
    const targetConvId = conv.id;
    setActionMenuConv(null);

    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('chatInterno.alerts.permissionsTitle', 'Permiso requerido'),
            t('chatInterno.alerts.permissionsMessage', 'Se necesita acceso a la galería para cambiar la foto.')
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSending(true);
        setError('');
        const asset = result.assets[0];
        const fileName = asset.fileName || `Group_${targetConvId}_${Date.now()}.jpg`;

        let uploadedUrl = '';
        try {
          const uploaded = await uploadChatAttachmentAsset(asset, fileName, perfil.id, empresaId);
          if (uploaded?.url && isRemoteUrl(uploaded.url)) {
            uploadedUrl = uploaded.url;
          }
        } catch (uploadErr) {
          console.warn('[ChatInterno] Upload error:', uploadErr);
        }

        if (!uploadedUrl) {
          setError('No se pudo subir la foto del grupo a la nube.');
          if (Platform.OS !== 'web') {
            Alert.alert(
              'Error de subida',
              'No se pudo subir la foto del grupo a la nube. Verifica tu conexión a internet e inténtalo nuevamente.'
            );
          }
          return;
        }

        // 1. Guardar en almacenamiento local persistente (AsyncStorage) y React state
        setLocalCustomPhotos((prev) => {
          const updated = { ...prev, [targetConvId]: uploadedUrl };
          if (perfil?.id) {
            AsyncStorage.setItem(`@nexxus_custom_chat_photos_${perfil.id}`, JSON.stringify(updated)).catch(() => {});
          }
          return updated;
        });

        // 2. Actualizar estado de conversaciones optimísticamente
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? { ...c, foto: uploadedUrl, imagenUrl: uploadedUrl, tipo: 'equipo' }
              : c
          )
        );

        // 3. Guardar en backend (Supabase) para todos los usuarios
        try {
          await useCases.chat.internal.updateConversation(targetConvId, {
            foto: uploadedUrl,
            imagenUrl: uploadedUrl,
            tipo: 'equipo',
          });
        } catch (dbErr) {
          console.error('[ChatInterno] Error persisting group photo to Supabase:', dbErr);
          setError('No se pudo sincronizar la foto del grupo en el servidor.');
        }
      }
    } catch (err: any) {
      console.error('[ChatInterno] Error updating group photo:', err);
      setError(err?.message || 'No se pudo actualizar la foto del grupo.');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', err?.message || 'No se pudo actualizar la foto del grupo.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConv = async (conv: Conversation) => {
    if (!perfil || !empresaId) return;
    const convTitle = getTituloConversacion(conv, perfil.id, users, localCustomNames);
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

  const directCount = useMemo(
    () => userConversations.filter((c) => !isGroupConv(c)).length,
    [userConversations]
  );

  const groupCount = useMemo(
    () => userConversations.filter((c) => isGroupConv(c)).length,
    [userConversations]
  );

  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return userConversations.filter((c) => {
      const unreadCount = conteoNoLeidos[c.id] || 0;
      const isGroup = isGroupConv(c);
      if (filtroTipo === 'no_leidos' && unreadCount === 0) return false;
      if (filtroTipo === 'directos' && isGroup) return false;
      if (filtroTipo === 'grupos' && !isGroup) return false;

      if (!term) return true;
      const title = getTituloConversacion(c, perfil?.id || '', users, localCustomNames).toLowerCase();
      const lastMsg = (c.ultimoMensaje || '').toLowerCase();
      return title.includes(term) || lastMsg.includes(term);
    });
  }, [userConversations, searchQuery, perfil?.id, users, filtroTipo, conteoNoLeidos, localCustomNames]);

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
      if (selectedUsers.length === 1 && !groupName.trim()) {
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
  const glassBg = pulse.surfaceElevated;
  const cardBg = pulse.surface;

  // Modal Flotante Cristalino para Opciones de Conversación (Silenciar, Bloquear, Borrar, etc)
  const renderActionMenuModal = () => {
    if (!actionMenuConv) return null;

    return (
      <Modal
        visible={!!actionMenuConv}
        transparent
        animationType="none"
        statusBarTranslucent
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
                  backgroundColor: pulse.surfaceElevated,
                  borderColor: pulse.border,
                  opacity: actionFadeAnim,
                  transform: [{ scale: actionScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: pulse.text }]} numberOfLines={1}>
                    {getTituloConversacion(actionMenuConv, perfil?.id || '', users, localCustomNames)}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarActionMenuModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={pulse.textTertiary} />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Cambiar Nombre */}
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => cerrarActionMenuModalConAnimacion(() => openRenameModal(actionMenuConv!))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionMenuIconWrap, { backgroundColor: pulse.pill }]}>
                    <MaterialIcons name="edit" size={20} color={pulse.icon} />
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: pulse.text }]}>
                      {t('chatInterno.actionMenu.renameTitle')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
                      {isGroupConv(actionMenuConv) ? t('chatInterno.actionMenu.renameSubGroup') : t('chatInterno.actionMenu.renameSubContact')}
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
                      { backgroundColor: mutedConvIds.includes(actionMenuConv.id) ? 'rgba(245,158,11,0.15)' : pulse.pill },
                    ]}
                  >
                    <MaterialIcons
                      name={mutedConvIds.includes(actionMenuConv.id) ? 'notifications-active' : 'notifications-off'}
                      size={20}
                      color={mutedConvIds.includes(actionMenuConv.id) ? '#F59E0B' : pulse.icon}
                    />
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: pulse.text }]}>
                      {mutedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.muteOff') : t('chatInterno.actionMenu.muteOn')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
                      {mutedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.muteOffSub') : t('chatInterno.actionMenu.muteOnSub')}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 3: Conditional (Grupo vs Directo) */}
                {isGroupConv(actionMenuConv) ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => handleChangeGroupPhoto(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: pulse.pill }]}>
                        <MaterialIcons name="add-a-photo" size={20} color={pulse.icon} />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: pulse.text }]}>
                          {t('chatInterno.actionMenu.changePhoto')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
                          {t('chatInterno.actionMenu.changePhotoSub')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => openAddMembersModal(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: pulse.pill }]}>
                        <MaterialIcons name="person-add" size={20} color={pulse.icon} />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: pulse.text }]}>
                          {t('chatInterno.actionMenu.addPeople')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
                          {t('chatInterno.actionMenu.addPeopleSub')}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => cerrarActionMenuModalConAnimacion(() => handleLeaveGroup(actionMenuConv!))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionMenuIconWrap, { backgroundColor: pulse.errorSurface }]}>
                        <MaterialIcons name="logout" size={20} color={pulse.errorText} />
                      </View>
                      <View style={styles.actionMenuTextWrap}>
                        <Text style={[styles.actionMenuItemText, { color: pulse.errorText }]}>
                          {t('chatInterno.actionMenu.leaveGroup')}
                        </Text>
                        <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
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
                        { backgroundColor: blockedConvIds.includes(actionMenuConv.id) ? pulse.errorSurface : pulse.pill },
                      ]}
                    >
                      <MaterialIcons
                        name={blockedConvIds.includes(actionMenuConv.id) ? 'lock-open' : 'block'}
                        size={20}
                        color={blockedConvIds.includes(actionMenuConv.id) ? pulse.errorText : pulse.icon}
                      />
                    </View>
                    <View style={styles.actionMenuTextWrap}>
                      <Text style={[styles.actionMenuItemText, { color: pulse.text }]}>
                        {blockedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.blockOff') : t('chatInterno.actionMenu.blockOn')}
                      </Text>
                      <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
                        {blockedConvIds.includes(actionMenuConv.id) ? t('chatInterno.actionMenu.blockOffSub') : t('chatInterno.actionMenu.blockOnSub')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={[styles.actionMenuDivider, { backgroundColor: pulse.border }]} />

                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => cerrarActionMenuModalConAnimacion(() => handleDeleteConv(actionMenuConv!))}
                  activeOpacity={0.7}
                  disabled={deletingConv}
                >
                  <View style={[styles.actionMenuIconWrap, { backgroundColor: pulse.errorSurface }]}>
                    {deletingConv ? (
                      <ActivityIndicator size="small" color={pulse.errorText} />
                    ) : (
                      <MaterialIcons name="delete-outline" size={20} color={pulse.errorText} />
                    )}
                  </View>
                  <View style={styles.actionMenuTextWrap}>
                    <Text style={[styles.actionMenuItemText, { color: pulse.errorText }]}>
                      {t('chatInterno.actionMenu.deleteConv')}
                    </Text>
                    <Text style={[styles.actionMenuItemSub, { color: pulse.textSecondary }]}>
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
        statusBarTranslucent
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
                  backgroundColor: pulse.surfaceElevated,
                  borderColor: pulse.border,
                  opacity: renameFadeAnim,
                  transform: [{ scale: renameScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: pulse.text, fontWeight: '900' }]}>
                    {isGroupConv(targetConvToRename) ? t('chatInterno.rename.titleGroup') : t('chatInterno.rename.titleContact')}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarRenameModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={pulse.textTertiary} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, color: pulse.textSecondary, marginTop: 2, marginBottom: 12 }}>
                  {t('chatInterno.rename.description')}
                </Text>

                <TextInput
                  value={renameInput}
                  onChangeText={setRenameInput}
                  placeholder={t('chatInterno.rename.placeholder')}
                  placeholderTextColor={pulse.textTertiary}
                  style={[
                    styles.groupInput,
                    {
                      color: pulse.text,
                      borderColor: pulse.border,
                      backgroundColor: pulse.pill,
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
                      { borderColor: pulse.border, borderRadius: 16, height: 42, paddingHorizontal: 18 },
                    ]}
                  >
                    <Text style={{ color: pulse.text, fontSize: 13, fontWeight: '800' }}>{t('chatInterno.common.cancel')}</Text>
                  </BotonAnimado>
                  <BotonAnimado
                    disabled={sending || !renameInput.trim()}
                    onPress={() => cerrarRenameModalConAnimacion(() => handleSaveRename())}
                    scaleTo={0.96}
                    style={[
                      styles.createBtn,
                      {
                        backgroundColor: pulse.inverse,
                        borderRadius: 16,
                        height: 42,
                        paddingHorizontal: 20,
                      },
                      (sending || !renameInput.trim()) && { opacity: 0.5 },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={pulse.textInverse} />
                    ) : (
                      <Text style={{ color: pulse.textInverse, fontSize: 13, fontWeight: '900' }}>
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
        statusBarTranslucent
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
                  backgroundColor: pulse.surfaceElevated,
                  borderColor: pulse.border,
                  maxHeight: '80%',
                  opacity: addMembersFadeAnim,
                  transform: [{ scale: addMembersScaleAnim }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => (e as any)?.stopPropagation?.()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={[styles.actionMenuTitle, { color: pulse.text, fontWeight: '900' }]}>
                    {t('chatInterno.addMembers.title')}
                  </Text>
                  <TouchableOpacity onPress={() => cerrarAddMembersModalConAnimacion()}>
                    <MaterialIcons name="close" size={20} color={pulse.textTertiary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 280, marginVertical: 12 }}>
                  {availableUsers.length === 0 ? (
                    <Text style={[styles.noResultsText, { color: pulse.textTertiary, textAlign: 'center', marginVertical: 16 }]}>
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
                          <View style={[styles.userAvatar, { backgroundColor: pulse.iconSurface }]}>
                            <Text style={[styles.avatarLetter, { color: pulse.text }]}>{(u.nombre || 'U').charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: pulse.text, fontWeight: '800' }]} numberOfLines={1}>
                              {u.nombre}
                            </Text>
                            <Text style={[styles.userRole, { color: pulse.textSecondary }]} numberOfLines={1}>
                              {u.correo || u.rol || 'Colaborador'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.checkbox,
                              { borderColor: pulse.borderStrong },
                              selected && {
                                backgroundColor: pulse.inverse,
                                borderColor: pulse.inverse,
                              },
                            ]}
                          >
                            {selected ? <MaterialIcons name="check" size={14} color={pulse.textInverse} /> : null}
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
                      { borderColor: pulse.border, borderRadius: 16, height: 42, paddingHorizontal: 18 },
                    ]}
                  >
                    <Text style={{ color: pulse.text, fontSize: 13, fontWeight: '800' }}>{t('chatInterno.common.cancel')}</Text>
                  </BotonAnimado>
                  <BotonAnimado
                    disabled={sending || newMembersSelectedIds.length === 0}
                    onPress={() => cerrarAddMembersModalConAnimacion(() => handleSaveAddMembers())}
                    scaleTo={0.96}
                    style={[
                      styles.createBtn,
                      {
                        backgroundColor: pulse.inverse,
                        borderRadius: 16,
                        height: 42,
                        paddingHorizontal: 20,
                      },
                      (sending || newMembersSelectedIds.length === 0) && { opacity: 0.5 },
                    ]}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color={pulse.textInverse} />
                    ) : (
                      <Text style={{ color: pulse.textInverse, fontSize: 13, fontWeight: '900' }}>
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
      <SafeAreaView style={[styles.contenedor, { backgroundColor: pulse.background }]}>
        <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LinearGradient colors={pulse.ambient} locations={[0, 0.28, 0.72]} style={styles.fondoAbsoluto} />
        <NavbarEnterprise titulo={t('chatInterno.navbar.unavailableTitle')} />
        <View style={styles.centerState}>
          <MaterialIcons name="business" size={44} color={pulse.textTertiary} />
          <Text style={[styles.stateTitle, { color: pulse.text }]}>{t('chatInterno.unavailable.title')}</Text>
          <Text style={[styles.stateText, { color: pulse.textSecondary }]}>
            {t('chatInterno.unavailable.message')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== VISTA 2: CONVERSACIÓN ACTIVA ====================
  if (selectedConversation) {
    const isGroup = isGroupConv(selectedConversation);
    const activeTitle = getTituloConversacion(selectedConversation, perfil.id, users, localCustomNames);
    const otherId = !isGroup ? selectedConversation.participanteIds?.find((id) => id !== perfil.id) : null;
    const userFromList = otherId ? (users.find((u) => u.id === otherId) as any) : null;
    const otherParticipant = selectedConversation.participantes?.find((p) => p.id !== perfil.id) as any;
    const directPhoto = userFromList?.foto_perfil || userFromList?.fotoPerfil || userFromList?.foto || userFromList?.avatarUrl || otherParticipant?.foto_perfil || otherParticipant?.fotoPerfil || otherParticipant?.foto || otherParticipant?.avatarUrl;
    const rawActivePhoto = getFotoConversacion(selectedConversation, perfil.id, users, localCustomPhotos) || (!isGroup ? directPhoto : undefined);
    const activePhoto = isRemoteUrl(rawActivePhoto) ? rawActivePhoto : undefined;

    return (
      <SafeAreaView style={[styles.contenedor, { backgroundColor: pulse.background, paddingBottom: 0 }]}>
        <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <LinearGradient colors={pulse.ambient} locations={[0, 0.28, 0.72]} style={styles.fondoAbsoluto} />

        <Animated.View style={{ flex: 1, opacity: chatFadeAnim, transform: [{ translateY: chatSlideAnim }] }}>
          <View style={styles.conversationHeader}>
            <BotonAnimado onPress={handleCloseChat} scaleTo={0.96} style={styles.headerRoundButton}>
              <MaterialIcons name="arrow-back" size={21} color={pulse.icon} />
            </BotonAnimado>
            <TouchableOpacity
              activeOpacity={isGroup ? 0.75 : 1}
              onPress={isGroup ? () => handleChangeGroupPhoto(selectedConversation) : undefined}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 12, marginLeft: 14, marginRight: 8 }}
            >
              {activePhoto ? (
                <Image source={{ uri: activePhoto }} style={styles.activeAvatarImage} />
              ) : isGroup ? (
                <View style={[styles.activeAvatarFallback, { backgroundColor: pulse.iconSurface }]}>
                  <MaterialIcons name="groups" size={24} color={pulse.textSecondary} />
                </View>
              ) : (
                <View style={[styles.activeAvatarFallback, { backgroundColor: pulse.iconSurface }]}>
                  <Text style={[styles.activeAvatarInitial, { color: pulse.text }]}>{(activeTitle || 'C').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.conversationTitleWrap}>
                <Text style={[styles.conversationTitle, { color: pulse.text }]} numberOfLines={1}>{activeTitle}</Text>
                <Text style={[styles.conversationSubtitle, { color: pulse.textSecondary }]} numberOfLines={1}>
                  {isGroup ? t('chatInterno.conversation.groupMembers', { count: selectedConversation.participantes?.length || selectedConversation.participanteIds?.length || 2 }) : t('chatInterno.conversation.directChat')}
                </Text>
              </View>
            </TouchableOpacity>
            <BotonAnimado onPress={() => setActionMenuConv(selectedConversation)} scaleTo={0.96} style={styles.headerRoundButton}>
              <MaterialIcons name="more-horiz" size={22} color={pulse.icon} />
            </BotonAnimado>
          </View>

        {error ? (
          <TouchableOpacity onPress={() => setError('')} style={styles.errorCard} activeOpacity={0.8}>
            <MaterialIcons name="error-outline" size={18} color={pulse.errorText} />
            <Text style={styles.errorText}>{error}</Text>
            <MaterialIcons name="close" size={16} color={pulse.errorText} />
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
                <MaterialIcons name="chat-bubble-outline" size={40} color={pulse.textTertiary} />
                <Text style={[styles.emptyTitle, { color: pulse.text }]}>{t('chatInterno.conversation.emptyTitle')}</Text>
                <Text style={[styles.emptySub, { color: pulse.textSecondary }]}>
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
                        <View style={[styles.senderAvatarFallback, { backgroundColor: pulse.iconSurface }]}>
                          <Text style={[styles.senderAvatarInitial, { color: pulse.text }]}>{senderInitial}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.messageBubble,
                      own
                        ? [styles.bubbleOwn, { backgroundColor: pulse.inverse, borderColor: pulse.inverse }]
                        : [styles.bubbleOther, { backgroundColor: pulse.surfaceElevated, borderColor: pulse.border }],
                    ]}
                  >
                    {!own ? (
                      <Text style={[styles.senderName, { color: colores.primarioClaro || pulse.textSecondary }]}>{senderName}</Text>
                    ) : null}
                    
                    {message.texto ? (
                      <Text style={own ? [styles.textOwn, { color: pulse.textInverse }] : [styles.textOther, { color: pulse.text }]}>
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
                          style={[
                            styles.attachmentCard,
                            {
                              backgroundColor: own ? (esOscuro ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)') : pulse.pill,
                              borderColor: own ? (esOscuro ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.2)') : pulse.border,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="picture-as-pdf" size={24} color={own ? pulse.textInverse : '#EF4444'} />
                          <View style={styles.attachmentCopy}>
                            <Text style={[styles.attachmentName, { color: own ? pulse.textInverse : pulse.text }]} numberOfLines={1}>
                              {attachment.nombre}
                            </Text>
                            <Text style={[styles.attachmentMeta, { color: own ? (esOscuro ? 'rgba(37,35,41,0.6)' : 'rgba(255,255,255,0.7)') : pulse.textTertiary }]}>
                              {formatBytes(attachment.size)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    <Text style={own ? [styles.timeOwn, { color: esOscuro ? 'rgba(37,35,41,0.68)' : 'rgba(255,255,255,0.68)' }] : [styles.timeOther, { color: pulse.textTertiary }]}>
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
            <View style={[styles.pendingTray, { backgroundColor: pulse.surfaceElevated, borderColor: pulse.border }]}>
              <View style={styles.pendingTrayHeader}>
                <Text style={[styles.pendingTrayTitle, { color: pulse.text }]}>
                  {t('chatInterno.attachments.title', { count: pendingAttachments.length })}
                </Text>
                <TouchableOpacity
                  disabled={sending}
                  onPress={pickImageAttachment}
                  style={[styles.addMoreBtn, { backgroundColor: pulse.pill }]}
                >
                  <MaterialIcons name="add-photo-alternate" size={16} color={colores.primarioClaro || pulse.text} />
                  <Text style={[styles.addMoreText, { color: colores.primarioClaro || pulse.text }]}>{t('chatInterno.attachments.addMore')}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
                {pendingAttachments.map((att, idx) => (
                  <View key={`${att.url}-${idx}`} style={[styles.previewCard, { backgroundColor: pulse.pill, borderColor: pulse.border }]}>
                    {att.tipo === 'imagen' ? (
                      <Image source={{ uri: att.url }} style={styles.previewImage} resizeMode="cover" />
                    ) : (
                      <>
                        <View style={styles.previewDocIcon}>
                          <MaterialIcons name="picture-as-pdf" size={28} color="#EF4444" />
                        </View>
                        <View style={[styles.previewMeta, { backgroundColor: esOscuro ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)' }]}>
                          <Text style={[styles.previewName, { color: pulse.text }]} numberOfLines={1}>
                            {att.nombre}
                          </Text>
                          <Text style={[styles.previewSize, { color: pulse.textTertiary }]}>
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
                  backgroundColor: pulse.errorSurface,
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  borderRadius: 24,
                  padding: 16,
                  marginHorizontal: 16,
                  marginBottom: alturaTeclado > 0 ? alturaTeclado + 6 : 88,
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
                <Text style={{ fontSize: 14, fontWeight: '900', color: pulse.text }}>
                  {t('chatInterno.blocked.title')}
                </Text>
                <Text style={{ fontSize: 12, color: pulse.textSecondary, marginTop: 2 }} numberOfLines={1}>
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
                  backgroundColor: pulse.surfaceElevated,
                  borderColor: pulse.border,
                  marginBottom: alturaTeclado > 0 ? alturaTeclado + 6 : 88,
                },
              ]}
            >
            <View style={styles.toolsWrap}>
              <BotonAnimado disabled={sending} onPress={() => setShowAttachmentSheet(true)} scaleTo={0.94} style={[styles.toolBtn, { backgroundColor: pulse.pill }]}>
                <MaterialIcons name="add" size={22} color={pulse.icon} />
              </BotonAnimado>
            </View>

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('chatInterno.input.placeholder')}
              placeholderTextColor={pulse.textTertiary}
              style={[styles.textInput, { color: pulse.text }]}
              multiline
            />

            <TouchableOpacity
              disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
              onPress={sendMessage}
              style={[
                styles.sendBtn,
                { backgroundColor: pulse.inverse },
                (sending || (!input.trim() && pendingAttachments.length === 0)) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={pulse.textInverse} />
              ) : (
                <MaterialIcons name="send" size={18} color={pulse.textInverse} />
              )}
            </TouchableOpacity>
          </View>
          )}
          </KeyboardAvoidingView>
        </Animated.View>

        <Modal
          visible={showAttachmentSheet}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowAttachmentSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => setShowAttachmentSheet(false)} style={styles.sheetOverlay}>
            <TouchableOpacity activeOpacity={1} onPress={(event) => event.stopPropagation()} style={[styles.attachmentSheet, { backgroundColor: pulse.surfaceElevated }]}>
              <View style={[styles.sheetHandle, { backgroundColor: pulse.borderStrong }]} />
              <Text style={[styles.sheetTitle, { color: pulse.text }]}>Adjuntar</Text>
              <View style={styles.attachmentActions}>
                <BotonAnimado
                  onPress={() => {
                    setShowAttachmentSheet(false);
                    void pickImageAttachment();
                  }}
                  scaleTo={0.95}
                  style={styles.attachmentAction}
                >
                  <View style={[styles.attachmentActionIcon, { backgroundColor: pulse.pill }]}><MaterialIcons name="image" size={22} color={pulse.icon} /></View>
                  <Text style={[styles.attachmentActionLabel, { color: pulse.text }]}>Fotos</Text>
                </BotonAnimado>
                <BotonAnimado
                  onPress={() => {
                    setShowAttachmentSheet(false);
                    void pickDocumentAttachment();
                  }}
                  scaleTo={0.95}
                  style={styles.attachmentAction}
                >
                  <View style={[styles.attachmentActionIcon, { backgroundColor: pulse.pill }]}><MaterialIcons name="attach-file" size={22} color={pulse.icon} /></View>
                  <Text style={[styles.attachmentActionLabel, { color: pulse.text }]}>Archivo</Text>
                </BotonAnimado>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Modal para ver fotos en grande / pantalla completa (App y Web) */}
        {previewImageUrl ? (
          <Modal
            visible={!!previewImageUrl}
            transparent
            animationType="fade"
            statusBarTranslucent
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

  // ==================== VISTA 1: LISTA DE CHATS ====================
  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: pulse.background }]}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient colors={pulse.ambient} locations={[0, 0.28, 0.72]} style={styles.fondoAbsoluto} />

      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.profile}
            scaleTo={0.97}
            onPress={() => navigation.navigate("PerfilLaboral")}
            accessibilityLabel="Abrir mi perfil"
          >
            {perfil?.foto_perfil ? (
              <Image source={{ uri: perfil.foto_perfil }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <Text style={[styles.avatarInitial, { color: pulse.text }]}>
                {((perfil?.nombre || 'U').trim().charAt(0) || 'U').toUpperCase()}
              </Text>
            )}
          </BotonAnimado>
          <Text style={[styles.topBarLabel, { color: pulse.text }]}>{t('chatInterno.navbar.title', 'Chat')}</Text>
          <View style={styles.headerActions}>
            <BotonAnimado
              onPress={() => {
                setSelectedUserIds([]);
                setGroupName('');
                setShowNewChatModal(true);
              }}
              scaleTo={0.96}
              style={[styles.addButton, { backgroundColor: pulse.inverse }]}
              accessibilityLabel="Nuevo chat"
            >
              <Feather name="plus" size={Platform.OS === 'ios' ? 22 : 19} color={pulse.textInverse} />
            </BotonAnimado>
            <BotonAnimado
              style={[styles.bellButton, { backgroundColor: pulse.surface, borderColor: pulse.border }]}
              scaleTo={0.96}
              onPress={() => navigation.navigate("Notificaciones")}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
              {totalNoLeidos > 0 && (
                <View style={[styles.notificationDot, { borderColor: pulse.surface }]} />
              )}
            </BotonAnimado>
          </View>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: pulse.text }]}>
          {t('chatInterno.navbar.unavailableTitle', 'Mensajes')}
        </Text>
      </View>

      {error ? (
        <TouchableOpacity onPress={() => setError('')} style={styles.errorCard} activeOpacity={0.8}>
          <MaterialIcons name="error-outline" size={18} color={pulse.errorText} />
          <Text style={styles.errorText}>{error}</Text>
          <MaterialIcons name="close" size={16} color={pulse.errorText} />
        </TouchableOpacity>
      ) : null}

      {/* Búsqueda contextual */}
      <View style={styles.actionHeader}>
        <View style={[styles.searchBox, { backgroundColor: pulse.surface, borderColor: pulse.border }]}>
          <MaterialIcons name="search" size={20} color={pulse.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('chatInterno.search.placeholder')}
            placeholderTextColor={pulse.textTertiary}
            style={[styles.searchInput, { color: pulse.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={pulse.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filtros con la misma cápsula de Mis tareas */}
      <View style={styles.chipsFiltroRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsFiltroScroll}>
          {[
            { id: 'todos' as const, label: 'Todos', count: userConversations.length },
            { id: 'no_leidos' as const, label: 'No leídos', count: totalNoLeidos },
            { id: 'directos' as const, label: 'Directos', count: directCount },
            { id: 'grupos' as const, label: 'Equipos', count: groupCount },
          ].map((chip) => {
            const activo = filtroTipo === chip.id;
            return (
              <BotonAnimado
                key={chip.id}
                onPress={() => setFiltroTipo(chip.id)}
                scaleTo={0.97}
                style={[
                  styles.chipFiltroBtn,
                  {
                    backgroundColor: activo ? pulse.chipActive : pulse.surface,
                    borderColor: activo ? pulse.chipActive : pulse.border,
                  },
                ]}
              >
                <View style={[styles.chipFiltroCount, { backgroundColor: activo ? pulse.chipCountActive : pulse.pill }]}>
                  <Text style={[styles.chipFiltroCountText, { color: activo ? pulse.chipTextActive : pulse.text }]}>{chip.count}</Text>
                </View>
                <Text
                  style={[
                    styles.chipFiltroTexto,
                    { color: activo ? pulse.chipTextActive : pulse.textSecondary },
                  ]}
                >
                  {chip.label}
                </Text>
              </BotonAnimado>
            );
          })}
        </ScrollView>
      </View>

      {/* Modal para iniciar nuevo chat / grupo a pantalla completa */}
      {showNewChatModal ? (
        <Modal
          visible={showNewChatModal}
          animationType="slide"
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => cerrarNuevoChatModalConAnimacion()}
        >
          <View
            style={[
              styles.newChatFullScreen,
              {
                backgroundColor: pulse.background,
                paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20) + (Platform.OS === 'ios' ? 14 : 16),
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12),
              },
            ]}
          >
            <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <View style={[styles.newChatContainer, { backgroundColor: pulse.background }]}>
                {/* Encabezado */}
                <View style={styles.newChatHeader}>
                  <Text style={[styles.newChatTitle, { color: pulse.text }]}>
                    {t('chatInterno.newChat.title', 'Nueva conversación')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => cerrarNuevoChatModalConAnimacion()}
                    style={[styles.newChatCloseBtn, { backgroundColor: pulse.pill }]}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={22} color={pulse.icon} />
                  </TouchableOpacity>
                </View>

                {/* Barra de Búsqueda Clara y Espaciosa */}
                <View style={[styles.newChatSearchBox, { backgroundColor: pulse.surface, borderColor: pulse.border }]}>
                  <MaterialIcons name="search" size={20} color={pulse.textTertiary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t('chatInterno.newChat.searchPlaceholder', 'Buscar por nombre, correo o rol...')}
                    placeholderTextColor={pulse.textTertiary}
                    style={[styles.newChatSearchInput, { color: pulse.text }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialIcons name="cancel" size={18} color={pulse.textTertiary} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Chips de usuarios seleccionados */}
                {selectedUsers.length > 0 ? (
                  <View style={styles.newChatSelectedContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newChatSelectedRow}>
                      {selectedUsers.map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => toggleSelectedUser(user.id)}
                          style={[styles.newChatUserChip, { backgroundColor: pulse.inverse }]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.newChatChipText, { color: pulse.textInverse }]} numberOfLines={1}>
                            {user.nombre}
                          </Text>
                          <MaterialIcons name="close" size={14} color={pulse.textInverse} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Nombre de grupo si hay 2+ seleccionados */}
                {selectedUsers.length > 1 ? (
                  <View style={[styles.newChatGroupInputContainer, { backgroundColor: pulse.surface, borderColor: pulse.border }]}>
                    <MaterialIcons name="group" size={20} color={pulse.textTertiary} />
                    <TextInput
                      value={groupName}
                      onChangeText={setGroupName}
                      placeholder={t('chatInterno.newChat.groupNamePlaceholder', 'Nombre del grupo (opcional)')}
                      placeholderTextColor={pulse.textTertiary}
                      style={[styles.newChatGroupInput, { color: pulse.text }]}
                    />
                  </View>
                ) : null}

                {/* Título de sección de miembros disponibles */}
                <View style={styles.newChatSectionHeader}>
                  <Text style={[styles.newChatSectionTitle, { color: pulse.textSecondary }]}>
                    {t('chatInterno.newChat.availableMembers', { count: filteredUsers.length })}
                  </Text>
                  {selectedUsers.length > 0 && (
                    <Text style={[styles.newChatSelectedCount, { color: pulse.textTertiary }]}>
                      {selectedUsers.length} {selectedUsers.length === 1 ? 'seleccionado' : 'seleccionados'}
                    </Text>
                  )}
                </View>

                {/* Lista de colaboradores en pantalla completa con scroll fluido */}
                <ScrollView
                  style={styles.newChatUserListScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: selectedUsers.length > 0 ? 88 : 24 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredUsers.length === 0 ? (
                    <View style={styles.newChatEmptyContainer}>
                      <MaterialIcons name="person-search" size={44} color={pulse.textTertiary} />
                      <Text style={[styles.newChatEmptyText, { color: pulse.textTertiary }]}>
                        {t('chatInterno.newChat.noUsers', 'No se encontraron colaboradores')}
                      </Text>
                    </View>
                  ) : (
                    filteredUsers.map((user) => {
                      const selected = selectedUserIds.includes(user.id);
                      return (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => toggleSelectedUser(user.id)}
                          style={[
                            styles.newChatUserOption,
                            {
                              backgroundColor: selected ? pulse.pill : pulse.surface,
                              borderColor: selected ? pulse.borderStrong : pulse.border,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.newChatAvatarWrap, { backgroundColor: pulse.iconSurface }]}>
                            {user.foto_perfil ? (
                              <Image source={{ uri: user.foto_perfil }} style={styles.newChatAvatarImage} resizeMode="cover" />
                            ) : (
                              <Text style={[styles.newChatAvatarLetter, { color: pulse.text }]}>
                                {(user.nombre || 'U').charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View style={styles.newChatUserInfo}>
                            <Text style={[styles.newChatUserName, { color: pulse.text }]}>{user.nombre}</Text>
                            <Text style={[styles.newChatUserRole, { color: pulse.textSecondary }]}>{user.rol || 'Colaborador'}</Text>
                          </View>
                          <View
                            style={[
                              styles.newChatCheckbox,
                              { borderColor: pulse.borderStrong },
                              selected && { backgroundColor: pulse.inverse, borderColor: pulse.inverse },
                            ]}
                          >
                            {selected ? <MaterialIcons name="check" size={14} color={pulse.textInverse} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                {/* Botón flotante inferior para crear chat o grupo */}
                {selectedUsers.length > 0 ? (
                  <View style={styles.newChatBottomFloatingBar}>
                    <BotonAnimado
                      disabled={sending}
                      onPress={handleStartConversation}
                      scaleTo={0.97}
                      style={[styles.newChatCreateBtn, { backgroundColor: pulse.inverse }, sending && { opacity: 0.75 }]}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color={pulse.textInverse} />
                      ) : (
                        <MaterialIcons
                          name={selectedUsers.length > 1 ? 'group-add' : 'chat'}
                          size={20}
                          color={pulse.textInverse}
                        />
                      )}
                      <Text style={[styles.newChatCreateBtnText, { color: pulse.textInverse }]}>
                        {sending
                          ? t('chatInterno.newChat.creating')
                          : selectedUsers.length > 1
                          ? t('chatInterno.newChat.createGroup')
                          : t('chatInterno.newChat.startChat')}
                      </Text>
                    </BotonAnimado>
                  </View>
                ) : null}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      ) : null}

      {/* Lista Principal de Conversaciones */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading && conversations.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colores.primarioClaro || pulse.text} />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="forum" size={44} color={pulse.textTertiary} />
            <Text style={[styles.emptyTitle, { color: pulse.text }]}>{t('chatInterno.list.emptyTitle')}</Text>
            <Text style={[styles.emptySub, { color: pulse.textSecondary }]}>
              {searchQuery
                ? t('chatInterno.list.emptySearch')
                : filtroTipo === 'no_leidos'
                ? t('chatInterno.list.emptyUnread')
                : t('chatInterno.list.emptyDefault')}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = isGroupConv(conv);
            const title = getTituloConversacion(conv, perfil.id, users, localCustomNames);
            const photoUrl = getFotoConversacion(conv, perfil.id, users, localCustomPhotos);
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
                    backgroundColor: hasUnread ? pulse.surfaceElevated : pulse.surface,
                    borderColor: pulse.border,
                  },
                  isBlocked && { opacity: 0.65 },
                ]}
              >
                <View style={[styles.convAvatar, isGroup && styles.convAvatarGroup]}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.convAvatarImage} resizeMode="cover" />
                  ) : isGroup ? (
                    <View style={styles.groupAvatarFallback}>
                      <MaterialIcons name="groups" size={21} color={pulse.textSecondary} />
                    </View>
                  ) : (
                    <Text style={[styles.avatarLetter, { color: pulse.text }]}>{(title || 'C').charAt(0).toUpperCase()}</Text>
                  )}
                  {isGroup && (
                    <View style={[styles.avatarGroupBadge, { backgroundColor: pulse.iconSurface, borderColor: pulse.surface }]}>
                      <MaterialIcons name="groups" size={10} color={pulse.text} />
                    </View>
                  )}
                </View>

                <View style={styles.convCopy}>
                  <View style={styles.convTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 6 }}>
                      {isGroup && (
                        <View style={[styles.groupPillTag, { backgroundColor: pulse.pill }]}>
                          <Text style={[styles.groupPillText, { color: pulse.textSecondary }]}>Grupo</Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.convTitle,
                          { color: pulse.text, flex: 1 },
                          hasUnread && { fontWeight: '900' },
                        ]}
                        numberOfLines={1}
                      >
                        {title}
                      </Text>
                    </View>
                    {isMuted ? (
                      <MaterialIcons name="notifications-off" size={14} color={pulse.textTertiary} style={{ marginLeft: 4 }} />
                    ) : null}
                    {isBlocked ? (
                      <MaterialIcons name="block" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.convPreview,
                      { color: isBlocked ? '#EF4444' : hasUnread ? pulse.text : pulse.textSecondary },
                      hasUnread && { fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {isBlocked ? (
                      t('chatInterno.blocked.previewText')
                    ) : (
                      <>
                        {preview.emisor && (isGroup || preview.emisor === 'Tú: ') ? (
                          <Text
                            style={{
                              color: hasUnread ? pulse.text : pulse.textSecondary,
                              fontWeight: '600',
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
                        { color: hasUnread ? pulse.text : pulse.textTertiary },
                        hasUnread && { fontWeight: '700' },
                      ]}
                    >
                      {timeStr}
                    </Text>
                  ) : (
                    <View style={{ height: 16 }} />
                  )}

                  <View style={styles.convMetaBottomRow}>
                    {hasUnread ? (
                      <View style={[styles.unreadBadgeWhatsApp, { backgroundColor: pulse.inverse }]}>
                        <Text style={[styles.unreadBadgeWhatsAppText, { color: pulse.textInverse }]}>
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
                      <MaterialIcons name="more-vert" size={19} color={pulse.textTertiary} />
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

function crearEstilos(pulse: ReturnType<typeof useTemaMobile>['colores']['pulso'], esOscuro: boolean) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      paddingBottom: 80,
    },
    fondoAbsoluto: {
      ...StyleSheet.absoluteFill,
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
      color: pulse.text,
    },
    stateText: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      color: pulse.textSecondary,
    },
    headerContainer: {
      marginHorizontal: 16,
      marginTop: 4,
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
      borderColor: pulse.border,
      borderRadius: 28,
    },
    backBtn: {
      width: isIOS ? 40 : 36,
      height: isIOS ? 40 : 36,
      borderRadius: isIOS ? 20 : 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    headerAvatar: {
      width: isIOS ? 42 : 38,
      height: isIOS ? 42 : 38,
      borderRadius: isIOS ? 21 : 19,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarText: {
      color: pulse.text,
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
      color: pulse.text,
    },
    headerSub: {
      fontSize: 11,
      fontWeight: '700',
      marginTop: 1,
      color: pulse.textTertiary,
    },
    topBarContainer: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profile: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    avatar: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
    },
    avatarInitial: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '700',
    },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      gap: isIOS ? 10 : 8,
    },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: pulse.border,
      shadowColor: pulse.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    notificationDot: {
      position: 'absolute',
      top: isIOS ? 11 : 9,
      right: isIOS ? 12 : 10,
      width: isIOS ? 8 : 7,
      height: isIOS ? 8 : 7,
      borderRadius: isIOS ? 4 : 3.5,
      backgroundColor: '#E56C67',
      borderWidth: 1.5,
      borderColor: pulse.surface,
    },
    titleRow: {
      marginHorizontal: 21,
      marginTop: isIOS ? 22 : 16,
    },
    title: {
      color: pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      fontWeight: '600',
      letterSpacing: isIOS ? -1.4 : -0.9,
    },
    conversationHeader: {
      minHeight: 72,
      marginHorizontal: 20,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerRoundButton: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: pulse.border,
      shadowColor: pulse.shadow,
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    conversationIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 10,
      minWidth: 0,
    },
    activeAvatarImage: {
      width: 46,
      height: 46,
      borderRadius: 23,
    },
    activeAvatarFallback: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.iconSurface,
    },
    activeAvatarInitial: {
      color: pulse.text,
      fontSize: 16,
      fontWeight: '800',
    },
    conversationTitleWrap: {
      maxWidth: '68%',
      marginLeft: 9,
    },
    conversationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: pulse.text,
    },
    conversationSubtitle: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: pulse.textSecondary,
    },
    actionHeader: {
      marginHorizontal: 21,
      marginTop: 18,
    },
    searchBox: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surface,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: pulse.text,
    },
    newChatBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    newChatBtnActive: {
      backgroundColor: pulse.inverse,
    },
    newChatCard: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surfaceElevated,
      padding: 14,
      maxHeight: 320,
      gap: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: pulse.text,
    },
    selectedRow: {
      gap: 6,
    },
    userChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: pulse.inverse,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 6,
    },
    chipText: {
      color: pulse.textInverse,
      fontSize: 12,
      fontWeight: '800',
      maxWidth: 120,
    },
    groupInput: {
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.pill,
      paddingHorizontal: 12,
      fontSize: 13,
      color: pulse.text,
    },
    userListScroll: {
      maxHeight: 160,
    },
    noResultsText: {
      padding: 16,
      textAlign: 'center',
      fontSize: 12,
      color: pulse.textTertiary,
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
      backgroundColor: pulse.pill,
    },
    userAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: pulse.iconSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: {
      color: pulse.text,
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
      color: pulse.text,
    },
    userRole: {
      fontSize: 11,
      marginTop: 1,
      color: pulse.textSecondary,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: pulse.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: pulse.inverse,
      borderColor: pulse.inverse,
    },
    createBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.inverse,
      height: 40,
      borderRadius: 14,
      gap: 8,
      marginTop: 4,
    },
    createBtnText: {
      color: pulse.textInverse,
      fontSize: 13,
      fontWeight: '900',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 112,
      gap: 8,
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
      color: pulse.text,
    },
    emptySub: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      color: pulse.textSecondary,
    },
    chipsFiltroRow: {
      marginTop: 18,
      marginBottom: 12,
    },
    chipsFiltroScroll: {
      paddingHorizontal: 21,
      gap: 9,
      flexDirection: 'row',
      alignItems: 'center',
    },
    chipFiltroBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 48,
      paddingHorizontal: 13,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surface,
    },
    chipFiltroTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: pulse.textSecondary,
    },
    chipFiltroCount: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 7,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipFiltroCountActive: { backgroundColor: pulse.chipCountActive },
    chipFiltroCountText: { color: pulse.text, fontSize: 12, fontWeight: '700' },
    chipFiltroCountTextActive: { color: pulse.chipTextActive },
    convItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surface,
      gap: 12,
    },
    convAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: pulse.iconSurface,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    convAvatarGroup: {
      backgroundColor: pulse.iconSurface,
    },
    avatarOnlineDot: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22C55E',
      borderWidth: 2.5,
      borderColor: pulse.surface,
    },
    avatarGroupBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: pulse.iconSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: pulse.surface,
    },
    groupAvatarFallback: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupPillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: pulse.pill,
      marginRight: 6,
    },
    groupPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: pulse.textSecondary,
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
      fontSize: 17,
      fontWeight: '600',
      color: pulse.text,
    },
    convPreview: {
      fontSize: 13,
      marginTop: 2,
      lineHeight: 18,
      color: pulse.textSecondary,
    },
    convMetaCol: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: 46,
    },
    convTimeText: {
      fontSize: 12,
      fontWeight: '600',
      color: pulse.textTertiary,
    },
    convMetaBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    unreadBadgeWhatsApp: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    unreadBadgeWhatsAppText: {
      color: pulse.textInverse,
      fontSize: 10.5,
      fontWeight: '900',
      lineHeight: 14,
    },
    errorCard: {
      marginHorizontal: 16,
      marginTop: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: pulse.errorSurface,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      color: pulse.errorText,
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
    },
    messagesContent: {
      paddingHorizontal: 20,
      paddingTop: 14,
      gap: 10,
      paddingBottom: 18,
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
      borderColor: pulse.border,
    },
    senderAvatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.iconSurface,
    },
    senderAvatarInitial: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '900',
    },
    messageBubble: {
      maxWidth: '82%',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 22,
      gap: 6,
    },
    bubbleOwn: {
      borderBottomRightRadius: 8,
      backgroundColor: pulse.inverse,
      borderColor: pulse.inverse,
    },
    bubbleOther: {
      borderBottomLeftRadius: 8,
      borderWidth: 1,
      backgroundColor: pulse.surfaceElevated,
      borderColor: pulse.border,
    },
    senderName: {
      fontSize: 11,
      fontWeight: '900',
    },
    textOwn: {
      color: pulse.textInverse,
      fontSize: 14,
      lineHeight: 20,
    },
    textOther: {
      fontSize: 14,
      lineHeight: 20,
      color: pulse.text,
    },
    timeOwn: {
      color: esOscuro ? 'rgba(37,35,41,0.68)' : 'rgba(255,255,255,0.68)',
      fontSize: 10,
      fontWeight: '700',
      alignSelf: 'flex-end',
    },
    timeOther: {
      fontSize: 10,
      fontWeight: '700',
      alignSelf: 'flex-end',
      color: pulse.textTertiary,
    },
    pendingTray: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surfaceElevated,
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
      color: pulse.text,
    },
    addMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: pulse.pill,
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
      borderColor: pulse.border,
      overflow: 'hidden',
      backgroundColor: pulse.pill,
      position: 'relative',
      padding: 4,
      justifyContent: 'space-between',
    },
    previewImage: {
      ...StyleSheet.absoluteFill,
      borderRadius: 12,
    },
    previewDocIcon: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewMeta: {
      backgroundColor: esOscuro ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)',
      borderRadius: 8,
      padding: 4,
      zIndex: 2,
    },
    previewName: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    previewSize: {
      fontSize: 9,
      marginTop: 1,
      color: 'rgba(255,255,255,0.7)',
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
      marginHorizontal: 20,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surfaceElevated,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toolsWrap: {
      flexDirection: 'row',
      gap: 4,
    },
    toolBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      fontSize: 14,
      paddingVertical: 8,
      color: pulse.text,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    attachmentSheet: {
      paddingHorizontal: 22,
      paddingTop: 10,
      paddingBottom: 30,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      backgroundColor: pulse.surfaceElevated,
      ...SOMBRAS.flotante,
    },
    sheetHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
      backgroundColor: pulse.borderStrong,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: pulse.text,
    },
    attachmentActions: {
      flexDirection: 'row',
      gap: 18,
      marginTop: 18,
    },
    attachmentAction: {
      alignItems: 'center',
      minWidth: 62,
    },
    attachmentActionIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.pill,
    },
    attachmentActionLabel: {
      marginTop: 7,
      fontSize: 12,
      fontWeight: '700',
      color: pulse.text,
    },
    attachmentCard: {
      marginTop: 6,
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
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
      borderColor: pulse.border,
    },
    blockedBanner: {
      marginHorizontal: 16,
      padding: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.35)',
      backgroundColor: pulse.errorSurface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    blockedText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: pulse.text,
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
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    actionMenuCard: {
      width: '100%',
      maxWidth: 440,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surfaceElevated,
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
      color: pulse.text,
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
      color: pulse.text,
    },
    actionMenuItemSub: {
      fontSize: 11,
      marginTop: 2,
      color: pulse.textSecondary,
    },
    actionMenuDivider: {
      height: 1,
      marginVertical: 4,
      backgroundColor: pulse.border,
    },
    btnSecondary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newChatFullScreen: {
      flex: 1,
      backgroundColor: pulse.background,
    },
    newChatContainer: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: pulse.background,
    },
    newChatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 14,
      marginBottom: 6,
    },
    newChatTitle: {
      color: pulse.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    newChatCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newChatSearchBox: {
      height: 48,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      marginBottom: 12,
    },
    newChatSearchInput: {
      flex: 1,
      fontSize: 15,
      color: pulse.text,
      fontWeight: '500',
      includeFontPadding: false,
      paddingVertical: 0,
    },
    newChatSelectedContainer: {
      marginBottom: 10,
    },
    newChatSelectedRow: {
      gap: 8,
      paddingVertical: 2,
    },
    newChatUserChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: pulse.inverse,
    },
    newChatChipText: {
      color: pulse.textInverse,
      fontSize: 13,
      fontWeight: '700',
      maxWidth: 140,
    },
    newChatGroupInputContainer: {
      height: 48,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    newChatGroupInput: {
      flex: 1,
      fontSize: 14,
      color: pulse.text,
      fontWeight: '500',
      includeFontPadding: false,
      paddingVertical: 0,
    },
    newChatSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      marginTop: 4,
    },
    newChatSectionTitle: {
      color: pulse.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    newChatSelectedCount: {
      color: pulse.textTertiary,
      fontSize: 12,
      fontWeight: '600',
    },
    newChatUserListScroll: {
      flex: 1,
    },
    newChatEmptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    newChatEmptyText: {
      color: pulse.textTertiary,
      fontSize: 14,
      fontWeight: '600',
    },
    newChatUserOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 18,
      marginBottom: 6,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 12,
    },
    newChatUserOptionSelected: {
      backgroundColor: pulse.pill,
      borderColor: pulse.borderStrong,
    },
    newChatAvatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: pulse.iconSurface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    newChatAvatarImage: {
      width: '100%',
      height: '100%',
    },
    newChatAvatarLetter: {
      color: pulse.text,
      fontSize: 17,
      fontWeight: '700',
    },
    newChatUserInfo: {
      flex: 1,
    },
    newChatUserName: {
      color: pulse.text,
      fontSize: 15,
      fontWeight: '700',
      includeFontPadding: false,
    },
    newChatUserRole: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
      includeFontPadding: false,
    },
    newChatCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: pulse.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newChatCheckboxSelected: {
      backgroundColor: pulse.inverse,
      borderColor: pulse.inverse,
    },
    newChatBottomFloatingBar: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 8 : 6,
      left: 20,
      right: 20,
    },
    newChatCreateBtn: {
      height: 52,
      borderRadius: 26,
      backgroundColor: pulse.inverse,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.flotante,
    },
    newChatCreateBtnText: {
      color: pulse.textInverse,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
