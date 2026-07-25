export type CompanyCalendarEventType = 'reunion' | 'recordatorio' | 'capacitacion' | 'vacaciones' | 'turno' | 'corporativo';

export type CompanyCalendarEvent = {
  id?: string;
  titulo: string;
  descripcion?: string;
  tipo: CompanyCalendarEventType;
  inicio: string | Date | { seconds?: number; toDate?: () => Date };
  fin: string | Date | { seconds?: number; toDate?: () => Date };
  empleadoIds?: string[];
  empleadoNombres?: string[];
  departamentoIds?: string[];
  departamentos?: string[];
  sedeIds?: string[];
  sedes?: string[];
  empresaId?: string;
  creadoPor?: string;
  creadoEn?: unknown;
  actualizadoEn?: unknown;
};

export type CompanyCalendarCatalogItem = {
  id?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  activo?: boolean;
  estado_activo?: boolean;
  empresaId?: string;
};

export type CompanyCalendarSnapshot = {
  eventos: CompanyCalendarEvent[];
  usuarios: CompanyCalendarCatalogItem[];
  departamentos: CompanyCalendarCatalogItem[];
  sedes: CompanyCalendarCatalogItem[];
};
