export type ObjectiveStatus = 'activo' | 'completado' | 'cancelado';

export interface KeyResult {
  id: string;
  objectiveId: string;
  titulo: string;
  valorObjetivo: number;
  valorActual: number;
  unidad: string;
}

export interface Objective {
  id: string;
  empresaId: string;
  usuarioId: string;
  creadoPor: string;
  titulo: string;
  descripcion: string;
  ciclo: string;
  estado: ObjectiveStatus;
  createdAt: string;
  keyResults: KeyResult[];
}

export interface NewObjective {
  empresaId: string;
  usuarioId: string;
  creadoPor: string;
  titulo: string;
  descripcion: string;
  ciclo: string;
  keyResults: Omit<KeyResult, 'id' | 'objectiveId'>[];
}
