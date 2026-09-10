import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { InternalRequest } from 'domain/entities/InternalRequest';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import ModalShell from '@/presentation/components/ui/ModalShell';
import EmptyState from '@/presentation/components/ui/EmptyState';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

const TODOS_LOS_TIPOS: InternalRequest['tipo'][] = [
  'vacaciones',
  'permiso',
  'adelanto_salarial',
  'soporte_tecnico',
  'compra_material',
  'cambio_horario',
  'incidente',
  'llegada_tarde',
  'horas_extra',
  'trabajo_remoto',
  'incapacidad',
  'permiso_especial',
];

const TIPOS_RANGO_FECHA = new Set<InternalRequest['tipo']>(['vacaciones', 'permiso', 'trabajo_remoto', 'incapacidad', 'permiso_especial']);
const TIPOS_FECHA_UNICA = new Set<InternalRequest['tipo']>(['cambio_horario', 'llegada_tarde', 'horas_extra']);
const TIPOS_MONTO = new Set<InternalRequest['tipo']>(['adelanto_salarial', 'compra_material']);
const TIPOS_HORAS = new Set<InternalRequest['tipo']>(['horas_extra']);
const TIPOS_ADJUNTO = new Set<InternalRequest['tipo']>(['incapacidad']);

interface Props { navigation: any; }

