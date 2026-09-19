import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator} from 'react-native';
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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;

interface Props {
  navigation: any;
}

export default function ControlAsistencia({ navigation }: Props) {
  const { t } = useTranslation();
  const { perfil, registrarEventoAsistencia, metrics } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores, esOscuro);

  const [estaActivo, setEstaActivo] = useState(false);
  const [enPausa, setEnPausa] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);

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
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `${t('controlAsistencia.alert_error_pause')}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  const confirmarFinalizarSalida = () => {
    Alert.alert(
      t('controlAsistencia.confirm_end_title'),
      t('controlAsistencia.confirm_end_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('controlAsistencia.confirm_end_finish'), style: 'destructive', onPress: manejarFinalizarSalida },
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
        t('controlAsistencia.success_end_title'),
        t('controlAsistencia.success_end_msg', { tiempo: tiempoTrabajado })
      );
    } catch (e: any) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), `${t('controlAsistencia.alert_error_event', { defaultValue: 'No se pudo registrar la salida.' })}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View pointerEvents="none" style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo={t('controlAsistencia.title', { defaultValue: 'Control de Asistencia' })}
        subtitulo={t('controlAsistencia.subtitle')}
        mostrarAtras
      />

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* HERO: PANEL CRONÓMETRO DE JORNADA */}
        <Animated.View
          entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))}
          style={estilos.panelHero}
        >
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContenido}>
            {/* Badge de Estado Pulsante */}
            <View style={estilos.badgeEstadoContenedor}>
              <View style={[
                estilos.puntoEstado,
                { backgroundColor: estaActivo ? (enPausa ? '#F59E0B' : '#10B981') : colores.textoSuave }
              ]} />
              <Text style={[
                estilos.textoEstadoBadge,
                { color: estaActivo ? (enPausa ? '#F59E0B' : '#10B981') : colores.textoSuave }
              ]}>
                {estaActivo
                  ? enPausa
                    ? t('controlAsistencia.status_pause')
                    : t('controlAsistencia.status_active')
                  : t('controlAsistencia.status_off')}
              </Text>
            </View>

            {/* Display Numérico del Cronómetro */}
            <Animated.View style={[estilos.relojDisplayWrap, estiloReloj]}>
              <Text style={estilos.tiempoDisplay} numberOfLines={1} adjustsFontSizeToFit>
                {formatearTiempo(segundos)}
              </Text>
            </Animated.View>

            {/* Subtítulos de Fecha & Entrada */}
            <Text style={estilos.fechaTextoCapital}>{formatearFechaHoy()}</Text>

            {horaEntrada && (
              <View style={estilos.filaEntradaRegistrada}>
                <Feather name="log-in" size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
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
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Feather name="play" size={18} color="#ffffff" />
                    )}
                    <Text style={estilos.textoBotonPrimario}>
                      {registrando ? 'Registrando Entrada...' : t('controlAsistencia.btn_start')}
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
                        {enPausa ? t('controlAsistencia.btn_resume') : t('controlAsistencia.btn_pause')}
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
                      <Text style={estilos.textoBotonSalida}>{t('controlAsistencia.btn_end')}</Text>
                    </View>
                  </BotonAnimado>
                </View>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* MÉTRICAS BENTO DE ASISTENCIA */}
        <Text style={estilos.seccionLabel}>{t('controlAsistencia.summary_label')}</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(40).easing(Easing.out(Easing.quad))}
          style={estilos.resumenGrid}
        >
          <View style={estilos.resumenCard}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: esOscuro ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.08)' }]}>
                <Feather name="clock" size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              </View>
              <Text style={estilos.resumenValor}>8h 00m</Text>
              <Text style={estilos.resumenLabel}>Meta Jornada</Text>
            </BlurView>
          </View>

          <View style={estilos.resumenCard}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Feather name="check-circle" size={15} color="#10B981" />
              </View>
              <Text style={[estilos.resumenValor, { color: '#10B981' }]}>A tiempo</Text>
              <Text style={estilos.resumenLabel}>Puntualidad</Text>
            </BlurView>
          </View>

          <View style={estilos.resumenCard}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <Feather name="zap" size={15} color="#F59E0B" />
              </View>
              <Text style={[estilos.resumenValor, { color: '#F59E0B' }]}>{metrics?.racha || 1} días</Text>
              <Text style={estilos.resumenLabel}>Racha Activa</Text>
            </BlurView>
          </View>
        </Animated.View>

        {/* DETALLE Y NORMAS DE ASISTENCIA */}
        <Text style={estilos.seccionLabel}>{t('controlAsistencia.policy_label')}</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))}
          style={estilos.tarjetaNormas}
        >
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.normasContent}>
            <View style={estilos.filaNorma}>
              <View style={estilos.iconoNormaBadge}>
                <Feather name="map-pin" size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              </View>
              <View style={estilos.textosNorma}>
                <Text style={estilos.tituloNorma}>Geolocalización y Cifrado</Text>
                <Text style={estilos.descNorma}>Cada evento se firma criptográficamente contra el servidor de tu empresa.</Text>
              </View>
            </View>

            <View style={estilos.divisorNorma} />

            <View style={estilos.filaNorma}>
              <View style={estilos.iconoNormaBadge}>
                <Feather name="shield" size={15} color="#10B981" />
              </View>
              <View style={estilos.textosNorma}>
                <Text style={estilos.tituloNorma}>Tolerancia de Entrada</Text>
                <Text style={estilos.descNorma}>Dispones de 15 minutos de gracia a partir de tu horario oficial asignado.</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = c.vidrioSutil;

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    scroll: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },

    panelHero: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
      backgroundColor: glass,
      marginBottom: 20,
      ...SOMBRAS.flotante,
    },
    heroContenido: {
      padding: 20,
      alignItems: 'center',
    },

    badgeEstadoContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 16,
    },
    puntoEstado: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    textoEstadoBadge: {
      fontSize: 10.5,
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
      color: c.texto,
      letterSpacing: -1,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },

    fechaTextoCapital: {
      fontSize: 13,
      color: c.textoSecundario,
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
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.06)',
    },
    textoEntradaRegistrada: {
      fontSize: 11.5,
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '700',
    },

    accionesMarcaje: {
      width: '100%',
      marginTop: 22,
    },
    botonEntrada: {
      borderRadius: 18,
      height: 52,
      backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.flotante,
    },
    contenidoBotonPrimario: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    textoBotonPrimario: {
      color: '#ffffff',
      fontWeight: '800',
      fontSize: 16,
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
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonPausaActiva: {
      backgroundColor: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.3)',
    },
    contenidoBotonPausa: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    textoBotonPausa: {
      color: '#F59E0B',
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
      ...SOMBRAS.flotante,
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
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.6,
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
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
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
      borderColor: c.borde,
    },
    resumenValor: {
      fontSize: 16,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.2,
      marginTop: 4,
    },
    resumenLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
    },

    tarjetaNormas: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
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
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textosNorma: { flex: 1 },
    tituloNorma: {
      fontSize: 13.5,
      fontWeight: '800',
      color: c.texto,
    },
    descNorma: {
      fontSize: 11.5,
      color: c.textoSecundario,
      lineHeight: 16,
      marginTop: 2,
    },
    divisorNorma: {
      height: 1,
      backgroundColor: c.borde,
    },
  });
}
