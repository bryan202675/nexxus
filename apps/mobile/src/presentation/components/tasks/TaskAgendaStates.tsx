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
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

export function TaskEmptyState({ completed }: { completed: boolean }) {
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, completed && styles.completedEmptyIcon]}>
        <Feather
          name={completed ? 'clock' : 'check'}
          size={24}
          color={completed ? colores.texto : colores.fondo}
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
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
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

function createStyles(c: ReturnType<typeof useTemaMobile>['colores']) {
  return StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 24,
  },
  emptyIconCircle: {
    alignItems: 'center',
    backgroundColor: c.advertenciaSuperficie,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
    shadowColor: c.sombra,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedEmptyIcon: {
    backgroundColor: c.vidrio,
  },
  emptyTitle: {
    color: c.texto,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: c.textoSecundario,
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
    backgroundColor: c.skeletonHighlight,
    borderRadius: 6,
    height: 12,
    marginTop: 14,
    width: 38,
  },
  skeletonLine: {
    backgroundColor: c.skeletonBase,
    flex: 1,
    marginTop: 8,
    width: 1,
  },
  skeletonCard: {
    backgroundColor: c.skeletonBase,
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
}
