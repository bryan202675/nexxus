import { httpsCallable } from 'firebase/functions';
import { ExportDataset, ExportFile, ExportFormat } from '@/domain/entities/ExportFile';
import { IExportRepository } from '@/domain/repositories/IExportRepository';
import { functions } from './firebaseConfig';

export class FirebaseExportRepository implements IExportRepository {
  async generate(input: { empresaId: string; dataset: ExportDataset; format: ExportFormat }): Promise<ExportFile> {
    const callable = httpsCallable(functions, 'generateTenantExport');
    const response = await callable(input);
    return response.data as ExportFile;
  }
}
