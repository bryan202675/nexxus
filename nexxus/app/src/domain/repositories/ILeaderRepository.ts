import { LeaderDashboard } from '@/domain/entities/Leader';
import { NewEvaluationInput } from '@/domain/entities/Evaluation';
import { RequestReportItem, RequestReportStatus } from '@/domain/entities/RequestReport';

export interface ILeaderRepository {
  subscribeDashboard(
    leader: { id: string; nombre: string; empresaId: string; rol?: string; departamentoId?: string; departamento?: string },
    limitCount: number,
    callback: (dashboard: LeaderDashboard) => void,
    onError: (error: Error) => void
  ): () => void;

  resolveApproval(
    item: RequestReportItem,
    estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada'>,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void>;

  createEvaluation(input: NewEvaluationInput): Promise<void>;
}
