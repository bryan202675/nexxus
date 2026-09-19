import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
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
                  <Feather name="check" size={14} color="#54745A" />
                ) : (
                  <Feather
                    name="arrow-up-right"
                    size={14}
                    color={
                      task.estado === "en_progreso" ? "#7A48BD" : "#403A37"
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
const styles = StyleSheet.create({
  row: { minHeight: 184, marginBottom: 15 },
  cardContent: { flex: 1, flexDirection: "row" },
  timeline: { width: 72, alignItems: "center", paddingTop: 17, marginRight: 4 },
  hour: {
    color: "#312C29",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.8,
  },
  period: { color: "#7E7772", fontSize: 11, fontWeight: "700", marginTop: 2 },
  line: {
    height: 46,
    width: 1,
    marginTop: 12,
    backgroundColor: "#DED9D4",
  },
  card: {
    flex: 1,
    minHeight: 184,
    padding: 17,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    shadowColor: "#2C2520",
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
    color: "#292522",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.55,
  },
  completedTitle: { color: "#85807B", textDecorationLine: "line-through" },
  description: {
    color: "#827B76",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 14,
  },
  metadata: { flex: 1, flexDirection: "row", gap: 5, overflow: "hidden" },
  assignee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: 118,
  },
  assigneeName: {
    color: "#665F5A",
    fontSize: 10.5,
    fontWeight: "600",
    flexShrink: 1,
  },
  tag: {
    maxWidth: 84,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "#F4F1EE",
  },
  tagText: { color: "#706964", fontSize: 10, fontWeight: "600" },
  statePill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statePending: { backgroundColor: "#F4F1EE" },
  stateProgress: { backgroundColor: "#EFE2FA" },
  stateDone: { backgroundColor: "#E6F0E6" },
  stateText: { fontSize: 11, fontWeight: "700" },
  statePendingText: { color: "#403A37" },
  stateProgressText: { color: "#7A48BD" },
  stateDoneText: { color: "#54745A" },
});
