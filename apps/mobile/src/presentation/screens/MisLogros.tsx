import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  ScrollView} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { EmptyState, Skeleton, SkeletonLista } from '@/presentation/components/ui';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { COLORES, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { calcularPuntos, calcularProgresoLogros, siguienteLogro } from 'domain/services/gamificationEngine';
import { AchievementProgress, EarnedAchievement } from 'domain/entities/Achievement';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

type ColoresTema = ReturnType<typeof useTemaMobile>['colores'];

interface Props { navigation: any; }

function BarraProgresoLogro({ porcentaje, colores }: { porcentaje: number; colores: ColoresTema }) {
  const progreso = useSharedValue(0);

  React.useEffect(() => {
    progreso.value = withTiming(porcentaje / 100, { duration: 600 });
  }, [porcentaje, progreso]);

  const estiloAnimado = useAnimatedStyle(() => ({ width: `${progreso.value * 100}%` }));

  return (
    <View style={[estilosProgreso.barraFondo, { backgroundColor: colores.vidrioSutil }]}>
      <Animated.View style={[estilosProgreso.barraRelleno, { backgroundColor: '#3B82F6' }, estiloAnimado]} />
    </View>
  );
}

export default function MisLogros({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, tareas, metrics } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores, esOscuro);

  const [cursosCompletados, setCursosCompletados] = useState(0);
  const [obtenidos, setObtenidos] = useState<EarnedAchievement[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (!perfil?.id || !perfil?.empresaId) {
        setCargando(false);
        return;
      }
      setCargando(true);
      try {
        const [progresoCursos, yaObtenidos] = await Promise.all([
          useCases.training.getProgressForUser(perfil.empresaId, perfil.id).catch(() => []),
          useCases.achievements.getEarned.execute(perfil.id).catch(() => []),
        ]);
        if (!activo) return;
        const totalCursos = (progresoCursos || []).filter((p) => p.completado).length;
        setCursosCompletados(totalCursos);
        setObtenidos(yaObtenidos || []);

        try {
          const nuevos = await useCases.achievements.sync.execute();
          if (!activo) return;
          if (nuevos && nuevos.length > 0) {
            const actualizados = await useCases.achievements.getEarned.execute(perfil.id);
            if (activo) setObtenidos(actualizados);
          }
        } catch {
          // Si el RPC remoto de sincronización no está disponible, los logros locales continúan operativos
        }
      } catch (e) {
        console.warn('[MisLogros] Aviso al cargar gamificación:', e);
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [perfil?.id, perfil?.empresaId, tareas, metrics?.racha]);

  const entrada = useMemo(() => ({
    tareasCompletadas: tareas.filter((tarea) => tarea.estado === 'completada').length,
    rachaCheckIn: metrics?.racha || 0,
    cursosCompletados,
  }), [tareas, metrics?.racha, cursosCompletados]);

  const puntos = calcularPuntos(entrada);
  const progresos: AchievementProgress[] = calcularProgresoLogros(entrada, obtenidos);
  const insigniasObtenidas = progresos.filter((p) => p.obtenido);
  const proximoLogro = siguienteLogro(progresos);

  const renderInsignia = ({ item, index }: { item: AchievementProgress; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(260).delay(index * 35).easing(Easing.out(Easing.quad))}
      style={estilos.tarjetaInsignia}
    >
      <View style={estilos.circuloInsignia}>
        <MaterialIcons name={item.icono as any} size={30} color={esOscuro ? '#93C5FD' : '#2563EB'} />
      </View>
      <Text style={estilos.nombreInsignia} numberOfLines={2}>{item.nombre}</Text>
      {item.fechaObtenida && (
        <Text style={estilos.fechaInsignia}>
          {new Date(item.fechaObtenida).toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US')}
        </Text>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}><FondoMobilePremium /></View>
      <NavbarEnterprise titulo={t('misLogros.title', { defaultValue: 'Mis Logros' })} subtitulo={t('misLogros.subtitle')} mostrarAtras />

      {cargando ? (
        <View style={estilos.scroll}>
          <Skeleton height={140} radius={RADIOS.xxl} style={{ marginBottom: 16 }} />
          <SkeletonLista filas={3} alturaFila={100} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          {/* Panel resumen con puntos y racha */}
          <Animated.View
            entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))}
            style={estilos.panelPuntosWrap}
          >
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.panelPuntos}>
              <Text style={estilos.labelPuntos}>{t('misLogros.accumulated_points', { defaultValue: 'Puntos Acumulados' })}</Text>
              <Text style={estilos.valorPuntos}>{puntos}</Text>
              <View style={estilos.rachaContenedor}>
                <FontAwesome5 name="fire" size={15} color="#F97316" />
                <Text style={estilos.textoRacha}>{t('misLogros.streak_days', { defaultValue: `${metrics?.racha || 0} días de racha`, count: metrics?.racha || 0 })}</Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Sección de insignias obtenidas */}
          <View style={estilos.seccionInsignias}>
            <Text style={estilos.seccionTitulo}>{t('misLogros.obtained_badges', { defaultValue: 'Insignias Obtenidas' })}</Text>
            {insigniasObtenidas.length === 0 ? (
              <EmptyState icono="award" titulo={t('misLogros.no_badges_msg', { defaultValue: 'Aún no has desbloqueado insignias. Completa tareas para ganarlas.' })} />
            ) : (
              <FlatList
                data={insigniasObtenidas}
                keyExtractor={(i) => i.id}
                renderItem={renderInsignia}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={estilos.filaInsignias}
              />
            )}
          </View>

          {/* Siguiente logro */}
          {proximoLogro && (
            <Animated.View
              entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))}
              style={estilos.proximoLogroWrap}
            >
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.proximoLogro}>
                <Text style={estilos.tituloProx}>{t('misLogros.next_achievement', { defaultValue: 'Próximo Objetivo' })}</Text>
                <View style={estilos.infoProx}>
                  <View style={estilos.iconoProxWrap}>
                    <MaterialIcons name={proximoLogro.icono as any} size={28} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={estilos.nombreProx}>{proximoLogro.nombre}</Text>
                    <Text style={estilos.descProx}>{proximoLogro.descripcion} ({proximoLogro.progreso}/{proximoLogro.umbral})</Text>
                    <BarraProgresoLogro porcentaje={Math.round((proximoLogro.progreso / proximoLogro.umbral) * 100)} colores={colores} />
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const estilosProgreso = StyleSheet.create({
  barraFondo: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 3 },
});

