import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import TaskCalendarStrip from '@/presentation/components/tasks/TaskCalendarStrip';
import TaskMonthPickerModal from '@/presentation/components/tasks/TaskMonthPickerModal';
import TaskTabs, { TaskTab } from '@/presentation/components/tasks/TaskTabs';
import TaskTimelineCard from '@/presentation/components/tasks/TaskTimelineCard';
import {
  TaskEmptyState,
  TaskSkeleton,
} from '@/presentation/components/tasks/TaskAgendaStates';
import {
  calendarDaysForMonth,
  dateKey,
  formatMonth,
  taskMatchesDay,
} from '@/presentation/components/tasks/taskAgendaUtils';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from 'domain/entities/Task';

const Text = AdminTranslatedText;

interface CentroTareasProps {
  navigation: {
    navigate: (route: string, params?: any) => void;
  };
}

export default function CentroTareas({ navigation }: CentroTareasProps) {
  const { tareas, cargando, recargarDatos, cambiarEstadoTarea } = useContextoUsuario();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TaskTab>('pendientes');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const containerWidth = Math.max(300, width - 32);

  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Genera todos los días del mes seleccionado
  const days = useMemo(() => calendarDaysForMonth(selectedDate), [selectedDate]);

  const pending = useMemo(
    () => tareas.filter((task) => task.estado !== 'completada'),
    [tareas]
  );

  const pendingDaysSet = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((task) => {
      if (!task.fecha_limite) return;
      const date = new Date(task.fecha_limite);
      if (!Number.isNaN(date.getTime())) {
        set.add(dateKey(date));
      }
    });
    return set;
  }, [pending]);

  const completed = useMemo(
    () => tareas.filter((task) => task.estado === 'completada'),
    [tareas]
  );

  const selectedTask = useMemo(
    () => tareas.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tareas]
  );

  const visibleTasks = useMemo(() => {
    const source = tab === 'pendientes' ? pending : completed;
    return source
      .filter((task) => taskMatchesDay(task, selectedDate))
      .sort((first, second) =>
        (first.fecha_limite || '9999').localeCompare(second.fecha_limite || '9999')
      );
  }, [completed, pending, selectedDate, tab]);

  const isLoading = cargando && tareas.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await recargarDatos();
    } catch {
      setRefreshError('No se pudieron actualizar tus tareas. Inténtalo nuevamente.');
    } finally {
      setRefreshing(false);
    }
  }, [recargarDatos]);

  const onToggle = useCallback(
    async (task: Task) => {
      try {
        await cambiarEstadoTarea(
          task.id,
          task.estado === 'completada' ? 'pendiente' : 'completada'
        );
      } catch {
        setRefreshError('No se pudo actualizar la tarea. Inténtalo nuevamente.');
      }
    },
    [cambiarEstadoTarea]
  );

  const handleSelectMonth = useCallback((year: number, monthIndex: number) => {
    const today = new Date();
    const isCurrentMonthAndYear =
      today.getFullYear() === year && today.getMonth() === monthIndex;

    const newDate = new Date(year, monthIndex, isCurrentMonthAndYear ? today.getDate() : 1);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    setMonthPickerVisible(false);
  }, []);

  const renderTask = useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <View style={[styles.taskItemRow, { width: containerWidth }]}>
        <TaskTimelineCard
          task={item}
          index={index}
          onPress={(task) => setSelectedTaskId(task.id)}
          onToggle={onToggle}
        />
      </View>
    ),
    [containerWidth, onToggle]
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9F4" />

      {/* Gradiente luminoso que cubre todo el fondo de la pantalla con desenfoque difuso */}
      <View pointerEvents="none" style={styles.gradientArea}>
        <LinearGradient
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          colors={[
            '#FFAF62', // Dorado / melocotón cálido superior izquierdo
            '#FF7FA7', // Rosa coral vibrante superior derecho
            '#FFAEC7', // Transición suave en el centro
            '#FFD6E5', // Rosa suave
            '#FFE2CE', // Melocotón cálido inferior
            '#FFC5DB', // Rosa pastel inferior derecho
          ]}
          locations={[0, 0.28, 0.52, 0.72, 0.88, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.amberGlowTop} />
        <View style={styles.roseGlowTop} />
        <View style={styles.peachCenterGlow} />
        <View style={styles.amberGlowBottom} />
        <View style={styles.roseGlowBottom} />

        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 55}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      </View>

      <FlatList
        data={isLoading ? [] : visibleTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111111"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header: Título Grande + Selector de Mes */}
            <View style={styles.header}>
              <Text style={styles.title}>Mis tareas</Text>
              <BotonAnimado
                style={styles.monthControl}
                scaleTo={0.93}
                onPress={() => setMonthPickerVisible(true)}
                accessibilityLabel="Abrir selector de mes y año"
              >
                <Text style={styles.month}>{formatMonth(selectedDate)}</Text>
                <Feather name="chevron-down" size={18} color="#1A171C" />
              </BotonAnimado>
            </View>

            {/* Calendario horizontal con todos los días del mes e indicador de pendientes */}
            <TaskCalendarStrip
              days={days}
              selectedDate={selectedDate}
              pendingDaysSet={pendingDaysSet}
              onSelect={setSelectedDate}
            />

            {/* Pestañas unidas continuamente al contenedor de tareas */}
            <TaskTabs
              active={tab}
              pendingCount={pending.length}
              completedCount={completed.length}
              onChange={setTab}
            />

            {/* Inicio del cuerpo blanco del contenedor */}
            <View
              style={[
                styles.whiteBodyTop,
                {
                  width: containerWidth,
                  borderTopLeftRadius: tab === 'pendientes' ? 0 : 28,
                  borderTopRightRadius: tab === 'pendientes' ? 28 : 0,
                },
              ]}
            >
              {refreshError && (
                <BotonAnimado
                  onPress={onRefresh}
                  scaleTo={0.98}
                  style={styles.error}
                >
                  <Text style={styles.errorText}>{refreshError}</Text>
                  <Feather name="refresh-cw" size={14} color="#A53E5B" />
                </BotonAnimado>
              )}
              {isLoading && <TaskSkeleton />}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={[styles.whiteBodyEmpty, { width: containerWidth }]}>
              <TaskEmptyState completed={tab === 'completadas'} />
            </View>
          )
        }
        ListFooterComponent={
          <View style={[styles.whiteBodyBottom, { width: containerWidth }]} />
        }
      />

      {/* Modal Selector de Mes y Año */}
      <TaskMonthPickerModal
        visible={monthPickerVisible}
        selectedDate={selectedDate}
        onClose={() => setMonthPickerVisible(false)}
        onSelectMonth={handleSelectMonth}
      />

      {/* Modal Integral de Detalle de Tarea */}
      <DetalleTareaModal
        visible={selectedTask !== null}
        tarea={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={() => navigation.navigate('ChatIA')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFDFB',
    flex: 1,
  },
  gradientArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  amberGlowTop: {
    backgroundColor: 'rgba(255, 175, 95, 0.70)',
    borderRadius: 200,
    height: 380,
    left: -110,
    position: 'absolute',
    top: -120,
    width: 410,
  },
  roseGlowTop: {
    backgroundColor: 'rgba(255, 115, 165, 0.65)',
    borderRadius: 210,
    height: 400,
    position: 'absolute',
    right: -130,
    top: -90,
    width: 430,
  },
  peachCenterGlow: {
    backgroundColor: 'rgba(255, 215, 160, 0.55)',
    borderRadius: 180,
    height: 340,
    left: 40,
    position: 'absolute',
    top: 220,
    width: 360,
  },
  amberGlowBottom: {
    backgroundColor: 'rgba(255, 185, 115, 0.55)',
    borderRadius: 220,
    height: 420,
    left: -100,
    position: 'absolute',
    bottom: -100,
    width: 440,
  },
  roseGlowBottom: {
    backgroundColor: 'rgba(255, 130, 180, 0.50)',
    borderRadius: 230,
    height: 450,
    position: 'absolute',
    right: -120,
    bottom: -120,
    width: 460,
  },
  listContent: {
    paddingBottom: 110,
    paddingTop: 28,
  },
  header: {
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  title: {
    color: '#111111',
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: -0.7,
    lineHeight: 42,
  },
  monthControl: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginLeft: -4,
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  month: {
    color: '#262228',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  whiteBodyTop: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  taskItemRow: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  whiteBodyEmpty: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  whiteBodyBottom: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    height: 24,
    marginBottom: 20,
    shadowColor: '#1A0C14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  error: {
    alignItems: 'center',
    backgroundColor: '#FFE7EC',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#A53E5B',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
