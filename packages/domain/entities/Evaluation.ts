export interface Evaluation {
  id: string;
  empresaId: string;
  empleadoId: string;
  empleadoNombre: string;
  evaluadorId: string;
  evaluadorNombre: string;
  periodo: string;
  puntualidad: number;
  tareasCompletadas: number;
  disciplina: number;
  comentarios: string;
  puntajeTotal: number;
  fechaCreacion: string;
}

export type NewEvaluationInput = Omit<Evaluation, 'id' | 'puntajeTotal' | 'fechaCreacion'>;

