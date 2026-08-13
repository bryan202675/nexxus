import { PlanCatalogEntry } from '../entities/Plan';

export interface IPlanRepository {
  getAll(): Promise<PlanCatalogEntry[]>;
}
