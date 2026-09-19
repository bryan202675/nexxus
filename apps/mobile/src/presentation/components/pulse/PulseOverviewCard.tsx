import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import PulseProgressRing from "./PulseProgressRing";

const Text = AdminTranslatedText;

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
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={["#222126", "#17161A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Clean minimal Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pulso de hoy</Text>
          {onPress && (
            <Feather
              name="arrow-up-right"
              size={17}
              color="rgba(255,255,255,0.4)"
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
              <View key={row.label} style={styles.metricCard}>
                <View style={styles.iconWrap}>
                  <Feather name={row.icon} size={14} color="#FFFFFF" />
                </View>
                <View style={styles.metricText}>
                  <Text style={styles.metricValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                  <Text style={styles.metricLabel}>{row.label}</Text>
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
    borderRadius: 24,
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
    padding: 18,
    minHeight: 195,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 17,
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
    paddingRight: 4,
  },
  metricsCol: {
    flex: 1,
    marginLeft: 14,
    gap: 7.5,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 13,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 9,
  },
  metricText: {
    flex: 1,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 0.5,
  },
});
