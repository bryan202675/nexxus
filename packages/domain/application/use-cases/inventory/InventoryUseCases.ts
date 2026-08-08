import {
  AssignInventoryAssetInput,
  CreateInventoryAssetInput,
  ReportInventoryIncidentInput,
} from '../../../entities/Inventory';
import { IInventoryRepository } from '../../../repositories/IInventoryRepository';

export class InventoryUseCases {
  constructor(private readonly repository: IInventoryRepository) {}

  subscribeCompanyAssets(...args: Parameters<IInventoryRepository['subscribeCompanyAssets']>) {
    return this.repository.subscribeCompanyAssets(...args);
  }

  subscribeUserAssets(...args: Parameters<IInventoryRepository['subscribeUserAssets']>) {
    return this.repository.subscribeUserAssets(...args);
  }

  subscribeIncidents(...args: Parameters<IInventoryRepository['subscribeIncidents']>) {
    return this.repository.subscribeIncidents(...args);
  }

  createAsset(input: CreateInventoryAssetInput) {
    return this.repository.createAsset(input);
  }

  assignAsset(input: AssignInventoryAssetInput) {
    return this.repository.assignAsset(input);
  }

  returnAsset(input: Omit<AssignInventoryAssetInput, 'empleadoId' | 'empleadoNombre'>) {
    return this.repository.returnAsset(input);
  }

  reportIncident(input: ReportInventoryIncidentInput) {
    return this.repository.reportIncident(input);
  }

  resolveIncident(incidentId: string, empresaId: string, actor: { id: string; nombre: string }) {
    return this.repository.resolveIncident(incidentId, empresaId, actor);
  }
}
