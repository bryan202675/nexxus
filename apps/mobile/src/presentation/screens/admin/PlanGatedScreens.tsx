/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/PlanGatedScreens.tsx
 * Capa: presentacion.
 * Proposito: Envuelve pantallas admin cuya funcionalidad depende del plan de la empresa
 * (ver @/shared/billing/plans) con PlanBlockedScreen cuando el plan actual no la incluye.
 * Se usa como `component` en AdminNavigator.tsx en vez de la pantalla directa, para no tocar el
 * código interno de cada pantalla (menos riesgo de romper algo ya funcionando).
 * Dependencias clave: useEmpresaPlan, PlanBlockedScreen, adminUtils.obtenerEmpresaIdAdmin.
 * Consideracion de mantenimiento: preservar firmas publicas al extender este archivo.
 */
import React, { ComponentType } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ADMIN } from './adminTheme';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useEmpresaPlan } from '@/presentation/hooks/useEmpresaPlan';
import { PlanFeatureKey } from '@/shared/billing/plans';
import PlanBlockedScreen from './PlanBlockedScreen';

import GestionNomina from './GestionNomina';
import GestionDocumentos from './GestionDocumentos';
import GestionInventario from './GestionInventario';
import MensajeriaInternaAdmin from './MensajeriaInternaAdmin';
import ChatIAAdmin from './ChatIAAdmin';

function withPlanGate<P extends object>(feature: PlanFeatureKey, Componente: ComponentType<P>) {
  return function Gated(props: P) {
    const { user } = useAuth();
    const empresaId = obtenerEmpresaIdAdmin(user);
    const { loading, plan, planFeatures } = useEmpresaPlan(empresaId);

    if (loading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ADMIN.primarioClaro} />
        </View>
      );
    }
    if (!planFeatures[feature]) {
      return <PlanBlockedScreen feature={feature} plan={plan} />;
    }
    return <Componente {...props} />;
  };
}

export const GestionNominaGated = withPlanGate('payroll', GestionNomina);
export const GestionDocumentosGated = withPlanGate('documents', GestionDocumentos);
export const GestionInventarioGated = withPlanGate('inventory', GestionInventario);
export const MensajeriaInternaAdminGated = withPlanGate('internalChat', MensajeriaInternaAdmin);
export const ChatIAAdminGated = withPlanGate('ai', ChatIAAdmin);