export default function SolicitudesInternas({ navigation }: Props) {
  const { t } = useTranslation();
  const { solicitudesInternas, crearSolicitudInterna, perfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosSolicInt(colores, esOscuro);

  const [modalVisible, setModalVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');

  // Form State
  const [tipo, setTipo] = useState<InternalRequest['tipo']>('permiso');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<InternalRequest['prioridad']>('media');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [monto, setMonto] = useState('');
  const [horasCantidad, setHorasCantidad] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState('');
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);

  const totalSolicitudes = solicitudesInternas.length;
  const pendientes = solicitudesInternas.filter((s) => s.estado === 'pendiente').length;
  const aprobadas = solicitudesInternas.filter((s) => s.estado === 'aprobada').length;
  const rechazadas = solicitudesInternas.filter((s) => s.estado === 'rechazada').length;

  const solicitudesFiltradas = solicitudesInternas.filter((s) => {
    if (filtroEstado === 'todas') return true;
    return s.estado === filtroEstado;
  });

  const manejarEnvio = async () => {
    if (!titulo || !descripcion) {
      Alert.alert(t('solicitudesInternas.incomplete_alert', { defaultValue: 'Campos incompletos' }), t('solicitudesInternas.incomplete_msg', { defaultValue: 'Por favor completa el título y la descripción.' }));
      return;
    }
    setEnviando(true);
    try {
      const payload: any = { tipo, titulo, descripcion, prioridad };
      if (TIPOS_RANGO_FECHA.has(tipo)) {
        if (fechaInicio) payload.fecha_inicio = fechaInicio;
        if (fechaFin) payload.fecha_fin = fechaFin;
      }
      if (TIPOS_FECHA_UNICA.has(tipo) && fechaInicio) {
        payload.fecha_inicio = fechaInicio;
      }
      if (TIPOS_MONTO.has(tipo) && monto) {
        payload.monto = Number(monto);
      }
      if (TIPOS_HORAS.has(tipo) && horasCantidad) {
        payload.horas_cantidad = Number(horasCantidad);
      }
      if (TIPOS_ADJUNTO.has(tipo) && archivoAdjunto) {
        payload.archivo_adjunto = archivoAdjunto;
      }
      await crearSolicitudInterna(payload);
      setModalVisible(false);
      resetForm();
      Alert.alert(t('solicitudesInternas.success_alert', { defaultValue: 'Solicitud enviada' }), t('solicitudesInternas.success_msg', { defaultValue: 'Tu solicitud fue registrada con éxito.' }));
    } catch {
      Alert.alert(t('solicitudesInternas.error_alert', { defaultValue: 'Error' }), t('solicitudesInternas.error_msg', { defaultValue: 'No se pudo enviar la solicitud. Intenta de nuevo.' }));
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setTipo('permiso');
    setPrioridad('media');
    setFechaInicio('');
    setFechaFin('');
    setMonto('');
    setHorasCantidad('');
    setArchivoAdjunto('');
  };

  const subirCertificado = async () => {
    if (!perfil?.empresaId) return;
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          setSubiendoAdjunto(true);
          try {
            const uploaded = await uploadManagedFile(file, {
              kind: 'document',
              ownerId: perfil.empresaId!,
              empresaId: perfil.empresaId!,
            });
            setArchivoAdjunto(uploaded.url);
          } catch (e: any) {
            Alert.alert(t('solicitudesInternas.upload_error_title', { defaultValue: 'No se pudo subir el archivo' }), e?.message || t('solicitudesInternas.upload_error_retry', { defaultValue: 'Intenta de nuevo.' }));
          } finally {
            setSubiendoAdjunto(false);
          }
        };
        input.click();
        return;
      }
      Alert.alert(t('solicitudesInternas.upload_unavailable_title', { defaultValue: 'Subida no disponible' }), t('solicitudesInternas.upload_unavailable_msg', { defaultValue: 'Adjunta el certificado desde la versión web por ahora.' }));
    } catch (e: any) {
      setSubiendoAdjunto(false);
      Alert.alert(t('solicitudesInternas.upload_error_title', { defaultValue: 'No se pudo subir el archivo' }), e?.message || t('solicitudesInternas.upload_error_retry', { defaultValue: 'Intenta de nuevo.' }));
    }
  };

  const obtenerColorEstado = (e: string) => {
    switch (e) {
      case 'aprobada': return '#10B981';
      case 'rechazada': return '#EF4444';
      case 'pendiente': return '#F59E0B';
      default: return colores.textoSuave;
    }
  };

  const obtenerIconoTipo = (tVal: string) => {
    switch (tVal) {
      case 'vacaciones': return 'sun';
      case 'adelanto_salarial': return 'dollar-sign';
      case 'soporte_tecnico': return 'tool';
      case 'cambio_horario': return 'clock';
      case 'trabajo_remoto': return 'home';
      case 'incapacidad': return 'activity';
      default: return 'file-text';
    }
  };

  const renderItem = ({ item, index }: { item: InternalRequest; index: number }) => {
    const colorSt = obtenerColorEstado(item.estado);
    return (
      <Animated.View
        entering={FadeInDown.duration(260).delay(Math.min(index, 8) * 35).easing(Easing.out(Easing.quad))}
        style={estilos.tarjetaWrap}
      >
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaContent}>
          <View style={estilos.headerTarjeta}>
            <View style={estilos.filaTipo}>
              <View style={[estilos.iconoTipoBadge, { backgroundColor: esOscuro ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.08)' }]}>
                <Feather name={obtenerIconoTipo(item.tipo) as any} size={14} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              </View>
              <Text style={estilos.tipoSolicitud}>{t(`solicitudesInternas.types.${item.tipo}`, { defaultValue: item.tipo.toUpperCase() })}</Text>
            </View>
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '18', borderColor: colorSt + '35' }]}>
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{t(`solicitudesInternas.states.${item.estado}`, { defaultValue: item.estado.toUpperCase() })}</Text>
            </View>
          </View>

          <Text style={estilos.tituloSolicitud} numberOfLines={1}>{item.titulo}</Text>
          <Text style={estilos.descSolicitud} numberOfLines={2}>{item.descripcion}</Text>

          <View style={estilos.divisorHorizontal} />

          <View style={estilos.footerTarjeta}>
            <View style={estilos.metaItem}>
              <Feather name="calendar" size={12} color={colores.textoSuave} />
              <Text style={estilos.fechaTexto}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
            {item.prioridad && (
              <View style={estilos.metaItem}>
                <Feather name="flag" size={11} color={item.prioridad === 'alta' ? '#EF4444' : colores.textoSuave} />
                <Text style={[estilos.prioridadTexto, item.prioridad === 'alta' && { color: '#EF4444' }]}>
                  {item.prioridad.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View pointerEvents="none" style={estilos.fondoAbsoluto}><FondoMobilePremium /></View>

      <NavbarEnterprise
        titulo={t('solicitudesInternas.title', { defaultValue: 'Solicitudes Internas' })}
        subtitulo={t('solicitudesInternas.nav_subtitle', { defaultValue: 'Peticiones, compras y permisos' })}
        mostrarAtras
      />

      <FlatList
        data={solicitudesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Banner Bento de Métricas */}
            <View style={estilos.resumenGrid}>
              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <Text style={estilos.resumenLabel}>{t('solicitudesInternas.summary_total', { defaultValue: 'Total' })}</Text>
                  <Text style={estilos.resumenValor}>{totalSolicitudes}</Text>
                </BlurView>
              </View>
              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <Text style={[estilos.resumenLabel, { color: '#F59E0B' }]}>{t('solicitudesInternas.summary_pending', { defaultValue: 'Pendientes' })}</Text>
                  <Text style={[estilos.resumenValor, { color: '#F59E0B' }]}>{pendientes}</Text>
                </BlurView>
              </View>
              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <Text style={[estilos.resumenLabel, { color: '#10B981' }]}>{t('solicitudesInternas.summary_approved', { defaultValue: 'Aprobadas' })}</Text>
                  <Text style={[estilos.resumenValor, { color: '#10B981' }]}>{aprobadas}</Text>
                </BlurView>
              </View>
            </View>

            {/* Botón de Acción Principal: Nueva Solicitud */}
            <BotonAnimado
              style={estilos.botonNuevaSolicitud}
              onPress={() => setModalVisible(true)}
              scaleTo={0.98}
            >
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.nuevaSolicitudContent}>
                <View style={estilos.iconoMasBadge}>
                  <Feather name="plus" size={18} color="#ffffff" />
                </View>
                <View style={estilos.textosNuevaSolicitud}>
                  <Text style={estilos.tituloNuevaSolicitud}>{t('solicitudesInternas.create_button_title', { defaultValue: 'Crear Nueva Solicitud' })}</Text>
                  <Text style={estilos.subtituloNuevaSolicitud}>{t('solicitudesInternas.create_button_subtitle', { defaultValue: 'Permisos, compras, adelantos y más' })}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colores.textoSuave} />
              </BlurView>
            </BotonAnimado>

            {/* Cabecera de Lista y Filtros */}
            <View style={estilos.cabeceraLista}>
              <Text style={estilos.tituloSeccion}>{t('solicitudesInternas.history_title', { defaultValue: 'Historial de Peticiones' })}</Text>
              <Text style={estilos.conteoVisible}>{t('solicitudesInternas.visible_count', { count: solicitudesFiltradas.length, defaultValue: `${solicitudesFiltradas.length} visibles` })}</Text>
            </View>

            {/* Chips de Filtro */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosScroll}>
              {[
                { id: 'todas', label: t('solicitudesInternas.filter_all', { defaultValue: 'Todas' }) },
                { id: 'pendiente', label: t('solicitudesInternas.filter_pending', { defaultValue: 'Pendientes' }) },
                { id: 'aprobada', label: t('solicitudesInternas.filter_approved', { defaultValue: 'Aprobadas' }) },
                { id: 'rechazada', label: t('solicitudesInternas.filter_rejected', { defaultValue: 'Rechazadas' }) },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFiltroEstado(f.id)}
                  style={[estilos.chipFiltro, filtroEstado === f.id && estilos.chipFiltroActivo]}
                  activeOpacity={0.8}
                >
                  <Text style={[estilos.textoChipFiltro, filtroEstado === f.id && estilos.textoChipFiltroActivo]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icono="inbox" titulo={t('solicitudesInternas.no_requests', { defaultValue: 'Sin solicitudes' })} detalle={t('solicitudesInternas.empty_detail', { defaultValue: 'No hay registros en esta categoría.' })} />
        }
      />

      {/* Modal / BottomSheet de Nueva Solicitud */}
      <ModalShell visible={modalVisible} onClose={() => setModalVisible(false)} style={estilos.modalContenido}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flexModal}>
          <View style={estilos.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.modalTitulo}>{t('solicitudesInternas.new_request', { defaultValue: 'Nueva Solicitud' })}</Text>
              <Text style={estilos.modalSubtitulo}>{t('solicitudesInternas.modal_subtitle', { defaultValue: 'Trámite interno y solicitudes operativas' })}</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal} activeOpacity={0.8}>
              <Feather name="x" size={18} color={colores.texto} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.modalScroll}>
            {/* SECCIÓN 1: TIPO DE SOLICITUD */}
            <View style={estilos.seccionFormulario}>
              <View style={estilos.filaSeccionHeader}>
                <Feather name="grid" size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                <Text style={estilos.labelSeccion}>{t('solicitudesInternas.section_type', { defaultValue: 'TIPO DE TRÁMITE' })}</Text>
              </View>
              <View style={estilos.gridTipos}>
                {TODOS_LOS_TIPOS.map((itemTipo) => {
                  const activo = tipo === itemTipo;
                  return (
                    <TouchableOpacity
                      key={itemTipo}
                      style={[estilos.chipTipo, activo && estilos.chipTipoActivo]}
                      onPress={() => setTipo(itemTipo as any)}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name={obtenerIconoTipo(itemTipo) as any}
                        size={12}
                        color={activo ? '#ffffff' : esOscuro ? '#93C5FD' : '#2563EB'}
                      />
                      <Text style={[estilos.textoChipTipo, activo && estilos.textoChipTipoActivo]}>
                        {t(`solicitudesInternas.types.${itemTipo}`, { defaultValue: itemTipo.replace('_', ' ') })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECCIÓN 2: PRIORIDAD */}
            <View style={estilos.seccionFormulario}>
              <View style={estilos.filaSeccionHeader}>
                <Feather name="flag" size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                <Text style={estilos.labelSeccion}>{t('solicitudesInternas.section_priority', { defaultValue: 'NIVEL DE PRIORIDAD' })}</Text>
              </View>
              <View style={estilos.filaPrioridades}>
                {(['baja', 'media', 'alta'] as const).map((p) => {
                  const activo = prioridad === p;
                  const colorP = p === 'alta' ? '#EF4444' : p === 'media' ? '#F59E0B' : '#10B981';
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPrioridad(p)}
                      style={[
                        estilos.botonPrioridad,
                        activo && { backgroundColor: colorP + '20', borderColor: colorP },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Feather name="flag" size={12} color={activo ? colorP : colores.textoSuave} />
                      <Text style={[estilos.textoPrioridad, activo && { color: colorP, fontWeight: '800' }]}>
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECCIÓN 3: DETALLES CONDICIONALES */}
            {(TIPOS_RANGO_FECHA.has(tipo) || TIPOS_FECHA_UNICA.has(tipo) || TIPOS_HORAS.has(tipo) || TIPOS_MONTO.has(tipo) || TIPOS_ADJUNTO.has(tipo)) && (
              <View style={estilos.seccionFormulario}>
                <View style={estilos.filaSeccionHeader}>
                  <Feather name="sliders" size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  <Text style={estilos.labelSeccion}>{t('solicitudesInternas.section_params', { defaultValue: 'PARÁMETROS DEL TRÁMITE' })}</Text>
                </View>

                {TIPOS_RANGO_FECHA.has(tipo) && (
                  <View style={estilos.filaDosColumnas}>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.labelInput}>{t('solicitudesInternas.date_start_label', { defaultValue: 'Fecha Inicio' })}</Text>
                      <View style={estilos.inputConIcono}>
                        <Feather name="calendar" size={14} color={colores.textoSuave} />
                        <TextInput
                          style={estilos.inputEnvoltorio}
                          value={fechaInicio}
                          onChangeText={setFechaInicio}
                          placeholder="AAAA-MM-DD"
                          placeholderTextColor={colores.textoSuave}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.labelInput}>{t('solicitudesInternas.date_end_label', { defaultValue: 'Fecha Fin' })}</Text>
                      <View style={estilos.inputConIcono}>
                        <Feather name="calendar" size={14} color={colores.textoSuave} />
                        <TextInput
                          style={estilos.inputEnvoltorio}
                          value={fechaFin}
                          onChangeText={setFechaFin}
                          placeholder="AAAA-MM-DD"
                          placeholderTextColor={colores.textoSuave}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {TIPOS_FECHA_UNICA.has(tipo) && (
                  <View>
                    <Text style={estilos.labelInput}>{t('solicitudesInternas.field_date_single', { defaultValue: 'Fecha Correspondiente' })}</Text>
                    <View style={estilos.inputConIcono}>
                      <Feather name="calendar" size={14} color={colores.textoSuave} />
                      <TextInput
                        style={estilos.inputEnvoltorio}
                        value={fechaInicio}
                        onChangeText={setFechaInicio}
                        placeholder="AAAA-MM-DD"
                        placeholderTextColor={colores.textoSuave}
                      />
                    </View>
                  </View>
                )}

                {TIPOS_HORAS.has(tipo) && (
                  <View>
                    <Text style={estilos.labelInput}>{t('solicitudesInternas.field_hours', { defaultValue: 'Cantidad de Horas' })}</Text>
                    <View style={estilos.inputConIcono}>
                      <Feather name="clock" size={14} color={colores.textoSuave} />
                      <TextInput
                        style={estilos.inputEnvoltorio}
                        value={horasCantidad}
                        onChangeText={setHorasCantidad}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colores.textoSuave}
                      />
                    </View>
                    <View style={estilos.filaChipsRapidos}>
                      {['1', '2', '4', '8'].map((h) => (
                        <TouchableOpacity
                          key={h}
                          onPress={() => setHorasCantidad(h)}
                          style={[estilos.chipRapido, horasCantidad === h && estilos.chipRapidoActivo]}
                        >
                          <Text style={[estilos.textoChipRapido, horasCantidad === h && estilos.textoChipRapidoActivo]}>+{h}h</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {TIPOS_MONTO.has(tipo) && (
                  <View>
                    <Text style={estilos.labelInput}>{t('solicitudesInternas.field_amount', { defaultValue: 'Monto Estimado ($ USD)' })}</Text>
                    <View style={estilos.inputConIcono}>
                      <Feather name="dollar-sign" size={14} color={colores.textoSuave} />
                      <TextInput
                        style={estilos.inputEnvoltorio}
                        value={monto}
                        onChangeText={setMonto}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={colores.textoSuave}
                      />
                    </View>
                    <View style={estilos.filaChipsRapidos}>
                      {['25', '50', '100', '200'].map((mVal) => (
                        <TouchableOpacity
                          key={mVal}
                          onPress={() => setMonto(mVal)}
                          style={[estilos.chipRapido, monto === mVal && estilos.chipRapidoActivo]}
                        >
                          <Text style={[estilos.textoChipRapido, monto === mVal && estilos.textoChipRapidoActivo]}>${mVal}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {TIPOS_ADJUNTO.has(tipo) && (
                  <View>
                    <Text style={estilos.labelInput}>{t('solicitudesInternas.field_attachment', { defaultValue: 'Certificado o Comprobante' })}</Text>
                    <TouchableOpacity style={estilos.botonAdjunto} onPress={subirCertificado} disabled={subiendoAdjunto} activeOpacity={0.8}>
                      {subiendoAdjunto ? (
                        <ActivityIndicator size="small" color={esOscuro ? '#93C5FD' : '#2563EB'} />
                      ) : (
                        <Feather name={archivoAdjunto ? "check-circle" : "paperclip"} size={16} color={archivoAdjunto ? "#10B981" : esOscuro ? '#93C5FD' : '#2563EB'} />
                      )}
                      <Text style={[estilos.textoBotonAdjunto, !!archivoAdjunto && { color: '#10B981' }]}>
                        {subiendoAdjunto
                          ? t('solicitudesInternas.attachment_btn_uploading', { defaultValue: 'Subiendo archivo...' })
                          : archivoAdjunto
                            ? t('solicitudesInternas.attachment_btn_uploaded', { defaultValue: 'Documento Adjunto ✓' })
                            : t('solicitudesInternas.attachment_btn_placeholder', { defaultValue: 'Adjuntar certificado médico (PDF)' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* SECCIÓN 4: ASUNTO Y DETALLES */}
            <View style={estilos.seccionFormulario}>
              <View style={estilos.filaSeccionHeader}>
                <Feather name="file-text" size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                <Text style={estilos.labelSeccion}>{t('solicitudesInternas.section_info', { defaultValue: 'INFORMACIÓN PRINCIPAL' })}</Text>
              </View>

              <Text style={estilos.labelInput}>{t('solicitudesInternas.field_subject', { defaultValue: 'Asunto / Título del Trámite' })}</Text>
              <TextInput
                style={estilos.input}
                value={titulo}
                onChangeText={setTitulo}
                placeholder={t('solicitudesInternas.field_subject_placeholder', { defaultValue: 'Ej. Solicitud de vacaciones de verano' })}
                placeholderTextColor={colores.textoSuave}
              />

              <Text style={[estilos.labelInput, { marginTop: 12 }]}>{t('solicitudesInternas.field_details', { defaultValue: 'Detalles y Justificación' })}</Text>
              <TextInput
                style={[estilos.input, estilos.textArea]}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                placeholder={t('solicitudesInternas.field_details_placeholder', { defaultValue: 'Explica el motivo del trámite y cualquier consideración relevante...' })}
                placeholderTextColor={colores.textoSuave}
                textAlignVertical="top"
              />
            </View>

            {/* BOTÓN DE ENVIAR */}
            <BotonAnimado
              style={estilos.botonEnviar}
              onPress={manejarEnvio}
              disabled={enviando}
              scaleTo={0.97}
            >
              <View style={estilos.contenidoBotonEnviar}>
                {enviando ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Feather name="send" size={16} color="#ffffff" />
                )}
                <Text style={estilos.textoBotonEnviar}>
                  {enviando
                    ? t('solicitudesInternas.submit_sending', { defaultValue: 'Registrando Solicitud...' })
                    : t('solicitudesInternas.send_request', { defaultValue: 'Enviar Solicitud' })}
                </Text>
              </View>
            </BotonAnimado>
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

function crearEstilosSolicInt(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = c.vidrioSutil;
  const inputBg = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const inputBorder = esOscuro ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
  const modalBg = esOscuro ? 'rgba(18, 18, 28, 0.98)' : 'rgba(248, 250, 252, 0.98)';
  const cardBg = esOscuro ? 'rgba(26, 26, 40, 0.90)' : 'rgba(255, 255, 255, 0.95)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    lista: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },

    resumenGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    resumenCard: {
      flex: 1,
      minHeight: 76,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    resumenContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    resumenLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    resumenValor: {
      fontSize: 22,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },

    botonNuevaSolicitud: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
      backgroundColor: glass,
      marginBottom: 20,
      ...SOMBRAS.flotante,
    },
    nuevaSolicitudContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    iconoMasBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textosNuevaSolicitud: { flex: 1 },
    tituloNuevaSolicitud: {
      fontSize: 14.5,
      fontWeight: '800',
      color: c.texto,
    },
    subtituloNuevaSolicitud: {
      fontSize: 11.5,
      color: c.textoSecundario,
      marginTop: 2,
    },

    cabeceraLista: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    tituloSeccion: {
      fontSize: 15.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.2,
    },
    conteoVisible: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textoSuave,
    },

    filtrosScroll: {
      gap: 8,
      marginBottom: 16,
    },
    chipFiltro: {
      paddingHorizontal: 15,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipFiltroActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChipFiltro: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipFiltroActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    tarjetaWrap: {
      marginBottom: 10,
    },
    tarjetaContent: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      padding: 14,
      ...SOMBRAS.flotante,
    },
    headerTarjeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    filaTipo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconoTipoBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    tipoSolicitud: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    badgeEstado: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    textoBadge: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    tituloSolicitud: {
      fontSize: 14.5,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    descSolicitud: {
      fontSize: 12.5,
      color: c.textoSecundario,
      lineHeight: 17,
    },
    divisorHorizontal: {
      height: 1,
      backgroundColor: c.borde,
      marginVertical: 10,
    },
    footerTarjeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    fechaTexto: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },
    prioridadTexto: {
      fontSize: 10,
      color: c.textoSuave,
      fontWeight: '800',
    },

    flexModal: { flex: 1 },
    modalContenido: {
      backgroundColor: modalBg,
      height: '92%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    modalTitulo: {
      fontSize: 18.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    modalSubtitulo: {
      fontSize: 12,
      color: c.textoSuave,
      marginTop: 2,
    },
    botonCerrarModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalScroll: {
      paddingBottom: 40,
    },

    seccionFormulario: {
      backgroundColor: cardBg,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: inputBorder,
      marginBottom: 14,
    },
    filaSeccionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    labelSeccion: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.6,
    },
    labelInput: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSecundario,
      marginBottom: 6,
    },

    gridTipos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    chipTipo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    chipTipoActivo: {
      backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
      borderColor: esOscuro ? '#3B82F6' : '#2563EB',
    },
    textoChipTipo: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSecundario,
    },
    textoChipTipoActivo: {
      color: '#ffffff',
      fontWeight: '800',
    },

    filaPrioridades: {
      flexDirection: 'row',
      gap: 8,
    },
    botonPrioridad: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    textoPrioridad: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },

    filaDosColumnas: {
      flexDirection: 'row',
      gap: 10,
    },
    inputConIcono: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: inputBg,
      borderRadius: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    inputEnvoltorio: {
      flex: 1,
      paddingVertical: 10,
      color: c.texto,
      fontSize: 13.5,
      fontWeight: '600',
    },

    filaChipsRapidos: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    chipRapido: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    chipRapidoActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? '#3B82F6' : '#2563EB',
    },
    textoChipRapido: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipRapidoActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '800',
    },

    botonAdjunto: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: inputBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    textoBotonAdjunto: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.texto,
    },

    input: {
      backgroundColor: inputBg,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: inputBorder,
      color: c.texto,
      fontSize: 14,
      fontWeight: '600',
    },
    textArea: {
      height: 85,
      paddingTop: 10,
    },

    botonEnviar: {
      marginTop: 8,
      borderRadius: 18,
      height: 52,
      backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.flotante,
    },
    contenidoBotonEnviar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    textoBotonEnviar: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 15,
      letterSpacing: 0.2,
    },
  });
}

