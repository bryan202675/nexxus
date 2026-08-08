/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Course.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

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
    documento_url?: string;
    contenido_texto?: string;
    evaluacion_corta?: {
      pregunta: string;
      opciones: string[];
      respuestaCorrecta: string;
    };
  }[];
  puntos: number;
}

export interface TrainingProgress {
  id: string;
  empresaId: string;
  empleadoId: string;
  cursoId: string;
  modulosCompletados: number[];
  porcentaje: number;
  completado: boolean;
  certificadoEmitido: boolean;
  certificadoCodigo?: string;
  certificadoEmitidoAt?: string;
  updatedAt?: string;
}

/**
 * Define el contrato de datos ICourseRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface ICourseRepository {
  getAll(empresaId: string): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
  getProgressForUser(empresaId: string, empleadoId: string): Promise<TrainingProgress[]>;
  completeModule(cursoId: string, moduloIndex: number): Promise<TrainingProgress>;
}
