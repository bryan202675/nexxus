export type SensitiveEmployeeProfilePatch = {
  salarioBase: number;
  tipo_contrato: string;
  banco: string;
  cuenta_bancaria: string;
  bonos_recurrentes: number;
  comisiones_recurrentes: number;
  descuentos_recurrentes: number;
  afp_pertenece: string;
};

export interface ISensitiveProfileRepository {
  updateEmployeeProfile(empleadoId: string, profile: SensitiveEmployeeProfilePatch): Promise<void>;
  updateEmployeeRole(empleadoId: string, rol: string): Promise<void>;
}
