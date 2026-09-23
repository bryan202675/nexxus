import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import DetalleTareaModal from "@/presentation/components/DetalleTareaModal";
import TaskCalendarStrip from "@/presentation/components/tasks/TaskCalendarStrip";
import TaskMonthPickerModal from "@/presentation/components/tasks/TaskMonthPickerModal";
import TaskTimelineCard from "@/presentation/components/tasks/TaskTimelineCard";
import {
  TaskEmptyState,
  TaskSkeleton,
} from "@/presentation/components/tasks/TaskAgendaStates";
import {
  MONTH_NAMES,
  calendarDays,
  formatMonth,
  isSameDay,
  taskMatchesDay,
} from "@/presentation/components/tasks/taskAgendaUtils";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import { SOMBRAS } from "@/shared/constants/diseno";
import { Task } from "domain/entities/Task";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";
import { useCases } from "@/infrastructure/container";

const Text = AdminTranslatedText;
type Filter = "todas" | "pendientes" | "completadas" | "urgentes";
type Navigation = { navigate: (route: string) => void; goBack: () => void };
type Route = { params?: { taskId?: string } };

export default function CentroTareas({
  navigation,
  route,
}: {
  navigation: Navigation;
  route?: Route;
}) {
  const { esOscuro, colores } = useTemaMobile();
  const styles = createStyles(colores);
  const { perfil, tareas, cargando, recargarDatos, cambiarEstadoTarea } =
    useContextoUsuario();
  const bottomPadding = useUserTabBottomPadding(115);
  const [filter, setFilter] = useState<Filter>("todas");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [linkedTask, setLinkedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const firstName =
    perfil?.nombre?.split(" ")[0] || "Usuario";
  const anchorDate = useMemo(
    () => selectedDate ?? monthAnchor,
    [selectedDate, monthAnchor]
  );
  const days = useMemo(() => calendarDays(anchorDate, 7), [anchorDate]);

  const onSelectDay = useCallback((date: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
  }, []);

  const selectMonth = useCallback((year: number, month: number) => {
    const next = new Date(year, month, 1);
    next.setHours(0, 0, 0, 0);
    setMonthAnchor(next);
    setSelectedDate(next);
    setMonthPickerVisible(false);
  }, []);

  const selectedTask = useMemo(
    () => tareas.find((task) => task.id === selectedTaskId) ?? linkedTask,
    [linkedTask, selectedTaskId, tareas]
  );
  useEffect(() => {
    const taskId = route?.params?.taskId;
    if (!taskId) return;
    const localTask = tareas.find((task) => task.id === taskId);
    if (localTask) {
      setLinkedTask(null);
      setSelectedTaskId(localTask.id);
      return;
    }
    let active = true;
    void useCases.tasks.getById.execute(taskId).then((task) => {
      if (active && task) {
        setLinkedTask(task);
        setSelectedTaskId(task.id);
      }
    }).catch(() => {
      if (active) setLinkedTask(null);
    });
    return () => { active = false; };
  }, [route?.params?.taskId, tareas]);
  const relevantTasks = useMemo(() => {
    if (!selectedDate) return tareas;
    return tareas.filter((task) => taskMatchesDay(task, selectedDate));
  }, [selectedDate, tareas]);

  const counts = useMemo(
    () => ({
      todas: relevantTasks.length,
      pendientes: relevantTasks.filter((task) => task.estado !== "completada").length,
      completadas: relevantTasks.filter((task) => task.estado === "completada").length,
      urgentes: relevantTasks.filter(
        (task) => task.prioridad === "Urgente" || task.prioridad === "Alta"
      ).length,
    }),
    [relevantTasks]
  );
  const visibleTasks = useMemo(
    () =>
      relevantTasks
        .filter((task) => {
          if (filter === "todas") return true;
          if (filter === "pendientes") return task.estado !== "completada";
          if (filter === "completadas") return task.estado === "completada";
          if (filter === "urgentes")
            return task.prioridad === "Urgente" || task.prioridad === "Alta";
          return true;
        })
        .sort((a, b) =>
          (a.fecha_limite || "9999").localeCompare(b.fecha_limite || "9999")
        ),
    [filter, relevantTasks]
  );
  const isLoading = cargando && tareas.length === 0;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await recargarDatos();
    } catch {
      setRefreshError(
        "No se pudieron actualizar tus tareas. Inténtalo nuevamente."
      );
    } finally {
      setRefreshing(false);
    }
  }, [recargarDatos]);
  const onToggle = useCallback(
    async (task: Task) => {
      try {
        await cambiarEstadoTarea(
          task.id,
          task.estado === "completada" ? "pendiente" : "completada"
        );
      } catch {
        setRefreshError(
          "No se pudo actualizar la tarea. Inténtalo nuevamente."
        );
      }
    },
    [cambiarEstadoTarea]
  );
  const renderTask = useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <TaskTimelineCard
        task={item}
        index={index}
        onPress={(task) => setSelectedTaskId(task.id)}
        onToggle={onToggle}
      />
    ),
    [onToggle]
  );
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle={esOscuro ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        pointerEvents="none"
        colors={colores.pulso.ambient}
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
          <Text style={styles.dateLabel}>{formatMonth(anchorDate)}</Text>
          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate("BusquedaGlobal")}
              accessibilityLabel="Buscar tareas"
            >
              <Feather name="search" size={Platform.OS === "ios" ? 21 : 18} color={colores.fondo} />
            </BotonAnimado>
            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              accessibilityLabel="Más opciones"
            >
              <Feather name="more-horizontal" size={Platform.OS === "ios" ? 22 : 19} color={colores.texto} />
            </BotonAnimado>
          </View>
        </View>
      </View>
      <FlatList
        data={isLoading ? [] : visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colores.primario}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Mis{`\n`}tareas</Text>
              <BotonAnimado
                style={styles.calendarPill}
                scaleTo={0.97}
                onPress={() => setMonthPickerVisible(true)}
              >
                <Feather name="calendar" size={Platform.OS === "ios" ? 20 : 17} color={colores.pulso.icon} />
                <Text style={styles.calendarText}>Calendario</Text>
              </BotonAnimado>
            </View>
            <TaskCalendarStrip
              days={days}
              selectedDate={selectedDate}
              onSelect={onSelectDay}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {(
                ["todas", "pendientes", "completadas", "urgentes"] as Filter[]
              ).map((item) => (
                <TaskFilter
                  key={item}
                  active={filter === item}
                  label={
                    item === "todas"
                      ? "Todas"
                      : item === "pendientes"
                      ? "Pendientes"
                      : item === "completadas"
                      ? "Hechas"
                      : "Importantes"
                  }
                  count={counts[item]}
                  icon={item === "urgentes" ? "star" : undefined}
                  onPress={() => setFilter(item)}
                  styles={styles}
                  colores={colores}
                />
              ))}
            </ScrollView>
            <View style={styles.dayContext}>
              <View style={styles.contextLeft}>
                <Feather
                  name={selectedDate ? "calendar" : "layers"}
                  size={19}
                  color={colores.pulso.textSecondary}
                />
                <Text style={styles.contextTitle}>
                  {selectedDate
                    ? isSameDay(selectedDate, new Date())
                      ? "Hoy"
                      : `${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`
                    : "Todas las fechas"}
                </Text>
              </View>
              {selectedDate ? (
                <BotonAnimado
                  scaleTo={0.96}
                  onPress={() => setSelectedDate(null)}
                  style={styles.clearDateButton}
                >
                  <Text style={styles.clearDateText}>Ver todas</Text>
                  <Feather name="x" size={13} color={colores.pulso.textSecondary} />
                </BotonAnimado>
              ) : (
                <Text style={styles.todayLabel}>
                  {visibleTasks.length}{" "}
                  {visibleTasks.length === 1 ? "tarea" : "tareas"}
                </Text>
              )}
            </View>
            {refreshError ? (
              <BotonAnimado
                onPress={onRefresh}
                scaleTo={0.98}
                style={styles.error}
              >
                <Text style={styles.errorText}>{refreshError}</Text>
                <Feather name="refresh-cw" size={14} color={colores.error} />
              </BotonAnimado>
            ) : null}
            {isLoading ? <TaskSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <TaskEmptyState completed={filter === "completadas"} />
          )
        }
        ListFooterComponent={<View style={styles.bottomSpace} />}
      />
      <TaskMonthPickerModal
        visible={monthPickerVisible}
        selectedDate={anchorDate}
        onClose={() => setMonthPickerVisible(false)}
        onSelectMonth={selectMonth}
      />
      <DetalleTareaModal
        visible={selectedTask !== null}
        tarea={selectedTask}
        onClose={() => {
          setSelectedTaskId(null);
          setLinkedTask(null);
        }}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={() => navigation.navigate("ChatIA")}
      />
    </SafeAreaView>
  );
}

