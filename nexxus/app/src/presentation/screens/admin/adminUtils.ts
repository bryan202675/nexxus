import { User } from '@/domain/entities/User';

export const obtenerEmpresaIdAdmin = (user: User | null | undefined): string => {
  const valor = user?.empresaId;
  return typeof valor === 'string' ? valor.trim() : '';
};

