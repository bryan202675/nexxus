import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import PulseProgressRing from "./PulseProgressRing";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const Text = AdminTranslatedText;
const isIOS = Platform.OS === "ios";

interface PulseOverviewCardProps {
  score: number;
  energy: string;
  stress: string;
  streak: number;
  accent: string;
  onPress?: () => void;
}

export default function PulseOverviewCard({
  score,
  energy,
  stress,
  streak,
  accent,
  onPress,
}: PulseOverviewCardProps) {
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const rows = [
    {
      icon: "zap" as const,
      label: "Energía",
      value: energy,
    },
    {
      icon: "heart" as const,
      label: "Estrés",
      value: stress,
    },
    {
      icon: "award" as const,
      label: "Racha",
      value: `${streak} ${streak === 1 ? "día" : "días"}`,
    },
  ];

  const cardContent = (
    <View style={[styles.cardContainer, { borderColor: pulse.border, shadowColor: pulse.shadow, backgroundColor: pulse.heroSurface }]}>
      <LinearGradient
        colors={pulse.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Clean minimal Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: pulse.heroText }]}>Pulso de hoy</Text>
          {onPress && (
            <Feather
              name="arrow-up-right"
              size={isIOS ? 20 : 17}
              color={pulse.heroTextSecondary}
            />
          )}
        </View>

        {/* Card Body */}
        <View style={styles.body}>
          <View style={styles.ringCol}>
            <PulseProgressRing value={score} color={accent} />
          </View>

          <View style={styles.metricsCol}>
            {rows.map((row) => (
              <View key={row.label} style={[styles.metricCard, { backgroundColor: pulse.heroMetricSurface, borderColor: pulse.heroMetricBorder }]}>
                <View style={[styles.iconWrap, { backgroundColor: pulse.heroIconSurface }]}>
                  <Feather name={row.icon} size={14} color={pulse.heroText} />
                </View>
                <View style={styles.metricText}>
                  <Text style={[styles.metricValue, { color: pulse.heroText }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                  <Text style={[styles.metricLabel, { color: pulse.heroTextSecondary }]}>{row.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <BotonAnimado
        scaleTo={0.98}
        onPress={onPress}
        accessibilityLabel="Ver detalle de pulso y bienestar"
      >
        {cardContent}
      </BotonAnimado>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: isIOS ? 24 : 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  gradient: {
    padding: isIOS ? 18 : 15,
    minHeight: isIOS ? 195 : 172,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isIOS ? 14 : 11,
  },
  title: {
    fontSize: isIOS ? 17 : 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ringCol: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 2,
  },
  metricsCol: {
    flex: 1,
    marginLeft: isIOS ? 14 : 12,
    gap: isIOS ? 8 : 6,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: isIOS ? 13 : 11,
    paddingVertical: isIOS ? 7 : 5.5,
    paddingHorizontal: isIOS ? 11 : 9,
    borderWidth: 1,
  },
  iconWrap: {
    width: isIOS ? 26 : 24,
    height: isIOS ? 26 : 24,
    borderRadius: isIOS ? 13 : 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: isIOS ? 9 : 8,
  },
  metricText: {
    flex: 1,
  },
  metricValue: {
    fontSize: isIOS ? 14 : 12.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: isIOS ? 10.5 : 9.5,
    fontWeight: "500",
    marginTop: 0.5,
  },
});
