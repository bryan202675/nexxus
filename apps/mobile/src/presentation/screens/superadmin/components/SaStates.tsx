import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

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
  const { t } = useTranslation();
  return (
    <View>
      <MaterialIcons name="domain-disabled" size={28} />
      <Text>{title || t('superadmin.saLayout.estados.sinDatosTitulo')}</Text>
      <Text>{text || t('superadmin.saLayout.estados.sinDatosTexto')}</Text>
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
  const { t } = useTranslation();
  return (
    <View>
      <MaterialIcons name="error-outline" size={28} />
      <Text>{t('superadmin.saLayout.estados.errorPanel')}</Text>
      <Text>{message}</Text>
    </View>
  );
}
