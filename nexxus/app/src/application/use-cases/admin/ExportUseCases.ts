import { ExportDataset, ExportFile, ExportFormat } from '@/domain/entities/ExportFile';
import { IExportRepository } from '@/domain/repositories/IExportRepository';

export class ExportUseCases {
  constructor(private exportRepository: IExportRepository) {}

  generate(input: { empresaId: string; dataset: ExportDataset; format: ExportFormat }): Promise<ExportFile> {
    return this.exportRepository.generate(input);
  }
}
