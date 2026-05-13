export interface Course {
  id: string;
  empresaId: string;
  titulo: string;
  descripcion: string;
  duracion: string;
  categoria: 'onboarding' | 'tecnico' | 'habilidades_blandas' | 'seguridad';
  modulos: {
    titulo: string;
    video_url?: string;
    contenido_texto?: string;
  }[];
  puntos: number;
}

export interface ICourseRepository {
  getAll(empresaId: string): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
}
