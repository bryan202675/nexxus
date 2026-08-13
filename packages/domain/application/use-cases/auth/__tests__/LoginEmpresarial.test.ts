import { describe, it, expect, vi } from 'vitest';
import { LoginEmpresarial } from '../LoginEmpresarial';
import { AuthError } from '../../../../errors/AuthError';
import { IAuthRepository } from '../../../../repositories/IAuthRepository';
import { User } from '../../../../entities/User';

function crearRepoMock(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    login: vi.fn(),
    loginEmpresarial: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
    ...overrides,
  } as unknown as IAuthRepository;
}

describe('LoginEmpresarial', () => {
  it('rechaza con AuthError.invalidCredentials si falta usuario o password', async () => {
    const repo = crearRepoMock();
    const useCase = new LoginEmpresarial(repo);

    await expect(useCase.execute({ codigoEmpresa: 'ACME', usuario: '', password: '123456' })).rejects.toMatchObject({
      code: 'auth/invalid-credentials',
    });
    expect(repo.loginEmpresarial).not.toHaveBeenCalled();
  });

  it('permite código de empresa vacío (login de super admin)', async () => {
    const user = { id: '1', correo: 'root@nexxus.com', rol: 'super_admin' } as User;
    const repo = crearRepoMock({ loginEmpresarial: vi.fn().mockResolvedValue(user) });
    const useCase = new LoginEmpresarial(repo);

    const resultado = await useCase.execute({ codigoEmpresa: '', usuario: 'root', password: 'secreta1' });

    expect(repo.loginEmpresarial).toHaveBeenCalledWith('', 'root', 'secreta1');
    expect(resultado).toEqual({ user });
  });

  it('normaliza el código de empresa a mayúsculas/sin espacios y el usuario a minúsculas', async () => {
    const user = { id: '2', correo: 'juan@empresa.com', rol: 'empleado' } as User;
    const repo = crearRepoMock({ loginEmpresarial: vi.fn().mockResolvedValue(user) });
    const useCase = new LoginEmpresarial(repo);

    await useCase.execute({ codigoEmpresa: '  acme123  ', usuario: '  Juan.Perez  ', password: 'secreta1' });

    expect(repo.loginEmpresarial).toHaveBeenCalledWith('ACME123', 'juan.perez', 'secreta1');
  });

  it('no vuelve a envolver un AuthError ya lanzado por el repositorio', async () => {
    const errorOriginal = AuthError.userNotFound();
    const repo = crearRepoMock({ loginEmpresarial: vi.fn().mockRejectedValue(errorOriginal) });
    const useCase = new LoginEmpresarial(repo);

    await expect(useCase.execute({ codigoEmpresa: 'ACME', usuario: 'juan', password: 'secreta1' })).rejects.toBe(errorOriginal);
  });
});
