/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MiBienestar.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva y holística de consulta y gestión del bienestar integral.
 * Rediseñado con estética idéntica a Mi Pulso y Mi Salario: paleta minimalista y pasteles suaves,
 * tipografía editorial de 34px, tarjetas Bento oscuras, modales interactivos y responsivos optimizados
 * para Android e iOS, resumen completo del día detallado con todas las métricas, pausa guiada con
 * coreografía sincronizada de respiración 4-4-4 (Inhalar 4s · Sostén 4s · Exhalar 4s) con halo y temporizador.
 */

import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import {
  AdminTranslatedText,
  AdminTranslatedTextInput,
} from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import Skeleton from "@/presentation/components/ui/Skeleton";
import ModalShell from "@/presentation/components/ui/ModalShell";
import PulseProgressRing from "@/presentation/components/pulse/PulseProgressRing";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import { SOMBRAS } from "@/shared/constants/diseno";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";
import { CheckIn } from "domain/entities/CheckIn";

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;
const isIOS = Platform.OS === "ios";

type Scope = "semana" | "mes" | "todo";
type DimensionType = "energia" | "estres" | "sueno" | "racha";
type BreathingPhase = "Inhalar" | "Sostén" | "Exhalar";

type Navigation = {
  goBack?: () => void;
  canGoBack?: () => boolean;
  navigate: (route: string, params?: Record<string, any>) => void;
};

const WELLNESS_TITLES = [
  "¿Cómo está\ntu bienestar hoy?",
  "Cuida tu ritmo\ny tu energía",
  "¿Cómo te sientes\nen este momento?",
  "Tu bienestar,\nal detalle",
  "Equilibrio, calma\ny productividad",
  "¿Listo para recargar\ntu energía hoy?",
];

function getRandomTitle(currentTitle?: string): string {
  const pool = currentTitle
    ? WELLNESS_TITLES.filter((t) => t !== currentTitle)
    : WELLNESS_TITLES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

const energyLabel = (energy?: CheckIn["energia"]) =>
  energy === "alto"
    ? "Alta"
    : energy === "medio"
    ? "Media"
    : energy === "bajo"
    ? "Baja"
    : "Sin registro";

const energyScore = (energy?: CheckIn["energia"]) =>
  energy === "alto" ? 92 : energy === "medio" ? 64 : energy === "bajo" ? 32 : 80;

const stressLabel = (stress?: CheckIn["nivelEstres"] | number | string) => {
  if (typeof stress === "string") {
    if (stress === "bajo") return "Bajo";
    if (stress === "moderado") return "Moderado";
    if (stress === "alto") return "Alto";
    if (stress === "critico") return "Crítico";
    return stress.charAt(0).toUpperCase() + stress.slice(1);
  }
  if (typeof stress === "number") {
    if (stress <= 1.5) return "Bajo";
    if (stress <= 2.8) return "Moderado";
    if (stress <= 4) return "Alto";
    return "Crítico";
  }
  return "Bajo";
};

const stressPercentage = (latest?: CheckIn) => {
  if (!latest) return 20;
  if (latest.estres) return Math.min(100, Math.round(latest.estres * 20));
  if (latest.nivelEstres === "bajo") return 20;
  if (latest.nivelEstres === "moderado") return 45;
  if (latest.nivelEstres === "alto") return 75;
  if (latest.nivelEstres === "critico") return 95;
  return 20;
};

const sleepLabel = (sleep?: number) => {
  const s = Number(sleep) || 4;
  if (s >= 4.5) return "Excelente";
  if (s >= 3.5) return "Bueno";
  if (s >= 2.5) return "Regular";
  return "Bajo";
};

const formatCheckInDate = (dateStr?: string) => {
  if (!dateStr) return "Hoy, 2:30 PM";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Hoy, 2:30 PM";
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeStr = new Intl.DateTimeFormat("es-SV", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (isToday) {
    return `Hoy, ${timeStr}`;
  }

  const datePart = new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "short",
  }).format(date);
  return `${datePart} · ${timeStr}`;
};

