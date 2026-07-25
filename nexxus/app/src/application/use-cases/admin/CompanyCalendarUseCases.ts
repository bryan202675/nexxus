import { CompanyCalendarSnapshot } from '@/domain/entities/CompanyCalendar';
import { ICompanyCalendarRepository, SaveCompanyCalendarEventInput } from '@/domain/repositories/ICompanyCalendarRepository';

export class CompanyCalendarUseCases {
  constructor(private repository: ICompanyCalendarRepository) {}

  subscribe(empresaId: string, callback: (snapshot: CompanyCalendarSnapshot) => void, onError?: () => void): () => void {
    return this.repository.subscribeCompanyCalendar(empresaId, callback, onError);
  }

  saveEvent(input: SaveCompanyCalendarEventInput): Promise<string> {
    return this.repository.saveEvent(input);
  }

  deleteEvent(eventId: string): Promise<void> {
    return this.repository.deleteEvent(eventId);
  }
}
