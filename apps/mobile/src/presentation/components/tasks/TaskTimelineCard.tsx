import React, { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import { Task } from "domain/entities/Task";
import { formatCardTime, formatTimelineTime } from "./taskAgendaUtils";
import TaskAvatar from "./TaskAvatar";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const Text = AdminTranslatedText;
interface TaskTimelineCardProps {
  task: Task;
  index: number;
  onPress: (task: Task) => void;
  onToggle: (task: Task) => void;
}

function TaskTimelineCard({
  task,
  index,
  onPress,
  onToggle,
}: TaskTimelineCardProps) {
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
  const reduceMotion = useReducedMotion();
  const time = formatTimelineTime(task);
  const completed = task.estado === "completada";
  const stateLabel = completed
    ? "Completada"
    : task.estado === "en_progreso"
    ? "En progreso"
    : "Pendiente";
  const stateStyle = completed
    ? styles.stateDone
    : task.estado === "en_progreso"
    ? styles.stateProgress
    : styles.statePending;
  const stateTextStyle = completed
    ? styles.stateDoneText
    : task.estado === "en_progreso"
    ? styles.stateProgressText
    : styles.statePendingText;
  const assigneeName = task.asignado_a?.trim();
  const hasNamedAssignee = Boolean(
    assigneeName &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(assigneeName) &&
      assigneeName.length <= 48
  );
  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInDown.delay(Math.min(index, 5) * 35).duration(220)
      }
      style={styles.row}
    >
      <BotonAnimado
        onPress={() => onPress(task)}
        scaleTo={0.98}
        style={styles.card}
        accessibilityLabel={`Abrir tarea ${task.titulo}`}
      >
        <View style={styles.cardContent}>
          <View style={styles.timeline}>
            <Text style={styles.hour}>{time.hour}</Text>
            <Text style={styles.period}>{time.period}</Text>
            <View style={styles.line} />
          </View>
          <View style={styles.taskContent}>
            <Text
              style={[styles.title, completed && styles.completedTitle]}
              numberOfLines={2}
            >
              {task.titulo}
            </Text>
            {task.descripcion ? (
              <Text style={styles.description} numberOfLines={2}>
                {task.descripcion}
              </Text>
            ) : (
              <Text style={styles.description} numberOfLines={1}>
                {formatCardTime(task)}
              </Text>
            )}
            <View style={styles.footer}>
              <View style={styles.metadata}>
                {hasNamedAssignee ? (
                  <View style={styles.assignee}>
                    <TaskAvatar name={assigneeName} size={29} />
                    <Text style={styles.assigneeName} numberOfLines={1}>
                      {assigneeName}
                    </Text>
                  </View>
                ) : null}
                {task.tags?.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
              <BotonAnimado
                onPress={() => onToggle(task)}
                scaleTo={0.95}
                style={[styles.statePill, stateStyle]}
                accessibilityLabel={
                  completed
                    ? "Marcar como pendiente"
                    : "Cambiar estado de la tarea"
                }
              >
                <Text style={[styles.stateText, stateTextStyle]}>
                  {stateLabel}
                </Text>
                {completed ? (
                  <Feather name="check" size={14} color={colores.exito} />
                ) : (
                  <Feather
                    name="arrow-up-right"
                    size={14}
                    color={
                      task.estado === "en_progreso" ? colores.primarioClaro : colores.texto
                    }
                  />
                )}
              </BotonAnimado>
            </View>
          </View>
        </View>
      </BotonAnimado>
    </Animated.View>
  );
}

export default memo(TaskTimelineCard);
function createStyles(c: ReturnType<typeof useTemaMobile>['colores']) {
  const pulse = c.pulso;
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    row: { minHeight: isIOS ? 184 : 148, marginBottom: isIOS ? 15 : 10 },
    cardContent: { flex: 1, flexDirection: "row" },
    timeline: { width: isIOS ? 72 : 56, alignItems: "center", paddingTop: isIOS ? 17 : 12, marginRight: isIOS ? 4 : 2 },
    hour: {
      color: pulse.text,
      fontSize: isIOS ? 22 : 18,
      fontWeight: "600",
      letterSpacing: -0.8,
    },
    period: { color: pulse.textSecondary, fontSize: isIOS ? 11 : 10, fontWeight: "700", marginTop: 2 },
    line: {
      height: isIOS ? 46 : 36,
      width: 1,
      marginTop: isIOS ? 12 : 8,
      backgroundColor: pulse.border,
    },
    card: {
      flex: 1,
      minHeight: isIOS ? 184 : 148,
      padding: isIOS ? 17 : 12,
      borderRadius: isIOS ? 27 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      shadowColor: pulse.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 7 },
      elevation: 2,
    },
    taskContent: {
      flex: 1,
      minWidth: 0,
      paddingTop: 2,
      justifyContent: "space-between",
    },
    title: {
      color: pulse.text,
      fontSize: isIOS ? 19 : 15.5,
      lineHeight: isIOS ? 24 : 20,
      fontWeight: "600",
      letterSpacing: -0.55,
    },
    completedTitle: { color: pulse.textSecondary, textDecorationLine: "line-through" },
    description: {
      color: pulse.textSecondary,
      fontSize: isIOS ? 12 : 11,
      lineHeight: isIOS ? 18 : 15,
      fontWeight: "500",
      marginTop: isIOS ? 6 : 4,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginTop: isIOS ? 14 : 10,
    },
    metadata: { flex: 1, flexDirection: "row", gap: 5, overflow: "hidden" },
    assignee: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      maxWidth: 118,
    },
    assigneeName: {
      color: pulse.textSecondary,
      fontSize: 10.5,
      fontWeight: "600",
      flexShrink: 1,
    },
    tag: {
      maxWidth: 84,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 13,
      backgroundColor: pulse.pill,
    },
    tagText: { color: pulse.textSecondary, fontSize: 10, fontWeight: "600" },
    statePill: {
      minHeight: isIOS ? 34 : 28,
      paddingHorizontal: isIOS ? 12 : 9,
      borderRadius: isIOS ? 17 : 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    statePending: { backgroundColor: pulse.pill },
    stateProgress: { backgroundColor: `${c.primario}2E` },
    stateDone: { backgroundColor: `${c.exito}2E` },
    stateText: { fontSize: isIOS ? 11 : 10, fontWeight: "700" },
    statePendingText: { color: pulse.text },
    stateProgressText: { color: c.primarioClaro },
    stateDoneText: { color: c.exito },
  });
}
