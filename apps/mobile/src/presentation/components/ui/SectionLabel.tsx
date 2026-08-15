import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface SectionLabelProps {
  children: string;
  action?: React.ReactNode;
}

export default function SectionLabel({ children, action }: SectionLabelProps) {
  const { colores } = useTemaMobile();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colores.textoSuave }]}>{children}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xxs },
  label: { ...TIPOGRAFIA.micro, letterSpacing: 1.2 },
});