function crearEstilos(c: ColoresTema, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill },
    scroll: { padding: 16, paddingBottom: 110, gap: 16 },

    panelPuntosWrap: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    panelPuntos: {
      alignItems: 'center',
      padding: 22,
      backgroundColor: glass,
    },
    labelPuntos: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    valorPuntos: {
      fontSize: 46,
      fontWeight: '900',
      color: c.texto,
      marginVertical: 4,
      letterSpacing: -1,
    },
    rachaContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(249, 115, 22, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.25)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADIOS.completo,
      marginTop: 6,
    },
    textoRacha: {
      fontSize: 12.5,
      fontWeight: '800',
      color: '#EA580C',
    },

    seccionInsignias: {
      marginTop: 6,
    },
    seccionTitulo: {
      fontSize: 16,
      color: c.texto,
      marginBottom: 12,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    filaInsignias: {
      justifyContent: 'flex-start',
      gap: 12,
    },
    tarjetaInsignia: {
      width: '30.8%',
      alignItems: 'center',
      marginBottom: 16,
    },
    circuloInsignia: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      marginBottom: 8,
      ...SOMBRAS.flotante,
    },
    nombreInsignia: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.texto,
      textAlign: 'center',
      lineHeight: 15,
    },
    fechaInsignia: {
      fontSize: 10,
      color: c.textoSuave,
      marginTop: 2,
    },

    proximoLogroWrap: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    proximoLogro: {
      padding: 16,
      backgroundColor: glass,
    },
    tituloProx: {
      fontSize: 11,
      fontWeight: '900',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    infoProx: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconoProxWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.20)',
    },
    nombreProx: {
      fontSize: 14.5,
      fontWeight: '800',
      color: c.texto,
    },
    descProx: {
      fontSize: 12,
      color: c.textoSuave,
      marginTop: 2,
      marginBottom: 10,
      lineHeight: 16,
    },
  });
}
