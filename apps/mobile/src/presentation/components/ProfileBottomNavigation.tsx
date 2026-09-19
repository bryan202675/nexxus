import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { normalizeRole } from '@/shared/auth/roles';

interface Props {
  navigation: { navigate: (screen: string, params?: { screen: string }) => void };
}

const rutas = [
  { name: 'Home', icon: 'home', label: 'app.home' },
  { name: 'Tareas', icon: 'assignment', label: 'app.tasks' },
  { name: 'Chat', icon: 'chat', label: 'app.chat' },
  { name: 'ChatIA', icon: 'auto-awesome', label: 'app.ai' },
  { name: 'Recursos', icon: 'grid-view', label: 'app.resources' },
] as const;
const rutaEquipo = { name: 'Equipo', icon: 'groups', label: 'app.team' } as const;

export default function ProfileBottomNavigation({ navigation }: Props) {
  const { perfil } = useContextoUsuario();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isManager = normalizeRole(perfil?.rol) === 'jefe';
  const appRoute = isManager ? 'AppJefe' : 'AppEmpleado';
  const rutasVisibles = isManager ? [rutas[0], rutas[1], rutaEquipo, rutas[2], rutas[3], rutas[4]] : rutas;

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: Platform.OS === 'ios' ? 20 : Math.max(12, insets.bottom + 8) }]}>
      <View style={styles.capsule}>
        <View style={[styles.indicator, { width: `${100 / rutasVisibles.length}%` }]} />
        {rutasVisibles.map((route) => {
          const active = route.name === 'Recursos';
          return (
            <TouchableOpacity key={route.name} activeOpacity={0.75} style={styles.item} onPress={() => navigation.navigate(appRoute, { screen: route.name })}>
              <MaterialIcons name={route.icon} size={route.name === 'ChatIA' ? 22 : 20} color={active ? '#FFFFFF' : '#302D2B'} />
              <Text numberOfLines={1} style={[styles.label, { color: active ? '#FFFFFF' : 'rgba(48,45,43,0.68)', fontWeight: active ? '800' : '600' }]}>{t(route.label)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  capsule: { width: '100%', maxWidth: 500, height: Platform.OS === 'ios' ? 64 : 60, borderRadius: Platform.OS === 'ios' ? 28 : 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(31,29,28,0.06)', backgroundColor: '#FFFFFF', ...SOMBRAS.flotante, flexDirection: 'row', paddingHorizontal: 5 },
  indicator: { position: 'absolute', top: 5, bottom: 5, right: 5, borderRadius: Platform.OS === 'ios' ? 22 : 20, backgroundColor: '#202020', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 2, paddingVertical: 3, gap: 2 },
  label: { fontSize: 10, lineHeight: 12, includeFontPadding: false, textAlign: 'center', letterSpacing: -0.1 },
});