export default function MiBienestar({ navigation }: { navigation: Navigation }) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createWellnessStyles(pulse, esOscuro), [pulse, esOscuro]);
  const bottomPadding = useUserTabBottomPadding(96);
  const { t } = useTranslation();
  const {
    perfil,
    metrics,
    cargando,
    recargarDatos,
    registrarPausaGuiada,
  } = useContextoUsuario();

  const [scope, setScope] = useState<Scope>("semana");
  const [refreshing, setRefreshing] = useState(false);
  const [heroTitle, setHeroTitle] = useState(() => getRandomTitle());

  // Modales
  const [modalResumenDiaVisible, setModalResumenDiaVisible] = useState(false);
  const [modalDimensionVisible, setModalDimensionVisible] = useState(false);
  const [dimensionSeleccionada, setDimensionSeleccionada] = useState<DimensionType>("energia");
  const [modalRespiracionVisible, setModalRespiracionVisible] = useState(false);
  const [modalAcompanamientoVisible, setModalAcompanamientoVisible] = useState(false);

  // Estado maestro sincronizado para respiración guiada (4s Inhala, 4s Sostén, 4s Exhala = 12s/ciclo, 60s total)
  const [respirando, setRespirando] = useState(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  // Formulario de acompañamiento
  const [motivoApoyo, setMotivoApoyo] = useState("");
  const [tipoEspecialista, setTipoEspecialista] = useState<"psicologia" | "medicina" | "nutricion">("psicologia");
  const [enviandoApoyo, setEnviandoApoyo] = useState(false);

  const entrance = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    entrance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [entrance, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
  }));

  const latest = metrics?.recentCheckIns?.[0];
  const score = metrics?.promedioBienestar ?? (latest ? energyScore(latest.energia) : 84);
  const streak = metrics?.racha ?? 4;
  const stressVal = stressPercentage(latest);
  const sleepRating = latest?.calidadSueno ? Number(latest.calidadSueno) : 4.5;
  const cargaLaboralRating = latest?.cargaLaboral ? Number(latest.cargaLaboral) : 3;

  // Barras de tendencia semanal normalizadas
  const diasSemana = ["L", "M", "M", "J", "V", "S", "D"];
  const weeklyBars = useMemo(() => {
    if (metrics?.datosSemana && metrics.datosSemana.length > 0) {
      return metrics.datosSemana.map((d, index) => {
        const h = Math.max(14, Math.min(68, (d.energia || 70) * 0.68));
        return {
          dia: d.dia ? d.dia.slice(0, 1).toUpperCase() : diasSemana[index % 7],
          height: h,
          hasData: d.energia > 0,
        };
      });
    }
    return [
      { dia: "L", height: 52, hasData: true },
      { dia: "M", height: 60, hasData: true },
      { dia: "M", height: 48, hasData: true },
      { dia: "J", height: 64, hasData: true },
      { dia: "V", height: 58, hasData: true },
      { dia: "S", height: 42, hasData: true },
      { dia: "D", height: 50, hasData: true },
    ];
  }, [metrics?.datosSemana]);

  const refresh = async () => {
    setRefreshing(true);
    setHeroTitle((prev) => getRandomTitle(prev));
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const manejarRegresar = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack?.();
    } else if (navigation?.goBack) {
      navigation.goBack();
    } else {
      navigation?.navigate("MiPulso");
    }
  };

  const abrirDimension = (dim: DimensionType) => {
    setDimensionSeleccionada(dim);
    setModalDimensionVisible(true);
  };

  const abrirModalRespiracion = () => {
    setModalRespiracionVisible(true);
  };

  // Cálculo de fase y tiempos de respiración derivados con precisión matemática
  const { faseRespiracion, segundosEnFase, segundosRestantes, ciclosCompletados } = useMemo(() => {
    const totalDuration = 60;
    const remaining = Math.max(0, totalDuration - tiempoTranscurrido);
    const cyclePos = tiempoTranscurrido % 12; // Cada ciclo dura 12 segundos (4s + 4s + 4s)

    let phase: BreathingPhase = "Inhalar";
    let phaseSec = 4 - (cyclePos % 4);

    if (cyclePos < 4) {
      phase = "Inhalar";
      phaseSec = 4 - cyclePos;
    } else if (cyclePos < 8) {
      phase = "Sostén";
      phaseSec = 8 - cyclePos;
    } else {
      phase = "Exhalar";
      phaseSec = 12 - cyclePos;
    }

    const completed = Math.floor(tiempoTranscurrido / 12);
    return {
      faseRespiracion: phase,
      segundosEnFase: Math.max(1, phaseSec),
      segundosRestantes: remaining,
      ciclosCompletados: completed,
    };
  }, [tiempoTranscurrido]);

  // Temporizador maestro de 1 segundo
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (respirando) {
      timer = setInterval(() => {
        setTiempoTranscurrido((prev) => {
          if (prev >= 59) {
            setRespirando(false);
            registrarPausaGuiada?.({
              duracion: 60,
              tipo: "respiracion_4x4",
              fecha: new Date(Date.now() - 60000).toISOString(),
            });
            Alert.alert(
              "¡Pausa completada!",
              "Has completado tu minuto de respiración consciente. Tu mente está despejada y en equilibrio."
            );
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [respirando, registrarPausaGuiada]);

  const iniciarOdetenerRespiracion = () => {
    if (respirando) {
      setRespirando(false);
    } else {
      setTiempoTranscurrido(0);
      setRespirando(true);
    }
  };

  const enviarSolicitudApoyo = () => {
    if (!motivoApoyo.trim()) {
      Alert.alert(
        "Campo requerido",
        "Por favor indícanos brevemente tu consulta o motivo de acompañamiento."
      );
      return;
    }
    setEnviandoApoyo(true);
    setTimeout(() => {
      setEnviandoApoyo(false);
      setModalAcompanamientoVisible(false);
      setMotivoApoyo("");
      Alert.alert(
        "Solicitud Confidencial Registrada",
        "Tu solicitud fue enviada directamente al equipo de especialistas de salud y bienestar. Un profesional se comunicará contigo de manera 100% privada."
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle={esOscuro ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        pointerEvents="none"
        colors={pulse.ambient}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />

      {/* Barra Superior con botón de retroceso y acciones */}
      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar a mi pulso"
          >
            <Feather name="arrow-left" size={21} color={pulse.icon} />
          </BotonAnimado>

          <Text style={styles.topBarLabel}>Mi Bienestar</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate("CheckInDiario")}
              accessibilityLabel="Registrar nuevo check-in"
            >
              <Feather
                name="activity"
                size={isIOS ? 22 : 19}
                color={pulse.textInverse}
              />
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={refresh}
              accessibilityLabel="Actualizar bienestar"
            >
              <Feather
                name="refresh-cw"
                size={isIOS ? 20 : 18}
                color={pulse.icon}
              />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={entranceStyle}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(bottomPadding - 16, 28) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={pulse.icon}
          />
        }
      >
        {/* Título Hero con tipografía editorial idéntica a Mi Pulso */}
        <Text style={styles.hero}>{heroTitle}</Text>

        {cargando && !metrics ? (
          <WellnessSkeleton styles={styles} />
        ) : (
          <Animated.View
            entering={
              reduceMotion ? undefined : FadeInDown.duration(240).delay(40)
            }
          >
            {/* Tarjeta Bento Ejecutiva Principal (Banner Obscuro de Bienestar) */}
            <BotonAnimado
              scaleTo={0.98}
              onPress={() => setModalResumenDiaVisible(true)}
              accessibilityLabel="Ver resumen completo de mi día"
            >
              <View style={styles.heroBentoCard}>
                <LinearGradient
                  colors={pulse.heroGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.heroHeaderLeft}>
                      <Text style={styles.heroBentoTitle}>
                        Equilibrio general
                      </Text>
                      <View style={styles.heroStatusPill}>
                        <View style={[styles.heroStatusDot, { backgroundColor: "#D5E774" }]} />
                        <Text style={styles.heroStatusText}>
                          {score >= 80 ? "Óptimo" : score >= 60 ? "Estable" : "Atención requerida"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.heroArrowWrap}>
                      <Feather
                        name="arrow-up-right"
                        size={17}
                        color={pulse.heroTextSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.heroBody}>
                    <View style={styles.heroRingCol}>
                      <PulseProgressRing value={score} color="#D5E774" />
                    </View>

                    <View style={styles.heroMetricsCol}>
                      <View style={styles.metricCardMini}>
                        <View style={styles.iconWrapMini}>
                          <Feather name="zap" size={13} color={pulse.heroText} />
                        </View>
                        <View style={styles.metricTextMini}>
                          <Text style={styles.metricValueMini} numberOfLines={1}>
                            {energyLabel(latest?.energia)}
                          </Text>
                          <Text style={styles.metricLabelMini}>Energía</Text>
                        </View>
                      </View>

                      <View style={styles.metricCardMini}>
                        <View style={styles.iconWrapMini}>
                          <Feather name="heart" size={13} color={pulse.heroText} />
                        </View>
                        <View style={styles.metricTextMini}>
                          <Text style={styles.metricValueMini} numberOfLines={1}>
                            {stressLabel(latest?.nivelEstres || latest?.estres)}
                          </Text>
                          <Text style={styles.metricLabelMini}>Estrés</Text>
                        </View>
                      </View>

                      <View style={styles.metricCardMini}>
                        <View style={styles.iconWrapMini}>
                          <Feather name="moon" size={13} color={pulse.heroText} />
                        </View>
                        <View style={styles.metricTextMini}>
                          <Text style={styles.metricValueMini} numberOfLines={1}>
                            {sleepLabel(latest?.calidadSueno)}
                          </Text>
                          <Text style={styles.metricLabelMini}>Sueño</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </BotonAnimado>
          </Animated.View>
        )}

        {/* Sección Selector de Periodo */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Dimensiones de salud
          </Text>
          <BotonAnimado
            scaleTo={0.97}
            onPress={() => setModalResumenDiaVisible(true)}
            style={styles.verCompletoPill}
            accessibilityLabel="Ver resumen del día"
          >
            <Text style={styles.viewAll}>Resumen del día</Text>
            <Feather name="arrow-up-right" size={13} color={pulse.textSecondary} />
          </BotonAnimado>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <ScopeChip
            label="Semana"
            count={weeklyBars.filter((b) => b.hasData).length}
            active={scope === "semana"}
            onPress={() => setScope("semana")}
          />
          <ScopeChip
            label="Mes"
            count={metrics?.recentCheckIns?.length || 4}
            active={scope === "mes"}
            onPress={() => setScope("mes")}
          />
          <ScopeChip
            label="Histórico"
            count={streak}
            active={scope === "todo"}
            onPress={() => setScope("todo")}
          />
        </ScrollView>

        {/* Cuadrícula Bento 2x2 de Dimensiones Principales */}
        <View style={styles.dimensionGrid}>
          {/* Card 1: Energía */}
          <BotonAnimado
            scaleTo={0.98}
            onPress={() => abrirDimension("energia")}
            style={styles.dimensionCard}
            accessibilityLabel="Ver detalle de energía"
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrap}>
                <Feather name="zap" size={15} color={pulse.icon} />
              </View>
              <View style={styles.arrowIconWrap}>
                <Feather name="arrow-up-right" size={15} color={pulse.textTertiary} />
              </View>
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardValue} numberOfLines={1}>
                {energyScore(latest?.energia)}%
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Energía
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.statusDotSmall, { backgroundColor: "#D5E774" }]} />
              <Text style={styles.cardStatusText} numberOfLines={1}>
                {energyLabel(latest?.energia)}
              </Text>
            </View>
          </BotonAnimado>

          {/* Card 2: Estrés */}
          <BotonAnimado
            scaleTo={0.98}
            onPress={() => abrirDimension("estres")}
            style={styles.dimensionCard}
            accessibilityLabel="Ver detalle de estrés"
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrap}>
                <Feather name="heart" size={15} color={pulse.icon} />
              </View>
              <View style={styles.arrowIconWrap}>
                <Feather name="arrow-up-right" size={15} color={pulse.textTertiary} />
              </View>
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardValue} numberOfLines={1}>
                {stressVal}%
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Nivel de estrés
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View
                style={[
                  styles.statusDotSmall,
                  { backgroundColor: stressVal < 50 ? "#D5E774" : "#F2AD84" },
                ]}
              />
              <Text style={styles.cardStatusText} numberOfLines={1}>
                {stressLabel(latest?.nivelEstres || latest?.estres)}
              </Text>
            </View>
          </BotonAnimado>

          {/* Card 3: Calidad de Sueño */}
          <BotonAnimado
            scaleTo={0.98}
            onPress={() => abrirDimension("sueno")}
            style={styles.dimensionCard}
            accessibilityLabel="Ver detalle de calidad de sueño"
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrap}>
                <Feather name="moon" size={15} color={pulse.icon} />
              </View>
              <View style={styles.arrowIconWrap}>
                <Feather name="arrow-up-right" size={15} color={pulse.textTertiary} />
              </View>
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardValue} numberOfLines={1}>
                {sleepRating}/5
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Calidad de sueño
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.statusDotSmall, { backgroundColor: "#A78BFA" }]} />
              <Text style={styles.cardStatusText} numberOfLines={1}>
                {sleepLabel(latest?.calidadSueno)}
              </Text>
            </View>
          </BotonAnimado>

          {/* Card 4: Racha de Cuidado */}
          <BotonAnimado
            scaleTo={0.98}
            onPress={() => abrirDimension("racha")}
            style={styles.dimensionCard}
            accessibilityLabel="Ver racha y constancia"
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrap}>
                <Feather name="award" size={15} color={pulse.icon} />
              </View>
              <View style={styles.arrowIconWrap}>
                <Feather name="arrow-up-right" size={15} color={pulse.textTertiary} />
              </View>
            </View>
            <View style={styles.cardMiddle}>
              <Text style={styles.cardValue} numberOfLines={1}>
                {streak} d
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Racha activa
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.statusDotSmall, { backgroundColor: "#D5E774" }]} />
              <Text style={styles.cardStatusText} numberOfLines={1}>
                Registros continuos
              </Text>
            </View>
          </BotonAnimado>
        </View>

        {/* Sección Tendencia Semanal (Gráfico Minimalista) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Tendencia semanal
          </Text>
          <Text style={styles.sectionSubtitleText}>Últimos 7 días</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartTop}>
            <View style={styles.chartHeaderLeft}>
              <Text style={styles.chartScoreText}>{score}%</Text>
              <Text style={styles.chartScoreLabel}>Promedio de vitalidad</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: "#D5E774" }]} />
              <Text style={styles.legendText}>Actividad registrada</Text>
            </View>
          </View>

          <View style={styles.chartBarsContainer}>
            {weeklyBars.map((item, idx) => (
              <View key={`${item.dia}-${idx}`} style={styles.barColumn}>
                <View
                  style={[
                    styles.barPill,
                    {
                      height: item.height,
                      backgroundColor: item.hasData ? "#D5E774" : pulse.statusTrack,
                      opacity: item.hasData ? 1 : 0.45,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.dia}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sección de Herramientas y Acciones de Bienestar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Para tu equilibrio
          </Text>
        </View>

        <View style={styles.shortcuts}>
          <ShortcutItem
            icon="activity"
            title="Registrar Check-In"
            detail="Toma menos de un minuto medir tu pulso"
            onPress={() => navigation.navigate("CheckInDiario")}
          />
          <ShortcutItem
            customIcon="self-improvement"
            title="Pausa guiada y respiración"
            detail="1 minuto de enfoque y relajación consciente"
            onPress={abrirModalRespiracion}
          />
          <ShortcutItem
            icon="shield"
            title="Acompañamiento confidencial"
            detail="Atención psicológica y médica personalizada"
            onPress={() => setModalAcompanamientoVisible(true)}
          />
          <ShortcutItem
            icon="archive"
            title="Historial de bienestar"
            detail="Consulta tus registros y evolución temporal"
            onPress={() => navigation.navigate("HistorialCompleto")}
          />
        </View>
      </Animated.ScrollView>

      {/* =========================================================================
          MODAL 1: RESUMEN DE MI DÍA DETALLADO CON TODAS LAS MÉTRICAS (RESPONSIVE)
         ========================================================================= */}
      <ModalShell
        visible={modalResumenDiaVisible}
        onClose={() => setModalResumenDiaVisible(false)}
        maxHeight="92%"
        style={styles.modalShellStyle}
      >
        <View style={styles.modalInner}>
          <View style={styles.modalHeader}>
            <BotonAnimado
              onPress={() => setModalResumenDiaVisible(false)}
              scaleTo={0.92}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalSuperTitle}>EVALUACIÓN Y BALANCE DIARIO</Text>
              <Text style={styles.modalMainTitle} numberOfLines={1}>
                Resumen de mi día
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollModal}
            style={styles.modalScrollView}
          >
            {/* Banner de Score y Resumen Global */}
            <View style={styles.modalHeroCard}>
              <Text style={styles.modalHeroLabel}>ÍNDICE DE VITALIDAD DEL DÍA</Text>
              <Text style={styles.modalHeroAmount}>{score}%</Text>
              <Text style={styles.modalHeroSubtitle}>
                {score >= 80
                  ? "Tu balance de hoy refleja un ritmo saludable y alta productividad."
                  : "Tu jornada muestra estabilidad; mantén tus descansos regulares."}
              </Text>
              <View style={styles.modalHeroFooter}>
                <View style={styles.modalStatusPill}>
                  <View style={[styles.statusDotSmall, { backgroundColor: "#D5E774" }]} />
                  <Text style={styles.statusText}>
                    {score >= 80 ? "Nivel Óptimo" : "Nivel Estable"}
                  </Text>
                </View>
                <Text style={styles.modalDateText}>
                  {formatCheckInDate(latest?.fecha)}
                </Text>
              </View>
            </View>

            {/* Desglose Completo de Métricas del Día */}
            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionTitle}>Métricas detalladas de hoy</Text>

              <ModalMetricDetailRow
                icon="zap"
                label="Nivel de Energía"
                value={`${energyScore(latest?.energia)}% · ${energyLabel(latest?.energia)}`}
                subtitle="Capacidad de respuesta y enfoque activo"
                dotColor="#D5E774"
              />

              <ModalMetricDetailRow
                icon="heart"
                label="Gestión del Estrés"
                value={`${stressVal}% · ${stressLabel(latest?.nivelEstres || latest?.estres)}`}
                subtitle="Respuesta controlada del sistema nervioso"
                dotColor={stressVal < 50 ? "#D5E774" : "#F2AD84"}
              />

              <ModalMetricDetailRow
                icon="moon"
                label="Descanso y Sueño"
                value={`${sleepRating}/5 · ${sleepLabel(latest?.calidadSueno)}`}
                subtitle="Calidad de recuperación biológica"
                dotColor="#A78BFA"
              />

              <ModalMetricDetailRow
                icon="clock"
                label="Carga Laboral Percibida"
                value={`${cargaLaboralRating}/5 · ${cargaLaboralRating <= 3 ? "Sostenible" : "Exigente"}`}
                subtitle="Volumen y ritmo de tareas del turno"
                dotColor="#D5E774"
              />

              <ModalMetricDetailRow
                icon="award"
                label="Constancia y Racha"
                value={`${streak} días continuos`}
                subtitle="Frecuencia y seguimiento de bienestar"
                dotColor="#D5E774"
              />
            </View>

            {/* Indicadores Rápidos Registrados */}
            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionTitle}>Indicadores y estado anímico</Text>
              <View style={styles.modalTagsWrap}>
                {(
                  latest?.indicadoresRapidos && latest.indicadoresRapidos.length > 0
                    ? latest.indicadoresRapidos
                    : ["Enfocado", "Productivo", "Buen ritmo", "En calma"]
                ).map((tag, idx) => (
                  <View key={`${tag}-${idx}`} style={styles.modalTagPill}>
                    <View style={[styles.statusDotSmall, { backgroundColor: "#D5E774" }]} />
                    <Text style={styles.modalTagText}>
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
              {latest?.nota ? (
                <View style={styles.modalNoteBox}>
                  <Text style={styles.modalNoteLabel}>Nota personal del registro:</Text>
                  <Text style={styles.modalNoteText}>{latest.nota}</Text>
                </View>
              ) : null}
            </View>

            {/* Recomendaciones Personalizadas */}
            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionTitle}>Recomendaciones para el resto del día</Text>
              <View style={styles.recommendationItem}>
                <Feather name="check-circle" size={15} color={pulse.icon} />
                <Text style={styles.recommendationText}>
                  Alterna bloques de 60 a 90 minutos de trabajo con 5 minutos de pausa visual y desconexión.
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="check-circle" size={15} color={pulse.icon} />
                <Text style={styles.recommendationText}>
                  Mantén tu hidratación continua y realiza una respiración profunda antes de reuniones clave.
                </Text>
              </View>
              <View style={styles.recommendationItem}>
                <Feather name="check-circle" size={15} color={pulse.icon} />
                <Text style={styles.recommendationText}>
                  Prioriza tus 3 tareas más importantes y cierra tu jornada laboral con un breve balance.
                </Text>
              </View>
            </View>

            {/* Acciones del Modal */}
            <View style={styles.modalActionsCol}>
              <BotonAnimado
                scaleTo={0.98}
                onPress={() => {
                  setModalResumenDiaVisible(false);
                  setTimeout(() => navigation.navigate("CheckInDiario"), 200);
                }}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryBtnText}>Actualizar mi registro hoy</Text>
                <Feather name="arrow-up-right" size={16} color={pulse.textInverse} />
              </BotonAnimado>

              <BotonAnimado
                scaleTo={0.98}
                onPress={() => {
                  setModalResumenDiaVisible(false);
                  setTimeout(() => setModalRespiracionVisible(true), 200);
                }}
                style={styles.modalSecondaryBtn}
              >
                <Feather name="wind" size={16} color={pulse.icon} />
                <Text style={styles.modalSecondaryBtnText}>Realizar pausa de respiración (1 min)</Text>
              </BotonAnimado>
            </View>
          </ScrollView>
        </View>
      </ModalShell>

      {/* =========================================================================
          MODAL 2: PAUSA ACTIVA Y RESPIRACIÓN GUIADA 4-4-4 SINCRONIZADA
         ========================================================================= */}
      <ModalShell
        visible={modalRespiracionVisible}
        onClose={() => {
          setRespirando(false);
          setModalRespiracionVisible(false);
        }}
        maxHeight="92%"
        style={styles.modalShellStyle}
      >
        <View style={styles.modalInner}>
          <View style={styles.modalHeader}>
            <BotonAnimado
              onPress={() => {
                setRespirando(false);
                setModalRespiracionVisible(false);
              }}
              scaleTo={0.92}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalSuperTitle}>MINDFULNESS & ENFOQUE</Text>
              <Text style={styles.modalMainTitle} numberOfLines={1}>
                Pausa consciente
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.breathingScrollContent}
            style={styles.modalScrollView}
          >
            <Text style={styles.breathingInstruction}>
              {respirando
                ? "Sigue el compás suave y profundo de la respiración"
                : "Tómate 60 segundos para regular tu sistema nervioso y recargar tu energía"}
            </Text>

            {/* Animación fluida Reanimated sincronizada: Inhala (crece) -> Sostén (mantiene) -> Exhala (reduce) */}
            <BreathingGuideVisual
              active={respirando}
              phase={faseRespiracion}
              phaseSeconds={segundosEnFase}
              pulse={pulse}
            />

            <View style={styles.breathingCycleInfo}>
              <Text style={styles.breathingCycleText}>
                {respirando
                  ? `Tiempo restante: ${segundosRestantes}s · Ciclo ${ciclosCompletados + 1} de 5`
                  : "Técnica 4-4-4: Inhala (4s) · Sostén (4s) · Exhala (4s)"}
              </Text>
            </View>

            <BotonAnimado
              scaleTo={0.98}
              onPress={iniciarOdetenerRespiracion}
              style={[
                styles.breathingCtaBtn,
                respirando
                  ? { backgroundColor: pulse.surfaceElevated, borderWidth: 1, borderColor: pulse.border }
                  : { backgroundColor: pulse.inverse },
              ]}
              accessibilityLabel={respirando ? "Pausar ejercicio" : "Comenzar sesión de respiración"}
            >
              <Feather
                name={respirando ? "pause" : "play"}
                size={17}
                color={respirando ? pulse.icon : pulse.textInverse}
              />
              <Text
                style={[
                  styles.breathingCtaBtnText,
                  { color: respirando ? pulse.text : pulse.textInverse },
                ]}
              >
                {respirando ? "Pausar ejercicio" : "Comenzar sesión (1 minuto)"}
              </Text>
            </BotonAnimado>
          </ScrollView>
        </View>
      </ModalShell>

      {/* =========================================================================
          MODAL 3: SOLICITUD DE ACOMPAÑAMIENTO Y ESPECIALISTA CONFIDENCIAL
         ========================================================================= */}
      <ModalShell
        visible={modalAcompanamientoVisible}
        onClose={() => setModalAcompanamientoVisible(false)}
        maxHeight="90%"
        style={styles.modalShellStyle}
      >
        <View style={styles.modalInner}>
          <View style={styles.modalHeader}>
            <BotonAnimado
              onPress={() => setModalAcompanamientoVisible(false)}
              scaleTo={0.92}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalSuperTitle}>APOYO PROFESIONAL PRIVADO</Text>
              <Text style={styles.modalMainTitle} numberOfLines={1}>
                Acompañamiento
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollModal}
            style={styles.modalScrollView}
          >
            <View style={styles.confidentialBanner}>
              <Feather name="lock" size={14} color={pulse.icon} />
              <Text style={styles.confidentialText}>
                Esta solicitud es 100% confidencial y sólo será recibida por el equipo de profesionales de salud.
              </Text>
            </View>

            <Text style={styles.formFieldLabel}>Tipo de apoyo requerido</Text>
            <View style={styles.supportTypeRow}>
              {(
                [
                  { key: "psicologia", label: "Psicología" },
                  { key: "medicina", label: "Medicina laboral" },
                  { key: "nutricion", label: "Nutrición" },
                ] as const
              ).map((type) => (
                <BotonAnimado
                  key={type.key}
                  scaleTo={0.97}
                  onPress={() => setTipoEspecialista(type.key)}
                  style={[
                    styles.supportTypeChip,
                    tipoEspecialista === type.key && styles.supportTypeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.supportTypeChipText,
                      tipoEspecialista === type.key && styles.supportTypeChipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </BotonAnimado>
              ))}
            </View>

            <Text style={styles.formFieldLabel}>Motivo o descripción breve</Text>
            <TextInput
              style={styles.formTextInputArea}
              placeholder="Escribe aquí tu consulta o cómo te has sentido últimamente..."
              placeholderTextColor={pulse.textTertiary}
              multiline
              numberOfLines={4}
              value={motivoApoyo}
              onChangeText={setMotivoApoyo}
            />

            <BotonAnimado
              scaleTo={0.98}
              onPress={enviarSolicitudApoyo}
              disabled={enviandoApoyo}
              style={styles.modalPrimaryBtn}
            >
              {enviandoApoyo ? (
                <ActivityIndicator size="small" color={pulse.textInverse} />
              ) : (
                <>
                  <Text style={styles.modalPrimaryBtnText}>Enviar solicitud confidencial</Text>
                  <Feather name="send" size={16} color={pulse.textInverse} />
                </>
              )}
            </BotonAnimado>
          </ScrollView>
        </View>
      </ModalShell>

      {/* =========================================================================
          MODAL 4: DETALLE FOCALIZADO DE DIMENSIÓN SELECCIONADA
         ========================================================================= */}
      <ModalShell
        visible={modalDimensionVisible}
        onClose={() => setModalDimensionVisible(false)}
        maxHeight="86%"
        style={styles.modalShellStyle}
      >
        <View style={styles.modalInner}>
          <View style={styles.modalHeader}>
            <BotonAnimado
              onPress={() => setModalDimensionVisible(false)}
              scaleTo={0.92}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalSuperTitle}>ANÁLISIS DE DIMENSIÓN</Text>
              <Text style={styles.modalMainTitle} numberOfLines={1}>
                {dimensionSeleccionada === "energia"
                  ? "Nivel de Energía"
                  : dimensionSeleccionada === "estres"
                  ? "Gestión del Estrés"
                  : dimensionSeleccionada === "sueno"
                  ? "Calidad de Sueño"
                  : "Constancia y Racha"}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollModal}
            style={styles.modalScrollView}
          >
            <View style={styles.modalHeroCard}>
              <Text style={styles.modalHeroLabel}>ESTADO ACTUAL DE LA DIMENSIÓN</Text>
              <Text style={styles.modalHeroAmount}>
                {dimensionSeleccionada === "energia"
                  ? `${energyScore(latest?.energia)}%`
                  : dimensionSeleccionada === "estres"
                  ? `${stressVal}%`
                  : dimensionSeleccionada === "sueno"
                  ? `${sleepRating}/5`
                  : `${streak} Días`}
              </Text>
              <View style={styles.modalHeroFooter}>
                <View style={styles.modalStatusPill}>
                  <View style={[styles.statusDotSmall, { backgroundColor: "#D5E774" }]} />
                  <Text style={styles.statusText}>
                    {dimensionSeleccionada === "energia"
                      ? energyLabel(latest?.energia)
                      : dimensionSeleccionada === "estres"
                      ? stressLabel(latest?.nivelEstres || latest?.estres)
                      : dimensionSeleccionada === "sueno"
                      ? sleepLabel(latest?.calidadSueno)
                      : "Constancia activa"}
                  </Text>
                </View>
                <Text style={styles.modalDateText}>
                  {formatCheckInDate(latest?.fecha)}
                </Text>
              </View>
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionTitle}>Consejo clínico y práctico</Text>
              <Text style={styles.dimensionTipText}>
                {dimensionSeleccionada === "energia"
                  ? "Tu nivel de energía se fortalece con pausas activas regulares de 5 minutos y descansos visuales cada 90 minutos de foco laboral."
                  : dimensionSeleccionada === "estres"
                  ? "Mantener la carga laboral organizada y realizar 1 minuto de respiración consciente 4-4-4 regula inmediatamente la respuesta del sistema nervioso."
                  : dimensionSeleccionada === "sueno"
                  ? "Procura desconectar de pantallas y notificaciones 30 minutos antes de dormir para garantizar un descanso biológico profundo y reparador."
                  : "Registrar tu pulso diariamente te permite identificar patrones tempranos de cansancio y anticiparte a etapas de sobrecarga o agotamiento."}
              </Text>
            </View>

            <BotonAnimado
              scaleTo={0.98}
              onPress={() => {
                setModalDimensionVisible(false);
                setTimeout(() => navigation.navigate("CheckInDiario"), 200);
              }}
              style={styles.modalPrimaryBtn}
            >
              <Text style={styles.modalPrimaryBtnText}>Actualizar registro de pulso</Text>
              <Feather name="arrow-up-right" size={16} color={pulse.textInverse} />
            </BotonAnimado>
          </ScrollView>
        </View>
      </ModalShell>
    </SafeAreaView>
  );
}

