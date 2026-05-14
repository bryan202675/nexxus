/**
 * Entidad pura de Check-In de bienestar.
 * No depende de Firebase, React, ni ninguna librería externa.
 */
export interface CheckIn {
  id: string;
  userId: string;
  empresaId?: string;
  usuarioNombre?: string;
  departamento?: string;
  fecha: string;
  energia: 'bajo' | 'medio' | 'alto';
  balanceEmocional: number; // 1-5
  estres: number;           // 1-5
  nivelEstres: 'bajo' | 'moderado' | 'alto' | 'critico';
  calidadSueno: number;     // 1-5
  cargaLaboral: number;     // 1-5 (carga percibida)
  indicadoresRapidos: string[]; // ['productivo', 'enfocado', 'cansado', etc.]
  nota?: string;
  comentarios?: string;
}

export type NuevaEntradaCheckIn = Omit<CheckIn, 'id' | 'fecha' | 'userId'>;
