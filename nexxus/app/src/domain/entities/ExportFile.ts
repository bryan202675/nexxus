export type ExportDataset = 'request_reports' | 'payroll' | 'attendance';
export type ExportFormat = 'csv' | 'pdf';

export type ExportFile = {
  filename: string;
  mimeType: string;
  base64: string;
  rows: number;
  dataset: ExportDataset;
  format: ExportFormat;
};
