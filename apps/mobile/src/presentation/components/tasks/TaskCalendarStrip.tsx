import React, { useEffect, useRef } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
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
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

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
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
  const progress = useDerivedValue(
    () => withTiming(selected ? 1 : 0, { duration: 180 }),
    [selected]
  );
  const numberStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colores.vidrio, colores.navegacionActiva]
    ),
    transform: [{ scale: 0.97 + progress.value * 0.03 }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colores.texto, colores.fondo]),
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
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
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

function createStyles(c: ReturnType<typeof useTemaMobile>["colores"]) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    scroll: { gap: isIOS ? 9 : 6, paddingTop: isIOS ? 32 : 12, paddingBottom: 1, paddingRight: isIOS ? 18 : 12 },
    pressable: { width: isIOS ? 48 : 42, height: isIOS ? 78 : 64, borderRadius: isIOS ? 24 : 18 },
    day: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    dayName: { color: c.textoSecundario, fontSize: isIOS ? 12 : 11, fontWeight: "700" },
    dayNumberWrap: {
      width: isIOS ? 46 : 38,
      height: isIOS ? 46 : 38,
      borderRadius: isIOS ? 23 : 19,
      alignItems: "center",
      justifyContent: "center",
    },
    dayNumber: { fontSize: isIOS ? 15 : 13, fontWeight: "700" },
  });
}
