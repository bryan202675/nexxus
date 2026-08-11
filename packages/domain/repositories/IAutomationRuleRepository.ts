import { AutomationRule, AutomationRunResult } from '../entities/AutomationRule';

export interface IAutomationRuleRepository {
  getByCompany(empresaId: string): Promise<AutomationRule[]>;
  create(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule>;
  setActive(id: string, activa: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  runNow(empresaId: string): Promise<AutomationRunResult[]>;
}