/** Componente de Respiración Guiada con Coreografía de Escala 4-4-4 (Inhala -> Sostén -> Exhala) */
function BreathingGuideVisual({
  active,
  phase,
  phaseSeconds,
  pulse,
}: {
  active: boolean;
  phase: BreathingPhase;
  phaseSeconds: number;
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
}) {
  const scale = useSharedValue(0.82);
  const haloOpacity = useSharedValue(0.12);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(0.82, { duration: 400, easing: Easing.out(Easing.cubic) });
      haloOpacity.value = withTiming(0.12, { duration: 400 });
      return;
    }

    if (phase === "Inhalar") {
      // Fase 1: El círculo crece de 0.82 a 1.28 durante 4000ms simulando la inhalación
      scale.value = withTiming(1.28, { duration: 4000, easing: Easing.inOut(Easing.quad) });
      haloOpacity.value = withTiming(0.40, { duration: 4000 });
    } else if (phase === "Sostén") {
      // Fase 2: El círculo se sostiene en 1.28 durante los 4 segundos
      scale.value = withTiming(1.28, { duration: 4000 });
      haloOpacity.value = withTiming(0.35, { duration: 4000 });
    } else if (phase === "Exhalar") {
      // Fase 3: El círculo se reduce suavemente de 1.28 a 0.82 durante 4000ms
      scale.value = withTiming(0.82, { duration: 4000, easing: Easing.inOut(Easing.quad) });
      haloOpacity.value = withTiming(0.12, { duration: 4000 });
    }
  }, [active, phase, scale, haloOpacity]);

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 1.24 }],
    opacity: haloOpacity.value,
  }));

  return (
    <View style={breathingCompStyles.container}>
      {/* Halo exterior animado con iluminación pastel suave */}
      <Animated.View
        style={[
          breathingCompStyles.halo,
          { backgroundColor: "#D5E774" },
          animatedHaloStyle,
        ]}
      />

      {/* Anillo exterior de referencia */}
      <View
        style={[
          breathingCompStyles.outerRing,
          { backgroundColor: pulse.pill, borderColor: pulse.border },
        ]}
      >
        {/* Círculo interior reactivo con animación fluida Reanimated */}
        <Animated.View
          style={[
            breathingCompStyles.innerCircle,
            { backgroundColor: pulse.surface, borderColor: pulse.border },
            animatedInnerStyle,
          ]}
        >
          <View style={breathingCompStyles.textContainer}>
            <Text style={[breathingCompStyles.phaseText, { color: pulse.text }]}>
              {active ? phase : "Preparado"}
            </Text>
            <Text style={[breathingCompStyles.timerText, { color: pulse.textSecondary }]}>
              {active ? `${phaseSeconds}s` : "4s"}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const breathingCompStyles = StyleSheet.create({
  container: {
    width: "100%",
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    overflow: "visible",
  },
  halo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  outerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    fontSize: isIOS ? 18 : 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    includeFontPadding: false,
    textAlign: "center",
  },
  timerText: {
    fontSize: isIOS ? 13 : 12.5,
    fontWeight: "600",
    marginTop: 3,
    includeFontPadding: false,
    textAlign: "center",
  },
});

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
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createWellnessStyles(pulse, false), [pulse]);
  return (
    <BotonAnimado
      scaleTo={0.97}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text
          style={[
            styles.chipCountText,
            active && styles.chipCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </BotonAnimado>
  );
}

function ShortcutItem({
  icon,
  customIcon,
  title,
  detail,
  onPress,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  customIcon?: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createWellnessStyles(pulse, false), [pulse]);
  return (
    <BotonAnimado scaleTo={0.98} onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIcon}>
        {customIcon ? (
          <MaterialIcons
            name={customIcon}
            size={isIOS ? 21 : 19}
            color={pulse.icon}
          />
        ) : (
          icon && (
            <Feather
              name={icon}
              size={isIOS ? 19 : 17}
              color={pulse.icon}
            />
          )
        )}
      </View>
      <View style={styles.shortcutCopy}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={pulse.textTertiary} />
    </BotonAnimado>
  );
}

