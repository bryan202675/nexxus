import { PlatformSnapshot, SuperAdminCompanyAction, SupportSessionResult } from '@/domain/entities/SuperAdmin';

export interface ISuperAdminRepository {
  subscribePlatform(
    callback: (snapshot: PlatformSnapshot) => void,
    onError: (error: Error) => void
  ): () => void;

  applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void>;

  startSupportSession(companyId: string): Promise<SupportSessionResult>;
}
