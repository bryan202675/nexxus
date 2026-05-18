/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Payment.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Payment {
  id: string;
  usuario_id: string;
  empresaId: string;

  // Identificación
  usuarioNombre?: string;
  departamento?: string;
  cargo?: string;
  sedeId?: string;
  tipo_contrato?: 'tiempo_completo' | 'medio_tiempo' | 'temporal';

  // Salario base
  salario_bruto: number;
  salario_base?: number;

  // Deducciones legales El Salvador
  isss: number;           // 3% del bruto (tope $30)
  afp: number;            // 7.25% del bruto
  renta: number;          // Retención ISR progresiva

  // Extras
  horas_extra?: number;
  valor_hora_extra?: number;
  bono?: number;
  comision?: number;
  descuentos_adicionales?: number;

  // Beneficios legales
  aguinaldo?: number;
  vacaciones_pagadas?: number;
  incapacidad?: number;

  // Resultado
  salario_neto: number;

  // Pago
  moneda: string;         // 'USD'
  banco?: string;
  cuenta_bancaria?: string;
  periodo: string;        // 'Mayo 2026'
  fecha_pago: string;
  estado: 'Pagado' | 'Procesando' | 'Pendiente';

  // Auditoría
  creadoPor?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  notas?: string;
  createdAt?: string;
}
