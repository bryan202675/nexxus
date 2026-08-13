/**
 * Fase 13: casos de uso del motor de automatizaciones SI/ENTONCES.
 */

import { IAutomationRuleRepository } from '../../../repositories/IAutomationRuleRepository';
import { AutomationRule, AutomationRunResult } from '../../../entities/AutomationRule';

export class GetAutomationRules {
  constructor(private repo: IAutomationRuleRepository) {}
  execute(empresaId: string): Promise<AutomationRule[]> {
    return this.repo.getByCompany(empresaId);
  }
}

export class CreateAutomationRule {
  constructor(private repo: IAutomationRuleRepository) {}
  execute(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule> {
    return this.repo.create(rule);
  }
}

export class SetAutomationRuleActive {
  constructor(private repo: IAutomationRuleRepository) {}
  execute(id: string, activa: boolean): Promise<void> {
    return this.repo.setActive(id, activa);
  }
}

export class DeleteAutomationRule {
  constructor(private repo: IAutomationRuleRepository) {}
  execute(id: string): Promise<void> {
    return this.repo.remove(id);
  }
}

export class RunAutomationRulesNow {
  constructor(private repo: IAutomationRuleRepository) {}
  execute(empresaId: string): Promise<AutomationRunResult[]> {
    return this.repo.runNow(empresaId);
  }
}
