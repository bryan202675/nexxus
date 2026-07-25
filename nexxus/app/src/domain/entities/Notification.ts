/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Notification.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


export interface Notification {
  id: string;
  usuario_id: string;
  empresaId: string;
  titulo: string;
  mensaje: string;
  tipo: 'tarea' | 'anuncio' | 'privada' | 'info' | 'ausencia' | 'bienestar' | 'aprobacion' | 'mensaje';
  leida: boolean;
  fecha: string;
}
