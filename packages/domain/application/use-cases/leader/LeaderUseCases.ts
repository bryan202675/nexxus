import { LeaderDashboard } from '../../../entities/Leader';
import { NewEvaluationInput } from '../../../entities/Evaluation';
import { RequestReportItem, RequestReportStatus } from '../../../entities/RequestReport';
import { ILeaderRepository } from '../../../repositories/ILeaderRepository';

export class LeaderUseCases {
  constructor(private leaderRepository: ILeaderRepository) {}

  subscribeDashboard(
    leader: { id: string; nombre: string; empresaId: string; rol?: string; departamentoId?: string; departamento?: string },
    limitCount: number,
    callback: (dashboard: LeaderDashboard) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.leaderRepository.subscribeDashboard(leader, limitCount, callback, onError);
  }

  resolveApproval(
    item: RequestReportItem,
    estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada'>,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    return this.leaderRepository.resolveApproval(item, estado, actor);
  }

  createEvaluation(input: NewEvaluationInput): Promise<void> {
    return this.leaderRepository.createEvaluation(input);
  }
}
