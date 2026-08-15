export interface TaskSubtask {
  id: string;
  tareaId: string;
  empresaId: string;
  titulo: string;
  completada: boolean;
  orden: number;
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskSubtask {
  tareaId: string;
  empresaId: string;
  titulo: string;
  orden: number;
  creadoPor: string;
}
