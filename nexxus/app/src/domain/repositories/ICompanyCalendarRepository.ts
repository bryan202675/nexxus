import { CompanyCalendarEvent, CompanyCalendarSnapshot } from '@/domain/entities/CompanyCalendar';

export type SaveCompanyCalendarEventInput = Omit<CompanyCalendarEvent, 'id' | 'creadoEn' | 'actualizadoEn'> & {
  id?: string;
  creadoPor?: string;
};

export interface ICompanyCalendarRepository {
  subscribeCompanyCalendar(empresaId: string, callback: (snapshot: CompanyCalendarSnapshot) => void, onError?: () => void): () => void;
  saveEvent(input: SaveCompanyCalendarEventInput): Promise<string>;
  deleteEvent(eventId: string): Promise<void>;
}
