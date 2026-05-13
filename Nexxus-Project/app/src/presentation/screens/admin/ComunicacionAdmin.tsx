import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
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
    blue: { color: BRAND.iconBright, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.22)' },
    default: { color: BRAND.textSec, bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.06)' },
  }[variant];
  return (
    <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
      <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
    </View>
  );
};

export default function ComunicacionAdmin() {
  const [selectedAudience, setSelectedAudience] = useState("Global");
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
    return ["Global", ...departamentos];
  }, [usuarios]);

  const datos = useMemo(() => {
    const feedsFiltrados = feeds.filter((feed) => {
      const destino = feed.departamentoDestino || 'Global';
      const coincideAudiencia = selectedAudience === 'Global' || destino === selectedAudience || destino === 'Todos' || destino === 'Global';
      const coincideBusqueda = (feed.mensaje || '').toLowerCase().includes(busqueda.toLowerCase()) || (feed.creadoPorNombre || '').toLowerCase().includes(busqueda.toLowerCase());
      return coincideAudiencia && coincideBusqueda;
    });
    const receptores = selectedAudience === 'Global'
      ? usuarios.filter((u) => u.activo !== false).length
      : usuarios.filter((u) => u.activo !== false && u.departamento === selectedAudience).length;
    const urgentes = feeds.filter((feed) => feed.prioridad === 'Alta' || feed.prioridad === 'Urgente').length;
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    const porCanal = audiencias.map((audiencia) => ({
      audiencia,
      total: feeds.filter((feed) => audiencia === 'Global' ? true : feed.departamentoDestino === audiencia).length,
      receptores: audiencia === 'Global' ? usuarios.length : usuarios.filter((u) => u.departamento === audiencia).length,
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
        creadoPorNombre: user?.nombre || 'Sistema',
        departamentoDestino: selectedAudience === 'Global' ? 'Todos' : selectedAudience,
        prioridad,
        mensaje: texto,
      });
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user?.id || '',
        usuarioNombre: user?.nombre || 'Administrador',
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
      Alert.alert('No se pudo enviar', 'Firebase no confirmó la creación del anuncio.');
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
    { label: "Anuncios Totales", val: feeds.length, detail: "historial activo", icon: "campaign" as const, color: BRAND.iconBright },
    { label: "Receptores Canal", val: datos.receptores, detail: selectedAudience, icon: "groups" as const, color: BRAND.success },
    { label: "Prioridad Alta", val: datos.urgentes, detail: "requiere atención", icon: "priority-high" as const, color: datos.urgentes > 0 ? BRAND.error : BRAND.success },
    { label: "No Leídas", val: datos.noLeidas, detail: "notificaciones", icon: "notifications-active" as const, color: datos.noLeidas > 0 ? BRAND.warning : BRAND.cyan },
  ];

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Mensajería Central</Text>
          <Text style={estilos.subtitulo}>Difusión masiva, comunicación segmentada y trazabilidad de anuncios</Text>
        </View>
        <TouchableOpacity style={estilos.btnPrimary} onPress={crearAnuncio} disabled={enviando || !mensaje.trim()}>
          <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnGradient}>
            <MaterialIcons name="flash-on" size={18} color="#fff" style={estilos.btnIcon} />
            <Text style={estilos.btnPrimaryText}>PUBLICAR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={estilos.gridStats}>
        {stats.map((stat) => (
          <View key={stat.label} style={estilos.statCard}>
            <View style={estilos.statRow}>
              <View style={estilos.statInfo}>
                <Text style={estilos.statLabel}>{stat.label}</Text>
                <Text style={estilos.statValue}>{stat.val}</Text>
                <Text style={[estilos.statTrend, { color: stat.color }]}>{stat.detail}</Text>
              </View>
              <IconPanel icon={stat.icon} color={stat.color} />
            </View>
          </View>
        ))}
      </View>

      <View style={estilos.gridMain}>
        <View style={estilos.colLeft}>
          <View style={estilos.premiumCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Canales</Text>
                <Text style={estilos.panelSubtitle}>Audiencias reales</Text>
              </View>
              <IconPanel icon="forum" color={BRAND.cyan} />
            </View>
            <View style={estilos.audienceList}>
              {datos.porCanal.map((canal) => (
                <TouchableOpacity key={canal.audiencia} onPress={() => setSelectedAudience(canal.audiencia)} style={estilos.audienceWrap}>
                  {selectedAudience === canal.audiencia ? (
                    <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.audienceBtn}>
                      <Text style={[estilos.audienceBtnText, { color: '#fff' }]}>{canal.audiencia}</Text>
                      <Text style={estilos.audienceCount}>{canal.receptores}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={estilos.audienceBtn}>
                      <Text style={[estilos.audienceBtnText, { color: BRAND.textSec }]}>{canal.audiencia}</Text>
                      <Text style={[estilos.audienceCount, { color: BRAND.textSec }]}>{canal.receptores}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={estilos.premiumCard}>
            <View style={estilos.panelHeader}>
              <View>
                <Text style={estilos.panelTitle}>Nuevo Anuncio</Text>
                <Text style={estilos.panelSubtitle}>Destino: {selectedAudience}</Text>
              </View>
              <IconPanel icon="send" color={BRAND.iconBright} />
            </View>
            <TextInput
              style={estilos.chatInput}
              placeholder="Redactar nuevo anuncio..."
              placeholderTextColor={BRAND.textSec}
              multiline
              value={mensaje}
              onChangeText={setMensaje}
            />
            <TouchableOpacity style={estilos.publishBtn} onPress={crearAnuncio} disabled={enviando || !mensaje.trim()}>
              <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.publishGradient}>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text style={estilos.publishText}>ENVIAR AHORA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.colRight}>
          <View style={[estilos.premiumCard, estilos.feedCard]}>
            <View style={estilos.chatHeader}>
              <View style={estilos.chatTitleRow}>
                <View style={estilos.liveDot} />
                <Text style={estilos.chatTitle}>Feed: {selectedAudience}</Text>
              </View>
              <PremiumBadge variant="blue">{datos.receptores} receptores</PremiumBadge>
            </View>
            <View style={estilos.searchContainer}>
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              <TextInput style={estilos.searchInput} placeholder="Buscar anuncios..." placeholderTextColor={BRAND.textSec} value={busqueda} onChangeText={setBusqueda} />
            </View>
            <ScrollView style={estilos.chatArea} contentContainerStyle={estilos.feedContent}>
              {datos.feedsFiltrados.map((feed) => {
                const prioridad = feed.prioridad || 'Normal';
                return (
                  <View key={feed.id} style={[estilos.feedItem, (prioridad === 'Alta' || prioridad === 'Urgente') && estilos.feedItemUrgent]}>
                    <View style={estilos.feedItemHeader}>
                      <View style={estilos.feedUserRow}>
                        <LinearGradient colors={(prioridad === 'Alta' || prioridad === 'Urgente') ? ['#EF4444', '#991B1B'] : [BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.feedAvatar}>
                          <Text style={estilos.feedAvatarText}>{(feed.creadoPorNombre || 'S')[0]}</Text>
                        </LinearGradient>
                        <View>
                          <Text style={estilos.feedUserName}>{feed.creadoPorNombre || 'Sistema'}</Text>
                          <Text style={estilos.feedUserMeta}>{feed.fecha || ''} · {feed.departamentoDestino || 'Global'}</Text>
                        </View>
                      </View>
                      <PremiumBadge variant={(prioridad === 'Alta' || prioridad === 'Urgente') ? 'error' : prioridad === 'Normal' ? 'default' : 'warning'}>{prioridad}</PremiumBadge>
                    </View>
                    <Text style={estilos.feedMsg}>{feed.mensaje}</Text>
                  </View>
                );
              })}
              {datos.feedsFiltrados.length === 0 && <EmptyState texto="Sin anuncios para este canal" />}
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
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 84, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  titulo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, textTransform: 'uppercase' },
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  btnPrimary: { borderRadius: 18, overflow: 'hidden', shadowColor: BRAND.iconBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10 },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 230, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, padding: 24, borderWidth: 1, borderColor: ADMIN.borde, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  statValue: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 7 },
  statTrend: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gridMain: { flexDirection: 'row', gap: 24 },
  colLeft: { flex: 0.85, gap: 24 },
  colRight: { flex: 1.65 },
  premiumCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: ADMIN.borde, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  panelTitle: { color: BRAND.textMain, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 4 },
  audienceList: { gap: 10 },
  audienceWrap: { borderRadius: 16, overflow: 'hidden' },
  audienceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.025)' },
  audienceBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  audienceCount: { color: '#fff', fontSize: 12, fontWeight: '900' },
  chatInput: { width: '100%', backgroundColor: BRAND.richBlack, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, color: '#fff', fontSize: 14, fontWeight: '700', minHeight: 130, textAlignVertical: 'top' },
  publishBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 14 },
  publishGradient: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  publishText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1.6 },
  feedCard: { padding: 0, minHeight: 680 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: BRAND.iconBright },
  chatTitle: { fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  searchContainer: { margin: 24, marginBottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,7,45,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 20, height: 56 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  chatArea: { flex: 1 },
  feedContent: { padding: 24 },
  feedItem: { padding: 22, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(196,181,253,0.10)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 18 },
  feedItemUrgent: { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' },
  feedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 14 },
  feedUserRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  feedAvatar: { width: 46, height: 46, borderRadius: ADMIN.radio, alignItems: 'center', justifyContent: 'center' },
  feedAvatarText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  feedUserName: { fontSize: 13, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  feedUserMeta: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  feedMsg: { fontSize: 14, color: '#D1D5DB', lineHeight: 23, fontWeight: '600' },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
