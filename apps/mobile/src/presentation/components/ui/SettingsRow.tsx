import React from 'react';
import { Switch, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

interface SettingsRowProps {
  icon: FeatherName;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  last?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
}

export default function SettingsRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  last = false,
  destructive = false,
  accessibilityHint,
}: SettingsRowProps) {
  const { colores, esOscuro } = useTemaMobile();
  const color = destructive ? COLORES.error : colores.texto;

  const leading = (
    <View style={styles.leading}>
      <View style={[styles.icon, { backgroundColor: destructive ? 'rgba(239,68,68,0.10)' : colores.vidrioSutil }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );

  const trailing = toggle ? (
    <Switch
      value={toggle.value}
      onValueChange={toggle.onChange}
      trackColor={{ false: esOscuro ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.22)', true: colores.primario }}
      thumbColor="#FFFFFF"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    />
  ) : (
    <View style={styles.trailing}>
      {value ? <Text style={[styles.value, { color: colores.textoSuave }]} numberOfLines={1}>{value}</Text> : null}
      {onPress ? <Feather name="chevron-right" size={18} color={colores.textoSuave} /> : null}
    </View>
  );

  const content = <>{leading}{trailing}</>;
  const rowStyle = [styles.row, { borderBottomColor: colores.bordeSutil }, last && styles.last];

  if (toggle || !onPress) return <View style={rowStyle}>{content}</View>;

  return (
    <BotonAnimado
      style={rowStyle}
      scaleTo={0.985}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </BotonAnimado>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.md, borderBottomWidth: 1 },
  last: { borderBottomWidth: 0 },
  leading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flexShrink: 1, fontSize: 16, fontWeight: '700' },
  trailing: { maxWidth: '44%', flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs, marginLeft: ESPACIADO.sm },
  value: { fontSize: 14, fontWeight: '500' },
});
