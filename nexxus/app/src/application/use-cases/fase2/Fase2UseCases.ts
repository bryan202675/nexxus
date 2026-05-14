import { IInternalRequestRepository, IChatContextualRepository, ContextualMessage } from '@/domain/repositories/IFase2Repositories';
import { NuevaSolicitudInterna } from '@/domain/entities/InternalRequest';

export class CreateInternalRequest {
  constructor(private repo: IInternalRequestRepository) {}
  execute(userId: string, data: NuevaSolicitudInterna) {
    return this.repo.create(userId, data);
  }
}

export class GetInternalRequests {
  constructor(private repo: IInternalRequestRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}

export class SendContextualMessage {
  constructor(private repo: IChatContextualRepository) {}
  execute(data: Omit<ContextualMessage, 'id' | 'timestamp'>) {
    return this.repo.sendMessage(data);
  }
}

export class SubscribeToChatContext {
  constructor(private repo: IChatContextualRepository) {}
  execute(origenRefId: string, callback: (msgs: ContextualMessage[]) => void) {
    return this.repo.subscribeToContext(origenRefId, callback);
  }
}
