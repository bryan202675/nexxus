import { supabase } from './supabaseClient';
import { IPaymentRepository } from 'domain/repositories/IPaymentRepository';
import { Payment } from 'domain/entities/Payment';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): Payment {
  return {
    ...(row.datos || {}),
    id: row.id,
    usuario_id: row.usuario_id,
    empresaId: row.empresa_id,
    salario_bruto: row.monto,
    isss: row.datos?.isss ?? 0,
    afp: row.datos?.afp ?? 0,
    renta: row.datos?.renta ?? 0,
    salario_neto: row.datos?.salario_neto ?? row.monto,
    moneda: row.moneda,
    periodo: row.datos?.periodo ?? '',
    fecha_pago: row.datos?.fecha_pago ?? row.created_at,
    estado: row.estado === 'confirmado' ? 'Pagado' : row.estado === 'procesando' ? 'Procesando' : 'Pendiente',
    createdAt: row.created_at,
  };
}

function toRow(payment: Record<string, any>) {
  const { usuario_id, empresaId, salario_bruto, moneda, estado, ...extra } = payment;
  return {
    usuario_id, empresa_id: empresaId, monto: salario_bruto,
    moneda: moneda ?? 'USD',
    estado: estado === 'Pagado' ? 'confirmado' : estado === 'Procesando' ? 'procesando' : 'pendiente',
    datos: extra,
  };
}

export class SupabasePaymentRepository implements IPaymentRepository {
  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getAllPayments(empresaId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getPaymentsByPeriod(empresaId: string, periodo: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('empresa_id', empresaId).contains('datos', { periodo });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async generatePayments(payments: Omit<Payment, 'id'>[]): Promise<void> {
    const { error } = await supabase.from('payments').insert(payments.map(toRow));
    if (error) throw error;
  }

  async createPayment(payment: Omit<Payment, 'id'>): Promise<string> {
    const { data, error } = await supabase.from('payments').insert(toRow(payment)).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    const { data: current } = await supabase.from('payments').select('datos').eq('id', paymentId).maybeSingle();
    const { usuario_id, empresaId, salario_bruto, moneda, estado, ...extra } = data as any;
    const row: Record<string, any> = { datos: { ...(current?.datos || {}), ...extra } };
    if (salario_bruto !== undefined) row.monto = salario_bruto;
    if (moneda !== undefined) row.moneda = moneda;
    if (estado !== undefined) row.estado = estado === 'Pagado' ? 'confirmado' : estado === 'Procesando' ? 'procesando' : 'pendiente';
    const { error } = await supabase.from('payments').update(row).eq('id', paymentId);
    if (error) throw error;
  }

  async updatePaymentStatus(paymentId: string, estado: Payment['estado']): Promise<void> {
    await this.updatePayment(paymentId, { estado });
  }

  async deletePayment(paymentId: string): Promise<void> {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) throw error;
  }

  async getAllPaymentHistory(empresaId: string): Promise<Payment[]> {
    return this.getAllPayments(empresaId);
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (payments: Payment[]) => void): () => void {
    return subscribeQuery('payments', `empresa_id=eq.${empresaId}`, () => this.getPaymentsByPeriod(empresaId, periodo), callback);
  }

  subscribeAll(empresaId: string, callback: (payments: Payment[]) => void): () => void {
    return subscribeQuery('payments', `empresa_id=eq.${empresaId}`, () => this.getAllPayments(empresaId), callback);
  }

  subscribeByUser(userId: string, empresaId: string | undefined, callback: (payments: Payment[]) => void): () => void {
    return subscribeQuery('payments', `usuario_id=eq.${userId}`, () => this.getPaymentsByUser(userId), callback);
  }
}
