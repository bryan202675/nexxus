export interface Department {
  id: string;
  empresaId: string;
  nombre: string;
  sedeId?: string;
  sedeNombre?: string;
  jefeId?: string;
  jefeNombre?: string;
  empleadosCount: number;
  sectores: {
    id: string;
    nombre: string;
    responsableId?: string;
    responsableNombre?: string;
    empleadosCount: number;
  }[];
}
