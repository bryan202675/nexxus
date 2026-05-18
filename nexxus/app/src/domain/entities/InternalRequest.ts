/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/InternalRequest.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface InternalRequest {
  id: string;
  userId: string;
  empresaId: string;
  tipo: 'vacaciones' | 'permiso' | 'adelanto_salarial' | 'soporte_tecnico' | 'compra_material' | 'cambio_horario' | 'incidente';
  titulo: string;
  descripcion: string;
  monto?: number; // Para adelantos o compras
  fecha_inicio?: string;
  fecha_fin?: string;
  archivo_adjunto?: string;
  estado: 'pendiente' | 'revisado' | 'aprobado' | 'rechazado' | 'resuelto';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  flujo_aprobacion: {
    paso: number;
    asignado_a_rol: 'jefe' | 'admin';
    fecha_accion?: string;
    comentario_resolucion?: string;
  }[];
  timestamp: string;
}

/**
 * Describe la forma tipada NuevaSolicitudInterna; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type NuevaSolicitudInterna = Omit<InternalRequest, 'id' | 'estado' | 'timestamp' | 'flujo_aprobacion'>;
