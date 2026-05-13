export interface Payment {
  id: string;
  usuario_id: string;
  empresaId: string;
  
  // Nómina details
  salario_bruto: number;
  isss: number;
  afp: number;
  renta: number;
  salario_neto: number;
  
  moneda: string; // ej: 'USD'
  periodo: string; // ej: 'Mayo 2026'
  fecha_pago: string;
  estado: 'Pagado' | 'Procesando' | 'Pendiente';
}
