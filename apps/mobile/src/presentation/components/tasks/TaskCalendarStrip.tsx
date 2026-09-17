import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { dateKey, formatDayName, isSameDay } from './taskAgendaUtils';

interface CalendarDayProps {
  date: Date;
  selected: boolean;
  hasPending: boolean;
  onPress: () => void;
}

function CalendarDay({
  date,
  selected,
  hasPending,
  onPress,
}: CalendarDayProps) {
  const progress = useDerivedValue(() => {
    return withSpring(selected ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
    });
  }, [selected]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const unselectedBg = hasPending
      ? 'rgba(255, 238, 245, 0.95)'
      : 'rgba(255, 255, 255, 0.82)';

    return {
      width: interpolate(progress.value, [0, 1], [46, 96]),
      borderRadius: interpolate(progress.value, [0, 1], [22, 30]),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [unselectedBg, '#111111']
      ),
      borderColor:
        hasPending && !selected
          ? 'rgba(255, 45, 85, 0.45)'
          : 'transparent',
      borderWidth: hasPending && !selected ? 1.5 : 0,
    };
  });

  const animatedNumberStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [hasPending ? '#1A0E13' : '#1A171C', '#FFFFFF']
    ),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [1, 1.05]),
      },
    ],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [hasPending ? '#9E2A4D' : '#706870', '#E0DFE2']
    ),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [1, 1.03]),
      },
    ],
  }));

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onPress();
  };

  return (
    <BotonAnimado
      onPress={handlePress}
      scaleTo={0.94}
      style={styles.pressable}
      accessibilityLabel={`Ver tareas del ${date.getDate()}${hasPending ? ', tiene tareas pendientes' : ''}`}
    >
      <Animated.View style={[styles.dayPill, animatedContainerStyle]}>
        {/* Badge llamativo con signo ! para días con tareas pendientes */}
        {hasPending && (
          <View
            style={[
              styles.alertBadge,
              selected ? styles.alertBadgeSelected : styles.alertBadgeUnselected,
            ]}
          >
            <Text style={styles.alertBadgeText}>!</Text>
          </View>
        )}

        <Animated.Text style={[styles.dayNumber, animatedNumberStyle]}>
          {date.getDate()}
        </Animated.Text>
        <Animated.Text style={[styles.dayLabel, animatedLabelStyle]}>
          {formatDayName(date)}
        </Animated.Text>
      </Animated.View>
    </BotonAnimado>
  );
}

interface TaskCalendarStripProps {
  days: Date[];
  selectedDate: Date;
  pendingDaysSet?: Set<string>;
  onSelect: (date: Date) => void;
}

export default function TaskCalendarStrip({
  days,
  selectedDate,
  pendingDaysSet,
  onSelect,
}: TaskCalendarStripProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const selectedIndex = days.findIndex((d) => isSameDay(d, selectedDate));
    if (selectedIndex !== -1 && scrollViewRef.current) {
      // Offset de desplazamiento suave centrado
      const offset = Math.max(0, selectedIndex * 54 - 70);
      scrollViewRef.current.scrollTo({ x: offset, animated: true });
    }
  }, [days, selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            selected={isSameDay(date, selectedDate)}
            hasPending={Boolean(pendingDaysSet?.has(dateKey(date)))}
            onPress={() => onSelect(date)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pressable: {
    borderRadius: 22,
    overflow: 'visible',
  },
  dayPill: {
    width: 48,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#1A0C14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FF2D55',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  alertBadgeSelected: {
    borderWidth: 1.5,
    borderColor: '#111111',
  },
  alertBadgeUnselected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  dayLabel: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
