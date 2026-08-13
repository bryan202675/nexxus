import { supabase } from './supabaseClient';
import { IExportRepository } from 'domain/repositories/IExportRepository';
import { ExportFile, ExportDataset, ExportFormat } from 'domain/entities/ExportFile';

export class SupabaseExportRepository implements IExportRepository {
  async generate(input: { empresaId: string; dataset: ExportDataset; format: ExportFormat }): Promise<ExportFile> {
    const { data, error } = await supabase.functions.invoke('generate-tenant-export', { body: input });
    if (error) throw error;
    return data as ExportFile;
  }
}
