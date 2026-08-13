import { ISensitiveProfileRepository, SensitiveEmployeeProfilePatch } from '../../../repositories/ISensitiveProfileRepository';

export class SensitiveProfileUseCases {
  constructor(private repository: ISensitiveProfileRepository) {}

  updateEmployeeProfile(empleadoId: string, profile: SensitiveEmployeeProfilePatch): Promise<void> {
    return this.repository.updateEmployeeProfile(empleadoId, profile);
  }

  updateEmployeeRole(empleadoId: string, rol: string): Promise<void> {
    return this.repository.updateEmployeeRole(empleadoId, rol);
  }
}
