/**
 * Documentacion Nexxus - nexxus/app/src/application/dtos/AuthDTO.ts
 * Capa: aplicacion.
 * Proposito: DTO de aplicacion. Documenta la forma de datos que viaja entre UI, casos de uso y servicios.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/** DTO para la respuesta de autenticación */
export interface AuthResponseDTO {
  user: User;
  token?: string;
}

/** DTO para las credenciales de login */
export interface LoginDTO {
  correo: string;
  password: string;
}

/** DTO para las credenciales de login empresarial */
export interface LoginEmpresarialDTO {
  codigoEmpresa: string;
  usuario: string;
  password: string;
}

/** DTO para el registro de un nuevo usuario */
export interface RegisterDTO {
  correo: string;
  password: string;
  nombre: string;
  rol: User['rol'];
}
