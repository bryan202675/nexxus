import { supabase } from './supabaseClient';
import { IPayrollRepository } from 'domain/repositories/IPayrollRepository';
import { PayrollRecord, PayrollStatus } from 'domain/entities/Payroll';
import { User } from 'domain/entities/User';
import { Attendance } from 'domain/entities/Attendance';
import { calculatePayroll } from 'domain/services/payrollPolicy';
import { subscribeQuery } from './realtime';
import { mapUserRow } from './mappers';

const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
// Mismo mapeo que ESTADO_PAYMENT en apps/dashboard/.../empresa-nomina/index.tsx -- payments.estado
// usa un vocabulario distinto (pendiente/procesando/confirmado) al de nominas.estado.
const ESTADO_PAYMENT: Record<string, string> = { pendiente: 'pendiente', revisado: 'procesando', pagado: 'confirmado' };

function mapRow(row: Record<string, any>): PayrollRecord {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    empleadoId: row.usuario_id,
    empleadoNombre: row.empleado_nombre ?? '',
    periodo: row.periodo ?? '',
    salarioBase: row.salario_bruto - row.bonos - row.comisiones,
    bonos: row.bonos,
    comisiones: row.comisiones,
    descuentos: row.otras_deducciones,
    horasExtra: row.horas_extra,
    valorHoraExtra: row.valor_hora_extra,
    descuentoTardanzas: row.descuento_tardanzas,
    descuentoAusencias: row.descuento_ausencias,
    salarioBruto: row.salario_bruto,
    isss: row.isss_empleado,
    afp: row.afp_empleado,
    renta: row.renta,
    totalPagar: row.salario_neto,
    estado: row.estado,
    creadoPor: row.creado_por ?? '',
    creadoPorNombre: row.creado_por_nombre ?? '',
    aprobadoPor: row.aprobado_por ?? undefined,
    aprobadoPorNombre: row.aprobado_por_nombre ?? undefined,
    fechaAprobacion: row.fecha_aprobacion ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    legacyPaymentId: row.legacy_payment_id ?? undefined,
  };
}

export class SupabasePayrollRepository implements IPayrollRepository {
  async getByPeriod(empresaId: string, periodo: string): Promise<PayrollRecord[]> {
    const { data, error } = await supabase.from('nominas').select('*').eq('empresa_id', empresaId).eq('periodo', periodo).limit(500);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByPeriod(empresaId: string, periodo: string, callback: (records: PayrollRecord[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('nominas', `empresa_id=eq.${empresaId}`, () => this.getByPeriod(empresaId, periodo), callback, onError);
  }

  private async getEmployees(empresaId: string): Promise<User[]> {
    const { data, error } = await supabase.from('usuarios').select('*').eq('empresa_id', empresaId).eq('eliminado', false).limit(500);
    if (error) throw error;
    return (data || []).map(mapUserRow).filter((u) => !['admin', 'admin_empresa', 'super_admin'].includes(u.rol) && u.activo !== false);
  }

  private async getAttendanceForPeriod(empresaId: string): Promise<Attendance[]> {
    const { data, error } = await supabase.from('asistencias').select('*').eq('empresa_id', empresaId).limit(1000);
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id, userId: row.usuario_id, empresaId: row.empresa_id, tipo: row.tipo, timestamp: row.created_at,
      horas_extra_calculadas: row.horas_extra, minutosTarde: row.minutos_tarde,
      estado_aprobacion: row.estado_aprobacion, offline_sync: row.offline_sync,
    }));
  }

