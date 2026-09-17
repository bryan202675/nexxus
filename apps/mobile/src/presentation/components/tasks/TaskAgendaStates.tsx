import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

export function TaskEmptyState({ completed }: { completed: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, completed && styles.completedEmptyIcon]}>
        <Feather
          name={completed ? 'clock' : 'check'}
          size={24}
          color="#111111"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {completed ? 'Aún no hay tareas completadas' : 'Todo al día'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {completed
          ? 'Cuando finalices una tarea, aparecerá aquí.'
          : 'Has terminado todas tus tareas para este día.'}
      </Text>
    </View>
  );
}

export function TaskSkeleton() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 750 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.skeletonRow, index === 0 && styles.skeletonHeroRow]}>
          <View style={styles.skeletonTimeline}>
            <View style={styles.skeletonTimeBadge} />
            <View style={styles.skeletonLine} />
          </View>
          <Animated.View
            style={[
              styles.skeletonCard,
              index === 0 ? styles.skeletonHeroCard : styles.skeletonSecondaryCard,
              animatedStyle,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 24,
  },
  emptyIconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFE4BA',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
    shadowColor: '#1A0C14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedEmptyIcon: {
    backgroundColor: '#EAEAEA',
  },
  emptyTitle: {
    color: '#121014',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#756D73',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  skeletonList: {
    gap: 12,
    marginTop: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    minHeight: 124,
  },
  skeletonHeroRow: {
    minHeight: 164,
  },
  skeletonTimeline: {
    alignItems: 'center',
    width: 48,
    marginRight: 6,
  },
  skeletonTimeBadge: {
    backgroundColor: '#EBE5E5',
    borderRadius: 6,
    height: 12,
    marginTop: 14,
    width: 38,
  },
  skeletonLine: {
    backgroundColor: '#E8E5E5',
    flex: 1,
    marginTop: 8,
    width: 1,
  },
  skeletonCard: {
    backgroundColor: '#ECE7E8',
    flex: 1,
    marginBottom: 12,
  },
  skeletonHeroCard: {
    borderRadius: 27,
    minHeight: 156,
  },
  skeletonSecondaryCard: {
    borderRadius: 23,
    minHeight: 114,
  },
});
