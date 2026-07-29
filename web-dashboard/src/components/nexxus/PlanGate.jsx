import { MdLockOutline } from "react-icons/md";
import { useEmpresaPlan, tieneFeature, planMinimoParaFeature, FEATURE_LABELS } from "services/planEnforcement";
import NexxusCard from "views/nexxus/components/NexxusCard";

// Bloquea una pantalla/sección completa si el plan actual de la empresa no incluye `feature`
// (ver PLAN_CATALOG en services/checkout.js). Se calcula en vivo desde empresas/{empresaId}, así
// que cuentas ya existentes (creadas antes de este sistema) también quedan cubiertas sin migrar
// nada: sin plan reconocido, se trata como Starter.
export default function PlanGate({ feature, children }) {
  const { loading, plan, planFeatures } = useEmpresaPlan();

  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (tieneFeature(planFeatures, feature)) return children;

  const requerido = planMinimoParaFeature(feature);
  const etiqueta = FEATURE_LABELS[feature] || feature;

  return (
    <NexxusCard extra="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lightPrimary dark:bg-charcoal-light">
        <MdLockOutline className="h-6 w-6 text-brand-500 dark:text-white" />
      </div>
      <h4 className="text-lg font-bold text-navy-700 dark:text-white">{etiqueta} no está incluido en tu plan</h4>
      <p className="max-w-md text-sm text-gray-500 dark:text-white/60">
        Tu plan actual es <b>{plan}</b>.
        {requerido ? ` ${etiqueta} está disponible desde el plan ${requerido}.` : " Esta función no está disponible en ningún plan todavía."}
      </p>
    </NexxusCard>
  );
}
