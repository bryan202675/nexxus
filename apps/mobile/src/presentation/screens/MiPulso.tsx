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
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import Skeleton from "@/presentation/components/ui/Skeleton";
import PulseOverviewCard from "@/presentation/components/pulse/PulseOverviewCard";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { SOMBRAS } from "@/shared/constants/diseno";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";
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
const pulseAccent = (energy?: CheckIn["energia"]) =>
  energy === "alto" ? "#D5E774" : energy === "medio" ? "#A78BFA" : "#F2AD84";
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
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        pointerEvents="none"
        colors={["#FBEDE8", "#F6ECF6", "#FFFDFC"]}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />
      <Animated.ScrollView
        style={entranceStyle}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#202020"
          />
        }
      >
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
              <Feather name="activity" size={22} color="#FFFFFF" />
            </BotonAnimado>
            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate("Notificaciones")}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={21} color="#202020" />
              {(alertasNoLeidas > 0 || pendingNotifications > 0) && (
                <View style={styles.notificationDot} />
              )}
            </BotonAnimado>
          </View>
        </View>
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
              accent={pulseAccent(latest?.energia)}
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
            customIcon={<MaterialIcons name="auto-awesome" size={19} color="#202020" />}
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
  return (
    <BotonAnimado
      scaleTo={0.97}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={[styles.chipCount, active && styles.chipCountActive]}>
        <Text style={styles.chipCountText}>{count}</Text>
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
  const accent = pulseAccent(checkIn.energia);
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
          <Feather name="arrow-up-right" size={18} color="#202020" />
        </View>
      </View>
      <Text style={styles.recordTitle}>
        {checkIn.indicadoresRapidos?.[0] || "Pulso registrado"}
      </Text>
      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color="#78736F" />
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
          <View style={[styles.statusDot, { backgroundColor: "#B7B2AD" }]} />
          <Text style={styles.statusText}>{label}</Text>
        </View>
        <View style={styles.arrowButton}>
          <Feather name="arrow-up-right" size={18} color="#202020" />
        </View>
      </View>
      <Text style={styles.recordTitle}>{title}</Text>
      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={15} color="#78736F" />
          <Text style={styles.time}>Toma menos de un minuto</Text>
        </View>
      </View>
    </BotonAnimado>
  );
}
function DimensionDot({ color }: { color: string }) {
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
  customIcon?: React.ReactNode;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <BotonAnimado scaleTo={0.98} onPress={onPress} style={styles.shortcut}>
      <View style={styles.shortcutIcon}>
        {customIcon || (icon && <Feather name={icon} size={17} color="#202020" />)}
      </View>
      <View style={styles.shortcutCopy}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color="#8B8681" />
    </BotonAnimado>
  );
}
function PulseSkeleton() {
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFDFC" },
  ambient: { ...StyleSheet.absoluteFill },
  content: {
    paddingHorizontal: 21,
    paddingTop: 4,
  },
  header: { height: 52, flexDirection: "row", alignItems: "center" },
  profile: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#E9D2BF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: "100%", height: "100%" },
  avatarInitial: { color: "#382E29", fontSize: 17, fontWeight: "700" },
  greeting: { flex: 1, marginLeft: 11 },
  greetingLine: { color: "#312E2C", fontSize: 15, fontWeight: "500" },
  name: { color: "#86807D", fontSize: 14, fontWeight: "500", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10 },
  addButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  bellButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...SOMBRAS.suave,
  },
  notificationDot: {
    position: "absolute",
    top: 11,
    right: 12,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E56C67",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  hero: {
    marginTop: 22,
    marginBottom: 20,
    color: "#1F1D1C",
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.4,
    fontWeight: "600",
  },
  loadingCard: {
    minHeight: 210,
    borderRadius: 25,
    backgroundColor: "#222222",
    padding: 20,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
  },
  loadingRows: { width: "39%", gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#24211F",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.8,
  },
  viewAll: { color: "#5F5A56", fontSize: 14, fontWeight: "600" },
  chips: { gap: 9, paddingRight: 20 },
  chip: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 9,
    paddingRight: 17,
    backgroundColor: "rgba(255,255,255,0.82)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(43,36,31,0.035)",
  },
  chipActive: { backgroundColor: "#D5E774" },
  chipCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#F5F2EF",
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountActive: { backgroundColor: "#FFFFFF" },
  chipCountText: { color: "#3A3531", fontSize: 14, fontWeight: "700" },
  chipLabel: { color: "#4B4642", fontSize: 14, fontWeight: "600" },
  chipLabelActive: { color: "#2E3023" },
  errorCard: {
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#FFF0EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: { color: "#9A453F", fontSize: 12, fontWeight: "600" },
  retry: { color: "#9A453F", fontSize: 12, fontWeight: "800" },
  checkinList: {
    marginTop: 14,
    gap: 12,
  },
  checkinCard: {
    minHeight: 180,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    ...SOMBRAS.suave,
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
    backgroundColor: "#F5F2EF",
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: "#544F4B", fontSize: 11, fontWeight: "700" },
  arrowButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F6F4",
  },
  recordTitle: {
    color: "#272321",
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
  time: { color: "#78736F", fontSize: 12, fontWeight: "600" },
  dimensionDots: { flexDirection: "row" },
  dimensionDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginLeft: -7,
  },
  shortcuts: { gap: 10 },
  shortcut: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(43,36,31,0.035)",
    flexDirection: "row",
    alignItems: "center",
    ...SOMBRAS.suave,
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F0ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shortcutCopy: { flex: 1, justifyContent: "center" },
  shortcutTitle: {
    color: "#292624",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    includeFontPadding: false,
  },
  shortcutDetail: {
    color: "#7B7570",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 14,
    includeFontPadding: false,
  },
});
