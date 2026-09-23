import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { SharedValue, withSpring } from "react-native-reanimated";
import MoodFace, { MoodId } from "./MoodFace";

const MOODS: { id: MoodId; label: string }[] = [
  { id: "excelente", label: "EXCELENTE" },
  { id: "bien", label: "BIEN" },
  { id: "normal", label: "NORMAL" },
  { id: "cansado", label: "CANSADO" },
  { id: "saturado", label: "SATURADO" },
];
const clampIndex = (value: number) => Math.max(0, Math.min(4, value));
const isAndroid = Platform.OS === "android";

export default function MoodStep({
  progress,
  mood,
  onChange,
}: {
  progress: SharedValue<number>;
  mood: MoodId;
  onChange: (mood: MoodId) => void;
}) {
  const { height } = useWindowDimensions();
  const compact = isAndroid && height < 720;
  const styles = React.useMemo(() => createStyles(compact), [compact]);
  const commit = useCallback(
    (index: number) => {
      const next = Math.round(clampIndex(index));
      const item = MOODS[next];
      if (item.id !== mood) {
        void Haptics.selectionAsync().catch(() => {});
        onChange(item.id);
      }
    },
    [mood, onChange]
  );
  const move = (direction: -1 | 1) => {
    const current = MOODS.findIndex((item) => item.id === mood);
    const next = clampIndex(current + direction);
    progress.value = withSpring(next, { damping: 20, stiffness: 210 });
    commit(next);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>¿Cómo empiezas hoy?</Text>
      <Text style={styles.subtitle}>
        Cuéntale a Nexxus cómo llegas antes de comenzar.
      </Text>
      <View style={styles.face}>
        <MoodFace progress={progress} />
      </View>
      <View style={styles.stateCopy}>
        <Pressable
          onPress={() => move(-1)}
          disabled={mood === "excelente"}
          accessibilityRole="button"
          accessibilityLabel="Estado anterior"
          style={[
            styles.direction,
            styles.previous,
            mood === "excelente" && styles.directionDisabled,
          ]}
        >
          <Feather name="chevron-left" size={isAndroid ? 20 : 24} color="#FFFFFF" />
        </Pressable>
        
        <View style={styles.textContainer}>
          <Text style={styles.feeling}>ME SIENTO</Text>
          <Text key={mood} style={styles.state}>
            {MOODS.find((item) => item.id === mood)?.label}
          </Text>
        </View>

        <Pressable
          onPress={() => move(1)}
          disabled={mood === "saturado"}
          accessibilityRole="button"
          accessibilityLabel="Siguiente estado"
          style={[
            styles.direction,
            styles.next,
            mood === "saturado" && styles.directionDisabled,
          ]}
        >
          <Feather name="chevron-right" size={isAndroid ? 20 : 24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(compact: boolean) {
  return StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  title: {
    color: "#17141B",
    fontSize: compact ? 22 : isAndroid ? 23 : 29,
    fontWeight: "800",
    letterSpacing: -0.9,
    textAlign: "center",
    marginTop: compact ? 8 : isAndroid ? 10 : 22,
  },
  subtitle: {
    color: "rgba(23,20,27,0.64)",
    fontSize: isAndroid ? 12 : 14,
    marginTop: isAndroid ? 4 : 7,
    textAlign: "center",
  },
  face: {
    flex: 1,
    width: isAndroid ? undefined : "100%",
    aspectRatio: isAndroid ? 1 : undefined,
    maxWidth: isAndroid ? "100%" : undefined,
    alignSelf: "center",
    minHeight: compact ? 170 : isAndroid ? 190 : 270,
    marginTop: isAndroid ? 6 : 16,
    position: "relative",
  },
  direction: {
    width: isAndroid ? 36 : 44,
    height: isAndroid ? 36 : 44,
    borderRadius: isAndroid ? 18 : 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17141B",
  },
  previous: { },
  next: { },
  directionDisabled: { opacity: 0.18 },
  directionText: {
    color: "#FFFFFF",
    fontSize: isAndroid ? 24 : 31,
    fontWeight: "400",
    lineHeight: isAndroid ? 28 : 36,
  },
  stateCopy: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: compact ? 8 : isAndroid ? 12 : 32,
  },
  textContainer: {
    alignItems: "center",
  },
  feeling: {
    color: "rgba(23,20,27,0.54)",
    fontSize: isAndroid ? 9 : 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: isAndroid ? 2 : 4,
  },
  state: {
    color: "#17141B",
    fontSize: isAndroid ? 17 : 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  });
}
