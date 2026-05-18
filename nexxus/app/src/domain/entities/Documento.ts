/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Documento.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Documento {
  id: string;
  userId: string;
  empresaId: string;
  titulo: string;
  tipo: 'nomina' | 'contrato' | 'rrhh' | 'certificado' | 'evaluacion' | 'otro';
  url: string;
  fechaSubida: string;
  leido: boolean;
}

/**
 * Define el contrato de datos IDocumentoRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IDocumentoRepository {
  getByUser(userId: string): Promise<Documento[]>;
  markAsRead(documentoId: string): Promise<void>;
}
