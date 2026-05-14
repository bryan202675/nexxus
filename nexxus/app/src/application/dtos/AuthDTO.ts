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

/** DTO para el registro de un nuevo usuario */
export interface RegisterDTO {
  correo: string;
  password: string;
  nombre: string;
  rol: User['rol'];
}
