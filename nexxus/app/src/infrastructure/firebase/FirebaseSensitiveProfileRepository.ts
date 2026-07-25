import { httpsCallable } from 'firebase/functions';
import { ISensitiveProfileRepository, SensitiveEmployeeProfilePatch } from '@/domain/repositories/ISensitiveProfileRepository';
import { functions } from './firebaseConfig';

export class FirebaseSensitiveProfileRepository implements ISensitiveProfileRepository {
  async updateEmployeeProfile(empleadoId: string, profile: SensitiveEmployeeProfilePatch): Promise<void> {
    const callable = httpsCallable(functions, 'updateSensitiveEmployeeProfile');
    await callable({ empleadoId, profile });
  }

  async updateEmployeeRole(empleadoId: string, rol: string): Promise<void> {
    const callable = httpsCallable(functions, 'updateEmployeeRole');
    await callable({ empleadoId, rol });
  }
}
