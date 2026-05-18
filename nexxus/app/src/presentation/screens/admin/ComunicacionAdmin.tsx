import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN } from './adminTheme';

const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

const CONTRAST_TEXT = '#FFFFFF';

type Anuncio = {
  id?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  departamentoDestino?: string;
  prioridad?: 'Normal' | 'Alta' | 'Urgente';
  mensaje?: string;
  fecha?: string;
};

type UsuarioComunicacion = {
  id?: string;
  nombre?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

type NotificacionComunicacion = {
  id?: string;
  tipo?: string;
  leida?: boolean;
  empresaId?: string;
  fecha?: string;
};

const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    <MaterialIcons name={icon} size={23} color={color} />
  </View>
);

const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'default'; children: React.ReactNode }) => {
  const mapa = {
    success: { color: BRAND.success, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
    warning: { color: BRAND.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
    error: { color: BRAND.error, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
    blue: { color: BRAND.violet, bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
    default: { color: BRAND.textSec, bg: ADMIN.fondoCampo, border: ADMIN.borde },
  }[variant];
  return (
    <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
      <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
    </View>
  );
};

export default function ComunicacionAdmin() {
  const { t } = useTranslation();
  const [selectedAudience, setSelectedAudience] = useState(t('admin.comunicacion.global'));
  const [feeds, setFeeds] = useState<Anuncio[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioComunicacion[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionComunicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('nx-comunicacion-force-white')) {
      const style = document.createElement('style');
      style.id = 'nx-comunicacion-force-white';
      style.textContent = `
        .nx-force-white-always,
        .nx-force-white-always * {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setFeeds([]);
      setUsuarios([]);
      setNotificaciones([]);
      setCargando(false);
      return;
    }

    const cargadas = new Set<string>();
    const marcarCarga = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= 3) setCargando(false);
    };

    setCargando(true);
    const unsubFeeds = useCases.admin.announcements.subscribe(empresaId, (dbFeeds) => {
      setFeeds(dbFeeds || []);
      marcarCarga('feeds');
    });
    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
      setUsuarios(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UsuarioComunicacion));
      marcarCarga('usuarios');
    }, () => marcarCarga('usuarios'));
    const unsubNotificaciones = onSnapshot(query(collection(db, 'notificaciones'), where('empresaId', '==', empresaId)), (snapshot) => {
      setNotificaciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NotificacionComunicacion));
      marcarCarga('notificaciones');
    }, () => marcarCarga('notificaciones'));

    return () => {
      unsubFeeds();
      unsubUsuarios();
      unsubNotificaciones();
    };
  }, [user]);

  const audiencias = useMemo(() => {
    const departamentos = Array.from(new Set(usuarios.map((u) => u.departamento).filter(Boolean))) as string[];
    return [t('admin.comunicacion.global'), ...departamentos];
  }, [usuarios, t]);

  const datos = useMemo(() => {
    const feedsFiltrados = feeds.filter((feed) => {
      const destino = feed.departamentoDestino || t('admin.comunicacion.global');
      const coincideAudiencia = selectedAudience === t('admin.comunicacion.global') || destino === selectedAudience || destino === t('admin.comunicacion.todos') || destino === t('admin.comunicacion.global');
      const coincideBusqueda = (feed.mensaje || '').toLowerCase().includes(busqueda.toLowerCase()) || (feed.creadoPorNombre || '').toLowerCase().includes(busqueda.toLowerCase());
      return coincideAudiencia && coincideBusqueda;
    });
    const receptores = selectedAudience === t('admin.comunicacion.global')
      ? usuarios.filter((u) => u.activo !== false).length
      : usuarios.filter((u) => u.activo !== false && u.departamento === selectedAudience).length;
    const urgentes = feeds.filter((feed) => feed.prioridad === 'Alta' || feed.prioridad === 'Urgente').length;
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    const porCanal = audiencias.map((audiencia) => ({
      audiencia,
      total: feeds.filter((feed) => audiencia === t('admin.comunicacion.global') ? true : feed.departamentoDestino === audiencia).length,
      receptores: audiencia === t('admin.comunicacion.global') ? usuarios.length : usuarios.filter((u) => u.departamento === audiencia).length,
    }));
    return { feedsFiltrados, receptores, urgentes, noLeidas, porCanal };
  }, [feeds, usuarios, notificaciones, selectedAudience, busqueda, audiencias]);

  const crearAnuncio = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const texto = mensaje.trim();
    if (!empresaId || !texto || enviando) return;
    setEnviando(true);
    try {
      const prioridad = texto.toLowerCase().includes('urgente') ? 'Urgente' : texto.toLowerCase().includes('crítico') ? 'Alta' : 'Normal';
      await useCases.admin.announcements.create({
        empresaId,
        creadoPorId: user?.id || '',
        creadoPorNombre: user?.nombre || t('common.system'),
        departamentoDestino: selectedAudience === t('admin.comunicacion.global') ? t('admin.comunicacion.todos') : selectedAudience,
        prioridad,
        mensaje: texto,
      });
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user?.id || '',
        usuarioNombre: user?.nombre || t('admin.roles.admin'),
        rol: user?.rol || 'admin',
        accion: 'Publicación de Anuncio',
        modulo: 'Mensajería',
        detalles: `${selectedAudience} · ${prioridad}`,
        estado: prioridad === 'Urgente' || prioridad === 'Alta' ? 'Warning' : 'Success',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });
      setMensaje('');
    } catch {
      Alert.alert(t('admin.comunicacion.error_envio'), t('admin.comunicacion.error_envio_msg'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  const stats = [
    { label: t('admin.comunicacion.stats.total_announcements'), val: feeds.length, detail: t('admin.comunicacion.stats.active_history'), icon: "campaign" as const, color: ADMIN.iconos.comunicacion },
    { label: t('admin.comunicacion.stats.channel_recipients'), val: datos.receptores, detail: selectedAudience, icon: "groups" as const, color: ADMIN.iconos.personas },
    { label: t('admin.comunicacion.stats.high_priority'), val: datos.urgentes, detail: t('admin.comunicacion.stats.needs_attention'), icon: "priority-high" as const, color: datos.urgentes > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
    { label: t('admin.comunicacion.stats.unread'), val: datos.noLeidas, detail: t('admin.comunicacion.stats.notifications'), icon: "notifications-active" as const, color: datos.noLeidas > 0 ? ADMIN.iconos.advertencia : ADMIN.iconos.comunicacion },
  ];

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>{t('admin.comunicacion.title')}</Text>
          <Text style={estilos.subtitulo}>{t('admin.comunicacion.subtitle')}</Text>
        </View>
      </View>

      <View style={estilos.gridMain}>
        <View style={estilos.colLeft}>
          <View style={estilos.premiumCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.channels_title')}</Text>
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.channels_subtitle')}</Text>
              </View>
              <IconPanel icon="forum" color={ADMIN.iconos.comunicacion} />
            </View>
            <View style={estilos.audienceList}>
              {datos.porCanal.map((canal) => (
                <TouchableOpacity key={canal.audiencia} onPress={() => setSelectedAudience(canal.audiencia)} style={estilos.audienceWrap}>
                  {selectedAudience === canal.audiencia ? (
                    <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.audienceBtn, { opacity: 1 }]}>
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtnText, { color: '#FFFFFF' }]}>{canal.audiencia}</Text>
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceCount, { color: '#FFFFFF' }]}>{canal.receptores}</Text>
                    </LinearGradient>
                  ) : (
                    <View {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtn, { opacity: 0.6 }]}>
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtnText, { color: '#FFFFFF' }]}>{canal.audiencia}</Text>
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceCount, { color: '#FFFFFF' }]}>{canal.receptores}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={estilos.premiumCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.new_announcement_title')}</Text>
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.destination')}: {selectedAudience}</Text>
              </View>
              <IconPanel icon="campaign" color={ADMIN.iconos.organizacion} />
            </View>
            <TextInput
              style={estilos.chatInput}
              placeholder={t('admin.comunicacion.new_announcement_placeholder')}
              placeholderTextColor={BRAND.textSec}
              multiline
              value={mensaje}
              onChangeText={setMensaje}
            />
            <TouchableOpacity style={estilos.publishBtn} onPress={crearAnuncio} disabled={enviando || !mensaje.trim()}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.publishGradient}>
                <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} name="send" size={18} color="#FFFFFF" style={{ color: '#FFFFFF' }} />
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.publishText, { color: '#FFFFFF' }]}>{t('admin.comunicacion.btn_send_now')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.colRight}>
          <View style={[estilos.premiumCard, estilos.feedCard]}>
            <View style={estilos.chatHeader}>
              <View style={estilos.chatTitleRow}>
                <View style={estilos.liveDot} />
                <Text style={estilos.chatTitle}>{t('admin.comunicacion.feed_title')}: {selectedAudience}</Text>
              </View>
              <PremiumBadge variant="blue">{datos.receptores} {t('admin.comunicacion.receptores')}</PremiumBadge>
            </View>
            <View style={estilos.searchContainer}>
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              <TextInput style={estilos.searchInput} placeholder={t('admin.comunicacion.search_placeholder')} placeholderTextColor={BRAND.textSec} value={busqueda} onChangeText={setBusqueda} />
            </View>
            <ScrollView style={estilos.chatArea} contentContainerStyle={estilos.feedContent}>
              {datos.feedsFiltrados.map((feed) => {
                const prioridad = feed.prioridad || 'Normal';
                return (
                  <View key={feed.id} style={[estilos.feedItem, (prioridad === 'Alta' || prioridad === 'Urgente') && estilos.feedItemUrgent]}>
                    <View style={estilos.feedItemHeader}>
                      <View style={estilos.feedUserRow}>
                        {(() => {
                          const autor = usuarios.find(u => u.id === feed.creadoPorId || u.nombre === feed.creadoPorNombre);
                          const foto = autor?.foto_perfil || autor?.fotoPerfil || autor?.photoURL;
                          return foto ? (
                            <Image source={{ uri: foto }} style={estilos.feedAvatar} />
                          ) : (
                            <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={(prioridad === 'Alta' || prioridad === 'Urgente') ? ['#EF4444', '#991B1B'] : [BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.feedAvatar}>
                              <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="person" size={17} color={CONTRAST_TEXT} />
                              <Text {...({ className: 'nx-force-white' } as any)} style={estilos.feedAvatarText}>{(feed.creadoPorNombre || 'S')[0].toUpperCase()}</Text>
                            </LinearGradient>
                          );
                        })()}
                        <View>
                          <Text style={estilos.feedUserName}>{feed.creadoPorNombre || t('common.system')}</Text>
                          <Text style={estilos.feedUserMeta}>{feed.fecha || ''} · {feed.departamentoDestino || t('admin.comunicacion.global')}</Text>
                        </View>
                      </View>
                      <PremiumBadge variant={(prioridad === 'Alta' || prioridad === 'Urgente') ? 'error' : prioridad === 'Normal' ? 'default' : 'warning'}>{prioridad}</PremiumBadge>
                    </View>
                    <Text style={estilos.feedMsg}>{feed.mensaje}</Text>
                  </View>
                );
              })}
              {datos.feedsFiltrados.length === 0 && <EmptyState texto={t('admin.comunicacion.empty_feed')} />}
            </ScrollView>
          </View>
        </View>
      </View>
    </ScrollView>
    </Animated.View>
  );
}

const EmptyState = ({ texto }: { texto: string }) => (
  <View style={estilos.emptyState}><Text style={estilos.emptyText}>{texto}</Text></View>
);

const estilos = StyleSheet.create({
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 260, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  titulo: { fontSize: 28, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0 },
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  btnPrimary: { borderRadius: 12, overflow: 'hidden', shadowColor: BRAND.iconBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10 },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 230, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, padding: 20, borderWidth: 1, borderColor: ADMIN.borde, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28, elevation: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0, marginBottom: 7 },
  statTrend: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gridMain: { flexDirection: 'row', gap: 24 },
  colLeft: { flex: 0.85, gap: 24 },
  colRight: { flex: 1.65 },
  premiumCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: ADMIN.borde, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28, elevation: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  panelTitle: { color: BRAND.textMain, fontSize: 14, fontWeight: '800' },
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3, marginTop: 4 },
  audienceList: { gap: 10 },
  audienceWrap: { borderRadius: 12, overflow: 'hidden' },
  audienceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  audienceBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  audienceCount: { color: CONTRAST_TEXT, fontSize: 12, fontWeight: '900' },
  chatInput: { width: '100%', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, padding: 18, color: BRAND.textMain, fontSize: 14, fontWeight: '700', minHeight: 130, textAlignVertical: 'top' },
  publishBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 14 },
  publishGradient: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  publishText: { color: CONTRAST_TEXT, fontSize: 12, fontWeight: '900', letterSpacing: 1.6 },
  feedCard: { padding: 0, minHeight: 680 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: BRAND.iconBright },
  chatTitle: { fontSize: 18, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  searchContainer: { margin: 24, marginBottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, paddingHorizontal: 20, height: 56 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14, fontWeight: '700' },
  chatArea: { flex: 1 },
  feedContent: { padding: 20 },
  feedItem: { padding: 22, borderRadius: 22, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, marginBottom: 18 },
  feedItemUrgent: { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' },
  feedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 14 },
  feedUserRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: ADMIN.fondoCampo, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  feedAvatarText: { color: CONTRAST_TEXT, fontSize: 13, fontWeight: '900', marginTop: -2 },
  feedUserName: { fontSize: 13, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  feedUserMeta: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  feedMsg: { fontSize: 14, color: BRAND.textMain, lineHeight: 23, fontWeight: '600' },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
