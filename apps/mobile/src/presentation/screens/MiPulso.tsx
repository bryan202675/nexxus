import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import Skeleton from "@/presentation/components/ui/Skeleton";
import PulseOverviewCard from "@/presentation/components/pulse/PulseOverviewCard";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { SOMBRAS } from "@/shared/constants/diseno";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import { CheckIn } from "domain/entities/CheckIn";

const Text = AdminTranslatedText;
type Scope = "hoy" | "semana" | "mes";
type Navigation = {
  navigate: (route: string, params?: Record<string, string>) => void;
};
const energyLabel = (energy?: CheckIn["energia"]) =>
  energy === "alto"
    ? "Alta"
    : energy === "medio"
    ? "Media"
    : energy === "bajo"
    ? "Baja"
    : "Sin registro";
const stressLabel = (stress?: CheckIn["nivelEstres"]) =>
  stress
    ? `${stress.charAt(0).toUpperCase()}${stress.slice(1)}`
    : "Sin registro";
const pulseAccent = (
  energy: CheckIn["energia"] | undefined,
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"]
) =>
  energy === "alto"
    ? pulse.energyHigh
    : energy === "medio"
    ? pulse.energyMedium
    : pulse.energyLow;
const formatCheckInDate = (dateStr?: string) => {
  if (!dateStr) return "Aún sin registro";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Aún sin registro";
  const now = new Date();
  const isToday = isSameDay(dateStr, now);
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

const greeting = () => {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 5
    ? "Buenas noches,"
    : hour >= 12
    ? "Buenas tardes,"
    : "Buenos días,";
};
const isSameDay = (value: string, compare: Date) => {
  if (!value) return false;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
};
function filterCheckIns(checkIns: CheckIn[] = [], scope: Scope): CheckIn[] {
  if (!Array.isArray(checkIns) || checkIns.length === 0) return [];
  const now = new Date();
  if (scope === "hoy") {
    return checkIns.filter((item) => isSameDay(item.fecha, now));
  }
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = new Date(startOfDay);
  since.setDate(startOfDay.getDate() - (scope === "semana" ? 7 : 30));
  return checkIns.filter((item) => {
    if (!item?.fecha) return false;
    const date = new Date(item.fecha);
    return !isNaN(date.getTime()) && date >= since;
  });
}

const PULSE_TITLES = [
  "¿Cómo está\ntu pulso hoy?",
  "¿Cómo late\ntu energía hoy?",
  "¿Cómo te sientes\nen este momento?",
  "¿Qué tal va\ntu ritmo hoy?",
  "¿Cómo vibra\ntu día hoy?",
  "¿Cómo fluye\ntu bienestar hoy?",
  "¿Listo para medir\ntu pulso hoy?",
  "¿Qué tal marcha\ntu energía hoy?",
];

function getRandomTitle(currentTitle?: string): string {
  const pool = currentTitle
    ? PULSE_TITLES.filter((t) => t !== currentTitle)
    : PULSE_TITLES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export default function MiPulso({ navigation }: { navigation: Navigation }) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = usePulseStyles();
  const bottomPadding = useUserTabBottomPadding(96);
  const { t } = useTranslation();
  const {
    perfil,
    metrics,
    tareas,
    notificaciones,
    alertasNoLeidas,
    cargando,
    error,
    recargarDatos,
  } = useContextoUsuario();
  const [scope, setScope] = useState<Scope>("hoy");
  const [refreshing, setRefreshing] = useState(false);
  const [heroTitle, setHeroTitle] = useState(() => getRandomTitle());
  const entrance = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const firstName =
    perfil?.nombre?.split(" ")[0] ||
    t("miPulso.user_default", { defaultValue: "Usuario" });
  const latest = metrics?.recentCheckIns?.[0];
  const scopedCheckIns = useMemo(
    () => filterCheckIns(metrics?.recentCheckIns ?? [], scope),
    [metrics?.recentCheckIns, scope]
  );
  const completedTasks = tareas.filter(
    (task) => task.estado === "completada"
  ).length;
  const pendingTasks = tareas.filter(
    (task) => task.estado !== "completada"
  ).length;
  const pendingNotifications = notificaciones.filter(
    (item) => !item.leida
  ).length;
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
    setHeroTitle((prev) => getRandomTitle(prev));
    try {
      await recargarDatos();
    } finally {
      setRefreshing(false);
    }
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
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <BotonAnimado
            style={styles.profile}
            scaleTo={0.97}
            onPress={() => navigation.navigate("PerfilLaboral")}
            accessibilityLabel="Abrir mi perfil"
          >
            {perfil?.foto_perfil ? (
              <Image
                source={{ uri: perfil.foto_perfil }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            )}
          </BotonAnimado>
          <View style={styles.greeting}>
            <Text style={styles.greetingLine}>{greeting()}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate("CheckInDiario")}
              accessibilityLabel="Registrar mi pulso"
            >
              <Feather
                name="activity"
                size={Platform.OS === "ios" ? 22 : 19}
                color={pulse.textInverse}
              />
            </BotonAnimado>
            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate("Notificaciones")}
              accessibilityLabel="Abrir notificaciones"
            >
              <Bell
                size={Platform.OS === "ios" ? 20 : 18}
                color={pulse.icon}
                strokeWidth={2}
              />
              {(alertasNoLeidas > 0 || pendingNotifications > 0) && (
                <View style={styles.notificationDot} />
              )}
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
        <Text style={styles.hero}>{heroTitle}</Text>
        {cargando && !perfil ? (
          <PulseSkeleton />
        ) : (
          <Animated.View
            entering={
              reduceMotion ? undefined : FadeInDown.duration(240).delay(40)
            }
          >
            <PulseOverviewCard
              score={metrics?.promedioBienestar ?? 0}
              energy={energyLabel(latest?.energia)}
              stress={stressLabel(latest?.nivelEstres)}
              streak={metrics?.racha ?? 0}
              accent={pulseAccent(latest?.energia, pulse)}
              onPress={() => navigation.navigate("MiBienestar")}
            />
          </Animated.View>
        )}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu actividad</Text>
          <BotonAnimado
            scaleTo={0.97}
            onPress={() => navigation.navigate("HistorialCompleto")}
          >
            <Text style={styles.viewAll}>Ver todo</Text>
          </BotonAnimado>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {(["hoy", "semana", "mes"] as Scope[]).map((item) => (
            <ScopeChip
              key={item}
              label={
                item === "hoy" ? "Hoy" : item === "semana" ? "Semana" : "Mes"
              }
              count={filterCheckIns(metrics?.recentCheckIns ?? [], item).length}
              active={scope === item}
              onPress={() => setScope(item)}
            />
          ))}
        </ScrollView>
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              No pudimos actualizar tu actividad.
            </Text>
            <BotonAnimado scaleTo={0.97} onPress={refresh}>
              <Text style={styles.retry}>Reintentar</Text>
            </BotonAnimado>
          </View>
        ) : null}
        <Animated.View
          key={scope}
          entering={
            reduceMotion ? undefined : FadeInDown.duration(220)
          }
          style={styles.checkinList}
        >
          {scopedCheckIns.length > 0 ? (
            scopedCheckIns.map((checkIn, index) => (
              <CheckInCard
                key={checkIn.id || `${checkIn.fecha}-${index}`}
                checkIn={checkIn}
                onPress={() => navigation.navigate("MiBienestar")}
              />
            ))
          ) : (
            <EmptyPulseCard
              scope={scope}
              onPress={() => navigation.navigate("CheckInDiario")}
            />
          )}
        </Animated.View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Para tu jornada</Text>
        </View>
        <View style={styles.shortcuts}>
          <Shortcut
            icon="check-circle"
            title="Tareas"
            detail={`${completedTasks} completadas · ${pendingTasks} pendientes`}
            onPress={() => navigation.navigate("CentroTareas")}
          />
          <Shortcut
            icon="clock"
            title="Asistencia"
            detail="Marcar turno"
            onPress={() => navigation.navigate("ControlAsistencia")}
          />
          <Shortcut
            icon="file-text"
            title="Solicitudes"
            detail="Gestiona tus permisos"
            onPress={() => navigation.navigate("SolicitudesAusencia")}
          />
          <Shortcut
            customIcon="auto-awesome"
            title="Asistente IA"
            detail="Una consulta rápida"
            onPress={() => navigation.navigate("ChatIA")}
          />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Más accesos</Text>
        </View>
        <View style={styles.shortcuts}>
          <Shortcut
            icon="search"
            title="Buscar"
            detail="Encuentra tareas y documentos"
            onPress={() => navigation.navigate("BusquedaGlobal")}
          />
          <Shortcut
            icon="credit-card"
            title="Mi salario"
            detail="Nómina y recibos"
            onPress={() => navigation.navigate("MiSalario")}
          />
          <Shortcut
            icon="folder"
            title="Documentos"
            detail="Revisa tu biblioteca"
            onPress={() => navigation.navigate("CentroDocumentos")}
          />
          <Shortcut
            icon="archive"
            title="Historial"
            detail="Toda tu actividad"
            onPress={() => navigation.navigate("HistorialCompleto")}
          />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

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
  const styles = usePulseStyles();
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
function CheckInCard({
  checkIn,
  onPress,
}: {
  checkIn: CheckIn;
  onPress: () => void;
}) {
  const { colores } = useTemaMobile();
  const styles = usePulseStyles();
  const pulse = colores.pulso;
  const accent = pulseAccent(checkIn.energia, pulse);
  return (
    <BotonAnimado
      scaleTo={0.98}
      onPress={onPress}
      style={styles.checkinCard}
      accessibilityLabel="Ver detalle del pulso"
    >
      <View style={styles.recordTop}>
        <View style={[styles.statusPill, { backgroundColor: `${accent}33` }]}>
          <View style={[styles.statusDot, { backgroundColor: accent }]} />
          <Text style={styles.statusText}>
            {energyLabel(checkIn.energia)} energía
          </Text>
        </View>
        <View style={styles.arrowButton}>
          <Feather name="arrow-up-right" size={18} color={pulse.icon} />
        </View>
      </View>
      <Text style={styles.recordTitle}>
        {checkIn.indicadoresRapidos?.[0] || "Pulso registrado"}
      </Text>
      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color={pulse.textTertiary} />
          <Text style={styles.time}>{formatCheckInDate(checkIn.fecha)}</Text>
        </View>
        <View style={styles.dimensionDots}>
          <DimensionDot color="#D5E774" />
          <DimensionDot color="#D9C5EE" />
          <DimensionDot color="#F2C9B8" />
        </View>
      </View>
    </BotonAnimado>
  );
}
function EmptyPulseCard({
  scope,
  onPress,
}: {
  scope: Scope;
  onPress: () => void;
}) {
  const { colores } = useTemaMobile();
  const styles = usePulseStyles();
  const pulse = colores.pulso;
  const label =
    scope === "hoy"
      ? "Sin registros hoy"
      : scope === "semana"
      ? "Sin registros esta semana"
      : "Sin registros este mes";

  const title =
    scope === "hoy"
      ? "Registra cómo te sientes"
      : "No hay registros en este periodo";

  return (
    <BotonAnimado scaleTo={0.98} onPress={onPress} style={styles.checkinCard}>
      <View style={styles.recordTop}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: pulse.textTertiary }]} />
          <Text style={styles.statusText}>{label}</Text>
        </View>
        <View style={styles.arrowButton}>
          <Feather name="arrow-up-right" size={18} color={pulse.icon} />
        </View>
      </View>
      <Text style={styles.recordTitle}>{title}</Text>
      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color={pulse.textTertiary} />
          <Text style={styles.time}>Toma menos de un minuto</Text>
        </View>
      </View>
    </BotonAnimado>
  );
}
function DimensionDot({ color }: { color: string }) {
  const styles = usePulseStyles();
  return <View style={[styles.dimensionDot, { backgroundColor: color }]} />;
}
function Shortcut({
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
  const styles = usePulseStyles();
  const pulse = colores.pulso;
  return (
    <BotonAnimado scaleTo={0.98} onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIcon}>
        {customIcon ? (
          <MaterialIcons
            name={customIcon}
            size={Platform.OS === "ios" ? 21 : 19}
            color={pulse.icon}
          />
        ) : (
          icon && (
            <Feather
              name={icon}
              size={Platform.OS === "ios" ? 19 : 17}
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
function PulseSkeleton() {
  const styles = usePulseStyles();
  return (
    <View style={styles.loadingCard}>
      <Skeleton width="35%" height={18} radius={8} />
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

function usePulseStyles() {
  const { colores } = useTemaMobile();
  return useMemo(() => createPulseStyles(colores.pulso), [colores.pulso]);
}

function createPulseStyles(pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"]) {
  const isIOS = Platform.OS === "ios";
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: pulse.background },
  ambient: { ...StyleSheet.absoluteFill },
  headerContainer: {
    paddingHorizontal: 21,
    paddingTop: isIOS ? 6 : 4,
    paddingBottom: 8,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 21,
    paddingTop: isIOS ? 12 : 8,
  },
  header: { height: isIOS ? 54 : 48, flexDirection: "row", alignItems: "center" },
  profile: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    overflow: "hidden",
    backgroundColor: pulse.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: pulse.border,
  },
  avatar: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
  },
  avatarInitial: { color: pulse.text, fontSize: isIOS ? 17 : 15, fontWeight: "700" },
  greeting: { flex: 1, marginLeft: 10 },
  greetingLine: { color: pulse.textSecondary, fontSize: isIOS ? 14 : 13.5, fontWeight: "500" },
  name: { color: pulse.text, fontSize: isIOS ? 14 : 13.5, fontWeight: "600", marginTop: 1 },
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
  notificationDot: {
    position: "absolute",
    top: isIOS ? 11 : 9,
    right: isIOS ? 12 : 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E56C67",
    borderWidth: 1.5,
    borderColor: pulse.surfaceElevated,
  },
  hero: {
    marginTop: isIOS ? 6 : 4,
    marginBottom: 16,
    color: pulse.text,
    fontSize: isIOS ? 34 : 27,
    lineHeight: isIOS ? 38 : 31,
    letterSpacing: -0.9,
    fontWeight: "600",
  },
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    color: pulse.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  viewAll: { color: pulse.textSecondary, fontSize: 13, fontWeight: "600" },
  chips: { gap: 8, paddingRight: 20 },
  chip: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingRight: 14,
    backgroundColor: pulse.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: pulse.border,
  },
  chipActive: { backgroundColor: pulse.chipActive, borderColor: pulse.chipActive },
  chipCount: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: pulse.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountActive: { backgroundColor: pulse.chipCountActive },
  chipCountText: { color: pulse.text, fontSize: 12.5, fontWeight: "700" },
  chipCountTextActive: { color: pulse.chipTextActive },
  chipLabel: { color: pulse.textSecondary, fontSize: 13, fontWeight: "600" },
  chipLabelActive: { color: pulse.chipTextActive },
  errorCard: {
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: pulse.errorSurface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: { color: pulse.errorText, fontSize: 12, fontWeight: "600" },
  retry: { color: pulse.errorText, fontSize: 12, fontWeight: "800" },
  checkinList: {
    marginTop: 14,
    gap: 12,
  },
  checkinCard: {
    minHeight: 180,
    padding: 18,
    borderRadius: 24,
    backgroundColor: pulse.surfaceElevated,
    borderWidth: 1,
    borderColor: pulse.border,
    justifyContent: "space-between",
    ...SOMBRAS.suave,
    shadowColor: pulse.shadow,
  },
  recordTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    minHeight: 29,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: pulse.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: pulse.textSecondary, fontSize: 11, fontWeight: "700" },
  arrowButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: pulse.iconSurface,
  },
  recordTitle: {
    color: pulse.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.55,
    textTransform: "capitalize",
    marginTop: 14,
  },
  recordFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  time: { color: pulse.textTertiary, fontSize: 12, fontWeight: "600" },
  dimensionDots: { flexDirection: "row" },
  dimensionDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: pulse.surfaceElevated,
    marginLeft: -7,
  },
  shortcuts: { gap: 8 },
  shortcut: {
    minHeight: isIOS ? 64 : 56,
    borderRadius: isIOS ? 18 : 16,
    paddingHorizontal: isIOS ? 14 : 13,
    paddingVertical: isIOS ? 12 : 10,
    backgroundColor: pulse.surfaceElevated,
    borderWidth: 1,
    borderColor: pulse.border,
    flexDirection: "row",
    alignItems: "center",
    ...SOMBRAS.suave,
    shadowColor: pulse.shadow,
  },
  shortcutIcon: {
    width: isIOS ? 38 : 34,
    height: isIOS ? 38 : 34,
    borderRadius: isIOS ? 19 : 17,
    backgroundColor: pulse.iconSurface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  shortcutCopy: { flex: 1, justifyContent: "center" },
  shortcutTitle: {
    color: pulse.text,
    fontSize: isIOS ? 14 : 13.5,
    fontWeight: "700",
    lineHeight: isIOS ? 18 : 17,
    includeFontPadding: false,
  },
  shortcutDetail: {
    color: pulse.textTertiary,
    fontSize: isIOS ? 11 : 10.5,
    fontWeight: "500",
    marginTop: 1,
    lineHeight: isIOS ? 14 : 13,
    includeFontPadding: false,
  },
  });
}
