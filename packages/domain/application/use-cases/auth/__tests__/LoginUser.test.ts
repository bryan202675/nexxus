import { describe, it, expect, vi } from 'vitest';
import { LoginUser } from '../LoginUser';
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

describe('LoginUser', () => {
  it('rechaza con AuthError.invalidCredentials si falta correo o password', async () => {
    const repo = crearRepoMock();
    const useCase = new LoginUser(repo);

    await expect(useCase.execute({ correo: '', password: '123456' })).rejects.toMatchObject({
      code: 'auth/invalid-credentials',
    });
    await expect(useCase.execute({ correo: 'a@b.com', password: '' })).rejects.toMatchObject({
      code: 'auth/invalid-credentials',
    });
    expect(repo.login).not.toHaveBeenCalled();
  });

  it('delega en el repositorio y devuelve el usuario autenticado', async () => {
    const user = { id: '1', correo: 'a@b.com', nombre: 'Ana', rol: 'empleado' } as User;
    const repo = crearRepoMock({ login: vi.fn().mockResolvedValue(user) });
    const useCase = new LoginUser(repo);

    const resultado = await useCase.execute({ correo: 'a@b.com', password: 'secreta1' });

    expect(repo.login).toHaveBeenCalledWith('a@b.com', 'secreta1');
    expect(resultado).toEqual({ user });
  });

  it('traduce errores con `code` de la infraestructura a AuthError conocidos', async () => {
    const repo = crearRepoMock({
      login: vi.fn().mockRejectedValue({ code: 'auth/wrong-password' }),
    });
    const useCase = new LoginUser(repo);

    await expect(useCase.execute({ correo: 'a@b.com', password: 'mala' })).rejects.toBeInstanceOf(AuthError);
    await expect(useCase.execute({ correo: 'a@b.com', password: 'mala' })).rejects.toMatchObject({
      code: 'auth/invalid-credentials',
    });
  });

  it('propaga errores sin `code` tal cual (no los envuelve en un AuthError falso)', async () => {
    const errorOriginal = new Error('fallo de red');
    const repo = crearRepoMock({ login: vi.fn().mockRejectedValue(errorOriginal) });
    const useCase = new LoginUser(repo);

    await expect(useCase.execute({ correo: 'a@b.com', password: 'secreta1' })).rejects.toBe(errorOriginal);
  });
});
