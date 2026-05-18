/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Course.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
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
    contenido_texto?: string;
  }[];
  puntos: number;
}

/**
 * Define el contrato de datos ICourseRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface ICourseRepository {
  getAll(empresaId: string): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
}
