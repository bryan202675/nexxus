import React, { useEffect } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const METRICS = ["Ánimo", "Energía", "Descanso", "Carga"];
const METRIC_ICONS = ["smile", "zap", "moon", "layers"] as const;
const isAndroid = Platform.OS === "android";

export default function CheckInSummaryStep({
  now,
  schedule,
  location,
  mood,
  energy,
  sleep,
  workload,
  success,
  error,
  dark,
}: {
  now: string;
  schedule: string;
  location: string;
  mood: string;
  energy: string;
  sleep: number;
  workload: number;
  success: boolean;
  error: string | null;
  dark: boolean;
}) {
  const confirmation = useSharedValue(success ? 1 : 0);

  useEffect(() => {
    confirmation.value = withTiming(success ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
    });
  }, [confirmation, success]);

  const previewStyle = useAnimatedStyle(() => ({
    opacity: 1 - confirmation.value,
    transform: [{ scale: interpolate(confirmation.value, [0, 1], [1, 0.95]) }],
  }));
  const successStyle = useAnimatedStyle(() => ({
    opacity: confirmation.value,
    transform: [
      { translateY: interpolate(confirmation.value, [0, 1], [12, 0]) },
      { scale: interpolate(confirmation.value, [0, 1], [0.92, 1]) },
    ],
  }));

  const values = [mood, energy, `${sleep}/5`, `${workload}/5`];

  const textStyle = dark ? styles.textLight : styles.textDark;
  const softStyle = dark ? styles.softLight : styles.softDark;
  const cardStyle = dark ? styles.cardDark : styles.cardLight;
  const metricBoxStyle = dark ? styles.metricBoxDark : styles.metricBoxLight;
  const iconColor = dark ? "#A1A1AA" : "#71717A"; // Neutral Zinc colors instead of purple
  const dividerStyle = dark ? styles.dividerDark : styles.dividerLight;

  const ContentWrapper = isAndroid ? ScrollView : View;
  const wrapperProps = isAndroid
    ? {
        style: styles.scroll,
        contentContainerStyle: styles.root,
        showsVerticalScrollIndicator: false,
        bounces: false,
      }
    : { style: styles.root };

  return (
    <ContentWrapper {...(wrapperProps as any)}>
      <Text style={[styles.title, textStyle]}>
        {success ? "Entrada registrada" : "Todo listo"}
      </Text>
      <Text style={[styles.subtitle, softStyle]}>
        {success
          ? `Tu jornada comienza a las ${now}.`
          : "Revisa tu resumen antes de iniciar."}
      </Text>

      <View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.preview, previewStyle]}>
          <View style={styles.headerRow}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>ENTRADA DE HOY</Text>
              <Feather name="chevron-right" size={isAndroid ? 13 : 14} color="#22C55E" />
            </View>
            <View style={styles.locationWrap}>
              <Feather name="map-pin" size={isAndroid ? 11 : 12} color={iconColor} />
              <Text style={[styles.locationText, softStyle]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </View>

          <View style={styles.timeSection}>
            <Text style={[styles.time, textStyle]}>{now}</Text>
            <Text style={[styles.schedule, softStyle]} numberOfLines={1}>
              {schedule}
            </Text>
          </View>

          <View style={[styles.divider, dividerStyle]} />

          <View style={styles.metricGrid}>
            {values.map((value, index) => (
              <View key={METRICS[index]} style={[styles.metricBox, metricBoxStyle]}>
                <View style={[styles.iconWrap, dark ? styles.iconWrapDark : styles.iconWrapLight]}>
                  <Feather name={METRIC_ICONS[index]} size={isAndroid ? 14 : 16} color={iconColor} />
                </View>
                <View style={styles.metricTextWrap}>
                  <Text style={[styles.metricName, softStyle]}>{METRICS[index]}</Text>
                  <Text style={[styles.metricValue, textStyle]} numberOfLines={1}>
                    {value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.confirmation, successStyle]}
        >
          <View style={styles.checkGlow} />
          <View style={styles.checkWrap}>
            <Feather name="check" size={isAndroid ? 28 : 36} color="#FFFFFF" />
          </View>
          <Text style={[styles.confirmationTitle, textStyle]}>Jornada iniciada</Text>
          <Text style={[styles.confirmationCopy, softStyle]}>
            Todo quedó registrado correctamente.
          </Text>
        </Animated.View>
      </View>

      {!success && (
        <Text style={[styles.hint, softStyle]}>
          Podrás actualizar tu pulso más tarde si lo necesitas.
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </ContentWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: "100%" },
  root: {
    flex: isAndroid ? undefined : 1,
    alignItems: "center",
    paddingTop: isAndroid ? 6 : 22,
    paddingBottom: isAndroid ? 12 : 0,
  },
  title: {
    fontSize: isAndroid ? 22 : 28,
    fontWeight: "800",
    letterSpacing: isAndroid ? -0.5 : -0.8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isAndroid ? 12.5 : 15,
    marginTop: isAndroid ? 3 : 6,
    textAlign: "center",
    lineHeight: isAndroid ? 17 : 21
  },
  textLight: { color: "#FFFFFF" },
  textDark: { color: "#241B3B" },
  softLight: { color: "rgba(255,255,255,0.6)" },
  softDark: { color: "#766D88" },

  card: {
    width: "100%",
    marginTop: isAndroid ? 12 : 24,
    borderRadius: isAndroid ? 18 : 24,
    paddingHorizontal: isAndroid ? 16 : 24,
    paddingVertical: isAndroid ? 14 : 24,
    borderWidth: 1,
    minHeight: isAndroid ? 0 : 340,
    justifyContent: "center",
  },
  cardDark: {
    backgroundColor: "#141224",
    borderColor: "rgba(196,181,253,0.15)",
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD6FE",
    shadowColor: "#312E81",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  preview: { width: "100%" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusText: {
    color: "#22C55E",
    fontSize: isAndroid ? 10 : 11,
    fontWeight: "800",
    letterSpacing: 0.5
  },

  locationWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
    paddingLeft: 12,
    minWidth: 0,
  },
  locationText: {
    fontSize: isAndroid ? 11 : 12,
    fontWeight: "600"
  },

  timeSection: {
    marginTop: isAndroid ? 10 : 24,
    alignItems: "center"
  },
  time: {
    fontSize: isAndroid ? 34 : 52,
    fontWeight: "900",
    letterSpacing: isAndroid ? -1 : -1.5
  },
  schedule: {
    fontSize: isAndroid ? 12 : 14,
    fontWeight: "600",
    marginTop: isAndroid ? 2 : 4
  },

  divider: {
    height: 1,
    marginVertical: isAndroid ? 12 : 24,
    width: "100%"
  },
  dividerDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  dividerLight: { backgroundColor: "#F4F4F5" }, // Zinc 100

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: isAndroid ? 8 : 12
  },
  metricBox: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: isAndroid ? 8 : 12,
    paddingHorizontal: isAndroid ? 10 : 12,
    borderRadius: isAndroid ? 12 : 16,
    gap: isAndroid ? 8 : 10,
  },
  metricBoxDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  metricBoxLight: {
    backgroundColor: "#FAFAFA", // Neutral bright gray
    borderWidth: 1,
    borderColor: "#E5E5E5" // Neutral border
  },

  iconWrap: {
    width: isAndroid ? 28 : 34,
    height: isAndroid ? 28 : 34,
    borderRadius: isAndroid ? 8 : 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  iconWrapLight: { backgroundColor: "#F4F4F5" }, // Zinc 100

  metricTextWrap: { flex: 1 },
  metricName: {
    fontSize: isAndroid ? 9 : 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  metricValue: {
    fontSize: isAndroid ? 12.5 : 14,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "capitalize"
  },

  confirmation: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    width: "100%"
  },
  checkGlow: {
    position: "absolute",
    width: isAndroid ? 100 : 130,
    height: isAndroid ? 100 : 130,
    borderRadius: isAndroid ? 50 : 65,
    backgroundColor: "rgba(34,197,94,0.15)",
    top: isAndroid ? -20 : -26,
  },
  checkWrap: {
    width: isAndroid ? 60 : 78,
    height: isAndroid ? 60 : 78,
    borderRadius: isAndroid ? 30 : 39,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  confirmationTitle: {
    fontSize: isAndroid ? 20 : 26,
    fontWeight: "900",
    marginTop: isAndroid ? 14 : 24
  },
  confirmationCopy: {
    fontSize: isAndroid ? 13 : 15,
    marginTop: isAndroid ? 4 : 8,
    textAlign: "center"
  },

  hint: {
    fontSize: isAndroid ? 11.5 : 13,
    textAlign: "center",
    lineHeight: isAndroid ? 16 : 19,
    marginTop: isAndroid ? 10 : 24,
    paddingHorizontal: isAndroid ? 16 : 22
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12
  },
});
