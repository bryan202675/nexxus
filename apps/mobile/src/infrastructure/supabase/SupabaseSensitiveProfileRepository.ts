import { supabase } from './supabaseClient';
import { ISensitiveProfileRepository, SensitiveEmployeeProfilePatch } from 'domain/repositories/ISensitiveProfileRepository';

export class SupabaseSensitiveProfileRepository implements ISensitiveProfileRepository {
  async updateEmployeeProfile(empleadoId: string, profile: SensitiveEmployeeProfilePatch): Promise<void> {
    const { error } = await supabase.functions.invoke('update-sensitive-employee-profile', { body: { empleadoId, profile } });
    if (error) throw error;
  }

  async updateEmployeeRole(empleadoId: string, rol: string): Promise<void> {
    const { error } = await supabase.functions.invoke('update-employee-role', { body: { empleadoId, rol } });
    if (error) throw error;
  }
}
