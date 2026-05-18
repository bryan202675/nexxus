/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Department.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Department {
  id: string;
  empresaId: string;
  nombre: string;
  sedeId?: string;
  sedeNombre?: string;
  jefeId?: string;
  jefeNombre?: string;
  empleadosCount: number;
  sectores: {
    id: string;
    nombre: string;
    responsableId?: string;
    responsableNombre?: string;
    empleadosCount: number;
  }[];
}