  async generateForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string }): Promise<number> {
    const [employees, existing, attendance] = await Promise.all([
      this.getEmployees(params.empresaId),
      this.getByPeriod(params.empresaId, params.periodo),
      this.getAttendanceForPeriod(params.empresaId),
    ]);
    const existingIds = new Set(existing.map((p) => p.empleadoId));
    const now = new Date().toISOString();
    const rows: Record<string, any>[] = [];

    for (const employee of employees) {
      if (!employee.id || existingIds.has(employee.id)) continue;
      const employeeAttendance = attendance.filter((a) => a.userId === employee.id);
      const horasExtra = employeeAttendance.reduce((t, a) => t + numberValue(a.horas_extra_calculadas), 0);
      const minutosTarde = employeeAttendance.reduce((t, a) => t + numberValue(a.minutosTarde), 0);
      const calc = calculatePayroll({
        salarioBase: numberValue(employee.salarioBase),
        bonos: numberValue(employee.bonos_recurrentes),
        comisiones: numberValue(employee.comisiones_recurrentes),
        descuentos: numberValue(employee.descuentos_recurrentes),
        horasExtra, minutosTarde,
      });
      rows.push({
        empresa_id: params.empresaId,
        usuario_id: employee.id,
        empleado_nombre: textValue(employee.nombre, textValue(employee.correo, 'Empleado')),
        periodo: params.periodo,
        periodo_anio: new Date().getFullYear(),
        periodo_mes: new Date().getMonth() + 1,
        bonos: numberValue(employee.bonos_recurrentes),
        comisiones: numberValue(employee.comisiones_recurrentes),
        otras_deducciones: numberValue(employee.descuentos_recurrentes),
        horas_extra: horasExtra,
        valor_hora_extra: numberValue(employee.salarioBase) > 0 ? numberValue(employee.salarioBase) / 160 : 0,
        descuento_tardanzas: calc.descuentoTardanzas,
        descuento_ausencias: calc.descuentoAusencias,
        salario_bruto: calc.salarioBruto,
        isss_empleado: calc.isss,
        afp_empleado: calc.afp,
        renta: calc.renta,
        salario_neto: calc.totalPagar,
        estado: 'pendiente',
        creado_por: params.actorId,
        creado_por_nombre: params.actorName,
      });
    }

    if (rows.length === 0) return 0;
    const { error } = await supabase.from('nominas').insert(rows);
    if (error) throw error;

    // Sin este espejo en "payments", la nómina generada desde el admin de mobile jamás aparecía
    // en "Mi Salario" del empleado (esa pantalla lee de payments, no de nominas) -- igual que
    // handleGenerarNomina en apps/dashboard/.../empresa-nomina/index.tsx.
    await supabase.from('payments').insert(rows.map((row) => {
      // Mismo cálculo interno de calculatePayroll (no lo devuelve por separado) -- necesario para
      // que "Mi Salario" no muestre siempre $0 en horas extra, y para poder derivar salario_base
      // (nominas no tiene esa columna, solo salario_bruto).
      const horasExtraPago = numberValue(row.horas_extra) * numberValue(row.valor_hora_extra) * 1.5;
      return {
        empresa_id: row.empresa_id,
        usuario_id: row.usuario_id,
        monto: row.salario_neto,
        moneda: 'USD',
        estado: 'pendiente',
        datos: {
          periodo: row.periodo,
          salario_base: row.salario_bruto - row.bonos - row.comisiones - horasExtraPago,
          bono: row.bonos,
          comision: row.comisiones,
          horas_extra: horasExtraPago,
          descuentos_adicionales: row.otras_deducciones,
          salario_bruto: row.salario_bruto,
          isss: row.isss_empleado,
          afp: row.afp_empleado,
          renta: row.renta,
          salario_neto: row.salario_neto,
        },
      };
    })).then(({ error: paymentsError }) => {
      if (paymentsError) console.error('[SupabasePayrollRepository] No se pudo espejar en payments:', paymentsError);
    });

    await supabase.from('audit_logs').insert({
      empresa_id: params.empresaId,
      actor_id: params.actorId,
      accion: 'Generación canónica de nómina',
      modulo: 'Nómina',
      detalles: `Se generaron ${rows.length} nóminas para ${params.periodo}`,
    });
    return rows.length;
  }

  async updateStatus(payrollId: string, estado: PayrollStatus, actor: { id: string; nombre: string }): Promise<void> {
    const now = new Date().toISOString();
    const { data: record } = await supabase.from('nominas').select('*').eq('id', payrollId).maybeSingle();
    const { error } = await supabase.from('nominas').update({
      estado, aprobado_por: actor.id, aprobado_por_nombre: actor.nombre,
      fecha_aprobacion: estado === 'pagado' ? now : null, updated_at: now,
    }).eq('id', payrollId);
    if (error) throw error;

    // Igual que handleCambiarEstado del dashboard: sin esto, "Mi Salario" se queda mostrando
    // "Pendiente" para siempre aunque el admin ya haya marcado la nómina como pagada desde mobile.
    if (record) {
      const estadoPayment = ESTADO_PAYMENT[estado] || 'pendiente';
      await supabase.from('payments').update({ estado: estadoPayment })
        .eq('usuario_id', record.usuario_id).eq('empresa_id', record.empresa_id)
        .contains('datos', { periodo: record.periodo });
    }

    if (estado === 'pagado' && record) {
      await supabase.from('notificaciones').insert({
        usuario_id: record.usuario_id,
        empresa_id: record.empresa_id,
        titulo: 'Nómina pagada',
        cuerpo: `Se ha aprobado tu nómina del periodo ${record.periodo}. Total neto: $${Number(record.salario_neto).toFixed(2)}.`,
        tipo: 'info',
      });
    }
  }

  async approveAllForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string; actorRole?: string }): Promise<number> {
    const records = await this.getByPeriod(params.empresaId, params.periodo);
    const pending = records.filter((r) => r.estado !== 'pagado');
    if (pending.length === 0) return 0;
    const now = new Date().toISOString();

    const { error } = await supabase.from('nominas').update({
      estado: 'pagado', aprobado_por: params.actorId, aprobado_por_nombre: params.actorName,
      fecha_aprobacion: now, updated_at: now,
    }).in('id', pending.map((r) => r.id));
    if (error) throw error;

    await supabase.from('payments').update({ estado: ESTADO_PAYMENT.pagado })
      .eq('empresa_id', params.empresaId).contains('datos', { periodo: params.periodo })
      .in('usuario_id', pending.map((r) => r.empleadoId))
      .then(({ error: paymentsError }) => {
        if (paymentsError) console.error('[SupabasePayrollRepository] No se pudo sincronizar payments:', paymentsError);
      });

    await supabase.from('notificaciones').insert(pending.map((r) => ({
      usuario_id: r.empleadoId,
      empresa_id: params.empresaId,
      titulo: 'Nómina pagada',
      cuerpo: `Se ha aprobado tu nómina del periodo ${r.periodo}. Total neto: $${r.totalPagar.toFixed(2)}.`,
      tipo: 'info',
    })));

    await supabase.from('audit_logs').insert({
      empresa_id: params.empresaId,
      actor_id: params.actorId,
      accion: 'Aprobación masiva de nómina',
      modulo: 'Nómina',
      detalles: `Se aprobaron ${pending.length} nóminas para ${params.periodo}`,
    });
    return pending.length;
  }
}
