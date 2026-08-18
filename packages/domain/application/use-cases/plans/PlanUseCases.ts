/**
 * Fase 15: unifica el catálogo de planes -- antes vivía hardcodeado por separado en
 * apps/mobile/src/shared/billing/plans.ts y apps/dashboard/src/services/checkout.ts, sin relación
 * con la tabla `planes` de Supabase (incluso con los mismos números, nada evitaba que se
 * desincronizaran). La tabla es ahora la fuente de verdad; este caso de uso cachea el resultado en
 * memoria (los planes cambian con muy poca frecuencia) para no pedirlo en cada render.
 */
import { PlanCatalogEntry } from '../../../entities/Plan';
import { IPlanRepository } from '../../../repositories/IPlanRepository';

let cache: PlanCatalogEntry[] | null = null;
let inFlight: Promise<PlanCatalogEntry[]> | null = null;

export class GetPlans {
  constructor(private repo: IPlanRepository) {}

  async execute(): Promise<PlanCatalogEntry[]> {
    if (cache) return cache;
    if (!inFlight) {
      inFlight = this.repo.getAll().then((plans) => {
        cache = plans;
        inFlight = null;
        return plans;
      }).catch((error) => {
        inFlight = null;
        throw error;
      });
    }
    return inFlight;
  }
}
