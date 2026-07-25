import {
  AssignInventoryAssetInput,
  CreateInventoryAssetInput,
  InventoryAsset,
  InventoryIncident,
  ReportInventoryIncidentInput,
} from '@/domain/entities/Inventory';

export interface IInventoryRepository {
  subscribeCompanyAssets(
    empresaId: string,
    limitCount: number,
    callback: (assets: InventoryAsset[]) => void,
    onError: (error: Error) => void
  ): () => void;
  subscribeUserAssets(
    empresaId: string,
    userId: string,
    limitCount: number,
    callback: (assets: InventoryAsset[]) => void,
    onError: (error: Error) => void
  ): () => void;
  subscribeIncidents(
    empresaId: string,
    limitCount: number,
    callback: (incidents: InventoryIncident[]) => void,
    onError: (error: Error) => void
  ): () => void;
  createAsset(input: CreateInventoryAssetInput): Promise<InventoryAsset>;
  assignAsset(input: AssignInventoryAssetInput): Promise<void>;
  returnAsset(input: Omit<AssignInventoryAssetInput, 'empleadoId' | 'empleadoNombre'>): Promise<void>;
  reportIncident(input: ReportInventoryIncidentInput): Promise<InventoryIncident>;
  resolveIncident(incidentId: string, empresaId: string, actor: { id: string; nombre: string }): Promise<void>;
}
