import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
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
import { SOMBRAS } from "@/shared/constants/diseno";
import { Task } from "domain/entities/Task";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";

const Text = AdminTranslatedText;
type Filter = "todas" | "pendientes" | "completadas" | "urgentes";
type Navigation = { navigate: (route: string) => void; goBack: () => void };

export default function CentroTareas({
  navigation,
}: {
  navigation: Navigation;
}) {
  const { perfil, tareas, cargando, recargarDatos, cambiarEstadoTarea } =
    useContextoUsuario();
  const bottomPadding = useUserTabBottomPadding(115);
  const [filter, setFilter] = useState<Filter>("todas");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
    () => tareas.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tareas]
  );
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
            tintColor="#202020"
          />
        }
        ListHeaderComponent={
          <View>
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
              <Text style={styles.dateLabel}>{formatMonth(anchorDate)}</Text>
              <View style={styles.headerActions}>
                <BotonAnimado
                  style={styles.addButton}
                  scaleTo={0.96}
                  onPress={() => navigation.navigate("BusquedaGlobal")}
                  accessibilityLabel="Buscar tareas"
                >
                  <Feather name="search" size={21} color="#FFFFFF" />
                </BotonAnimado>
                <BotonAnimado
                  style={styles.bellButton}
                  scaleTo={0.96}
                  accessibilityLabel="Más opciones"
                >
                  <Feather name="more-horizontal" size={23} color="#202020" />
                </BotonAnimado>
              </View>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Mis{`\n`}tareas</Text>
              <BotonAnimado
                style={styles.calendarPill}
                scaleTo={0.97}
                onPress={() => setMonthPickerVisible(true)}
              >
                <Feather name="calendar" size={20} color="#25211F" />
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
                />
              ))}
            </ScrollView>
            <View style={styles.dayContext}>
              <View style={styles.contextLeft}>
                <Feather
                  name={selectedDate ? "calendar" : "layers"}
                  size={19}
                  color="#58514D"
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
                  <Feather name="x" size={13} color="#6E6864" />
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
                <Feather name="refresh-cw" size={14} color="#A34A45" />
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
        onClose={() => setSelectedTaskId(null)}
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
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  return (
    <BotonAnimado
      onPress={onPress}
      scaleTo={0.97}
      style={[styles.filter, active && styles.filterActive]}
    >
      {icon ? (
        <Feather name={icon} size={16} color={active ? "#FFFFFF" : "#3E3936"} />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFDFC" },
  ambient: { ...StyleSheet.absoluteFill },
  listContent: {
    paddingHorizontal: 21,
    paddingTop: 4,
    paddingBottom: 115,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
  dateLabel: {
    color: "#292522",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 22,
  },
  title: {
    color: "#1F1D1C",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "600",
    letterSpacing: -1.4,
  },
  calendarPill: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...SOMBRAS.suave,
  },
  calendarText: { color: "#292522", fontSize: 15, fontWeight: "600" },
  filters: { flexDirection: "row", gap: 9, marginTop: 18, paddingRight: 4 },
  filter: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.86)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(32,28,25,0.04)",
  },
  filterActive: { backgroundColor: "#202020", borderColor: "#202020" },
  filterCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 7,
    backgroundColor: "#F1EFED",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountActive: { backgroundColor: "rgba(255,255,255,0.16)" },
  filterCountText: { color: "#3C3734", fontSize: 12, fontWeight: "700" },
  filterCountTextActive: { color: "#FFFFFF" },
  filterText: { color: "#3E3936", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  dayContext: {
    marginTop: 24,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contextLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  contextTitle: {
    color: "#383330",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.7,
  },
  todayLabel: { color: "#837C77", fontSize: 13, fontWeight: "600" },
  clearDateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F1EFED",
  },
  clearDateText: {
    color: "#544E4A",
    fontSize: 12,
    fontWeight: "700",
  },
  error: {
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#FFF0EE",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: { flex: 1, color: "#A34A45", fontSize: 12, fontWeight: "600" },
  bottomSpace: { height: 18 },
});
