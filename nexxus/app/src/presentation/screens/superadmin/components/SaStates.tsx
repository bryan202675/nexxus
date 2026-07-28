import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function MetricTile({ label, value, detail, icon, tone, estilos, index = 0 }: {
  label: string;
  value: string;
  detail: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tone?: string;
  estilos?: any;
  index?: number;
}) {
  return (
    <View>
      <View>
        <View>
          <MaterialIcons name={icon} size={24} />
        </View>
        <View>
          <Text>{label}</Text>
          <Text>{value}</Text>
          {detail ? <Text>{detail}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export function EmptyState({ estilos, title, text }: { estilos?: any; title?: string; text?: string }) {
  return (
    <View>
      <MaterialIcons name="domain-disabled" size={28} />
      <Text>{title || 'Sin datos todavía'}</Text>
      <Text>{text || 'Cuando existan registros en Firebase aparecerán aquí sin usar datos simulados.'}</Text>
    </View>
  );
}

export function LoadingState({ estilos, tiles = 4 }: { estilos?: any; tiles?: number }) {
  return (
    <View>
      {Array.from({ length: tiles }).map((_, item) => (
        <View key={item}>
          <View />
          <View />
          <View />
        </View>
      ))}
    </View>
  );
}

export function ErrorPanel({ estilos, theme, message }: { estilos?: any; theme?: any; message: string }) {
  return (
    <View>
      <MaterialIcons name="error-outline" size={28} />
      <Text>No se pudo cargar el panel</Text>
      <Text>{message}</Text>
    </View>
  );
}
