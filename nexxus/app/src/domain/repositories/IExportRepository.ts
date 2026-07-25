import { ExportDataset, ExportFile, ExportFormat } from '@/domain/entities/ExportFile';

export interface IExportRepository {
  generate(input: {
    empresaId: string;
    dataset: ExportDataset;
    format: ExportFormat;
  }): Promise<ExportFile>;
}
