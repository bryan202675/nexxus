import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
export type TaskTab = 'pendientes' | 'completadas';

interface TaskTabsProps {
  active: TaskTab;
  pendingCount: number;
  completedCount: number;
  onChange: (tab: TaskTab) => void;
}

export default function TaskTabs({
  active,
  pendingCount,
  completedCount,
  onChange,
}: TaskTabsProps) {
  const { width } = useWindowDimensions();
  const isPending = active === 'pendientes';
  const containerWidth = Math.max(300, width - 32);

  const handlePressPending = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onChange('pendientes');
  };

  const handlePressCompleted = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onChange('completadas');
  };

  return (
    <View style={[styles.tabsWrapper, { width: containerWidth }]}>
      {isPending ? (
        <View style={styles.tabsRow}>
          {/* Pestaña Pendientes Activa (blanca, fundida al contenedor) */}
          <BotonAnimado
            onPress={handlePressPending}
            scaleTo={0.98}
            style={styles.activeTabLeft}
            accessibilityState={{ selected: true }}
          >
            <Text style={styles.activeText}>Pendientes ({pendingCount})</Text>
          </BotonAnimado>

          {/* Pestaña Completadas Inactiva (pastilla translúcida pastel pegada) */}
          <BotonAnimado
            onPress={handlePressCompleted}
            scaleTo={0.98}
            style={styles.inactiveTabRight}
            accessibilityState={{ selected: false }}
          >
            <Text style={styles.inactiveText}>Completadas ({completedCount})</Text>
          </BotonAnimado>
        </View>
      ) : (
        <View style={styles.tabsRow}>
          {/* Pestaña Pendientes Inactiva (pastilla translúcida pastel pegada) */}
          <BotonAnimado
            onPress={handlePressPending}
            scaleTo={0.98}
            style={styles.inactiveTabLeft}
            accessibilityState={{ selected: false }}
          >
            <Text style={styles.inactiveText}>Pendientes ({pendingCount})</Text>
          </BotonAnimado>

          {/* Pestaña Completadas Activa (blanca, fundida al contenedor) */}
          <BotonAnimado
            onPress={handlePressCompleted}
            scaleTo={0.98}
            style={styles.activeTabRight}
            accessibilityState={{ selected: true }}
          >
            <Text style={styles.activeText}>Completadas ({completedCount})</Text>
          </BotonAnimado>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrapper: {
    alignSelf: 'center',
    height: 44,
    marginTop: 24,
    zIndex: 3,
  },
  tabsRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 44,
  },
  activeTabLeft: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 20,
    height: 44,
    justifyContent: 'center',
    marginBottom: -1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  inactiveTabRight: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 230, 242, 0.72)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
    marginLeft: 6,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  inactiveTabLeft: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 230, 242, 0.72)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
    marginRight: 6,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  activeTabRight: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 24,
    height: 44,
    justifyContent: 'center',
    marginBottom: -1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  activeText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inactiveText: {
    color: '#6E5664',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
