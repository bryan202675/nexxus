export interface TaskComment {
  id: string;
  tareaId: string;
  empresaId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  createdAt: string;
  updatedAt: string;
  editado: boolean;
}

export interface NewTaskComment {
  tareaId: string;
  empresaId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
}
