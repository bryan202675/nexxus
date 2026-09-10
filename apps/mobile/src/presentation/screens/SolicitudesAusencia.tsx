/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/SolicitudesAusencia.tsx
 * Capa: presentacion.
 * Proposito: Gestión, creación, detalle, edición y cancelación de solicitudes de ausencia.
 * Rediseñado con estética Glassmorphism monocromática ejecutiva, selector de rango
 * de fechas con calendario visual interactivo, adjuntos múltiples y animaciones fluidas con Reanimated.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Absence, AdjuntoItem } from 'domain/entities/Absence';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import ModalShell from '@/presentation/components/ui/ModalShell';
import EmptyState from '@/presentation/components/ui/EmptyState';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props {
  navigation: any;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COLORES_PRIORIDAD: Record<Absence['prioridad'], string> = {
  baja: '#10B981',
  media: '#3B82F6',
  alta: '#F59E0B',
  urgente: '#EF4444',
};

const ICONOS_CATEGORIA: Partial<Record<Absence['tipo'], React.ComponentProps<typeof Feather>['name']>> = {
  vacaciones: 'sun',
  enfermedad: 'activity',
  personal: 'user',
  emergencia: 'alert-triangle',
  capacitacion: 'book-open',
  otro: 'file-text',
};

export default function SolicitudesAusencia({ navigation }: Props) {
  const { t } = useTranslation();
  const { solicitudes, crearSolicitudAusencia, actualizarSolicitudAusencia, cancelarSolicitudAusencia, recargarDatos } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilosSolicAus(colores, esOscuro), [colores, esOscuro]);

  // Modales
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Absence | null>(null);
  const [solicitudEditando, setSolicitudEditando] = useState<Absence | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const manejarRefrescar = async () => {
    setRefrescando(true);
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } catch {}
    setRefrescando(false);
  };

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

  // Selección de archivos múltiples
  const tomarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('solicitudesAusencia.permission_required_title', { defaultValue: 'Permiso requerido' }), t('solicitudesAusencia.permission_camera_msg', { defaultValue: 'Se necesita acceso a la cámara para tomar una foto.' }));
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
    } catch (e) {
      Alert.alert(t('solicitudesAusencia.alert_error', { defaultValue: 'Error' }), t('solicitudesAusencia.error_camera_msg', { defaultValue: 'No se pudo abrir la cámara.' }));
    }
  };

  const seleccionarDeGaleria = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('solicitudesAusencia.permission_required_title', { defaultValue: 'Permiso requerido' }), t('solicitudesAusencia.permission_gallery_msg', { defaultValue: 'Se necesita acceso a la galería para seleccionar imágenes.' }));
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
    } catch (e) {
      Alert.alert(t('solicitudesAusencia.alert_error', { defaultValue: 'Error' }), t('solicitudesAusencia.error_gallery_msg', { defaultValue: 'No se pudo abrir la galería.' }));
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
          nombre: file.name || `archivo_${index + 1}`,
          tipo: file.mimeType?.startsWith('image/') ? 'imagen' : 'documento',
        }));
        setAdjuntos((prev) => [...prev, ...nuevos]);
      }
    } catch (e) {
      Alert.alert(t('solicitudesAusencia.alert_error', { defaultValue: 'Error' }), t('solicitudesAusencia.error_document_msg', { defaultValue: 'No se pudo seleccionar el documento.' }));
    }
  };

  const mostrarOpcionesAdjunto = () => {
    Alert.alert(
      t('solicitudesAusencia.attach_options_title', { defaultValue: 'Adjuntar comprobante o archivo' }),
      t('solicitudesAusencia.attach_options_msg', { defaultValue: 'Selecciona el origen del archivo:' }),
      [
        { text: t('solicitudesAusencia.attach_option_browse', { defaultValue: 'Explorar Archivos' }), onPress: seleccionarDocumento },
        { text: t('solicitudesAusencia.attach_option_photo', { defaultValue: 'Tomar foto' }), onPress: tomarFoto },
        { text: t('solicitudesAusencia.attach_option_gallery', { defaultValue: 'Elegir de la galería' }), onPress: seleccionarDeGaleria },
        { text: t('solicitudesAusencia.attach_option_cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
      ]
    );
  };

  const eliminarAdjunto = (id: string) => {
    setAdjuntos((prev) => prev.filter((a) => a.id !== id));
  };

  const abrirFormularioCrear = () => {
    setSolicitudEditando(null);
    resetForm();
    setModalFormVisible(true);
  };

  const abrirFormularioEditar = (sol: Absence) => {
    setSolicitudEditando(sol);
    setAsunto(sol.asunto || '');
    setTipo(sol.tipo || 'vacaciones');
    setFechaInicio(sol.fecha_inicio || '');
    setFechaFin(sol.fecha_fin || '');
    setMotivo(sol.motivo === 'Sin justificación adicional' ? '' : (sol.motivo || ''));
    setPrioridad(sol.prioridad || 'media');
    setAdjuntos(sol.archivos_adjuntos || (sol.archivo_adjunto ? [{ id: '1', uri: sol.archivo_adjunto, nombre: 'Archivo adjunto', tipo: 'documento' }] : []));
    setDetalleModalVisible(false);
    setModalFormVisible(true);
  };

  const manejarGuardarSolicitud = async () => {
    if (!asunto.trim() || !fechaInicio || !fechaFin) {
      Alert.alert(t('solicitudesAusencia.alert_incomplete'), t('solicitudesAusencia.alert_incomplete_msg'));
      return;
    }

    setEnviando(true);
    try {
      if (solicitudEditando) {
        // Modo Edición
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
        Alert.alert(t('solicitudesAusencia.alert_update_success', { defaultValue: 'Solicitud Actualizada' }), t('solicitudesAusencia.alert_update_success_msg', { defaultValue: 'Los cambios en tu solicitud se han guardado con éxito.' }));
      } else {
        // Modo Creación
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
        Alert.alert(t('solicitudesAusencia.alert_success'), t('solicitudesAusencia.alert_success_msg'));
      }
      setModalFormVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert(t('common.error'), t('solicitudesAusencia.alert_error_msg'));
    } finally {
      setEnviando(false);
    }
  };

  const manejarCancelarSolicitud = (sol: Absence) => {
    Alert.alert(
      t('solicitudesAusencia.cancel_confirm_title', { defaultValue: 'Cancelar Solicitud' }),
      t('solicitudesAusencia.cancel_confirm_msg', { subject: sol.asunto || sol.tipo, defaultValue: `¿Estás seguro de cancelar tu solicitud de ${sol.asunto || sol.tipo}? Esta acción no se puede deshacer.` }),
      [
        { text: t('solicitudesAusencia.cancel_confirm_keep', { defaultValue: 'No, mantener' }), style: 'cancel' },
        {
          text: t('solicitudesAusencia.cancel_confirm_confirm', { defaultValue: 'Sí, cancelar solicitud' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (cancelarSolicitudAusencia) {
                await cancelarSolicitudAusencia(sol.id);
              }
              setDetalleModalVisible(false);
              setSolicitudSeleccionada(null);
              Alert.alert(t('solicitudesAusencia.cancel_success_title', { defaultValue: 'Solicitud Cancelada' }), t('solicitudesAusencia.cancel_success_msg', { defaultValue: 'La solicitud ha sido cancelada correctamente.' }));
            } catch (e) {
              Alert.alert(t('solicitudesAusencia.alert_error', { defaultValue: 'Error' }), t('solicitudesAusencia.cancel_error_msg', { defaultValue: 'No se pudo cancelar la solicitud.' }));
            }
          },
        },
      ]
    );
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

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return '#10B981';
      case 'rechazada':
        return '#EF4444';
      case 'cancelada':
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  const categorias: { id: Absence['tipo']; label: string }[] = [
    { id: 'vacaciones', label: t('solicitudesAusencia.categories.vacaciones') },
    { id: 'enfermedad', label: t('solicitudesAusencia.categories.enfermedad') },
    { id: 'personal', label: t('solicitudesAusencia.categories.personal') },
    { id: 'emergencia', label: t('solicitudesAusencia.categories.emergencia') },
    { id: 'capacitacion', label: t('solicitudesAusencia.categories.capacitacion') },
  ];

  const prioridades: { id: Absence['prioridad']; label: string }[] = [
    { id: 'baja', label: t('solicitudesAusencia.priorities.low') },
    { id: 'media', label: t('solicitudesAusencia.priorities.medium') },
    { id: 'alta', label: t('solicitudesAusencia.priorities.high') },
    { id: 'urgente', label: t('solicitudesAusencia.priorities.urgent') },
  ];

  const renderItem = ({ item, index }: { item: Absence; index: number }) => {
    const colorSt = obtenerColorEstado(item.estado);
    const iconoCat = ICONOS_CATEGORIA[item.tipo] || 'clock';
    const totalAdjuntos = item.archivos_adjuntos?.length || (item.archivo_adjunto ? 1 : 0);
    const observacionAdmin = item.comentario_resolucion || item.observaciones;

    return (
      <Animated.View entering={FadeInDown.duration(280).delay(index * 35)} style={estilos.bentoCard}>
        <BotonAnimado
          onPress={() => {
            setSolicitudSeleccionada(item);
            setDetalleModalVisible(true);
          }}
          scaleTo={0.98}
          style={{ width: '100%' }}
        >
          <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.bentoContent}>
            <View style={estilos.headerTarjeta}>
              <View style={estilos.infoBasica}>
                <View style={estilos.filaTipo}>
                  <View style={estilos.iconoTipoPill}>
                    <Feather name={iconoCat} size={12} color={colores.texto} />
                  </View>
                  <Text style={estilos.tipoSolicitud}>{t(`solicitudesAusencia.categories.${item.tipo}`, { defaultValue: item.tipo }).toUpperCase()}</Text>
                </View>
                <Text style={estilos.asuntoSolicitud} numberOfLines={1}>
                  {item.asunto || item.tipo.toUpperCase()}
                </Text>
              </View>
              <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '18', borderColor: colorSt + '40' }]}>
                <Text style={[estilos.textoBadge, { color: colorSt }]}>
                  {t(`common.${item.estado}`, { defaultValue: item.estado }).toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={estilos.motivoSolicitud} numberOfLines={2}>
              {item.motivo}
            </Text>

            {/* Banner de Observación de Aprobación/Rechazo */}
            {observacionAdmin && (item.estado === 'aprobada' || item.estado === 'rechazada') && (
              <View style={[estilos.resolucionBannerMini, item.estado === 'aprobada' ? estilos.resolucionBannerAprobada : estilos.resolucionBannerRechazada]}>
                <Feather
                  name={item.estado === 'aprobada' ? 'check-circle' : 'alert-circle'}
                  size={12}
                  color={item.estado === 'aprobada' ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[estilos.textoResolucionBannerMini, { color: item.estado === 'aprobada' ? '#10B981' : '#EF4444' }]}
                  numberOfLines={1}
                >
                  {observacionAdmin}
                </Text>
              </View>
            )}

            <View style={estilos.divisorHorizontal} />

            <View style={estilos.footerCard}>
              <View style={estilos.fechasSolicitud}>
                <Feather name="calendar" size={13} color={colores.textoSuave} />
                <Text style={estilos.textoFechas}>
                  {item.fecha_inicio} al {item.fecha_fin}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {totalAdjuntos > 0 && (
                  <View style={estilos.adjuntosBadgeMini}>
                    <Feather name="paperclip" size={11} color={colores.textoSuave} />
                    <Text style={estilos.textoAdjuntosBadgeMini}>{totalAdjuntos}</Text>
                  </View>
                )}
                <View style={estilos.prioridadPill}>
                  <View style={[estilos.puntoPrioridadMini, { backgroundColor: COLORES_PRIORIDAD[item.prioridad || 'media'] }]} />
                  <Text style={estilos.textoPrioridadMini}>{t(`solicitudesAusencia.priorities.${item.prioridad || 'media'}`)}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </BotonAnimado>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo={t('solicitudesAusencia.title')}
        subtitulo={t('solicitudesAusencia.nav_subtitle', { defaultValue: 'Gestión y permisos' })}
        mostrarAtras
        ocultarAccionesDerechas
        accionDerecha={
          <BotonAnimado
            onPress={abrirFormularioCrear}
            scaleTo={0.92}
            style={estilos.botonHeaderNueva}
            accessibilityLabel={t('solicitudesAusencia.new_request_label', { defaultValue: 'Nueva Solicitud' })}
          >
            <Feather name="plus" size={19} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
          </BotonAnimado>
        }
      />

      {/* Métricas rápidas de cabecera */}
      <View style={estilos.resumenSuperior}>
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.resumenVidrio}>
          <View style={estilos.metricaColumna}>
            <Text style={estilos.metricaValor}>{solicitudes.length}</Text>
            <Text style={estilos.metricaLabel}>{t('solicitudesAusencia.summary_total', { defaultValue: 'Total' })}</Text>
          </View>
          <View style={estilos.divisorVertical} />
          <View style={estilos.metricaColumna}>
            <Text style={[estilos.metricaValor, { color: '#F59E0B' }]}>
              {solicitudes.filter((s) => s.estado === 'pendiente').length}
            </Text>
            <Text style={estilos.metricaLabel}>{t('solicitudesAusencia.summary_pending', { defaultValue: 'Pendientes' })}</Text>
          </View>
          <View style={estilos.divisorVertical} />
          <View style={estilos.metricaColumna}>
            <Text style={[estilos.metricaValor, { color: '#10B981' }]}>
              {solicitudes.filter((s) => s.estado === 'aprobada').length}
            </Text>
            <Text style={estilos.metricaLabel}>{t('solicitudesAusencia.summary_approved', { defaultValue: 'Aprobadas' })}</Text>
          </View>
        </BlurView>
      </View>

      <Animated.FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        refreshing={refrescando}
        onRefresh={manejarRefrescar}
        ListEmptyComponent={
          <View style={estilos.emptyWrap}>
            <EmptyState
              icono="calendar"
              titulo={t('solicitudesAusencia.empty_msg')}
              detalle={t('solicitudesAusencia.empty_detail', { defaultValue: 'No tienes solicitudes registradas actualmente.' })}
            />
            <BotonAnimado
              onPress={abrirFormularioCrear}
              scaleTo={0.96}
              style={estilos.botonEmptyCTA}
            >
              <Feather name="plus" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
              <Text style={estilos.textoEmptyCTA}>{t('solicitudesAusencia.create_request_label', { defaultValue: 'Crear Solicitud' })}</Text>
            </BotonAnimado>
          </View>
        }
      />

      {/* Botón flotante inferior permanente para crear solicitud */}
      {solicitudes.length > 0 && (
        <View style={estilos.fabContenedor}>
          <BotonAnimado
            onPress={abrirFormularioCrear}
            scaleTo={0.95}
            style={estilos.fabBoton}
            accessibilityLabel={t('solicitudesAusencia.new_request_label', { defaultValue: 'Nueva Solicitud' })}
          >
            <Feather name="plus" size={18} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            <Text style={estilos.fabTexto}>{t('solicitudesAusencia.new_request_label', { defaultValue: 'Nueva Solicitud' })}</Text>
          </BotonAnimado>
        </View>
      )}

      {/* MODAL DETALLE DE SOLICITUD */}
      <ModalShell visible={detalleModalVisible} onClose={() => setDetalleModalVisible(false)} style={estilos.modalContenido}>
        {solicitudSeleccionada && (
          <View style={estilos.flexModal}>
            <View style={estilos.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={estilos.iconoTipoPill}>
                    <Feather name={ICONOS_CATEGORIA[solicitudSeleccionada.tipo] || 'clock'} size={12} color={colores.texto} />
                  </View>
                  <Text style={estilos.tipoSolicitud}>
                    {t(`solicitudesAusencia.categories.${solicitudSeleccionada.tipo}`, { defaultValue: solicitudSeleccionada.tipo }).toUpperCase()}
                  </Text>
                </View>
                <Text style={estilos.modalTitulo} numberOfLines={2}>
                  {solicitudSeleccionada.asunto || solicitudSeleccionada.tipo.toUpperCase()}
                </Text>
              </View>
              <BotonAnimado onPress={() => setDetalleModalVisible(false)} scaleTo={0.92} style={estilos.botonCerrarModal}>
                <Feather name="x" size={18} color={colores.texto} />
              </BotonAnimado>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollModal}>
              {/* Card de Resolución y Observación si ya fue aprobada o rechazada */}
              {(solicitudSeleccionada.estado === 'aprobada' || solicitudSeleccionada.estado === 'rechazada') && (
                <View
                  style={[
                    estilos.detalleSeccionCard,
                    solicitudSeleccionada.estado === 'aprobada'
                      ? estilos.detalleCardResolucionAprobada
                      : estilos.detalleCardResolucionRechazada,
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Feather
                      name={solicitudSeleccionada.estado === 'aprobada' ? 'check-circle' : 'alert-circle'}
                      size={18}
                      color={solicitudSeleccionada.estado === 'aprobada' ? '#10B981' : '#EF4444'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          estilos.detalleResolucionTitulo,
                          { color: solicitudSeleccionada.estado === 'aprobada' ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {solicitudSeleccionada.estado === 'aprobada'
                          ? t('solicitudesAusencia.resolution_approved_title', { defaultValue: 'Solicitud Aprobada' })
                          : t('solicitudesAusencia.resolution_rejected_title', { defaultValue: 'Solicitud Rechazada' })}
                      </Text>
                      {solicitudSeleccionada.resolved_at && (
                        <Text style={estilos.detalleResolucionFecha}>
                          {new Date(solicitudSeleccionada.resolved_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Text style={estilos.detalleLabel}>{t('solicitudesAusencia.resolution_message_label', { defaultValue: 'Mensaje / Observación de Administración' })}</Text>
                  <Text style={estilos.detalleMotivoTexto}>
                    {solicitudSeleccionada.comentario_resolucion ||
                      solicitudSeleccionada.observaciones ||
                      (solicitudSeleccionada.estado === 'aprobada'
                        ? t('solicitudesAusencia.resolution_default_approved', { defaultValue: 'Tu solicitud ha sido aprobada exitosamente.' })
                        : t('solicitudesAusencia.resolution_default_rejected', { defaultValue: 'Tu solicitud ha sido rechazada por administración.' }))}
                  </Text>
                </View>
              )}

              {/* Estado */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>{t('solicitudesAusencia.detail_status_label', { defaultValue: 'Estado actual' })}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <View style={[estilos.badgeEstado, { backgroundColor: obtenerColorEstado(solicitudSeleccionada.estado) + '18', borderColor: obtenerColorEstado(solicitudSeleccionada.estado) + '40' }]}>
                    <Text style={[estilos.textoBadge, { color: obtenerColorEstado(solicitudSeleccionada.estado) }]}>
                      {t(`common.${solicitudSeleccionada.estado}`, { defaultValue: solicitudSeleccionada.estado }).toUpperCase()}
                    </Text>
                  </View>
                  <View style={estilos.prioridadPill}>
                    <View style={[estilos.puntoPrioridadMini, { backgroundColor: COLORES_PRIORIDAD[solicitudSeleccionada.prioridad || 'media'] }]} />
                    <Text style={estilos.textoPrioridadMini}>
                      {t('solicitudesAusencia.detail_priority_label', { priority: t(`solicitudesAusencia.priorities.${solicitudSeleccionada.prioridad || 'media'}`), defaultValue: `Prioridad ${t(`solicitudesAusencia.priorities.${solicitudSeleccionada.prioridad || 'media'}`)}` })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Rango de Fechas */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>{t('solicitudesAusencia.detail_period_label', { defaultValue: 'Período de Ausencia' })}</Text>
                <View style={estilos.detalleFilaFechas}>
                  <View style={estilos.detalleFechaBox}>
                    <Text style={estilos.detalleFechaBoxLabel}>{t('solicitudesAusencia.detail_from_label', { defaultValue: 'Desde' })}</Text>
                    <Text style={estilos.detalleFechaBoxValor}>{solicitudSeleccionada.fecha_inicio}</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={colores.textoSuave} />
                  <View style={estilos.detalleFechaBox}>
                    <Text style={estilos.detalleFechaBoxLabel}>{t('solicitudesAusencia.detail_to_label', { defaultValue: 'Hasta' })}</Text>
                    <Text style={estilos.detalleFechaBoxValor}>{solicitudSeleccionada.fecha_fin}</Text>
                  </View>
                </View>
              </View>

              {/* Justificación */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>{t('solicitudesAusencia.detail_justification_label', { defaultValue: 'Justificación' })}</Text>
                <Text style={estilos.detalleMotivoTexto}>
                  {solicitudSeleccionada.motivo || t('solicitudesAusencia.detail_no_justification', { defaultValue: 'Sin justificación adicional.' })}
                </Text>
              </View>

              {/* Archivos Adjuntos */}
              {((solicitudSeleccionada.archivos_adjuntos && solicitudSeleccionada.archivos_adjuntos.length > 0) || solicitudSeleccionada.archivo_adjunto) && (
                <View style={estilos.detalleSeccionCard}>
                  <Text style={estilos.detalleLabel}>{t('solicitudesAusencia.detail_attachments_label', { defaultValue: 'Comprobantes / Archivos Adjuntos' })}</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {solicitudSeleccionada.archivos_adjuntos?.map((adj, i) => (
                      <View key={adj.id || `adj-${i}`} style={estilos.cardAdjuntoPreview}>
                        {adj.tipo === 'imagen' ? (
                          <Image source={{ uri: adj.uri }} style={estilos.thumbAdjunto} />
                        ) : (
                          <View style={estilos.iconoDocWrap}>
                            <Feather name="file-text" size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                          </View>
                        )}
                        <View style={estilos.infoAdjunto}>
                          <Text style={estilos.nombreAdjunto} numberOfLines={1}>{adj.nombre}</Text>
                          <Text style={estilos.subAdjunto}>{adj.tipo === 'imagen' ? t('solicitudesAusencia.attachment_type_photo', { defaultValue: 'Foto adjunta' }) : t('solicitudesAusencia.attachment_type_document', { defaultValue: 'Documento adjunto' })}</Text>
                        </View>
                      </View>
                    ))}
                    {!solicitudSeleccionada.archivos_adjuntos?.length && solicitudSeleccionada.archivo_adjunto && (
                      <View style={estilos.cardAdjuntoPreview}>
                        <View style={estilos.iconoDocWrap}>
                          <Feather name="file-text" size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                        </View>
                        <View style={estilos.infoAdjunto}>
                          <Text style={estilos.nombreAdjunto} numberOfLines={1}>{t('solicitudesAusencia.generic_attachment_name', { defaultValue: 'Archivo adjunto' })}</Text>
                          <Text style={estilos.subAdjunto}>{t('solicitudesAusencia.attachment_generic_sub', { defaultValue: 'Comprobante cargado' })}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Acciones de Edición y Cancelación (si está pendiente) */}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <View style={estilos.filaAccionesDetalle}>
                  <BotonAnimado
                    onPress={() => abrirFormularioEditar(solicitudSeleccionada)}
                    scaleTo={0.96}
                    style={estilos.botonEditarDetalle}
                  >
                    <Feather name="edit-3" size={16} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    <Text style={estilos.textoBotonEditarDetalle}>{t('solicitudesAusencia.edit_request_button', { defaultValue: 'Editar Solicitud' })}</Text>
                  </BotonAnimado>

                  <BotonAnimado
                    onPress={() => manejarCancelarSolicitud(solicitudSeleccionada)}
                    scaleTo={0.96}
                    style={estilos.botonCancelarDetalle}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <Text style={estilos.textoBotonCancelarDetalle}>{t('solicitudesAusencia.cancel_button', { defaultValue: 'Cancelar' })}</Text>
                  </BotonAnimado>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </ModalShell>

      {/* MODAL CREAR / EDITAR SOLICITUD */}
      <ModalShell visible={modalFormVisible} onClose={() => setModalFormVisible(false)} style={estilos.modalContenido}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flexModal}>
          <View style={estilos.modalHeader}>
            <View>
              <Text style={estilos.modalTitulo}>
                {solicitudEditando ? t('solicitudesAusencia.edit_request_button', { defaultValue: 'Editar Solicitud' }) : t('solicitudesAusencia.modal_title')}
              </Text>
              <Text style={estilos.modalSubtitulo}>
                {solicitudEditando ? t('solicitudesAusencia.modal_subtitle_edit', { defaultValue: 'Modifica las fechas o detalles' }) : t('solicitudesAusencia.modal_subtitle_create', { defaultValue: 'Registra tus fechas y motivo' })}
              </Text>
            </View>
            <BotonAnimado onPress={() => setModalFormVisible(false)} scaleTo={0.92} style={estilos.botonCerrarModal}>
              <Feather name="x" size={18} color={colores.texto} />
            </BotonAnimado>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollModal}>
            {/* Asunto */}
            <Text style={estilos.label}>{t('solicitudesAusencia.label_subject')}</Text>
            <TextInput
              style={estilos.input}
              placeholder={t('solicitudesAusencia.placeholder_subject')}
              placeholderTextColor={colores.textoSuave}
              value={asunto}
              onChangeText={setAsunto}
            />

            {/* Categoría */}
            <Text style={estilos.label}>{t('solicitudesAusencia.label_category')}</Text>
            <View style={estilos.gridTipos}>
              {categorias.map((cat) => {
                const activo = tipo === cat.id;
                return (
                  <BotonAnimado
                    key={cat.id}
                    onPress={() => setTipo(cat.id)}
                    scaleTo={0.94}
                    style={[estilos.chipTipo, activo && estilos.chipTipoActivo]}
                  >
                    <Feather
                      name={ICONOS_CATEGORIA[cat.id] || 'clock'}
                      size={13}
                      color={activo ? (esOscuro ? '#0B0C1E' : '#FFFFFF') : colores.textoSuave}
                    />
                    <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{cat.label}</Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Selector de Rango de Fechas con Calendario Interactivo */}
            <View style={estilos.seccionFechasHeader}>
              <Text style={estilos.labelSinMargin}>{t('solicitudesAusencia.label_dates_section', { defaultValue: 'Fechas de Ausencia' })}</Text>
              {diasSeleccionadosCount > 0 && (
                <View style={estilos.badgeDiasCount}>
                  <Text style={estilos.textoDiasCount}>
                    {t('solicitudesAusencia.days_count', { count: diasSeleccionadosCount, defaultValue: `${diasSeleccionadosCount} ${diasSeleccionadosCount === 1 ? 'día' : 'días'}` })}
                  </Text>
                </View>
              )}
            </View>

            <BotonAnimado
              onPress={() => setCalendarioAbierto(!calendarioAbierto)}
              scaleTo={0.98}
              style={[estilos.cardRangoFechas, calendarioAbierto && estilos.cardRangoFechasAbierto]}
            >
              <View style={estilos.fechaSlot}>
                <Text style={estilos.fechaSlotLabel}>{t('solicitudesAusencia.label_start_date')}</Text>
                <View style={estilos.fechaSlotValorWrap}>
                  <Feather name="calendar" size={14} color={colores.textoSuave} />
                  <Text style={[estilos.fechaSlotValor, !fechaInicio && { color: colores.textoSuave }]}>
                    {fechaInicio || t('solicitudesAusencia.select_placeholder', { defaultValue: 'Seleccionar' })}
                  </Text>
                </View>
              </View>

              <Feather name="arrow-right" size={16} color={colores.textoSuave} />

              <View style={estilos.fechaSlot}>
                <Text style={estilos.fechaSlotLabel}>{t('solicitudesAusencia.label_end_date')}</Text>
                <View style={estilos.fechaSlotValorWrap}>
                  <Feather name="calendar" size={14} color={colores.textoSuave} />
                  <Text style={[estilos.fechaSlotValor, !fechaFin && { color: colores.textoSuave }]}>
                    {fechaFin || t('solicitudesAusencia.select_placeholder', { defaultValue: 'Seleccionar' })}
                  </Text>
                </View>
              </View>
            </BotonAnimado>

            {/* Calendario visual embebido interactivo */}
            {calendarioAbierto && (
              <Animated.View entering={FadeInDown.duration(260)} style={estilos.calendarioContainer}>
                <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.calendarioVidrio}>
                  {/* Cabecera del Calendario */}
                  <View style={estilos.calHeader}>
                    <BotonAnimado onPress={() => cambiarMesCal(-1)} scaleTo={0.88} style={estilos.calBotonNav}>
                      <Feather name="chevron-left" size={18} color={colores.texto} />
                    </BotonAnimado>
                    <Text style={estilos.calMesTitulo}>
                      {NOMBRES_MESES[calMes]} {calAnio}
                    </Text>
                    <BotonAnimado onPress={() => cambiarMesCal(1)} scaleTo={0.88} style={estilos.calBotonNav}>
                      <Feather name="chevron-right" size={18} color={colores.texto} />
                    </BotonAnimado>
                  </View>

                  {/* Días de la semana */}
                  <View style={estilos.calSemanaFila}>
                    {DIAS_SEMANA.map((d) => (
                      <Text key={d} style={estilos.calSemanaLetra}>
                        {d}
                      </Text>
                    ))}
                  </View>

                  {/* Cuadrícula de días */}
                  <View style={estilos.calGridDias}>
                    {diasEnMes.map((dia, idx) => {
                      if (dia === 0) {
                        return <View key={`empty-${idx}`} style={estilos.calDiaVacio} />;
                      }

                      const fechaDia = formatearFecha(calAnio, calMes, dia);
                      const esInicio = fechaDia === fechaInicio;
                      const esFin = fechaDia === fechaFin;
                      const enRango = fechaInicio && fechaFin && fechaDia > fechaInicio && fechaDia < fechaFin;
                      const esHoy = fechaDia === formatearFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

                      return (
                        <TouchableOpacity
                          key={`day-${dia}`}
                          onPress={() => seleccionarDiaCalendario(dia)}
                          activeOpacity={0.7}
                          style={[
                            estilos.calDiaBoton,
                            enRango && estilos.calDiaEnRango,
                            (esInicio || esFin) && estilos.calDiaExtremo,
                          ]}
                        >
                          <Text
                            style={[
                              estilos.calDiaTexto,
                              esHoy && estilos.calDiaHoyTexto,
                              enRango && estilos.calDiaEnRangoTexto,
                              (esInicio || esFin) && estilos.calDiaExtremoTexto,
                            ]}
                          >
                            {dia}
                          </Text>
                          {esHoy && !(esInicio || esFin) && <View style={estilos.calPuntoHoy} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Botón rápido para confirmar selección de fechas */}
                  <BotonAnimado
                    onPress={() => setCalendarioAbierto(false)}
                    scaleTo={0.96}
                    style={estilos.calBotonConfirmar}
                  >
                    <Text style={estilos.calBotonConfirmarTexto}>{t('solicitudesAusencia.apply_dates_button', { defaultValue: 'Aplicar fechas' })}</Text>
                  </BotonAnimado>
                </BlurView>
              </Animated.View>
            )}

            {/* Justificación (Opcional) */}
            <View style={estilos.seccionJustificacionHeader}>
              <Text style={estilos.labelSinMargin}>{t('solicitudesAusencia.label_justification')}</Text>
              <View style={estilos.badgeOpcional}>
                <Text style={estilos.textoBadgeOpcional}>{t('solicitudesAusencia.optional_badge', { defaultValue: 'Opcional' })}</Text>
              </View>
            </View>
            <TextInput
              style={[estilos.input, estilos.textArea]}
              placeholder={t('solicitudesAusencia.placeholder_justification', { defaultValue: 'Explica el motivo (opcional)...' })}
              placeholderTextColor={colores.textoSuave}
              multiline
              numberOfLines={4}
              value={motivo}
              onChangeText={setMotivo}
            />

            {/* Adjuntar Archivos Múltiples / Comprobantes */}
            <View style={estilos.seccionAdjuntoHeader}>
              <Text style={estilos.labelSinMargin}>{t('solicitudesAusencia.label_attachments_section', { defaultValue: 'Comprobantes o Archivos' })}</Text>
              <View style={estilos.badgeOpcional}>
                <Text style={estilos.textoBadgeOpcional}>{t('solicitudesAusencia.optional_badge', { defaultValue: 'Opcional' })}</Text>
              </View>
            </View>

            {adjuntos.length > 0 && (
              <View style={{ gap: 8, marginBottom: 8 }}>
                {adjuntos.map((adj) => (
                  <Animated.View key={adj.id} entering={FadeInDown.duration(220)} style={estilos.cardAdjuntoPreview}>
                    {adj.tipo === 'imagen' ? (
                      <Image source={{ uri: adj.uri }} style={estilos.thumbAdjunto} />
                    ) : (
                      <View style={estilos.iconoDocWrap}>
                        <Feather name="file-text" size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                      </View>
                    )}
                    <View style={estilos.infoAdjunto}>
                      <Text style={estilos.nombreAdjunto} numberOfLines={1}>
                        {adj.nombre}
                      </Text>
                      <Text style={estilos.subAdjunto}>
                        {adj.tipo === 'imagen' ? t('solicitudesAusencia.attachment_type_photo', { defaultValue: 'Foto adjunta' }) : t('solicitudesAusencia.attachment_type_document', { defaultValue: 'Documento adjunto' })}
                      </Text>
                    </View>
                    <BotonAnimado
                      onPress={() => eliminarAdjunto(adj.id)}
                      scaleTo={0.9}
                      style={estilos.botonQuitarAdjunto}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </BotonAnimado>
                  </Animated.View>
                ))}
              </View>
            )}

            <BotonAnimado
              onPress={mostrarOpcionesAdjunto}
              scaleTo={0.97}
              style={estilos.botonAdjuntar}
            >
              <View style={estilos.iconoAdjuntarWrap}>
                <Feather name="paperclip" size={16} color={colores.texto} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoAdjuntarTitulo}>
                  {adjuntos.length > 0 ? t('solicitudesAusencia.attach_button_add_another', { defaultValue: '+ Adjuntar otro archivo o foto' }) : t('solicitudesAusencia.attach_button_add', { defaultValue: 'Adjuntar documento o foto' })}
                </Text>
                <Text style={estilos.textoAdjuntarSub}>{t('solicitudesAusencia.attach_button_sub', { defaultValue: 'Archivos PDF, Word, fotos de galería o cámara' })}</Text>
              </View>
              <Feather name="file-plus" size={18} color={colores.textoSuave} />
            </BotonAnimado>

            {/* Prioridad */}
            <Text style={estilos.label}>{t('solicitudesAusencia.label_priority')}</Text>
            <View style={estilos.filaPrioridad}>
              {prioridades.map((p) => {
                const activo = prioridad === p.id;
                const dotColor = COLORES_PRIORIDAD[p.id];
                return (
                  <BotonAnimado
                    key={p.id}
                    onPress={() => setPrioridad(p.id)}
                    scaleTo={0.95}
                    style={[estilos.chipPrioridad, activo && estilos.chipPrioridadActivo]}
                  >
                    <View style={[estilos.puntoPrioridad, { backgroundColor: dotColor }]} />
                    <Text style={[estilos.textoChipP, activo && estilos.textoChipPActivo]}>{p.label}</Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Botón Enviar / Guardar */}
            <BotonAnimado
              style={[estilos.botonEnviar, enviando && { opacity: 0.6 }]}
              onPress={manejarGuardarSolicitud}
              scaleTo={0.96}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
              ) : (
                <>
                  <Text style={estilos.textoBotonEnviar}>
                    {solicitudEditando ? t('solicitudesAusencia.btn_submit_edit', { defaultValue: 'Guardar Cambios' }) : t('solicitudesAusencia.btn_submit')}
                  </Text>
                  <Feather name="check" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                </>
              )}
            </BotonAnimado>
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

function crearEstilosSolicAus(c: any, esOscuro: boolean) {
  const glassMini = c.vidrioSutil;
  const inputBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)';
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.06)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.22)';
  const modalBg = esOscuro ? 'rgba(11,12,30,0.96)' : 'rgba(248,250,252,0.97)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    botonHeaderNueva: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    resumenSuperior: {
      paddingHorizontal: ESPACIADO.md,
      marginTop: ESPACIADO.sm,
      marginBottom: ESPACIADO.sm,
    },
    resumenVidrio: {
      height: 64,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 12,
      ...SOMBRAS.suave,
    },
    metricaColumna: { alignItems: 'center', flex: 1 },
    metricaValor: { fontSize: 18, fontWeight: '800', color: c.texto, letterSpacing: -0.3 },
    metricaLabel: { fontSize: 11, fontWeight: '600', color: c.textoSuave, marginTop: 1 },
    divisorVertical: { width: 1, height: 24, backgroundColor: c.borde },

    lista: { paddingHorizontal: ESPACIADO.md, paddingBottom: 110, gap: 12 },
    bentoCard: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    bentoContent: { padding: 16 },
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    infoBasica: { flex: 1, marginRight: 10 },
    filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    iconoTipoPill: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipoSolicitud: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.4 },
    asuntoSolicitud: { fontSize: 16, fontWeight: '800', color: c.texto, letterSpacing: -0.2 },
    badgeEstado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo, borderWidth: 1 },
    textoBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    motivoSolicitud: { fontSize: 13, color: c.textoSecundario, lineHeight: 18, marginBottom: 4 },
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: 10 },
    footerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fechasSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    textoFechas: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    prioridadPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: glassMini },
    puntoPrioridadMini: { width: 6, height: 6, borderRadius: 3 },
    textoPrioridadMini: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 30,
      paddingHorizontal: 20,
    },
    botonEmptyCTA: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: RADIOS.completo,
      ...SOMBRAS.suave,
    },
    textoEmptyCTA: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: -0.1,
    },

    fabContenedor: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      zIndex: 99,
    },
    fabBoton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: RADIOS.completo,
      ...SOMBRAS.flotante,
    },
    fabTexto: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: -0.2,
    },

    flexModal: { flex: 1 },
    modalContenido: { backgroundColor: modalBg, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    modalTitulo: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.4 },
    modalSubtitulo: { fontSize: 12, fontWeight: '600', color: c.textoSuave, marginTop: 1 },
    botonCerrarModal: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollModal: { paddingHorizontal: 20, paddingBottom: 40 },

    label: { fontSize: 11, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 16 },
    labelSinMargin: { fontSize: 11, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 0.4 },
    seccionFechasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
    badgeDiasCount: { backgroundColor: activeSurface, borderWidth: 1, borderColor: activeBorder, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    textoDiasCount: { fontSize: 11, fontWeight: '700', color: c.texto },

    input: {
      backgroundColor: inputBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: c.borde,
      color: c.texto,
      fontSize: 15,
    },
    textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },

    gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipTipo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIOS.completo,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipTipoActivo: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      borderColor: esOscuro ? '#FFFFFF' : '#0F172A',
    },
    textoChip: { fontSize: 12, fontWeight: '600', color: c.textoSecundario },
    textoChipActivo: { color: esOscuro ? '#0B0C1E' : '#FFFFFF', fontWeight: '800' },

    cardRangoFechas: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: inputBg,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    cardRangoFechasAbierto: {
      borderColor: activeBorder,
      backgroundColor: activeSurface,
    },
    fechaSlot: { flex: 1 },
    fechaSlotLabel: { fontSize: 10, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', marginBottom: 2 },
    fechaSlotValorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fechaSlotValor: { fontSize: 14, fontWeight: '700', color: c.texto },

    calendarioContainer: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      marginTop: 10,
      marginBottom: 6,
      ...SOMBRAS.flotante,
    },
    calendarioVidrio: { padding: 14 },
    calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    calMesTitulo: { fontSize: 15, fontWeight: '800', color: c.texto, letterSpacing: -0.2 },
    calBotonNav: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calSemanaFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    calSemanaLetra: { width: 38, textAlign: 'center', fontSize: 11, fontWeight: '700', color: c.textoSuave },

    calGridDias: { flexDirection: 'row', flexWrap: 'wrap' },
    calDiaVacio: { width: '14.28%', height: 38 },
    calDiaBoton: {
      width: '14.28%',
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    calDiaEnRango: {
      backgroundColor: activeSurface,
      borderRadius: 0,
    },
    calDiaExtremo: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      borderRadius: 12,
    },
    calDiaTexto: { fontSize: 13, fontWeight: '600', color: c.texto },
    calDiaEnRangoTexto: { color: c.texto, fontWeight: '700' },
    calDiaExtremoTexto: { color: esOscuro ? '#0B0C1E' : '#FFFFFF', fontWeight: '800' },
    calDiaHoyTexto: { color: esOscuro ? '#FFFFFF' : '#0F172A', fontWeight: '800' },
    calPuntoHoy: { width: 4, height: 4, borderRadius: 2, backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A', marginTop: 1 },

    calBotonConfirmar: {
      marginTop: 12,
      height: 38,
      borderRadius: 19,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calBotonConfirmarTexto: { fontSize: 12, fontWeight: '700', color: c.texto },

    seccionJustificacionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
    seccionAdjuntoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
    badgeOpcional: { backgroundColor: glassMini, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: c.borde },
    textoBadgeOpcional: { fontSize: 10, fontWeight: '700', color: c.textoSuave },

    botonAdjuntar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: inputBg,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: c.borde,
      borderStyle: 'dashed',
    },
    iconoAdjuntarWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textoAdjuntarTitulo: { fontSize: 13, fontWeight: '700', color: c.texto },
    textoAdjuntarSub: { fontSize: 11, color: c.textoSuave, marginTop: 1 },

    cardAdjuntoPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: inputBg,
      borderRadius: 18,
      padding: 10,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    thumbAdjunto: { width: 44, height: 44, borderRadius: 12 },
    iconoDocWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoAdjunto: { flex: 1 },
    nombreAdjunto: { fontSize: 13, fontWeight: '700', color: c.texto },
    subAdjunto: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 1 },
    botonQuitarAdjunto: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(239,68,68,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    filaPrioridad: { flexDirection: 'row', gap: 8 },
    chipPrioridad: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: 14,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipPrioridadActivo: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
      borderWidth: 1.5,
    },
    puntoPrioridad: { width: 8, height: 8, borderRadius: 4 },
    textoChipP: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    textoChipPActivo: { color: c.texto, fontWeight: '800' },
    adjuntosBadgeMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: glassMini,
    },
    textoAdjuntosBadgeMini: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textoSuave,
    },

    resolucionBannerMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
    },
    resolucionBannerAprobada: {
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.25)',
    },
    resolucionBannerRechazada: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
    textoResolucionBannerMini: {
      fontSize: 11,
      fontWeight: '600',
      flex: 1,
    },

    detalleSeccionCard: {
      backgroundColor: inputBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    detalleCardResolucionAprobada: {
      borderColor: 'rgba(16,185,129,0.35)',
      backgroundColor: esOscuro ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)',
    },
    detalleCardResolucionRechazada: {
      borderColor: 'rgba(239,68,68,0.35)',
      backgroundColor: esOscuro ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)',
    },
    detalleResolucionTitulo: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    detalleResolucionFecha: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textoSuave,
      marginTop: 1,
    },
    detalleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    detalleMotivoTexto: {
      fontSize: 14,
      color: c.texto,
      lineHeight: 20,
      fontWeight: '500',
    },
    detalleFilaFechas: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    detalleFechaBox: {
      flex: 1,
      backgroundColor: activeSurface,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
    },
    detalleFechaBoxLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: c.textoSuave,
      textTransform: 'uppercase',
    },
    detalleFechaBoxValor: {
      fontSize: 14,
      fontWeight: '800',
      color: c.texto,
      marginTop: 2,
    },

    filaAccionesDetalle: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
      marginBottom: 20,
    },
    botonEditarDetalle: {
      flex: 1,
      height: 50,
      borderRadius: 25,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    textoBotonEditarDetalle: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
    },
    botonCancelarDetalle: {
      height: 50,
      paddingHorizontal: 18,
      borderRadius: 25,
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    textoBotonCancelarDetalle: {
      color: '#EF4444',
      fontWeight: '800',
      fontSize: 14,
    },

    botonEnviar: {
      marginTop: 24,
      borderRadius: 26,
      height: 52,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    textoBotonEnviar: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
      letterSpacing: -0.2,
    },
  });
}


