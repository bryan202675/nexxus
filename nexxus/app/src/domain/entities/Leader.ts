import { Evaluation } from './Evaluation';
import { RequestReportItem } from './RequestReport';
import { Task } from './Task';
import { User } from './User';

export interface LeaderTeamMember extends User {
  tareasPendientes: number;
  tareasVencidas: number;
  solicitudesPendientes: number;
  ultimaEvaluacion?: Evaluation;
}

export interface LeaderDashboard {
  equipo: LeaderTeamMember[];
  tareas: Task[];
  aprobaciones: RequestReportItem[];
  evaluaciones: Evaluation[];
  metricas: {
    miembros: number;
    tareasPendientes: number;
    tareasVencidas: number;
    aprobacionesPendientes: number;
    rendimientoPromedio: number;
  };
}
