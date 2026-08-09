import { describe, it, expect, vi } from 'vitest';
import { CreateTask } from '../CreateTask';
import { GetTasks } from '../GetTasks';
import { UpdateTask } from '../UpdateTask';
import { ITaskRepository } from '../../../../repositories/ITaskRepository';

function crearRepoMock(overrides: Partial<ITaskRepository> = {}): ITaskRepository {
  return {
    getTasksByUser: vi.fn(),
    subscribeTasksByUser: vi.fn(),
    getTasksByCompany: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskState: vi.fn(),
    deleteTask: vi.fn(),
    ...overrides,
  } as unknown as ITaskRepository;
}

describe('Casos de uso de Tareas (CRUD)', () => {
  it('CreateTask delega en repo.createTask con la tarea recibida', async () => {
    const repo = crearRepoMock();
    const tarea = { titulo: 'Revisar nómina', usuarioId: 'u1', empresaId: 'e1', estado: 'pendiente' as const };

    await new CreateTask(repo).execute(tarea);

    expect(repo.createTask).toHaveBeenCalledWith(tarea);
    expect(repo.createTask).toHaveBeenCalledTimes(1);
  });

  it('GetTasks delega en repo.getTasksByUser con el userId recibido', async () => {
    const tareas = [{ id: 't1' }, { id: 't2' }];
    const repo = crearRepoMock({ getTasksByUser: vi.fn().mockResolvedValue(tareas) });

    const resultado = await new GetTasks(repo).execute('u1');

    expect(repo.getTasksByUser).toHaveBeenCalledWith('u1');
    expect(resultado).toBe(tareas);
  });

  it('UpdateTask delega en repo.updateTask con el id y los datos parciales', async () => {
    const repo = crearRepoMock();

    await new UpdateTask(repo).execute('t1', { estado: 'completada' });

    expect(repo.updateTask).toHaveBeenCalledWith('t1', { estado: 'completada' });
  });
});