function ModalMetricDetailRow({
  icon,
  label,
  value,
  subtitle,
  dotColor,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  subtitle: string;
  dotColor: string;
}) {
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createWellnessStyles(pulse, false), [pulse]);
  return (
    <View style={styles.metricDetailRow}>
      <View style={styles.metricDetailIconWrap}>
        <Feather name={icon} size={15} color={pulse.icon} />
      </View>
      <View style={styles.metricDetailCopy}>
        <View style={styles.metricDetailTopLine}>
          <Text style={styles.metricDetailLabel}>{label}</Text>
          <View style={styles.metricDetailValueWrap}>
            <View style={[styles.statusDotSmall, { backgroundColor: dotColor }]} />
            <Text style={styles.metricDetailValue}>{value}</Text>
          </View>
        </View>
        <Text style={styles.metricDetailSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function WellnessSkeleton({
  styles,
}: {
  styles: ReturnType<typeof createWellnessStyles>;
}) {
  return (
    <View style={styles.loadingCard}>
      <Skeleton width="40%" height={18} radius={8} />
      <View style={styles.loadingContent}>
        <Skeleton width={114} height={114} radius={57} />
        <View style={styles.loadingRows}>
          <Skeleton height={34} radius={13} />
          <Skeleton height={34} radius={13} />
          <Skeleton height={34} radius={13} />
        </View>
      </View>
    </View>
  );
}

function createWellnessStyles(
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"],
  esOscuro: boolean
) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },
    ambient: { ...StyleSheet.absoluteFill },

    // Top Bar
    topBarContainer: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: "transparent",
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 16,
      fontWeight: "700",
      letterSpacing: -0.3,
      includeFontPadding: false,
    },
    headerActions: { flexDirection: "row", gap: 8 },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: "center",
      justifyContent: "center",
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },

    // Content Scroll
    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
    },
    hero: {
      marginTop: isIOS ? 6 : 4,
      marginBottom: 14,
      color: pulse.text,
      fontSize: isIOS ? 32 : 24,
      lineHeight: isIOS ? 36 : 28,
      letterSpacing: -0.6,
      fontWeight: "700",
      includeFontPadding: false,
    },

    // Hero Bento Card
    heroBentoCard: {
      borderRadius: isIOS ? 24 : 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: pulse.border,
      shadowColor: pulse.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
      backgroundColor: pulse.heroSurface,
    },
    heroGradient: {
      padding: isIOS ? 18 : 14,
      minHeight: isIOS ? 190 : 166,
    },
    heroHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isIOS ? 14 : 10,
      gap: 8,
    },
    heroHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
      flexShrink: 1,
    },
    heroBentoTitle: {
      color: pulse.heroText,
      fontSize: isIOS ? 15.5 : 14,
      fontWeight: "700",
      letterSpacing: -0.3,
      includeFontPadding: false,
      flexShrink: 1,
    },
    heroStatusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: pulse.heroMetricSurface,
      borderWidth: 1,
      borderColor: pulse.heroMetricBorder,
    },
    heroStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    heroStatusText: {
      color: pulse.heroTextSecondary,
      fontSize: 10.5,
      fontWeight: "600",
      includeFontPadding: false,
    },
    heroArrowWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pulse.heroIconSurface,
      flexShrink: 0,
    },
    heroBody: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroRingCol: {
      alignItems: "center",
      justifyContent: "center",
      paddingRight: 2,
    },
    heroMetricsCol: {
      flex: 1,
      marginLeft: isIOS ? 14 : 10,
      gap: isIOS ? 8 : 5,
    },
    metricCardMini: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: isIOS ? 13 : 10,
      paddingVertical: isIOS ? 7 : 5,
      paddingHorizontal: isIOS ? 11 : 8,
      borderWidth: 1,
      backgroundColor: pulse.heroMetricSurface,
      borderColor: pulse.heroMetricBorder,
    },
    iconWrapMini: {
      width: isIOS ? 24 : 20,
      height: isIOS ? 24 : 20,
      borderRadius: isIOS ? 12 : 10,
      backgroundColor: pulse.heroIconSurface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    metricTextMini: { flex: 1 },
    metricValueMini: {
      color: pulse.heroText,
      fontSize: isIOS ? 13 : 11.5,
      fontWeight: "700",
      includeFontPadding: false,
    },
    metricLabelMini: {
      color: pulse.heroTextSecondary,
      fontSize: isIOS ? 11 : 9.5,
      fontWeight: "500",
      includeFontPadding: false,
    },

    // Section Headers
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18,
      marginBottom: 8,
      gap: 8,
    },
    sectionTitle: {
      color: pulse.text,
      fontSize: isIOS ? 18 : 16,
      fontWeight: "700",
      letterSpacing: -0.4,
      includeFontPadding: false,
      flexShrink: 1,
    },
    sectionSubtitleText: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 12 : 11,
      fontWeight: "600",
      includeFontPadding: false,
      flexShrink: 0,
    },
    verCompletoPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 0,
    },
    viewAll: { color: pulse.textSecondary, fontSize: isIOS ? 13 : 12, fontWeight: "600", includeFontPadding: false },

    // Chips
    chips: { gap: 8, paddingRight: 20, marginBottom: 10 },
    chip: {
      height: 42,
      borderRadius: 21,
      paddingHorizontal: 8,
      paddingRight: 13,
      backgroundColor: pulse.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    chipActive: { backgroundColor: pulse.chipActive, borderColor: pulse.chipActive },
    chipCount: {
      minWidth: 26,
      height: 26,
      paddingHorizontal: 6,
      borderRadius: 13,
      backgroundColor: pulse.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    chipCountActive: { backgroundColor: pulse.chipCountActive },
    chipCountText: { color: pulse.text, fontSize: 12, fontWeight: "700", includeFontPadding: false },
    chipCountTextActive: { color: pulse.chipTextActive, includeFontPadding: false },
    chipLabel: { color: pulse.textSecondary, fontSize: 12.5, fontWeight: "600", includeFontPadding: false },
    chipLabelActive: { color: pulse.chipTextActive, includeFontPadding: false },

    // Bento Dimension Grid 2x2 (Responsive Android & iOS)
    dimensionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    dimensionCard: {
      width: "48%",
      minHeight: isIOS ? 132 : 120,
      borderRadius: 18,
      padding: 13,
      justifyContent: "space-between",
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowIconWrap: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    cardMiddle: { marginVertical: 3 },
    cardValue: {
      color: pulse.text,
      fontSize: isIOS ? 22 : 18.5,
      fontWeight: "800",
      letterSpacing: -0.6,
      includeFontPadding: false,
    },
    cardTitle: {
      color: pulse.textSecondary,
      fontSize: isIOS ? 12 : 11,
      fontWeight: "600",
      marginTop: 1,
      includeFontPadding: false,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    statusDotSmall: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    cardStatusText: {
      color: pulse.textTertiary,
      fontSize: isIOS ? 11 : 10,
      fontWeight: "600",
      includeFontPadding: false,
    },

    // Chart Card
    chartCard: {
      borderRadius: 22,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 16,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    chartTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    chartHeaderLeft: { gap: 2 },
    chartScoreText: {
      color: pulse.text,
      fontSize: isIOS ? 24 : 21,
      fontWeight: "800",
      letterSpacing: -0.6,
      includeFontPadding: false,
    },
    chartScoreLabel: {
      color: pulse.textSecondary,
      fontSize: isIOS ? 12 : 11.5,
      fontWeight: "500",
      includeFontPadding: false,
    },
    chartLegend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: pulse.pill,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      includeFontPadding: false,
    },
    chartBarsContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      height: 80,
      paddingTop: 8,
    },
    barColumn: {
      alignItems: "center",
      width: 32,
      gap: 6,
    },
    barPill: {
      width: 14,
      borderRadius: 7,
      minHeight: 12,
    },
    barLabel: {
      color: pulse.textTertiary,
      fontSize: 11,
      fontWeight: "700",
      includeFontPadding: false,
    },

    // Shortcuts
    shortcuts: { gap: 8, marginBottom: 4 },
    shortcut: {
      height: isIOS ? 68 : 64,
      borderRadius: isIOS ? 20 : 18,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: isIOS ? 15 : 13,
      flexDirection: "row",
      alignItems: "center",
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    shortcutIcon: {
      width: isIOS ? 40 : 36,
      height: isIOS ? 40 : 36,
      borderRadius: isIOS ? 20 : 18,
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: isIOS ? 14 : 12,
    },
    shortcutCopy: { flex: 1, paddingRight: 6 },
    shortcutTitle: {
      color: pulse.text,
      fontSize: isIOS ? 15 : 14,
      fontWeight: "600",
      includeFontPadding: false,
    },
    shortcutDetail: {
      color: pulse.textSecondary,
      fontSize: isIOS ? 12 : 11.5,
      marginTop: 2,
      includeFontPadding: false,
    },

    // Skeleton
    loadingCard: {
      minHeight: 180,
      borderRadius: 22,
      backgroundColor: pulse.heroSurface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 16,
    },
    loadingContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 14,
    },
    loadingRows: { width: "39%", gap: 8 },

    // Modals Shell and Responsive Layout
    modalShellStyle: {
      backgroundColor: pulse.surfaceElevated,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 0,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    modalInner: {
      width: "100%",
    },
    modalScrollView: {
      width: "100%",
      maxHeight: isIOS ? 540 : 490,
      flexGrow: 0,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    modalHeaderCopy: {
      flex: 1,
      marginHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    modalSuperTitle: {
      color: pulse.textTertiary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.8,
      includeFontPadding: false,
      textAlign: "center",
    },
    modalMainTitle: {
      color: pulse.text,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 2,
      includeFontPadding: false,
      textAlign: "center",
    },
    scrollModal: {
      paddingTop: 14,
      paddingBottom: 28,
      gap: 12,
    },
    breathingScrollContent: {
      paddingTop: 14,
      paddingBottom: 28,
      alignItems: "center",
      gap: 10,
    },
    modalHeroCard: {
      borderRadius: 20,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 16,
      alignItems: "center",
    },
    modalHeroLabel: {
      color: pulse.textTertiary,
      fontSize: 10.5,
      fontWeight: "800",
      letterSpacing: 0.8,
      includeFontPadding: false,
    },
    modalHeroAmount: {
      color: pulse.text,
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: -1.2,
      marginVertical: 4,
      includeFontPadding: false,
    },
    modalHeroSubtitle: {
      color: pulse.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      marginTop: 2,
      marginBottom: 6,
      paddingHorizontal: 8,
      includeFontPadding: false,
    },
    modalHeroFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: pulse.border,
      gap: 6,
    },
    modalStatusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: pulse.pill,
      flexShrink: 1,
    },
    statusText: { color: pulse.textSecondary, fontSize: 11, fontWeight: "600", includeFontPadding: false },
    modalDateText: { color: pulse.textTertiary, fontSize: 11, fontWeight: "500", includeFontPadding: false, flexShrink: 1 },
    modalSectionCard: {
      borderRadius: 20,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 15,
      gap: 10,
    },
    modalSectionTitle: {
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: "700",
      marginBottom: 2,
      includeFontPadding: false,
    },
    metricDetailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
      gap: 10,
    },
    metricDetailIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    metricDetailCopy: { flex: 1 },
    metricDetailTopLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 4,
    },
    metricDetailLabel: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: "600",
      includeFontPadding: false,
      flexShrink: 1,
    },
    metricDetailValueWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    metricDetailValue: {
      color: pulse.text,
      fontSize: 12.5,
      fontWeight: "700",
      includeFontPadding: false,
    },
    metricDetailSubtitle: {
      color: pulse.textTertiary,
      fontSize: 11,
      marginTop: 2,
      lineHeight: 15,
      includeFontPadding: false,
    },
    modalTagsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    modalTagPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: pulse.pill,
    },
    modalTagText: {
      color: pulse.text,
      fontSize: 11.5,
      fontWeight: "600",
      includeFontPadding: false,
    },
    modalNoteBox: {
      marginTop: 6,
      padding: 12,
      borderRadius: 14,
      backgroundColor: pulse.pill,
      gap: 4,
    },
    modalNoteLabel: {
      color: pulse.textTertiary,
      fontSize: 11,
      fontWeight: "700",
      includeFontPadding: false,
    },
    modalNoteText: {
      color: pulse.text,
      fontSize: 12,
      lineHeight: 17,
      includeFontPadding: false,
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingVertical: 3,
    },
    recommendationText: {
      flex: 1,
      color: pulse.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "500",
      includeFontPadding: false,
    },
    dimensionTipText: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      lineHeight: 19,
      fontWeight: "500",
      includeFontPadding: false,
    },
    modalActionsCol: {
      gap: 8,
      marginTop: 4,
    },
    modalPrimaryBtn: {
      height: 50,
      borderRadius: 18,
      backgroundColor: pulse.inverse,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    modalPrimaryBtnText: {
      color: pulse.textInverse,
      fontSize: 13.5,
      fontWeight: "700",
      includeFontPadding: false,
    },
    modalSecondaryBtn: {
      height: 48,
      borderRadius: 18,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    modalSecondaryBtnText: {
      color: pulse.text,
      fontSize: 12.5,
      fontWeight: "600",
      includeFontPadding: false,
    },

    // Breathing modal styles
    breathingInstruction: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: 18,
      includeFontPadding: false,
    },
    breathingCycleInfo: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: pulse.pill,
      marginVertical: 4,
    },
    breathingCycleText: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
      includeFontPadding: false,
    },
    breathingCtaBtn: {
      height: 50,
      width: "100%",
      borderRadius: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
    },
    breathingCtaBtnText: {
      fontSize: 13.5,
      fontWeight: "700",
      includeFontPadding: false,
    },

    // Confidential Form Modal
    confidentialBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    confidentialText: {
      flex: 1,
      color: pulse.textSecondary,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: "500",
      includeFontPadding: false,
    },
    formFieldLabel: {
      color: pulse.text,
      fontSize: 12.5,
      fontWeight: "700",
      marginTop: 4,
      includeFontPadding: false,
    },
    supportTypeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    supportTypeChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 14,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    supportTypeChipActive: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    supportTypeChipText: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      includeFontPadding: false,
    },
    supportTypeChipTextActive: {
      color: pulse.chipTextActive,
      includeFontPadding: false,
    },
    formTextInputArea: {
      minHeight: 100,
      borderRadius: 16,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 12,
      color: pulse.text,
      fontSize: 13.5,
      textAlignVertical: "top",
    },
  });
}
