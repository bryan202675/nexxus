import { PlatformSnapshot, SuperAdminCompanyAction, SupportSessionResult } from '@/domain/entities/SuperAdmin';
import { ISuperAdminRepository } from '@/domain/repositories/ISuperAdminRepository';

export class SuperAdminUseCases {
  constructor(private superAdminRepository: ISuperAdminRepository) {}

  subscribePlatform(callback: (snapshot: PlatformSnapshot) => void, onError: (error: Error) => void): () => void {
    return this.superAdminRepository.subscribePlatform(callback, onError);
  }

  applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    return this.superAdminRepository.applyCompanyAction(companyId, action, actor);
  }

  startSupportSession(companyId: string): Promise<SupportSessionResult> {
    return this.superAdminRepository.startSupportSession(companyId);
  }
}