function TaskFilter({
  active,
  label,
  count,
  icon,
  onPress,
  styles,
  colores,
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colores: ReturnType<typeof useTemaMobile>['colores'];
}) {
  return (
    <BotonAnimado
      onPress={onPress}
      scaleTo={0.97}
      style={[styles.filter, active && styles.filterActive]}
    >
      {icon ? (
        <Feather name={icon} size={16} color={active ? colores.pulso.chipTextActive : colores.pulso.text} />
      ) : (
        <View style={[styles.filterCount, active && styles.filterCountActive]}>
          <Text
            style={[
              styles.filterCountText,
              active && styles.filterCountTextActive,
            ]}
          >
            {count}
          </Text>
        </View>
      )}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </BotonAnimado>
  );
}

function createStyles(c: ReturnType<typeof useTemaMobile>['colores']) {
  const isIOS = Platform.OS === "ios";
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.pulso.background },
  ambient: { ...StyleSheet.absoluteFill },
  headerContainer: {
    paddingHorizontal: 21,
    paddingTop: isIOS ? 6 : 4,
    paddingBottom: 8,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 21,
    paddingTop: isIOS ? 12 : 8,
    paddingBottom: 115,
  },
  header: {
    height: isIOS ? 54 : 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profile: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    overflow: "hidden",
    backgroundColor: c.pulso.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.pulso.border,
  },
  avatar: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
  },
  avatarInitial: { color: c.pulso.text, fontSize: isIOS ? 17 : 15, fontWeight: "700" },
  dateLabel: {
    color: c.pulso.text,
    fontSize: isIOS ? 17 : 15,
    fontWeight: "600",
    letterSpacing: isIOS ? -0.5 : -0.3,
  },
  headerActions: { flexDirection: "row", gap: isIOS ? 10 : 8 },
  addButton: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    backgroundColor: c.navegacionActiva,
    alignItems: "center",
    justifyContent: "center",
  },
  bellButton: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    backgroundColor: c.pulso.surfaceElevated,
    borderWidth: 1,
    borderColor: c.pulso.border,
    alignItems: "center",
    justifyContent: "center",
    ...SOMBRAS.suave,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: isIOS ? 10 : 6,
  },
  title: {
    color: c.pulso.text,
    fontSize: isIOS ? 34 : 25,
    lineHeight: isIOS ? 38 : 29,
    fontWeight: "600",
    letterSpacing: isIOS ? -1.4 : -0.8,
  },
  calendarPill: {
    height: isIOS ? 50 : 42,
    borderRadius: isIOS ? 25 : 21,
    paddingHorizontal: isIOS ? 17 : 14,
    backgroundColor: c.pulso.surfaceElevated,
    flexDirection: "row",
    alignItems: "center",
    gap: isIOS ? 10 : 8,
    ...SOMBRAS.suave,
  },
  calendarText: { color: c.pulso.text, fontSize: isIOS ? 15 : 13, fontWeight: "600" },
  filters: { flexDirection: "row", gap: isIOS ? 9 : 6, marginTop: isIOS ? 18 : 12, paddingRight: 4 },
  filter: {
    minHeight: isIOS ? 48 : 38,
    borderRadius: isIOS ? 24 : 19,
    paddingHorizontal: isIOS ? 13 : 10,
    backgroundColor: c.pulso.surfaceElevated,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: c.pulso.border,
  },
  filterActive: {
    backgroundColor: c.pulso.chipActive,
    borderColor: c.pulso.chipActive,
  },
  filterCount: {
    minWidth: isIOS ? 28 : 22,
    height: isIOS ? 28 : 22,
    borderRadius: isIOS ? 14 : 11,
    paddingHorizontal: isIOS ? 7 : 5,
    backgroundColor: c.pulso.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountActive: { backgroundColor: c.pulso.chipCountActive },
  filterCountText: { color: c.pulso.text, fontSize: isIOS ? 12 : 10.5, fontWeight: "700" },
  filterCountTextActive: { color: c.pulso.chipTextActive },
  filterText: { color: c.pulso.textSecondary, fontSize: isIOS ? 13 : 11.5, fontWeight: "600" },
  filterTextActive: { color: c.pulso.chipTextActive },
  dayContext: {
    marginTop: isIOS ? 24 : 16,
    marginBottom: isIOS ? 14 : 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contextLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  contextTitle: {
    color: c.pulso.text,
    fontSize: isIOS ? 24 : 18,
    fontWeight: "600",
    letterSpacing: -0.7,
  },
  todayLabel: { color: c.pulso.textSecondary, fontSize: isIOS ? 13 : 11.5, fontWeight: "600" },
  clearDateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: c.pulso.pill,
  },
  clearDateText: {
    color: c.pulso.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  error: {
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: c.pulso.errorSurface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { flex: 1, color: c.pulso.errorText, fontSize: 12, fontWeight: "600" },
  bottomSpace: { height: 18 },
}); }
