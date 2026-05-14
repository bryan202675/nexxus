export interface Announcement {
  id: string;
  empresaId: string;
  creadoPorId: string;
  creadoPorNombre: string;
  departamentoDestino: string; // 'Todos' or specific depto like 'Ventas'
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  mensaje: string;
  fecha: string; // ISO 8601
}
