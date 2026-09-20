import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { normalizeRole } from '@/shared/auth/roles';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

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
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const isManager = normalizeRole(perfil?.rol) === 'jefe';
  const appRoute = isManager ? 'AppJefe' : 'AppEmpleado';
  const rutasVisibles = isManager ? [rutas[0], rutas[1], rutaEquipo, rutas[2], rutas[3], rutas[4]] : rutas;

  const isIOS = Platform.OS === 'ios';
  const iconSize = (route: string) => isIOS ? (route === 'ChatIA' ? 22 : 20) : (route === 'ChatIA' ? 18 : 16.5);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: isIOS ? 20 : Math.max(8, insets.bottom > 0 ? insets.bottom + 4 : 10) }]}>
      <View style={[styles.capsule, { backgroundColor: pulse.navSurface, borderColor: pulse.border, shadowColor: pulse.shadow }]}>
        <View style={[styles.indicator, { width: `${100 / rutasVisibles.length}%`, backgroundColor: pulse.inverse }]} />
        {rutasVisibles.map((route) => {
          const active = route.name === 'Recursos';
          return (
            <TouchableOpacity key={route.name} activeOpacity={0.75} style={styles.item} onPress={() => navigation.navigate(appRoute, { screen: route.name })}>
              <MaterialIcons name={route.icon} size={iconSize(route.name)} color={active ? pulse.textInverse : pulse.navInactive} />
              <Text numberOfLines={1} maxFontSizeMultiplier={isIOS ? 1.15 : 1.05} style={[styles.label, { color: active ? pulse.textInverse : pulse.navInactive, fontWeight: active ? '800' : '600' }]}>{t(route.label)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const isIOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  container: { position: 'absolute', left: isIOS ? 16 : 10, right: isIOS ? 16 : 10, alignItems: 'center', zIndex: 1000 },
  capsule: { width: '100%', maxWidth: isIOS ? 500 : 460, height: isIOS ? 64 : 50, borderRadius: isIOS ? 28 : 25, overflow: 'hidden', borderWidth: 1, ...SOMBRAS.flotante, flexDirection: 'row', paddingHorizontal: isIOS ? 5 : 3 },
  indicator: { position: 'absolute', top: isIOS ? 5 : 3, bottom: isIOS ? 5 : 3, right: isIOS ? 5 : 3, borderRadius: isIOS ? 22 : 20, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 2, paddingVertical: isIOS ? 3 : 1, gap: isIOS ? 2 : 1 },
  label: { fontSize: isIOS ? 10 : 8.5, lineHeight: isIOS ? 12 : 10, includeFontPadding: false, textAlign: 'center', letterSpacing: isIOS ? -0.1 : -0.3 },
});
