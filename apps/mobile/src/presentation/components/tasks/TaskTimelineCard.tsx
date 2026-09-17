import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { Task } from 'domain/entities/Task';
import TaskAvatar from './TaskAvatar';
import {
  formatAssigneeName,
  formatCardTime,
  formatTimelineTime,
} from './taskAgendaUtils';

const Text = AdminTranslatedText;

interface TaskTimelineCardProps {
  task: Task;
  index: number;
  onPress: (task: Task) => void;
  onToggle: (task: Task) => void;
}

function TaskTimelineCard({
  task,
  index,
  onPress,
  onToggle,
}: TaskTimelineCardProps) {
  const completed = task.estado === 'completada';
  const isHero = index === 0 && !completed;
  const backgroundColor = isHero ? '#F8A8C6' : completed ? '#F1F1EF' : '#F4F4F6';

  const time = formatTimelineTime(task);
  const assignee = formatAssigneeName(task);

  const handleToggle = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    onToggle(task);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 45).duration(280)}
      style={[styles.row, isHero && styles.heroRow]}
    >
      {/* Columna Timeline con Hora (2 líneas limpias) y Línea vertical simétrica */}
      <View style={styles.timelineColumn}>
        <View style={styles.timeWrapper}>
          <Text style={styles.timeHour}>{time.hour}</Text>
          <Text style={styles.timePeriod}>{time.period}</Text>
        </View>
        <View style={styles.lineContainer}>
          <View
            style={[
              styles.timelineLine,
              isHero ? styles.timelineLineActive : styles.timelineLineInactive,
            ]}
          />
        </View>
      </View>

      {/* Tarjeta de Tarea */}
      <BotonAnimado
        onPress={() => onPress(task)}
        scaleTo={0.98}
        style={[
          styles.card,
          { backgroundColor },
          isHero && styles.heroCard,
          completed && styles.completedCard,
        ]}
        accessibilityLabel={`Abrir tarea ${task.titulo}`}
      >
        {/* Horario / Schedule */}
        <Text style={[styles.schedule, completed && styles.completedMuted]}>
          {formatCardTime(task)}
        </Text>

        {/* Título de la tarea */}
        <Text
          numberOfLines={isHero ? 3 : 2}
          style={[
            styles.title,
            isHero && styles.heroTitle,
            completed && styles.completedTitle,
          ]}
        >
          {task.titulo}
        </Text>

        {/* Footer: Responsable + Botón de Acción Circular */}
        <View style={styles.footer}>
          <View style={styles.assigneeContainer}>
            <TaskAvatar name={assignee.name} size={32} />
            <View style={styles.assigneeTextColumn}>
              <Text numberOfLines={1} style={styles.assigneeName}>
                {assignee.name}
              </Text>
              <Text numberOfLines={1} style={styles.assigneeRole}>
                {assignee.role}
              </Text>
            </View>
          </View>

          <BotonAnimado
            onPress={handleToggle}
            scaleTo={0.90}
            style={[
              styles.actionButton,
              completed && styles.completedActionButton,
            ]}
            accessibilityLabel={completed ? 'Marcar como pendiente' : 'Completar tarea'}
          >
            <Feather
              name={completed ? 'check' : 'arrow-up-right'}
              size={17}
              color="#FFFFFF"
            />
          </BotonAnimado>
        </View>
      </BotonAnimado>
    </Animated.View>
  );
}

export default memo(TaskTimelineCard);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 122,
    marginBottom: 12,
  },
  heroRow: {
    minHeight: 160,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 44,
    marginRight: 8,
  },
  timeWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  timeHour: {
    color: '#1A1719',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  timePeriod: {
    color: '#706B70',
    fontSize: 9.5,
    fontWeight: '600',
    lineHeight: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  lineContainer: {
    alignItems: 'center',
    flex: 1,
    marginTop: 6,
    width: 12,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
  },
  timelineLineActive: {
    backgroundColor: '#111111',
    width: 2,
  },
  timelineLineInactive: {
    backgroundColor: '#E4E0E2',
    width: 1.5,
  },
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 22,
    padding: 15,
  },
  heroCard: {
    minHeight: 152,
    borderRadius: 24,
    padding: 16,
  },
  completedCard: {
    backgroundColor: '#F1F1EF',
  },
  schedule: {
    color: '#554A50',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title: {
    color: '#121014',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 5,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 24,
    marginTop: 6,
  },
  completedTitle: {
    color: '#7E787C',
    textDecorationLine: 'line-through',
  },
  completedMuted: {
    color: '#8C858A',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
  },
  assigneeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    maxWidth: '72%',
  },
  assigneeTextColumn: {
    justifyContent: 'center',
  },
  assigneeName: {
    color: '#1D191E',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  assigneeRole: {
    color: '#6A5F67',
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 13,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  completedActionButton: {
    backgroundColor: '#4B734E',
  },
});
