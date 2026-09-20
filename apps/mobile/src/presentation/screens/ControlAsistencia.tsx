/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/ControlAsistencia.tsx
 * Capa: presentacion.
 * Proposito: Control de jornada laboral, cronómetro en vivo, marcajes de entrada/pausa/salida,
 * resumen de puntualidad, cronología diaria y solicitud de correcciones.
 * Rediseñado con el Design System editorial de Nexxus y soporte integral de alto contraste para Dark Mode.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';

type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

const Text = AdminTranslatedText;

interface Props {
  navigation: {
    navigate: (route: string, params?: Record<string, string>) => void;
    goBack: () => void;
    canGoBack?: () => boolean;
  };
}

export default function ControlAsistencia({ navigation }: Props) {
  const { t } = useTranslation();
  const { perfil, registrarEventoAsistencia, metrics, crearSolicitudInterna } = useContextoUsuario();
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const bottomPadding = useUserTabBottomPadding(96);
  const estilos = useMemo(() => crearEstilos(pulse, esOscuro), [pulse, esOscuro]);

  const [estaActivo, setEstaActivo] = useState(false);
  const [enPausa, setEnPausa] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);

  // Modal de Corrección
  const [modalCorreccionAbierto, setModalCorreccionAbierto] = useState(false);
  const [tipoCorreccion, setTipoCorreccion] = useState<'llegada_tarde' | 'incidente' | 'cambio_horario'>('llegada_tarde');
  const [horaReal, setHoraReal] = useState('');
  const [motivoCorreccion, setMotivoCorreccion] = useState('');
  const [enviandoCorreccion, setEnviandoCorreccion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const escalaReloj = useSharedValue(1);

  // Restaurar estado del timer al cargar
  useEffect(() => {
    const restaurarTimer = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@asistencia_inicio');
        const pausaGuardada = await AsyncStorage.getItem('@asistencia_en_pausa');
        const entradaGuardada = await AsyncStorage.getItem('@asistencia_hora_entrada');

        if (entradaGuardada) setHoraEntrada(entradaGuardada);

        if (guardado) {
          const inicio = new Date(guardado).getTime();
          const ahora = Date.now();
          const diff = Math.floor((ahora - inicio) / 1000);
          setEstaActivo(true);
          setEnPausa(pausaGuardada === 'true');
          if (diff > 0) setSegundos(diff);
        } else {
          setEstaActivo(false);
          setEnPausa(false);
          setSegundos(0);
          setHoraEntrada(null);
        }
      } catch (e) {
        console.error('Error restaurando timer:', e);
      }
    };
    restaurarTimer();
  }, [perfil?.estado_activo]);

  // Manejo del contador de segundos
  useEffect(() => {
    if (estaActivo && !enPausa) {
      timerRef.current = setInterval(() => {
        setSegundos((s) => s + 1);
      }, 1000);

      escalaReloj.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      escalaReloj.value = withTiming(1, { duration: 200 });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [estaActivo, enPausa, escalaReloj]);

  const estiloReloj = useAnimatedStyle(() => ({
    transform: [{ scale: escalaReloj.value }],
  }));

  const formatearTiempo = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatearFechaHoy = () => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const manejarRegresar = () => {
    if (navigation.canGoBack?.() || typeof navigation.goBack === 'function') {
      navigation.goBack();
    } else {
      navigation.navigate('MiPulso');
    }
  };

  const manejarIniciarEntrada = async () => {
    setRegistrando(true);
    try {
      await registrarEventoAsistencia('entrada');
      const ahoraIso = new Date().toISOString();
      const ahoraHora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      await AsyncStorage.setItem('@asistencia_inicio', ahoraIso);
      await AsyncStorage.setItem('@asistencia_hora_entrada', ahoraHora);
      await AsyncStorage.removeItem('@asistencia_en_pausa');

      setHoraEntrada(ahoraHora);
      setEstaActivo(true);
      setEnPausa(false);
      setSegundos(0);
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `${t('controlAsistencia.alert_error_event', { defaultValue: 'No se pudo registrar la entrada.' })}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  const alternarPausa = async () => {
    setRegistrando(true);
    try {
      if (!enPausa) {
        await registrarEventoAsistencia('inicio_pausa');
        await AsyncStorage.setItem('@asistencia_en_pausa', 'true');
        setEnPausa(true);
      } else {
        await registrarEventoAsistencia('fin_pausa');
        await AsyncStorage.removeItem('@asistencia_en_pausa');
        setEnPausa(false);
      }
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `${t('controlAsistencia.alert_error_pause', { defaultValue: 'No se pudo registrar la pausa.' })}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  const confirmarFinalizarSalida = () => {
    Alert.alert(
      t('controlAsistencia.confirm_end_title', { defaultValue: '¿Finalizar Jornada?' }),
      t('controlAsistencia.confirm_end_msg', { defaultValue: 'Se registrará tu hora de salida oficial y se detendrá el cronómetro.' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        { text: t('controlAsistencia.confirm_end_finish', { defaultValue: 'Finalizar' }), style: 'destructive', onPress: manejarFinalizarSalida },
      ]
    );
  };

  const manejarFinalizarSalida = async () => {
    setRegistrando(true);
    try {
      const tiempoTrabajado = formatearTiempo(segundos);
      await registrarEventoAsistencia('salida');
      await AsyncStorage.removeItem('@asistencia_inicio');
      await AsyncStorage.removeItem('@asistencia_hora_entrada');
      await AsyncStorage.removeItem('@asistencia_en_pausa');

      setEstaActivo(false);
      setEnPausa(false);
      setSegundos(0);
      setHoraEntrada(null);

      Alert.alert(
        t('controlAsistencia.success_end_title', { defaultValue: 'Jornada Finalizada' }),
        t('controlAsistencia.success_end_msg', { defaultValue: `Has completado ${tiempoTrabajado} de jornada el día de hoy.`, tiempo: tiempoTrabajado })
      );
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `${t('controlAsistencia.alert_error_event', { defaultValue: 'No se pudo registrar la salida.' })}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  const enviarSolicitudCorreccion = async () => {
    if (!motivoCorreccion.trim()) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), 'Por favor indica el motivo o justificación de la corrección.');
      return;
    }

    setEnviandoCorreccion(true);
    try {
      await crearSolicitudInterna({
        userId: perfil?.id || '',
        empresaId: perfil?.empresaId || '',
        tipo: tipoCorreccion,
        titulo: `Ajuste de Asistencia: ${tipoCorreccion === 'llegada_tarde' ? 'Llegada Tarde' : tipoCorreccion === 'incidente' ? 'Marcaje Omitido' : 'Cambio de Horario'}`,
        descripcion: `Hora real reportada: ${horaReal || 'No especificada'}. Detalle: ${motivoCorreccion}`,
        prioridad: 'media',
      });

      setModalCorreccionAbierto(false);
      setHoraReal('');
      setMotivoCorreccion('');
      Alert.alert('Solicitud enviada', 'Tu solicitud de corrección de asistencia ha sido enviada al equipo de Recursos Humanos.');
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `No se pudo enviar la solicitud: ${e.message || e}`);
    } finally {
      setEnviandoCorreccion(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        colors={pulse.ambient}
        locations={[0, 0.28, 0.75]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={estilos.topBarContainer}>
        <View style={estilos.topBar}>
          <BotonAnimado
            style={estilos.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={esOscuro ? '#FFFFFF' : pulse.text} />
          </BotonAnimado>

          <Text style={estilos.topBarLabel}>
            {t('controlAsistencia.title', { defaultValue: 'Control de Asistencia' })}
          </Text>

          <BotonAnimado
            style={estilos.historyButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate('HistorialCompleto')}
            accessibilityLabel="Ver historial de asistencias"
          >
            <Feather name="calendar" size={Platform.OS === 'ios' ? 19 : 17} color={esOscuro ? '#FFFFFF' : pulse.text} />
          </BotonAnimado>
        </View>
      </View>

      <ScrollView contentContainerStyle={[estilos.scroll, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* HERO: PANEL CRONÓMETRO DE JORNADA */}
        <Animated.View
          entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))}
          style={estilos.panelHero}
        >
          <View style={estilos.heroContenido}>
            {/* Badge de Estado */}
            <View style={estilos.badgeEstadoContenedor}>
              <View
                style={[
                  estilos.puntoEstado,
                  { backgroundColor: estaActivo ? (enPausa ? '#F59E0B' : '#10B981') : (esOscuro ? '#A8A29E' : pulse.textTertiary) }
                ]}
              />
              <Text
                style={[
                  estilos.textoEstadoBadge,
                  { color: estaActivo ? (enPausa ? (esOscuro ? '#FDE68A' : '#B45309') : (esOscuro ? '#6EE7B7' : '#047857')) : (esOscuro ? '#E2DFE8' : pulse.textTertiary) }
                ]}
              >
                {estaActivo
                  ? enPausa
                    ? t('controlAsistencia.status_pause', { defaultValue: 'En pausa' })
                    : t('controlAsistencia.status_active', { defaultValue: 'En jornada' })
                  : t('controlAsistencia.status_off', { defaultValue: 'Fuera de jornada' })}
              </Text>
            </View>

            {/* Display Numérico del Cronómetro */}
            <Animated.View style={[estilos.relojDisplayWrap, estiloReloj]}>
              <Text style={estilos.tiempoDisplay} numberOfLines={1} adjustsFontSizeToFit>
                {formatearTiempo(segundos)}
              </Text>
            </Animated.View>

            {/* Subtítulo de Fecha Capitalizada */}
            <Text style={estilos.fechaTextoCapital}>{formatearFechaHoy()}</Text>

            {horaEntrada && (
              <View style={estilos.filaEntradaRegistrada}>
                <Feather name="log-in" size={13} color={esOscuro ? '#BAE6FD' : '#2563EB'} />
                <Text style={estilos.textoEntradaRegistrada}>Inicio registrado: {horaEntrada}</Text>
              </View>
            )}

            {/* Botones de Marcaje */}
            <View style={estilos.accionesMarcaje}>
              {!estaActivo ? (
                <BotonAnimado
                  style={estilos.botonEntrada}
                  onPress={manejarIniciarEntrada}
                  disabled={registrando}
                  scaleTo={0.97}
                >
                  <View style={estilos.contenidoBotonPrimario}>
                    {registrando ? (
                      <ActivityIndicator size="small" color={pulse.textInverse} />
                    ) : (
                      <Feather name="play" size={18} color={pulse.textInverse} />
                    )}
                    <Text style={estilos.textoBotonPrimario}>
                      {registrando ? 'Registrando Entrada...' : t('controlAsistencia.btn_start', { defaultValue: 'Iniciar jornada' })}
                    </Text>
                  </View>
                </BotonAnimado>
              ) : (
                <View style={estilos.filaBotonesActivos}>
                  <BotonAnimado
                    style={[estilos.botonPausa, enPausa && estilos.botonPausaActiva]}
                    onPress={alternarPausa}
                    disabled={registrando}
                    scaleTo={0.96}
                  >
                    <View style={estilos.contenidoBotonPausa}>
                      <Feather name={enPausa ? "play" : "pause"} size={16} color={enPausa ? "#10B981" : "#F59E0B"} />
                      <Text style={[estilos.textoBotonPausa, enPausa && { color: "#10B981" }]}>
                        {enPausa ? t('controlAsistencia.btn_resume', { defaultValue: 'Reanudar' }) : t('controlAsistencia.btn_pause', { defaultValue: 'Pausar' })}
                      </Text>
                    </View>
                  </BotonAnimado>

                  <BotonAnimado
                    style={estilos.botonSalida}
                    onPress={confirmarFinalizarSalida}
                    disabled={registrando}
                    scaleTo={0.96}
                  >
                    <View style={estilos.contenidoBotonSalida}>
                      {registrando ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Feather name="square" size={16} color="#ffffff" />
                      )}
                      <Text style={estilos.textoBotonSalida}>
                        {t('controlAsistencia.btn_end', { defaultValue: 'Finalizar jornada' })}
                      </Text>
                    </View>
                  </BotonAnimado>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* MÉTRICAS BENTO DE ASISTENCIA */}
        <Text style={estilos.seccionLabel}>{t('controlAsistencia.summary_label', { defaultValue: 'Métricas de hoy' })}</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(40).easing(Easing.out(Easing.quad))}
          style={estilos.resumenGrid}
        >
          <View style={estilos.resumenCard}>
            <View style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: esOscuro ? 'rgba(59,130,246,0.22)' : 'rgba(37,99,235,0.08)' }]}>
                <Feather name="clock" size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              </View>
              <Text style={estilos.resumenValor}>8h 00m</Text>
              <Text style={estilos.resumenSubLabel}>Meta Jornada</Text>
            </View>
          </View>

          <View style={estilos.resumenCard}>
            <View style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: esOscuro ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.10)' }]}>
                <Feather name="check-circle" size={15} color={esOscuro ? '#34D399' : '#10B981'} />
              </View>
              <Text style={[estilos.resumenValor, { color: esOscuro ? '#34D399' : '#10B981' }]}>A tiempo</Text>
              <Text style={estilos.resumenSubLabel}>Puntualidad</Text>
            </View>
          </View>

          <View style={estilos.resumenCard}>
            <View style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: esOscuro ? 'rgba(245,158,11,0.22)' : 'rgba(245,158,11,0.10)' }]}>
                <Feather name="zap" size={15} color={esOscuro ? '#FBBF24' : '#F59E0B'} />
              </View>
              <Text style={[estilos.resumenValor, { color: esOscuro ? '#FBBF24' : '#F59E0B' }]}>{metrics?.racha || 1} días</Text>
              <Text style={estilos.resumenSubLabel}>Racha Activa</Text>
            </View>
          </View>
        </Animated.View>

        {/* CRONOLOGÍA DE LA JORNADA DE HOY */}
        <Text style={estilos.seccionLabel}>Jornada de hoy</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(60).easing(Easing.out(Easing.quad))}
          style={estilos.cronologiaCard}
        >
          <View style={estilos.cronologiaItem}>
            <View style={[estilos.cronoIconCircle, { backgroundColor: horaEntrada ? (esOscuro ? 'rgba(16,185,129,0.22)' : '#EAF4DC') : pulse.pill }]}>
              <Feather name="log-in" size={14} color={horaEntrada ? (esOscuro ? '#34D399' : '#10B981') : (esOscuro ? '#A8A29E' : pulse.textTertiary)} />
            </View>
            <View style={estilos.cronoTextos}>
              <Text style={estilos.cronoTitulo}>Marcaje de Entrada</Text>
              <Text style={estilos.cronoSubtitulo}>
                {horaEntrada ? `Registrado a las ${horaEntrada}` : 'Pendiente de inicio'}
              </Text>
            </View>
            {horaEntrada && (
              <View style={estilos.cronoBadgeDone}>
                <Text style={estilos.cronoBadgeDoneText}>OK</Text>
              </View>
            )}
          </View>

          <View style={estilos.cronoDivider} />

          <View style={estilos.cronologiaItem}>
            <View style={[estilos.cronoIconCircle, { backgroundColor: enPausa ? (esOscuro ? 'rgba(245,158,11,0.22)' : '#FFF6E5') : pulse.pill }]}>
              <Feather name="pause-circle" size={14} color={enPausa ? (esOscuro ? '#FBBF24' : '#F59E0B') : (esOscuro ? '#A8A29E' : pulse.textTertiary)} />
            </View>
            <View style={estilos.cronoTextos}>
              <Text style={estilos.cronoTitulo}>Pausas y Descansos</Text>
              <Text style={estilos.cronoSubtitulo}>
                {enPausa ? 'Pausa activa actualmente' : 'Sin pausas registradas'}
              </Text>
            </View>
          </View>

          <View style={estilos.cronoDivider} />

          <View style={estilos.cronologiaItem}>
            <View style={[estilos.cronoIconCircle, { backgroundColor: pulse.pill }]}>
              <Feather name="log-out" size={14} color={esOscuro ? '#A8A29E' : pulse.textTertiary} />
            </View>
            <View style={estilos.cronoTextos}>
              <Text style={estilos.cronoTitulo}>Marcaje de Salida</Text>
              <Text style={estilos.cronoSubtitulo}>
                {estaActivo ? 'En curso · Fin esperado a las 8 hrs' : 'Sin registrar'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ACCIÓN: SOLICITAR CORRECCIÓN */}
        <Animated.View
          entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))}
          style={estilos.correccionBanner}
        >
          <View style={estilos.correccionIconWrap}>
            <Feather name="edit-3" size={18} color={esOscuro ? '#FFFFFF' : pulse.text} />
          </View>
          <View style={estilos.correccionTextos}>
            <Text style={estilos.correccionTitulo}>¿Tuviste un problema de marcaje?</Text>
            <Text style={estilos.correccionDesc}>
              Reporta una entrada tardía, olvido o cambio de turno directamente.
            </Text>
          </View>
          <BotonAnimado
            style={estilos.botonCorreccionPill}
            onPress={() => setModalCorreccionAbierto(true)}
            scaleTo={0.96}
          >
            <Text style={estilos.botonCorreccionPillText}>Ajustar</Text>
          </BotonAnimado>
        </Animated.View>

        {/* DETALLE Y NORMAS DE ASISTENCIA */}
        <Text style={estilos.seccionLabel}>{t('controlAsistencia.policy_label', { defaultValue: 'Normas y Políticas' })}</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(100).easing(Easing.out(Easing.quad))}
          style={estilos.tarjetaNormas}
        >
          <View style={estilos.normasContent}>
            <View style={estilos.filaNorma}>
              <View style={estilos.iconoNormaBadge}>
                <Feather name="map-pin" size={15} color={esOscuro ? '#93C5FD' : pulse.inverse} />
              </View>
              <View style={estilos.textosNorma}>
                <Text style={estilos.tituloNorma}>Geolocalización y Cifrado</Text>
                <Text style={estilos.descNorma}>Cada evento se firma criptográficamente contra el servidor de tu empresa.</Text>
              </View>
            </View>

            <View style={estilos.divisorNorma} />

            <View style={estilos.filaNorma}>
              <View style={estilos.iconoNormaBadge}>
                <Feather name="shield" size={15} color={esOscuro ? '#34D399' : '#10B981'} />
              </View>
              <View style={estilos.textosNorma}>
                <Text style={estilos.tituloNorma}>Tolerancia de Entrada</Text>
                <Text style={estilos.descNorma}>Dispones de 15 minutos de gracia a partir de tu horario oficial asignado.</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal de Solicitud de Corrección */}
      <ModalShell
        visible={modalCorreccionAbierto}
        onClose={() => setModalCorreccionAbierto(false)}
        maxHeight="85%"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.modalScroll}>
          <View style={estilos.modalHeader}>
            <View style={estilos.modalIconBadge}>
              <Feather name="clock" size={16} color={esOscuro ? '#FFFFFF' : pulse.text} />
            </View>
            <Text style={estilos.modalTitle}>Solicitar Corrección de Marcaje</Text>
            <TouchableOpacity
              onPress={() => setModalCorreccionAbierto(false)}
              style={estilos.modalCloseBtn}
            >
              <Feather name="x" size={18} color={esOscuro ? '#FFFFFF' : pulse.text} />
            </TouchableOpacity>
          </View>

          <Text style={estilos.modalSubtitle}>
            Indica el tipo de incidencia y el horario real para actualizar tu registro oficial.
          </Text>

          {/* Tipo de corrección */}
          <Text style={estilos.inputLabel}>TIPO DE INCIDENCIA</Text>
          <View style={estilos.tipoTabsRow}>
            <TouchableOpacity
              style={[estilos.tipoTab, tipoCorreccion === 'llegada_tarde' && estilos.tipoTabActive]}
              onPress={() => setTipoCorreccion('llegada_tarde')}
            >
              <Text style={[estilos.tipoTabText, tipoCorreccion === 'llegada_tarde' && estilos.tipoTabTextActive]}>
                Llegada Tarde
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.tipoTab, tipoCorreccion === 'incidente' && estilos.tipoTabActive]}
              onPress={() => setTipoCorreccion('incidente')}
            >
              <Text style={[estilos.tipoTabText, tipoCorreccion === 'incidente' && estilos.tipoTabTextActive]}>
                Marcaje Omitido
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.tipoTab, tipoCorreccion === 'cambio_horario' && estilos.tipoTabActive]}
              onPress={() => setTipoCorreccion('cambio_horario')}
            >
              <Text style={[estilos.tipoTabText, tipoCorreccion === 'cambio_horario' && estilos.tipoTabTextActive]}>
                Cambio Turno
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hora Real */}
          <Text style={estilos.inputLabel}>HORA REAL O ESTIMADA (EJ. 08:30 AM)</Text>
          <TextInput
            style={estilos.inputField}
            placeholder="08:30 AM"
            placeholderTextColor={esOscuro ? '#94A3B8' : pulse.textTertiary}
            value={horaReal}
            onChangeText={setHoraReal}
          />

          {/* Justificación */}
          <Text style={estilos.inputLabel}>MOTIVO O JUSTIFICACIÓN</Text>
          <TextInput
            style={[estilos.inputField, estilos.inputArea]}
            placeholder="Describe qué ocurrió (falla de app, conexión, reunión urgente fuera de oficina)..."
            placeholderTextColor={esOscuro ? '#94A3B8' : pulse.textTertiary}
            value={motivoCorreccion}
            onChangeText={setMotivoCorreccion}
            multiline
            numberOfLines={4}
          />

          <BotonAnimado
            style={estilos.btnEnviarCorreccion}
            onPress={enviarSolicitudCorreccion}
            disabled={enviandoCorreccion}
            scaleTo={0.98}
          >
            {enviandoCorreccion ? (
              <ActivityIndicator size="small" color={pulse.textInverse} />
            ) : (
              <Text style={estilos.btnEnviarCorreccionText}>Enviar Solicitud a RRHH</Text>
            )}
          </BotonAnimado>
        </ScrollView>
      </ModalShell>
    </SafeAreaView>
  );
}

const isIOS = Platform.OS === 'ios';

function crearEstilos(pulse: PulseColors, esOscuro: boolean) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: pulse.background },

    topBarContainer: {
      paddingHorizontal: 20,
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
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '700',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    historyButton: {
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

    scroll: {
      paddingHorizontal: 20,
      paddingTop: isIOS ? 12 : 8,
    },

    panelHero: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      backgroundColor: pulse.surfaceElevated,
      marginBottom: 20,
      ...SOMBRAS.suave,
    },
    heroContenido: {
      padding: 22,
      alignItems: 'center',
    },

    badgeEstadoContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      marginBottom: 16,
    },
    puntoEstado: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    textoEstadoBadge: {
      fontSize: 11.5,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    relojDisplayWrap: {
      marginVertical: 4,
      paddingHorizontal: 8,
    },
    tiempoDisplay: {
      fontSize: 48,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : pulse.text,
      letterSpacing: -1,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },

    fechaTextoCapital: {
      fontSize: 13,
      color: esOscuro ? '#E2DFE8' : pulse.textTertiary,
      textTransform: 'capitalize',
      marginTop: 4,
      fontWeight: '600',
    },

    filaEntradaRegistrada: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: esOscuro ? 'rgba(56,189,248,0.18)' : 'rgba(37,99,235,0.06)',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: esOscuro ? 'rgba(56,189,248,0.28)' : 'transparent',
    },
    textoEntradaRegistrada: {
      fontSize: 11.5,
      color: esOscuro ? '#BAE6FD' : '#2563EB',
      fontWeight: '700',
    },

    accionesMarcaje: {
      width: '100%',
      marginTop: 22,
    },
    botonEntrada: {
      borderRadius: 18,
      height: 52,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    contenidoBotonPrimario: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    textoBotonPrimario: {
      color: pulse.textInverse,
      fontWeight: '800',
      fontSize: 15.5,
      letterSpacing: 0.2,
    },

    filaBotonesActivos: {
      flexDirection: 'row',
      gap: 10,
    },
    botonPausa: {
      flex: 1,
      borderRadius: 16,
      height: 48,
      backgroundColor: esOscuro ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonPausaActiva: {
      backgroundColor: esOscuro ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)',
      borderColor: esOscuro ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.3)',
    },
    contenidoBotonPausa: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    textoBotonPausa: {
      color: esOscuro ? '#FBBF24' : '#F59E0B',
      fontWeight: '800',
      fontSize: 13.5,
    },
    botonSalida: {
      flex: 1.3,
      borderRadius: 16,
      height: 48,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    contenidoBotonSalida: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    textoBotonSalida: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 14,
    },

    seccionLabel: {
      fontSize: 11.5,
      fontWeight: '800',
      color: esOscuro ? '#E2DFE8' : pulse.textTertiary,
      letterSpacing: 0.7,
      textTransform: 'uppercase',
      marginBottom: 10,
      paddingHorizontal: 2,
    },

    resumenGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    resumenCard: {
      flex: 1,
      minHeight: 96,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      backgroundColor: pulse.surfaceElevated,
      ...SOMBRAS.suave,
    },
    resumenContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    resumenIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.pill,
    },
    resumenValor: {
      fontSize: 15.5,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : pulse.text,
      letterSpacing: -0.2,
      marginTop: 4,
    },
    resumenSubLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: esOscuro ? '#C5C1CB' : pulse.textTertiary,
    },

    // Cronología de Hoy
    cronologiaCard: {
      borderRadius: 22,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      padding: 16,
      marginBottom: 20,
      ...SOMBRAS.suave,
    },
    cronologiaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cronoIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cronoTextos: {
      flex: 1,
    },
    cronoTitulo: {
      fontSize: 13.5,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : pulse.text,
    },
    cronoSubtitulo: {
      fontSize: 12,
      color: esOscuro ? '#D0CCD6' : pulse.textTertiary,
      marginTop: 2,
    },
    cronoBadgeDone: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: esOscuro ? 'rgba(16,185,129,0.22)' : '#EAF4DC',
    },
    cronoBadgeDoneText: {
      color: esOscuro ? '#34D399' : '#10B981',
      fontSize: 10.5,
      fontWeight: '800',
    },
    cronoDivider: {
      height: 1,
      backgroundColor: pulse.border,
      marginVertical: 12,
      marginLeft: 44,
    },

    // Corrección Banner
    correccionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      padding: 14,
      gap: 12,
      marginBottom: 20,
      ...SOMBRAS.suave,
    },
    correccionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    correccionTextos: {
      flex: 1,
    },
    correccionTitulo: {
      fontSize: 13,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : pulse.text,
    },
    correccionDesc: {
      fontSize: 11.5,
      color: esOscuro ? '#D0CCD6' : pulse.textTertiary,
      lineHeight: 16,
      marginTop: 2,
    },
    botonCorreccionPill: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: pulse.inverse,
    },
    botonCorreccionPillText: {
      color: pulse.textInverse,
      fontSize: 11.5,
      fontWeight: '800',
    },

    // Políticas / Normas
    tarjetaNormas: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      backgroundColor: pulse.surfaceElevated,
      ...SOMBRAS.suave,
    },
    normasContent: {
      padding: 16,
      gap: 12,
    },
    filaNorma: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconoNormaBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    textosNorma: { flex: 1 },
    tituloNorma: {
      fontSize: 13.5,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : pulse.text,
    },
    descNorma: {
      fontSize: 12,
      color: esOscuro ? '#D0CCD6' : pulse.textTertiary,
      lineHeight: 17,
      marginTop: 2,
    },
    divisorNorma: {
      height: 1,
      backgroundColor: pulse.border,
    },

    // Modal de Corrección
    modalScroll: {
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    modalIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    modalTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : pulse.text,
      marginLeft: 10,
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    modalSubtitle: {
      fontSize: 13,
      color: esOscuro ? '#D0CCD6' : pulse.textSecondary,
      lineHeight: 18,
      marginBottom: 18,
    },
    inputLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: esOscuro ? '#E2DFE8' : pulse.textTertiary,
      letterSpacing: 0.6,
      marginBottom: 6,
      marginTop: 10,
    },
    tipoTabsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tipoTab: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipoTabActive: {
      backgroundColor: '#D5E774',
      borderColor: '#D5E774',
    },
    tipoTabText: {
      fontSize: 11,
      fontWeight: '700',
      color: esOscuro ? '#E2DFE8' : pulse.textSecondary,
    },
    tipoTabTextActive: {
      color: '#1F1D1C',
      fontWeight: '800',
    },
    inputField: {
      borderRadius: 14,
      backgroundColor: esOscuro ? '#24252C' : pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.10)' : pulse.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      color: esOscuro ? '#FFFFFF' : pulse.text,
    },
    inputArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    btnEnviarCorreccion: {
      marginTop: 20,
      borderRadius: 16,
      backgroundColor: pulse.inverse,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnEnviarCorreccionText: {
      color: pulse.textInverse,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}
