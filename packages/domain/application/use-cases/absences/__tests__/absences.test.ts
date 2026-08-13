import { describe, it, expect, vi } from 'vitest';
import { CreateAbsence } from '../CreateAbsence';
import { GetAbsences } from '../GetAbsences';
import { IAbsenceRepository } from '../../../../repositories/IAbsenceRepository';

function crearRepoMock(overrides: Partial<IAbsenceRepository> = {}): IAbsenceRepository {
  return {
    getAbsencesByUser: vi.fn(),
    getAbsencesByCompany: vi.fn(),
    createAbsence: vi.fn(),
    updateAbsenceState: vi.fn(),
    ...overrides,
  } as unknown as IAbsenceRepository;
}

describe('Casos de uso de Ausencias (CRUD)', () => {
  it('CreateAbsence delega en repo.createAbsence con la ausencia recibida', async () => {
    const repo = crearRepoMock();
    const ausencia = { usuarioId: 'u1', empresaId: 'e1', tipo: 'vacaciones', motivo: 'Viaje' };

    await new CreateAbsence(repo).execute(ausencia);

    expect(repo.createAbsence).toHaveBeenCalledWith(ausencia);
  });

  it('GetAbsences delega en repo.getAbsencesByUser con el userId recibido', async () => {
    const ausencias = [{ id: 'a1' }];
    const repo = crearRepoMock({ getAbsencesByUser: vi.fn().mockResolvedValue(ausencias) });

    const resultado = await new GetAbsences(repo).execute('u1');

    expect(repo.getAbsencesByUser).toHaveBeenCalledWith('u1');
    expect(resultado).toBe(ausencias);
  });
});
