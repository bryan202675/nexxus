/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/PlanBlockedScreen.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de bloqueo cuando el plan actual de la empresa no incluye una funcion admin.
 * Dependencias clave: ADMIN theme, PLAN_CATALOG (@/shared/billing/plans).
 * Consideracion de mantenimiento: preservar firmas publicas al extender este archivo.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ADMIN } from './adminTheme';
import { NexxusPlan, PLAN_CATALOG, PLAN_ORDER, PlanFeatureKey } from '@/shared/billing/plans';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

const FEATURE_LABELS: Partial<Record<PlanFeatureKey, string>> = {
  reports: 'Reportes',
  payroll: 'Nómina',
  documents: 'Documentos',
  inventory: 'Inventario',
  internalChat: 'Mensajería interna',
  ai: 'Nexxus IA',
  metrics: 'Métricas avanzadas',
  leaders: 'Jefaturas',
  exports: 'Exportar datos',
  customBranding: 'Personalización de marca',
};

function planMinimoParaFeature(feature: PlanFeatureKey): NexxusPlan | null {
  return PLAN_ORDER.find((nombre) => PLAN_CATALOG[nombre].features[feature]) || null;
}

export default function PlanBlockedScreen({ feature, plan }: { feature: PlanFeatureKey; plan: NexxusPlan }) {
  const etiqueta = FEATURE_LABELS[feature] || feature;
  const requerido = planMinimoParaFeature(feature);
  return (
    <View style={styles.contenedor}>
      <View style={styles.icono}>
        <MaterialIcons name="lock-outline" size={28} color={ADMIN.primarioClaro} />
      </View>
      <Text style={styles.titulo}>{etiqueta} no está incluido en tu plan</Text>
      <Text style={styles.descripcion}>
        Tu plan actual es {plan}.{requerido ? ` ${etiqueta} está disponible desde el plan ${requerido}.` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN.superficieSuave,
    marginBottom: 8,
  },
  titulo: {
    color: ADMIN.texto,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  descripcion: {
    color: ADMIN.textoSecundario,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },
});
