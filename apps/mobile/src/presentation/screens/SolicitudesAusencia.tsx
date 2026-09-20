/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/SolicitudesAusencia.tsx
 * Capa: presentacion.
 * Proposito: Gestión, creación, detalle, edición y cancelación de solicitudes de ausencia y permisos.
 * Rediseñado con la estética idéntica a Mi Pulso: tipografía limpia, paleta minimalista y discreta
 * (negros, beiges, pasteles suaves), tarjetas Bento, animaciones fluidas y modales ejecutivos.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import Skeleton from '@/presentation/components/ui/Skeleton';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import { Absence, AdjuntoItem } from 'domain/entities/Absence';

type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type FilterScope = 'todas' | 'pendiente' | 'aprobada' | 'rechazada';

type Navigation = {
  navigate: (route: string, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack?: () => boolean;
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORIAS: { id: Absence['tipo']; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { id: 'vacaciones', label: 'Vacaciones', icon: 'sun' },
  { id: 'enfermedad', label: 'Enfermedad', icon: 'activity' },
  { id: 'personal', label: 'Personal', icon: 'user' },
  { id: 'emergencia', label: 'Emergencia', icon: 'alert-circle' },
  { id: 'capacitacion', label: 'Capacitación', icon: 'book-open' },
  { id: 'otro', label: 'Otro motivo', icon: 'file-text' },
];

const PRIORIDADES: { id: Absence['prioridad']; label: string; dotColor: string }[] = [
  { id: 'baja', label: 'Baja', dotColor: '#D5E774' },
  { id: 'media', label: 'Media', dotColor: '#E9D2BF' },
  { id: 'alta', label: 'Alta', dotColor: '#F2AD84' },
  { id: 'urgente', label: 'Urgente', dotColor: '#EF4444' },
];

const getStatusTheme = (estado?: string, esOscuro?: boolean) => {
  switch (estado) {
    case 'aprobada':
      return {
        bg: esOscuro ? 'rgba(74, 222, 128, 0.15)' : '#EAF4DC',
        dot: '#4ADE80',
        text: esOscuro ? '#4ADE80' : '#455E24',
        label: 'Aprobada',
      };
    case 'rechazada':
      return {
        bg: esOscuro ? 'rgba(248, 113, 113, 0.15)' : '#F6ECEB',
        dot: '#F87171',
        text: esOscuro ? '#F87171' : '#833932',
        label: 'Rechazada',
      };
    case 'cancelada':
      return {
        bg: esOscuro ? 'rgba(156, 163, 175, 0.15)' : '#EFECE9',
        dot: '#9CA3AF',
        text: esOscuro ? '#9CA3AF' : '#5D5853',
        label: 'Cancelada',
      };
    default:
      return {
        bg: esOscuro ? 'rgba(251, 191, 36, 0.15)' : '#FFF6E5',
        dot: '#FBBF24',
        text: esOscuro ? '#FBBF24' : '#7C5819',
        label: 'Pendiente',
      };
  }
};

const formatPeriodDate = (inicio?: string, fin?: string) => {
  if (!inicio) return 'Sin fecha';
  if (!fin || inicio === fin) {
    const d = new Date(inicio);
    if (isNaN(d.getTime())) return inicio;
    return new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short' }).format(d);
  }
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return `${inicio} — ${fin}`;
  const f1 = new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short' }).format(d1);
  const f2 = new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short' }).format(d2);
  return `${f1} — ${f2}`;
};

export default function SolicitudesAusencia({ navigation }: { navigation: Navigation }) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);
  const bottomPadding = useUserTabBottomPadding(96);
  const { t } = useTranslation();
  const {
    perfil,
    solicitudes = [],
    crearSolicitudAusencia,
    actualizarSolicitudAusencia,
    cancelarSolicitudAusencia,
    recargarDatos,
    cargando,
  } = useContextoUsuario();

  const [scope, setScope] = useState<FilterScope>('todas');
  const [refreshing, setRefreshing] = useState(false);
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Absence | null>(null);
  const [solicitudEditando, setSolicitudEditando] = useState<Absence | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  // Form State
  const [asunto, setAsunto] = useState('');
  const [tipo, setTipo] = useState<Absence['tipo']>('vacaciones');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prioridad, setPrioridad] = useState<Absence['prioridad']>('media');
  const [adjuntos, setAdjuntos] = useState<AdjuntoItem[]>([]);

  // Calendario State
  const hoy = new Date();
  const [calMes, setCalMes] = useState(hoy.getMonth());
  const [calAnio, setCalAnio] = useState(hoy.getFullYear());

  const entrance = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const firstName =
    perfil?.nombre?.split(' ')[0] ||
    t('miPulso.user_default', { defaultValue: 'Usuario' });

  useEffect(() => {
    entrance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [entrance, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
  }));

  const refresh = async () => {
    setRefreshing(true);
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(
    () => ({
      todas: solicitudes.length,
      pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
      aprobada: solicitudes.filter((s) => s.estado === 'aprobada').length,
      rechazada: solicitudes.filter((s) => s.estado === 'rechazada').length,
    }),
    [solicitudes]
  );

  const solicitudesFiltradas = useMemo(() => {
    if (scope === 'todas') return solicitudes;
    return solicitudes.filter((s) => s.estado === scope);
  }, [scope, solicitudes]);

  const solicitudDestacada = useMemo(() => {
    return solicitudes.find((s) => s.estado === 'pendiente') || solicitudes[0] || null;
  }, [solicitudes]);

  // Calendario Helper Functions
  const cambiarMesCal = (delta: number) => {
    let nuevoMes = calMes + delta;
    let nuevoAnio = calAnio;
    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio++;
    } else if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio--;
    }
    setCalMes(nuevoMes);
    setCalAnio(nuevoAnio);
  };

  const diasEnMes = useMemo(() => {
    const primerDia = new Date(calAnio, calMes, 1);
    const totalDias = new Date(calAnio, calMes + 1, 0).getDate();
    let diaSemanaPrimerDia = primerDia.getDay() - 1;
    if (diaSemanaPrimerDia < 0) diaSemanaPrimerDia = 6;

    const lista = [];
    for (let i = 0; i < diaSemanaPrimerDia; i++) {
      lista.push(0);
    }
    for (let d = 1; d <= totalDias; d++) {
      lista.push(d);
    }
    return lista;
  }, [calMes, calAnio]);

  const formatearFecha = (anio: number, mes: number, dia: number) => {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  };

  const seleccionarDiaCalendario = (dia: number) => {
    if (dia === 0) return;
    const seleccion = formatearFecha(calAnio, calMes, dia);

    if (!fechaInicio || (fechaInicio && fechaFin)) {
      setFechaInicio(seleccion);
      setFechaFin('');
    } else if (fechaInicio && !fechaFin) {
      if (seleccion < fechaInicio) {
        setFechaFin(fechaInicio);
        setFechaInicio(seleccion);
      } else {
        setFechaFin(seleccion);
      }
    }
  };

  const diasSeleccionadosCount = useMemo(() => {
    if (!fechaInicio) return 0;
    if (!fechaFin) return 1;
    const ini = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diff = Math.round((fin.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [fechaInicio, fechaFin]);

  // Archivos y fotos
  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar una foto.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const item: AdjuntoItem = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          uri: res.assets[0].uri,
          nombre: res.assets[0].fileName || `foto_${Date.now()}.jpg`,
          tipo: 'imagen',
        };
        setAdjuntos((prev) => [...prev, item]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const seleccionarDeGaleria = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const nuevos: AdjuntoItem[] = res.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
          uri: asset.uri,
          nombre: asset.fileName || `imagen_${index + 1}.jpg`,
          tipo: 'imagen',
        }));
        setAdjuntos((prev) => [...prev, ...nuevos]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo acceder a la galería.');
    }
  };

  const seleccionarDocumento = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const nuevos: AdjuntoItem[] = res.assets.map((file, index) => ({
          id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
          uri: file.uri,
          nombre: file.name || `documento_${index + 1}`,
          tipo: file.mimeType?.startsWith('image/') ? 'imagen' : 'documento',
        }));
        setAdjuntos((prev) => [...prev, ...nuevos]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const mostrarOpcionesAdjunto = () => {
    Alert.alert(
      'Adjuntar comprobante',
      'Selecciona el origen del comprobante o archivo:',
      [
        { text: 'Explorar archivos', onPress: seleccionarDocumento },
        { text: 'Tomar foto', onPress: tomarFoto },
        { text: 'Elegir de galería', onPress: seleccionarDeGaleria },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const eliminarAdjunto = (id: string) => {
    setAdjuntos((prev) => prev.filter((a) => a.id !== id));
  };

  const resetForm = () => {
    setAsunto('');
    setTipo('vacaciones');
    setFechaInicio('');
    setFechaFin('');
    setMotivo('');
    setPrioridad('media');
    setAdjuntos([]);
    setSolicitudEditando(null);
    setCalendarioAbierto(false);
  };

  const abrirFormularioCrear = () => {
    resetForm();
    setModalFormVisible(true);
  };

  const abrirFormularioEditar = (sol: Absence) => {
    setSolicitudEditando(sol);
    setAsunto(sol.asunto || '');
    setTipo(sol.tipo || 'vacaciones');
    setFechaInicio(sol.fecha_inicio || '');
    setFechaFin(sol.fecha_fin || '');
    setMotivo(sol.motivo === 'Sin justificación adicional' ? '' : sol.motivo || '');
    setPrioridad(sol.prioridad || 'media');
    setAdjuntos(
      sol.archivos_adjuntos ||
        (sol.archivo_adjunto ? [{ id: '1', uri: sol.archivo_adjunto, nombre: 'Archivo adjunto', tipo: 'documento' }] : [])
    );
    setDetalleModalVisible(false);
    setModalFormVisible(true);
  };

  const manejarGuardarSolicitud = async () => {
    if (!asunto.trim() || !fechaInicio || !fechaFin) {
      Alert.alert('Campos incompletos', 'Por favor completa el título y el rango de fechas.');
      return;
    }

    setEnviando(true);
    try {
      if (solicitudEditando) {
        if (actualizarSolicitudAusencia) {
          await actualizarSolicitudAusencia(solicitudEditando.id, {
            asunto: asunto.trim(),
            tipo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            motivo: motivo.trim() || 'Sin justificación adicional',
            prioridad,
            archivos_adjuntos: adjuntos,
            archivo_adjunto: adjuntos.length > 0 ? adjuntos[0].uri : undefined,
          });
        }
        Alert.alert('Solicitud actualizada', 'Los cambios han sido guardados correctamente.');
      } else {
        await crearSolicitudAusencia({
          asunto: asunto.trim(),
          tipo,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          motivo: motivo.trim() || 'Sin justificación adicional',
          prioridad,
          estado: 'pendiente',
          fecha_solicitud: new Date().toISOString(),
          archivos_adjuntos: adjuntos,
          archivo_adjunto: adjuntos.length > 0 ? adjuntos[0].uri : undefined,
        });
        Alert.alert('Solicitud enviada', 'Tu solicitud fue registrada con éxito para su revisión.');
      }
      setModalFormVisible(false);
      resetForm();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la solicitud. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const manejarCancelarSolicitud = (sol: Absence) => {
    Alert.alert(
      'Cancelar solicitud',
      `¿Deseas cancelar tu solicitud de "${sol.asunto || sol.tipo}"?`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (cancelarSolicitudAusencia) {
                await cancelarSolicitudAusencia(sol.id);
              }
              setDetalleModalVisible(false);
              setSolicitudSeleccionada(null);
              Alert.alert('Solicitud cancelada', 'Tu solicitud ha sido cancelada exitosamente.');
            } catch {
              Alert.alert('Error', 'No se pudo cancelar la solicitud.');
            }
          },
        },
      ]
    );
  };

  const manejarRegresar = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    } else {
      navigation?.navigate('Inicio');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={pulse.ambient}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />

      {/* Barra Superior */}
      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
          </BotonAnimado>

          <Text style={styles.topBarLabel}>Ausencias</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={abrirFormularioCrear}
              accessibilityLabel="Crear nueva solicitud"
            >
              <Feather name="plus" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.textInverse} />
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('ConfiguracionApp')}
              accessibilityLabel="Abrir configuración"
            >
              <Feather name="settings" size={Platform.OS === 'ios' ? 20 : 17} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={entranceStyle}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={pulse.inverse}
          />
        }
      >
        {/* Hero Title con la misma tipografía de Mi Pulso */}
        <Text style={styles.hero}>Tus{'\n'}solicitudes</Text>

        {/* Overview Banner con el estilo de PulseOverviewCard */}
        {cargando && solicitudes.length === 0 ? (
          <OverviewSkeleton />
        ) : (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(240).delay(40)}>
            <SolicitudesOverviewCard
              total={counts.todas}
              pendientes={counts.pendiente}
              aprobadas={counts.aprobada}
              destacada={solicitudDestacada}
              onPressNueva={abrirFormularioCrear}
            />
          </Animated.View>
        )}

        {/* Header de Sección para Filtros y Registros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de tiempo</Text>
          <BotonAnimado scaleTo={0.97} onPress={abrirFormularioCrear}>
            <Text style={styles.viewAll}>+ Solicitar</Text>
          </BotonAnimado>
        </View>

        {/* Chips de Filtro idénticos a Mi Pulso */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(['todas', 'pendiente', 'aprobada', 'rechazada'] as FilterScope[]).map((item) => (
            <ScopeChip
              key={item}
              label={
                item === 'todas'
                  ? 'Todas'
                  : item === 'pendiente'
                  ? 'Pendientes'
                  : item === 'aprobada'
                  ? 'Aprobadas'
                  : 'Rechazadas'
              }
              count={counts[item]}
              active={scope === item}
              onPress={() => setScope(item)}
            />
          ))}
        </ScrollView>

        {/* Lista de Solicitudes en tarjetas Bento idénticas a checkinCard */}
        <Animated.View
          key={scope}
          entering={reduceMotion ? undefined : FadeInDown.duration(220)}
          style={styles.requestList}
        >
          {solicitudesFiltradas.length > 0 ? (
            solicitudesFiltradas.map((item, index) => (
              <SolicitudCard
                key={item.id || `${item.fecha_inicio}-${index}`}
                solicitud={item}
                onPress={() => {
                  setSolicitudSeleccionada(item);
                  setDetalleModalVisible(true);
                }}
              />
            ))
          ) : (
            <EmptySolicitudesCard
              scope={scope}
              onPress={abrirFormularioCrear}
            />
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* MODAL DETALLE DE SOLICITUD */}
      <ModalShell
        visible={detalleModalVisible}
        onClose={() => setDetalleModalVisible(false)}
        maxHeight="92%"
        style={styles.modalBody}
      >
        {solicitudSeleccionada && (
          <View style={styles.modalBody}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalCategoryIcon}>
                  <Feather
                    name={
                      CATEGORIAS.find((c) => c.id === solicitudSeleccionada.tipo)?.icon ||
                      'calendar'
                    }
                    size={16}
                    color={pulse.icon}
                  />
                </View>
                <View>
                  <Text style={styles.modalCategoryText}>
                    {CATEGORIAS.find((c) => c.id === solicitudSeleccionada.tipo)?.label ||
                      solicitudSeleccionada.tipo.toUpperCase()}
                  </Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {solicitudSeleccionada.asunto || 'Solicitud de permiso'}
                  </Text>
                </View>
              </View>

              <BotonAnimado
                onPress={() => setDetalleModalVisible(false)}
                scaleTo={0.92}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={18} color={pulse.icon} />
              </BotonAnimado>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              {/* Card de Resolución si fue aprobada o rechazada */}
              {(solicitudSeleccionada.estado === 'aprobada' ||
                solicitudSeleccionada.estado === 'rechazada') && (
                <View
                  style={[
                    styles.resolutionCard,
                    solicitudSeleccionada.estado === 'aprobada'
                      ? styles.resolutionCardApproved
                      : styles.resolutionCardRejected,
                  ]}
                >
                  <View style={styles.resolutionHeader}>
                    <Feather
                      name={
                        solicitudSeleccionada.estado === 'aprobada'
                          ? 'check-circle'
                          : 'alert-circle'
                      }
                      size={17}
                      color={
                        solicitudSeleccionada.estado === 'aprobada' ? '#4ADE80' : '#F87171'
                      }
                    />
                    <Text
                      style={[
                        styles.resolutionTitle,
                        {
                          color:
                            solicitudSeleccionada.estado === 'aprobada'
                              ? esOscuro ? '#4ADE80' : '#455E24'
                              : esOscuro ? '#F87171' : '#833932',
                        },
                      ]}
                    >
                      {solicitudSeleccionada.estado === 'aprobada'
                        ? 'Solicitud aprobada'
                        : 'Solicitud rechazada'}
                    </Text>
                  </View>
                  <Text style={styles.resolutionBody}>
                    {solicitudSeleccionada.comentario_resolucion ||
                      solicitudSeleccionada.observaciones ||
                      (solicitudSeleccionada.estado === 'aprobada'
                        ? 'Tu solicitud ha sido aprobada por administración.'
                        : 'Tu solicitud no pudo ser aprobada en esta ocasión.')}
                  </Text>
                </View>
              )}

              {/* Estado y Prioridad */}
              <View style={styles.detailSectionCard}>
                <Text style={styles.detailLabel}>Estado actual</Text>
                <View style={styles.detailStatusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusTheme(solicitudSeleccionada.estado, esOscuro).bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusTheme(solicitudSeleccionada.estado, esOscuro).dot },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusTheme(solicitudSeleccionada.estado, esOscuro).text },
                      ]}
                    >
                      {getStatusTheme(solicitudSeleccionada.estado, esOscuro).label}
                    </Text>
                  </View>

                  <View style={styles.detailPriorityPill}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            PRIORIDADES.find((p) => p.id === solicitudSeleccionada.prioridad)
                              ?.dotColor || '#E9D2BF',
                        },
                      ]}
                    />
                    <Text style={styles.detailPriorityText}>
                      Prioridad{' '}
                      {PRIORIDADES.find((p) => p.id === solicitudSeleccionada.prioridad)
                        ?.label || 'Media'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Rango de Fechas */}
              <View style={styles.detailSectionCard}>
                <Text style={styles.detailLabel}>Período de ausencia</Text>
                <View style={styles.detailPeriodRow}>
                  <View style={styles.detailDateBox}>
                    <Text style={styles.detailDateBoxLabel}>Desde</Text>
                    <Text style={styles.detailDateBoxValue}>
                      {solicitudSeleccionada.fecha_inicio}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={pulse.textTertiary} />
                  <View style={styles.detailDateBox}>
                    <Text style={styles.detailDateBoxLabel}>Hasta</Text>
                    <Text style={styles.detailDateBoxValue}>
                      {solicitudSeleccionada.fecha_fin}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Justificación */}
              <View style={styles.detailSectionCard}>
                <Text style={styles.detailLabel}>Justificación</Text>
                <Text style={styles.detailJustificationText}>
                  {solicitudSeleccionada.motivo || 'Sin justificación adicional.'}
                </Text>
              </View>

              {/* Comprobantes y Adjuntos */}
              {((solicitudSeleccionada.archivos_adjuntos &&
                solicitudSeleccionada.archivos_adjuntos.length > 0) ||
                solicitudSeleccionada.archivo_adjunto) && (
                <View style={styles.detailSectionCard}>
                  <Text style={styles.detailLabel}>Comprobantes adjuntos</Text>
                  <View style={styles.attachmentsList}>
                    {solicitudSeleccionada.archivos_adjuntos?.map((adj, i) => (
                      <TouchableOpacity
                        key={adj.id || `adj-${i}`}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (adj.uri) Linking.openURL(adj.uri).catch(() => {});
                        }}
                        style={styles.attachmentPreviewItem}
                      >
                        {adj.tipo === 'imagen' ? (
                          <Image source={{ uri: adj.uri }} style={styles.attachmentThumb} />
                        ) : (
                          <View style={styles.attachmentDocIcon}>
                            <Feather name="file-text" size={18} color={pulse.icon} />
                          </View>
                        )}
                        <View style={styles.attachmentMeta}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {adj.nombre}
                          </Text>
                          <Text style={styles.attachmentSub}>
                            {adj.tipo === 'imagen' ? 'Foto adjunta' : 'Documento'}
                          </Text>
                        </View>
                        <Feather name="external-link" size={15} color={pulse.textTertiary} />
                      </TouchableOpacity>
                    ))}
                    {!solicitudSeleccionada.archivos_adjuntos?.length &&
                      solicitudSeleccionada.archivo_adjunto && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            if (solicitudSeleccionada.archivo_adjunto)
                              Linking.openURL(solicitudSeleccionada.archivo_adjunto).catch(() => {});
                          }}
                          style={styles.attachmentPreviewItem}
                        >
                          <View style={styles.attachmentDocIcon}>
                            <Feather name="file-text" size={18} color={pulse.icon} />
                          </View>
                          <View style={styles.attachmentMeta}>
                            <Text style={styles.attachmentName} numberOfLines={1}>
                              Comprobante adjunto
                            </Text>
                            <Text style={styles.attachmentSub}>Toca para abrir</Text>
                          </View>
                          <Feather name="external-link" size={15} color={pulse.textTertiary} />
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              )}

              {/* Acciones de Edición y Cancelación */}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <View style={styles.detailActionsRow}>
                  <BotonAnimado
                    onPress={() => abrirFormularioEditar(solicitudSeleccionada)}
                    scaleTo={0.97}
                    style={styles.editButton}
                  >
                    <Feather name="edit-3" size={16} color={pulse.textInverse} />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </BotonAnimado>

                  <BotonAnimado
                    onPress={() => manejarCancelarSolicitud(solicitudSeleccionada)}
                    scaleTo={0.97}
                    style={styles.cancelButton}
                  >
                    <Feather name="trash-2" size={16} color={esOscuro ? '#F87171' : '#833932'} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </BotonAnimado>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </ModalShell>

      {/* MODAL CREAR / EDITAR SOLICITUD */}
      <ModalShell
        visible={modalFormVisible}
        onClose={() => setModalFormVisible(false)}
        maxHeight="92%"
        style={styles.modalBody}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBody}
        >
          {/* Header Modal Form */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalCategoryText}>
                {solicitudEditando ? 'MODIFICAR' : 'NUEVA SOLICITUD'}
              </Text>
              <Text style={styles.modalTitle}>
                {solicitudEditando ? 'Editar solicitud' : 'Solicitar ausencia'}
              </Text>
            </View>

            <BotonAnimado
              onPress={() => setModalFormVisible(false)}
              scaleTo={0.92}
              style={styles.modalCloseButton}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScroll}
          >
            {/* Título o Asunto */}
            <Text style={styles.formLabel}>Asunto o título</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej. Vacaciones de verano, Cita médica..."
              placeholderTextColor={pulse.textTertiary}
              value={asunto}
              onChangeText={setAsunto}
            />

            {/* Categorías */}
            <Text style={styles.formLabel}>Motivo principal</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIAS.map((cat) => {
                const active = tipo === cat.id;
                return (
                  <BotonAnimado
                    key={cat.id}
                    onPress={() => setTipo(cat.id)}
                    scaleTo={0.95}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Feather
                      name={cat.icon}
                      size={14}
                      color={active ? pulse.textInverse : pulse.textTertiary}
                    />
                    <Text
                      style={[
                        styles.categoryChipLabel,
                        active && styles.categoryChipLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Selector de Rango de Fechas */}
            <View style={styles.dateHeaderRow}>
              <Text style={styles.formLabelNoMargin}>Período de fechas</Text>
              {diasSeleccionadosCount > 0 && (
                <View style={styles.daysCountPill}>
                  <Text style={styles.daysCountText}>
                    {diasSeleccionadosCount} {diasSeleccionadosCount === 1 ? 'día' : 'días'}
                  </Text>
                </View>
              )}
            </View>

            <BotonAnimado
              onPress={() => setCalendarioAbierto(!calendarioAbierto)}
              scaleTo={0.98}
              style={[
                styles.dateRangePickerCard,
                calendarioAbierto && styles.dateRangePickerCardActive,
              ]}
            >
              <View style={styles.dateSlot}>
                <Text style={styles.dateSlotLabel}>Inicio</Text>
                <View style={styles.dateSlotValueWrap}>
                  <Feather name="calendar" size={14} color={pulse.icon} />
                  <Text
                    style={[
                      styles.dateSlotValue,
                      !fechaInicio && { color: pulse.textTertiary },
                    ]}
                  >
                    {fechaInicio || 'Seleccionar'}
                  </Text>
                </View>
              </View>

              <Feather name="arrow-right" size={16} color={pulse.textTertiary} />

              <View style={styles.dateSlot}>
                <Text style={styles.dateSlotLabel}>Fin</Text>
                <View style={styles.dateSlotValueWrap}>
                  <Feather name="calendar" size={14} color={pulse.icon} />
                  <Text
                    style={[
                      styles.dateSlotValue,
                      !fechaFin && { color: pulse.textTertiary },
                    ]}
                  >
                    {fechaFin || 'Seleccionar'}
                  </Text>
                </View>
              </View>
            </BotonAnimado>

            {/* Calendario Embebido Interactivo */}
            {calendarioAbierto && (
              <Animated.View
                entering={FadeInDown.duration(240)}
                style={styles.calendarContainer}
              >
                {/* Cabecera del Mes */}
                <View style={styles.calHeader}>
                  <BotonAnimado
                    onPress={() => cambiarMesCal(-1)}
                    scaleTo={0.88}
                    style={styles.calNavBtn}
                  >
                    <Feather name="chevron-left" size={18} color={pulse.icon} />
                  </BotonAnimado>
                  <Text style={styles.calMonthTitle}>
                    {NOMBRES_MESES[calMes]} {calAnio}
                  </Text>
                  <BotonAnimado
                    onPress={() => cambiarMesCal(1)}
                    scaleTo={0.88}
                    style={styles.calNavBtn}
                  >
                    <Feather name="chevron-right" size={18} color={pulse.icon} />
                  </BotonAnimado>
                </View>

                {/* Días de la Semana */}
                <View style={styles.calWeekRow}>
                  {DIAS_SEMANA.map((d) => (
                    <Text key={d} style={styles.calWeekDay}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Cuadrícula de Días */}
                <View style={styles.calDaysGrid}>
                  {diasEnMes.map((dia, idx) => {
                    if (dia === 0) {
                      return <View key={`empty-${idx}`} style={styles.calDayEmpty} />;
                    }

                    const fechaDia = formatearFecha(calAnio, calMes, dia);
                    const esInicio = fechaDia === fechaInicio;
                    const esFin = fechaDia === fechaFin;
                    const enRango =
                      fechaInicio && fechaFin && fechaDia > fechaInicio && fechaDia < fechaFin;
                    const esHoy =
                      fechaDia ===
                      formatearFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                    return (
                      <TouchableOpacity
                        key={`day-${dia}`}
                        onPress={() => seleccionarDiaCalendario(dia)}
                        activeOpacity={0.7}
                        style={[
                          styles.calDayBtn,
                          enRango && styles.calDayInRange,
                          (esInicio || esFin) && styles.calDayEdge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calDayText,
                            esHoy && styles.calDayTodayText,
                            enRango && styles.calDayInRangeText,
                            (esInicio || esFin) && styles.calDayEdgeText,
                          ]}
                        >
                          {dia}
                        </Text>
                        {esHoy && !(esInicio || esFin) && <View style={styles.calTodayDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Botón Aplicar */}
                <BotonAnimado
                  onPress={() => setCalendarioAbierto(false)}
                  scaleTo={0.96}
                  style={styles.calApplyBtn}
                >
                  <Text style={styles.calApplyBtnText}>Aplicar selección</Text>
                </BotonAnimado>
              </Animated.View>
            )}

            {/* Justificación */}
            <View style={styles.dateHeaderRow}>
              <Text style={styles.formLabelNoMargin}>Justificación o notas</Text>
              <Text style={styles.optionalBadge}>Opcional</Text>
            </View>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Escribe detalles adicionales sobre tu solicitud..."
              placeholderTextColor={pulse.textTertiary}
              multiline
              numberOfLines={3}
              value={motivo}
              onChangeText={setMotivo}
            />

            {/* Comprobantes Adjuntos */}
            <View style={styles.dateHeaderRow}>
              <Text style={styles.formLabelNoMargin}>Comprobantes o fotos</Text>
              <Text style={styles.optionalBadge}>Opcional</Text>
            </View>

            {adjuntos.length > 0 && (
              <View style={styles.attachmentsList}>
                {adjuntos.map((adj) => (
                  <Animated.View
                    key={adj.id}
                    entering={FadeInDown.duration(200)}
                    style={styles.attachmentFormItem}
                  >
                    {adj.tipo === 'imagen' ? (
                      <Image source={{ uri: adj.uri }} style={styles.attachmentThumb} />
                    ) : (
                      <View style={styles.attachmentDocIcon}>
                        <Feather name="file-text" size={18} color={pulse.icon} />
                      </View>
                    )}
                    <View style={styles.attachmentMeta}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {adj.nombre}
                      </Text>
                      <Text style={styles.attachmentSub}>
                        {adj.tipo === 'imagen' ? 'Foto adjunta' : 'Documento cargado'}
                      </Text>
                    </View>
                    <BotonAnimado
                      onPress={() => eliminarAdjunto(adj.id)}
                      scaleTo={0.9}
                      style={styles.removeAttachmentBtn}
                    >
                      <Feather name="trash-2" size={15} color={esOscuro ? '#F87171' : '#833932'} />
                    </BotonAnimado>
                  </Animated.View>
                ))}
              </View>
            )}

            <BotonAnimado
              onPress={mostrarOpcionesAdjunto}
              scaleTo={0.97}
              style={styles.attachButton}
            >
              <View style={styles.attachIconWrap}>
                <Feather name="paperclip" size={16} color={pulse.icon} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachTitle}>
                  {adjuntos.length > 0 ? '+ Adjuntar otro archivo' : 'Adjuntar documento o foto'}
                </Text>
                <Text style={styles.attachSub}>Formatos PDF, Word, fotos de cámara o galería</Text>
              </View>
              <Feather name="plus" size={17} color={pulse.textTertiary} />
            </BotonAnimado>

            {/* Prioridad */}
            <Text style={styles.formLabel}>Nivel de prioridad</Text>
            <View style={styles.priorityGrid}>
              {PRIORIDADES.map((p) => {
                const active = prioridad === p.id;
                return (
                  <BotonAnimado
                    key={p.id}
                    onPress={() => setPrioridad(p.id)}
                    scaleTo={0.95}
                    style={[styles.priorityChip, active && styles.priorityChipActive]}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: p.dotColor }]} />
                    <Text
                      style={[
                        styles.priorityChipText,
                        active && styles.priorityChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Botón Guardar / Enviar */}
            <BotonAnimado
              style={[styles.submitButton, enviando && { opacity: 0.6 }]}
              onPress={manejarGuardarSolicitud}
              scaleTo={0.97}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color={pulse.textInverse} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {solicitudEditando ? 'Guardar cambios' : 'Enviar solicitud'}
                  </Text>
                  <Feather name="check" size={17} color={pulse.textInverse} />
                </>
              )}
            </BotonAnimado>
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

// Subcomponente Chip de Filtro idéntico a Mi Pulso
function ScopeChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);

  return (
    <BotonAnimado
      scaleTo={0.97}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={styles.chipCountText}>{count}</Text>
      </View>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </BotonAnimado>
  );
}

// Subcomponente Tarjeta de Solicitud Bento idéntico a checkinCard
function SolicitudCard({
  solicitud,
  onPress,
}: {
  solicitud: Absence;
  onPress: () => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);
  const theme = getStatusTheme(solicitud.estado, esOscuro);
  const categoria = CATEGORIAS.find((c) => c.id === solicitud.tipo);
  const adjuntosCount =
    (solicitud.archivos_adjuntos?.length || 0) + (solicitud.archivo_adjunto ? 1 : 0);

  return (
    <BotonAnimado
      scaleTo={0.98}
      onPress={onPress}
      style={styles.checkinCard}
      accessibilityLabel="Ver detalle de la solicitud"
    >
      <View style={styles.recordTop}>
        <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: theme.dot }]} />
          <Text style={[styles.statusText, { color: theme.text }]}>{theme.label}</Text>
        </View>

        <View style={styles.arrowButton}>
          <Feather name="arrow-up-right" size={18} color={pulse.icon} />
        </View>
      </View>

      <Text style={styles.recordTitle} numberOfLines={1}>
        {solicitud.asunto || categoria?.label || 'Solicitud de ausencia'}
      </Text>

      {solicitud.motivo && solicitud.motivo !== 'Sin justificación adicional' ? (
        <Text style={styles.recordDetail} numberOfLines={2}>
          {solicitud.motivo}
        </Text>
      ) : null}

      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color={pulse.textTertiary} />
          <Text style={styles.time}>
            {formatPeriodDate(solicitud.fecha_inicio, solicitud.fecha_fin)}
          </Text>
        </View>

        <View style={styles.footerTags}>
          {adjuntosCount > 0 && (
            <View style={styles.tagPill}>
              <Feather name="paperclip" size={11} color={pulse.textTertiary} />
              <Text style={styles.tagPillText}>{adjuntosCount}</Text>
            </View>
          )}

          <View style={styles.tagPill}>
            <View
              style={[
                styles.priorityDot,
                {
                  backgroundColor:
                    PRIORIDADES.find((p) => p.id === solicitud.prioridad)?.dotColor || '#E9D2BF',
                },
              ]}
            />
            <Text style={styles.tagPillText}>
              {PRIORIDADES.find((p) => p.id === solicitud.prioridad)?.label || 'Media'}
            </Text>
          </View>
        </View>
      </View>
    </BotonAnimado>
  );
}

// Subcomponente Overview Banner Ejecutivo inspirado en PulseOverviewCard
function SolicitudesOverviewCard({
  total,
  pendientes,
  aprobadas,
  destacada,
  onPressNueva,
}: {
  total: number;
  pendientes: number;
  aprobadas: number;
  destacada: Absence | null;
  onPressNueva: () => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);

  return (
    <View style={styles.overviewContainer}>
      <LinearGradient
        colors={pulse.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overviewGradient}
      >
        <View style={styles.overviewHeader}>
          <View>
            <Text style={styles.overviewPretitle}>BALANCE DE PERMISOS</Text>
            <Text style={styles.overviewTitle}>Tus solicitudes activas</Text>
          </View>
          <BotonAnimado onPress={onPressNueva} scaleTo={0.92} style={styles.overviewNewBtn}>
            <Feather name="plus" size={16} color="#FFFFFF" />
          </BotonAnimado>
        </View>

        <View style={styles.overviewMetricsRow}>
          <View style={styles.overviewMetricItem}>
            <View style={styles.overviewIconWrap}>
              <Feather name="clock" size={13} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.overviewMetricVal}>{pendientes}</Text>
              <Text style={styles.overviewMetricLbl}>En revisión</Text>
            </View>
          </View>

          <View style={styles.overviewMetricItem}>
            <View style={styles.overviewIconWrap}>
              <Feather name="check" size={13} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.overviewMetricVal}>{aprobadas}</Text>
              <Text style={styles.overviewMetricLbl}>Aprobadas</Text>
            </View>
          </View>

          <View style={styles.overviewMetricItem}>
            <View style={styles.overviewIconWrap}>
              <Feather name="layers" size={13} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.overviewMetricVal}>{total}</Text>
              <Text style={styles.overviewMetricLbl}>Totales</Text>
            </View>
          </View>
        </View>

        {destacada ? (
          <View style={styles.overviewBottomBox}>
            <Text style={styles.overviewBottomBoxLabel}>ÚLTIMO REGISTRO</Text>
            <View style={styles.overviewBottomBoxContent}>
              <Text style={styles.overviewBottomBoxTitle} numberOfLines={1}>
                {destacada.asunto || destacada.tipo}
              </Text>
              <Text style={styles.overviewBottomBoxDate}>
                {destacada.fecha_inicio} · {destacada.estado}
              </Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

// Subcomponente Empty Card
function EmptySolicitudesCard({
  scope,
  onPress,
}: {
  scope: FilterScope;
  onPress: () => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);

  const label =
    scope === 'todas'
      ? 'Sin solicitudes registradas'
      : scope === 'pendiente'
      ? 'Sin solicitudes pendientes'
      : scope === 'aprobada'
      ? 'Sin solicitudes aprobadas'
      : 'Sin solicitudes rechazadas';

  return (
    <BotonAnimado scaleTo={0.98} onPress={onPress} style={styles.checkinCard}>
      <View style={styles.recordTop}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: pulse.textTertiary }]} />
          <Text style={styles.statusText}>{label}</Text>
        </View>
        <View style={styles.arrowButton}>
          <Feather name="plus" size={18} color={pulse.icon} />
        </View>
      </View>
      <Text style={styles.recordTitle}>Solicita tu tiempo libre</Text>
      <Text style={styles.recordDetail}>
        Planifica tus vacaciones, descansos médicos o permisos especiales fácilmente.
      </Text>
      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color={pulse.textTertiary} />
          <Text style={styles.time}>Toma menos de un minuto</Text>
        </View>
      </View>
    </BotonAnimado>
  );
}

// Skeleton de Carga
function OverviewSkeleton() {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createAusenciaStyles(pulse, esOscuro), [pulse, esOscuro]);

  return (
    <View style={styles.loadingCard}>
      <Skeleton width="40%" height={16} radius={8} />
      <View style={styles.loadingContent}>
        <Skeleton width="100%" height={48} radius={14} />
        <Skeleton width="100%" height={38} radius={14} />
      </View>
    </View>
  );
}

const isIOS = Platform.OS === 'ios';

function createAusenciaStyles(pulse: PulseColors, esOscuro: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },
    ambient: { ...StyleSheet.absoluteFill },
    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
    },
    /* Top Bar */
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
    backButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
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
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    hero: {
      marginTop: isIOS ? 22 : 16,
      marginBottom: isIOS ? 20 : 16,
      color: pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      letterSpacing: isIOS ? -1.4 : -0.9,
      fontWeight: '600',
    },

    // Overview Banner Ejecutivo
    overviewContainer: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    overviewGradient: {
      padding: 18,
      minHeight: 180,
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    overviewPretitle: {
      color: 'rgba(255, 255, 255, 0.48)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    overviewTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 2,
    },
    overviewNewBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overviewMetricsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    overviewMetricItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 14,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.04)',
      gap: 8,
    },
    overviewIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overviewMetricVal: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    overviewMetricLbl: {
      color: 'rgba(255, 255, 255, 0.52)',
      fontSize: 10,
      fontWeight: '500',
    },
    overviewBottomBox: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    overviewBottomBoxLabel: {
      color: 'rgba(255, 255, 255, 0.45)',
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.6,
    },
    overviewBottomBoxContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 3,
    },
    overviewBottomBoxTitle: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    overviewBottomBoxDate: {
      color: 'rgba(255, 255, 255, 0.52)',
      fontSize: 11,
      fontWeight: '500',
    },

    // Skeleton
    loadingCard: {
      minHeight: 180,
      borderRadius: 24,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 18,
      gap: 16,
    },
    loadingContent: {
      gap: 10,
    },

    // Secciones
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 26,
      marginBottom: 14,
    },
    sectionTitle: {
      color: pulse.text,
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: -0.8,
    },
    viewAll: { color: pulse.inverse, fontSize: 14, fontWeight: '600' },

    // Chips
    chips: { gap: 9, paddingRight: 20 },
    chip: {
      height: 50,
      borderRadius: 25,
      paddingHorizontal: 9,
      paddingRight: 17,
      backgroundColor: pulse.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    chipActive: { backgroundColor: pulse.chipActive, borderColor: pulse.chipActive },
    chipCount: {
      minWidth: 32,
      height: 32,
      paddingHorizontal: 8,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipCountActive: { backgroundColor: pulse.surfaceElevated },
    chipCountText: { color: pulse.text, fontSize: 14, fontWeight: '700' },
    chipLabel: { color: pulse.textTertiary, fontSize: 14, fontWeight: '600' },
    chipLabelActive: { color: pulse.textInverse },

    // Lista de Solicitudes y Bento Cards
    requestList: {
      marginTop: 14,
      gap: 12,
    },
    checkinCard: {
      minHeight: 160,
      padding: 18,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
    },
    recordTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusPill: {
      minHeight: 29,
      borderRadius: 15,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: pulse.pill,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },
    arrowButton: {
      width: 39,
      height: 39,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    recordTitle: {
      color: pulse.text,
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: -0.55,
      textTransform: 'capitalize',
      marginTop: 12,
    },
    recordDetail: {
      color: pulse.textTertiary,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    recordFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    time: { color: pulse.textTertiary, fontSize: 12, fontWeight: '600' },
    footerTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tagPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    tagPillText: {
      color: pulse.textTertiary,
      fontSize: 11,
      fontWeight: '600',
    },
    priorityDot: { width: 6, height: 6, borderRadius: 3 },

    // Modales
    modalBody: { flex: 1, backgroundColor: pulse.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 2,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    modalCategoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCategoryText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: pulse.textTertiary,
      letterSpacing: 0.6,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: pulse.text,
      letterSpacing: -0.4,
    },
    modalCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalScroll: {
      paddingBottom: 30,
    },

    // Detalle Modal
    resolutionCard: {
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
    },
    resolutionCardApproved: {
      backgroundColor: esOscuro ? 'rgba(74, 222, 128, 0.12)' : '#F2F8EC',
      borderColor: esOscuro ? 'rgba(74, 222, 128, 0.3)' : '#D4E8BF',
    },
    resolutionCardRejected: {
      backgroundColor: esOscuro ? 'rgba(248, 113, 113, 0.12)' : '#FAF0EF',
      borderColor: esOscuro ? 'rgba(248, 113, 113, 0.3)' : '#F0D5D3',
    },
    resolutionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 4,
    },
    resolutionTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    resolutionBody: {
      fontSize: 12.5,
      color: pulse.textTertiary,
      lineHeight: 18,
      marginTop: 2,
    },
    detailSectionCard: {
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: pulse.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    detailStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    detailPriorityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailPriorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: pulse.text,
    },
    detailPeriodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    detailDateBox: {
      flex: 1,
      backgroundColor: pulse.surface,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
    },
    detailDateBoxLabel: {
      fontSize: 9.5,
      fontWeight: '600',
      color: pulse.textTertiary,
      textTransform: 'uppercase',
    },
    detailDateBoxValue: {
      fontSize: 13.5,
      fontWeight: '700',
      color: pulse.text,
      marginTop: 2,
    },
    detailJustificationText: {
      fontSize: 13.5,
      color: pulse.text,
      lineHeight: 19,
      fontWeight: '500',
    },
    attachmentsList: {
      gap: 8,
      marginTop: 4,
    },
    attachmentPreviewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: pulse.surface,
      borderRadius: 14,
      padding: 8,
      gap: 10,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
    },
    attachmentThumb: {
      width: 40,
      height: 40,
      borderRadius: 10,
    },
    attachmentDocIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentMeta: {
      flex: 1,
    },
    attachmentName: {
      fontSize: 12.5,
      fontWeight: '600',
      color: pulse.text,
    },
    attachmentSub: {
      fontSize: 10.5,
      color: pulse.textTertiary,
      marginTop: 1,
    },
    detailActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
      marginBottom: 10,
    },
    editButton: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      backgroundColor: pulse.inverse,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    editButtonText: {
      color: pulse.textInverse,
      fontSize: 14,
      fontWeight: '700',
    },
    cancelButton: {
      height: 48,
      paddingHorizontal: 18,
      borderRadius: 24,
      backgroundColor: esOscuro ? 'rgba(239,68,68,0.15)' : '#FAF0EF',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(239,68,68,0.3)' : '#F0D5D3',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    cancelButtonText: {
      color: esOscuro ? '#F87171' : '#833932',
      fontSize: 13.5,
      fontWeight: '700',
    },

    // Formularios de Creación
    formLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: pulse.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 14,
      marginBottom: 8,
    },
    formLabelNoMargin: {
      fontSize: 11,
      fontWeight: '700',
      color: pulse.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    dateHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    daysCountPill: {
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 10,
    },
    daysCountText: {
      fontSize: 11,
      fontWeight: '700',
      color: pulse.text,
    },
    optionalBadge: {
      fontSize: 10,
      fontWeight: '600',
      color: pulse.textTertiary,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    formInput: {
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 12,
      fontSize: 14.5,
      color: pulse.text,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
      paddingTop: 11,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    categoryChipActive: {
      backgroundColor: pulse.inverse,
      borderColor: pulse.inverse,
    },
    categoryChipLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: pulse.textTertiary,
    },
    categoryChipLabelActive: {
      color: pulse.textInverse,
    },

    // Selector de Fechas
    dateRangePickerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    dateRangePickerCardActive: {
      backgroundColor: pulse.surfaceElevated,
      borderColor: pulse.inverse,
    },
    dateSlot: { flex: 1 },
    dateSlotLabel: {
      fontSize: 9.5,
      fontWeight: '700',
      color: pulse.textTertiary,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    dateSlotValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateSlotValue: {
      fontSize: 13.5,
      fontWeight: '700',
      color: pulse.text,
    },

    // Calendario Embebido
    calendarContainer: {
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      padding: 14,
      marginTop: 10,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
    },
    calHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    calMonthTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: pulse.text,
      letterSpacing: -0.2,
    },
    calNavBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    calWeekDay: {
      width: 36,
      textAlign: 'center',
      fontSize: 10.5,
      fontWeight: '700',
      color: pulse.textTertiary,
    },
    calDaysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calDayEmpty: {
      width: '14.28%',
      height: 36,
    },
    calDayBtn: {
      width: '14.28%',
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    calDayInRange: {
      backgroundColor: pulse.pill,
      borderRadius: 0,
    },
    calDayEdge: {
      backgroundColor: pulse.inverse,
      borderRadius: 10,
    },
    calDayText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: pulse.text,
    },
    calDayInRangeText: {
      color: pulse.text,
      fontWeight: '700',
    },
    calDayEdgeText: {
      color: pulse.textInverse,
      fontWeight: '700',
    },
    calDayTodayText: {
      color: pulse.inverse,
      fontWeight: '800',
    },
    calTodayDot: {
      width: 3.5,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: pulse.inverse,
      marginTop: 1,
    },
    calApplyBtn: {
      marginTop: 10,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calApplyBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: pulse.text,
    },

    // Adjuntos en Form
    attachmentFormItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 14,
      padding: 8,
      gap: 10,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    removeAttachmentBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: esOscuro ? 'rgba(239,68,68,0.15)' : '#FAF0EF',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(239,68,68,0.3)' : '#F0D5D3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      borderStyle: 'dashed',
    },
    attachIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    attachTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: pulse.text,
    },
    attachSub: {
      fontSize: 10.5,
      color: pulse.textTertiary,
      marginTop: 1,
    },

    // Prioridades en Form
    priorityGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    priorityChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    priorityChipActive: {
      backgroundColor: pulse.surface,
      borderColor: pulse.inverse,
      ...SOMBRAS.suave,
    },
    priorityChipText: {
      fontSize: 11.5,
      color: pulse.textTertiary,
      fontWeight: '600',
    },
    priorityChipTextActive: {
      color: pulse.text,
      fontWeight: '700',
    },

    // Submit Button
    submitButton: {
      marginTop: 22,
      borderRadius: 24,
      height: 50,
      backgroundColor: pulse.inverse,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    submitButtonText: {
      color: pulse.textInverse,
      fontWeight: '700',
      fontSize: 14.5,
      letterSpacing: -0.2,
    },
  });
}
