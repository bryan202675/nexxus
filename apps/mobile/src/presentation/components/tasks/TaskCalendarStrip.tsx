import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import { formatDayName, isSameDay } from "./taskAgendaUtils";

const Text = AdminTranslatedText;
interface TaskCalendarStripProps {
  days: Date[];
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

function CalendarDay({
  date,
  selected,
  onPress,
}: {
  date: Date;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useDerivedValue(
    () => withTiming(selected ? 1 : 0, { duration: 180 }),
    [selected]
  );
  const numberStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["#F1EFED", "#202020"]
    ),
    transform: [{ scale: 0.97 + progress.value * 0.03 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ["#3B3633", "#FFFFFF"]),
  }));
  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onPress();
  };
  return (
    <BotonAnimado
      onPress={handlePress}
      scaleTo={0.97}
      style={styles.pressable}
      accessibilityLabel={`Ver tareas del ${date.getDate()}`}
    >
      <View style={styles.day}>
        <Text style={styles.dayName}>{formatDayName(date)}</Text>
        <Animated.View style={[styles.dayNumberWrap, numberStyle]}>
          <Animated.Text style={[styles.dayNumber, textStyle]}>
            {date.getDate()}
          </Animated.Text>
        </Animated.View>
      </View>
    </BotonAnimado>
  );
}

export default function TaskCalendarStrip({
  days,
  selectedDate,
  onSelect,
}: TaskCalendarStripProps) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!selectedDate) return;
    const index = days.findIndex((day) => isSameDay(day, selectedDate));
    if (index >= 0)
      scrollRef.current?.scrollTo({
        x: Math.max(0, index * 57 - 6),
        animated: true,
      });
  }, [days, selectedDate]);
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {days.map((date) => (
        <CalendarDay
          key={date.toISOString()}
          date={date}
          selected={selectedDate ? isSameDay(date, selectedDate) : false}
          onPress={() => onSelect(date)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 9, paddingTop: 32, paddingBottom: 1, paddingRight: 18 },
  pressable: { width: 48, height: 78, borderRadius: 24 },
  day: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dayName: { color: "#4E4844", fontSize: 12, fontWeight: "700" },
  dayNumberWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: { fontSize: 15, fontWeight: "700" },
});
