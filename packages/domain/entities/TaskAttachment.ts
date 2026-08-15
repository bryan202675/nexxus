export interface TaskAttachment {
  id: string;
  tareaId: string;
  empresaId: string;
  nombre: string;
  url: string;
  publicId: string;
  mime: string;
  tamano: number;
  subidoPor: string;
  subidoPorNombre: string;
  createdAt: string;
}

export interface NewTaskAttachment {
  tareaId: string;
  empresaId: string;
  nombre: string;
  url: string;
  publicId: string;
  mime: string;
  tamano: number;
  subidoPor: string;
  subidoPorNombre: string;
}
