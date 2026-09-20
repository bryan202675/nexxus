import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { MONTH_NAMES } from './taskAgendaUtils';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

interface TaskMonthPickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectMonth: (year: number, monthIndex: number) => void;
}

function TaskMonthPickerContent({
  selectedDate,
  onClose,
  onSelectMonth,
}: Omit<TaskMonthPickerModalProps, 'visible'>) {
  const { colores } = useTemaMobile();
  const styles = createStyles(colores);
  const [browsingYear, setBrowsingYear] = useState(selectedDate.getFullYear());

  const currentRealYear = new Date().getFullYear();
  const currentRealMonth = new Date().getMonth();

  const handlePrevYear = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setBrowsingYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setBrowsingYear((prev) => prev + 1);
  };

  const handleGoToToday = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setBrowsingYear(currentRealYear);
    onSelectMonth(currentRealYear, currentRealMonth);
  };

  const handleSelectMonth = (monthIndex: number) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onSelectMonth(browsingYear, monthIndex);
  };

  return (
    <View style={styles.container}>
      {/* Header del Modal */}
      <View style={styles.headerRow}>
        <Text style={styles.modalTitle}>Seleccionar mes y año</Text>
        <BotonAnimado
          onPress={onClose}
          scaleTo={0.92}
          style={styles.closeBtn}
          accessibilityLabel="Cerrar selector"
        >
          <Feather name="x" size={18} color={colores.texto} />
        </BotonAnimado>
      </View>

      {/* Selector de Año con Chevrons */}
      <View style={styles.yearNavigator}>
        <BotonAnimado
          onPress={handlePrevYear}
          scaleTo={0.90}
          style={styles.yearArrowBtn}
          accessibilityLabel="Año anterior"
        >
          <Feather name="chevron-left" size={20} color={colores.texto} />
        </BotonAnimado>

        <View style={styles.yearCenter}>
          <Text style={styles.yearText}>{browsingYear}</Text>
        </View>

        <BotonAnimado
          onPress={handleNextYear}
          scaleTo={0.90}
          style={styles.yearArrowBtn}
          accessibilityLabel="Año siguiente"
        >
          <Feather name="chevron-right" size={20} color={colores.texto} />
        </BotonAnimado>

        <BotonAnimado
          onPress={handleGoToToday}
          scaleTo={0.94}
          style={styles.todayPill}
          accessibilityLabel="Ir al mes actual"
        >
          <Text style={styles.todayText}>Mes actual</Text>
        </BotonAnimado>
      </View>

      {/* Cuadrícula de 12 Meses */}
      <View style={styles.monthsGrid}>
        {MONTH_NAMES.map((nombreMes, index) => {
          const isSelected =
            selectedDate.getFullYear() === browsingYear &&
            selectedDate.getMonth() === index;
          const isCurrentRealMonth =
            currentRealYear === browsingYear && currentRealMonth === index;

          return (
            <BotonAnimado
              key={nombreMes}
              onPress={() => handleSelectMonth(index)}
              scaleTo={0.94}
              style={[
                styles.monthItem,
                isSelected && styles.selectedMonthItem,
                !isSelected && isCurrentRealMonth && styles.currentRealMonthItem,
              ]}
              accessibilityLabel={`Seleccionar ${nombreMes} ${browsingYear}`}
            >
              <Text
                style={[
                  styles.monthText,
                  isSelected && styles.selectedMonthText,
                  !isSelected && isCurrentRealMonth && styles.currentRealMonthText,
                ]}
              >
                {nombreMes.slice(0, 3)}
              </Text>
            </BotonAnimado>
          );
        })}
      </View>
    </View>
  );
}

export default function TaskMonthPickerModal({
  visible,
  selectedDate,
  onClose,
  onSelectMonth,
}: TaskMonthPickerModalProps) {
  return (
    <ModalShell visible={visible} onClose={onClose} maxHeight={Platform.OS === 'ios' ? '62%' : '78%'}>
      <TaskMonthPickerContent
        key={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
        selectedDate={selectedDate}
        onClose={onClose}
        onSelectMonth={onSelectMonth}
      />
    </ModalShell>
  );
}

function createStyles(c: ReturnType<typeof useTemaMobile>['colores']) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    container: {
      paddingBottom: isIOS ? 20 : 12,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: isIOS ? 16 : 10,
      paddingHorizontal: 4,
    },
    modalTitle: {
      color: c.texto,
      fontSize: isIOS ? 20 : 17,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    closeBtn: {
      alignItems: 'center',
      backgroundColor: c.vidrio,
      borderRadius: 16,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    yearNavigator: {
      alignItems: 'center',
      backgroundColor: c.superficie,
      borderRadius: 18,
      flexDirection: 'row',
      marginBottom: isIOS ? 18 : 10,
      paddingHorizontal: 8,
      paddingVertical: isIOS ? 6 : 4,
    },
    yearArrowBtn: {
      alignItems: 'center',
      backgroundColor: c.superficieElevada,
      borderRadius: 14,
      height: 36,
      justifyContent: 'center',
      width: 36,
      shadowColor: c.sombra,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    yearCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearText: {
      color: c.texto,
      fontSize: isIOS ? 18 : 16,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    todayPill: {
      backgroundColor: c.navegacionActiva,
      borderRadius: 14,
      paddingHorizontal: isIOS ? 12 : 10,
      paddingVertical: isIOS ? 7 : 5,
    },
    todayText: {
      color: c.fondo,
      fontSize: 11,
      fontWeight: '800',
    },
    monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: isIOS ? 10 : 6,
    },
    monthItem: {
      alignItems: 'center',
      backgroundColor: c.superficie,
      borderRadius: isIOS ? 16 : 12,
      height: isIOS ? 52 : 42,
      justifyContent: 'center',
      width: '31%',
    },
    selectedMonthItem: {
      backgroundColor: c.navegacionActiva,
      shadowColor: c.sombra,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2,
    },
    currentRealMonthItem: {
      borderWidth: 1.5,
      borderColor: c.primario,
      backgroundColor: c.vidrio,
    },
    monthText: {
      color: c.texto,
      fontSize: isIOS ? 14.5 : 12.5,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    selectedMonthText: {
      color: c.fondo,
      fontWeight: '900',
    },
    currentRealMonthText: {
      color: c.primario,
      fontWeight: '900',
    },
  });
}
