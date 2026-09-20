import React from "react";
import { StyleSheet, View } from "react-native";
import { CheckInProgressDot } from "./CheckInProgressDot";

export default function CheckInProgress({
  step,
  total = 3,
  dark,
}: {
  step: number;
  total?: number;
  dark: boolean;
  textColor: string;
}) {
  return (
    <View accessibilityLabel={`Paso ${step} de ${total}`} style={styles.wrap}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 === step;
        const isPast = i + 1 < step;

        return <CheckInProgressDot key={i} active={isActive} past={isPast} dark={dark} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
});
