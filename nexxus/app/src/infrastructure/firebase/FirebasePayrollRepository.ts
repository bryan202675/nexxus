/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/FirebasePayrollRepository.ts
 * Capa: infraestructura.
 * Proposito: Generacion canonica de nominas con espejo legacy en payments.
 * Dependencias clave: Firestore, usuarios, asistencias y servicio payrollPolicy.
 * Consideracion de mantenimiento: no usar datos simulados; todo calculo viene de usuarios/asistencia.
 */

import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PayrollRecord, PayrollStatus } from '@/domain/entities/Payroll';
import { IPayrollRepository } from '@/domain/repositories/IPayrollRepository';
import { User } from '@/domain/entities/User';
import { Attendance } from '@/domain/entities/Attendance';
import { calculatePayroll } from '@/domain/services/payrollPolicy';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;

export class FirebasePayrollRepository implements IPayrollRepository {
  async getByPeriod(empresaId: string, periodo: string): Promise<PayrollRecord[]> {
    const snapshot = await getDocs(query(
      collection(db, 'nominas'),
      where('empresaId', '==', empresaId),
      where('periodo', '==', periodo),
      limit(500)
    ));
    return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as PayrollRecord));
  }

  subscribeByPeriod(
    empresaId: string,
    periodo: string,
    callback: (records: PayrollRecord[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return onSnapshot(
      query(
        collection(db, 'nominas'),
        where('empresaId', '==', empresaId),
        where('periodo', '==', periodo),
        limit(500)
      ),
      (snapshot) => callback(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as PayrollRecord))),
      onError
    );
  }

  private async getEmployees(empresaId: string): Promise<User[]> {
    const snapshot = await getDocs(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId), limit(500)));
    return snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() } as User))
      .filter((user) => user.eliminado !== true && user.activo !== false && user.rol !== 'admin' && user.rol !== 'admin_empresa' && user.rol !== 'super_admin');
  }

  private async getAttendanceForPeriod(empresaId: string): Promise<Attendance[]> {
    const snapshot = await getDocs(query(collection(db, 'asistencias'), where('empresaId', '==', empresaId), limit(1000)));
    return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Attendance));
  }

  async generateForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string }): Promise<number> {
    const [employees, existing, attendance] = await Promise.all([
      this.getEmployees(params.empresaId),
      this.getByPeriod(params.empresaId, params.periodo),
      this.getAttendanceForPeriod(params.empresaId),
    ]);
    const existingEmployees = new Set(existing.map((payroll) => payroll.empleadoId));
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let created = 0;

    employees.forEach((employee) => {
      if (!employee.id || existingEmployees.has(employee.id)) return;
      const employeeAttendance = attendance.filter((item) => item.userId === employee.id);
      const horasExtra = employeeAttendance.reduce((total, item) => total + numberValue(item.horas_extra_calculadas), 0);
      const minutosTarde = employeeAttendance.reduce((total, item) => total + numberValue(item.minutosTarde), 0);
      const payrollCalc = calculatePayroll({
        salarioBase: numberValue(employee.salarioBase),
        bonos: numberValue(employee.bonos_recurrentes),
        comisiones: numberValue(employee.comisiones_recurrentes),
        descuentos: numberValue(employee.descuentos_recurrentes),
        horasExtra,
        minutosTarde,
      });
      const payrollRef = doc(collection(db, 'nominas'));
      const legacyPaymentRef = doc(collection(db, 'payments'));
      const record: Omit<PayrollRecord, 'id'> = {
        empresaId: params.empresaId,
        empleadoId: employee.id,
        empleadoNombre: textValue(employee.nombre, textValue(employee.correo, 'Empleado')),
        periodo: params.periodo,
        salarioBase: numberValue(employee.salarioBase),
        bonos: numberValue(employee.bonos_recurrentes),
        comisiones: numberValue(employee.comisiones_recurrentes),
        descuentos: numberValue(employee.descuentos_recurrentes),
        horasExtra,
        valorHoraExtra: numberValue(employee.salarioBase) > 0 ? numberValue(employee.salarioBase) / 160 : 0,
        descuentoTardanzas: payrollCalc.descuentoTardanzas,
        descuentoAusencias: payrollCalc.descuentoAusencias,
        salarioBruto: payrollCalc.salarioBruto,
        isss: payrollCalc.isss,
        afp: payrollCalc.afp,
        renta: payrollCalc.renta,
        totalPagar: payrollCalc.totalPagar,
        estado: 'pendiente',
        creadoPor: params.actorId,
        creadoPorNombre: params.actorName,
        createdAt: now,
        updatedAt: now,
        legacyPaymentId: legacyPaymentRef.id,
      };
      batch.set(payrollRef, record);
      batch.set(legacyPaymentRef, {
        usuario_id: employee.id,
        usuarioNombre: record.empleadoNombre,
        empresaId: params.empresaId,
        departamento: employee.departamento || '',
        cargo: employee.cargo || '',
        salario_bruto: record.salarioBruto,
        salario_base: record.salarioBase,
        isss: record.isss,
        afp: record.afp,
        renta: record.renta,
        salario_neto: record.totalPagar,
        horas_extra: record.horasExtra,
        bono: record.bonos,
        comision: record.comisiones,
        descuentos_adicionales: record.descuentos + record.descuentoTardanzas + record.descuentoAusencias,
        moneda: 'USD',
        periodo: params.periodo,
        fecha_pago: now,
        estado: 'Procesando',
        creadoPor: params.actorName,
        createdAt: now,
        nominaId: payrollRef.id,
      });
      created += 1;
    });

    if (created > 0) {
      await batch.commit();
      await addDoc(collection(db, 'audit_logs'), {
        empresaId: params.empresaId,
        empresa_id: params.empresaId,
        usuarioId: params.actorId,
        usuario_id: params.actorId,
        usuarioNombre: params.actorName,
        rol: 'admin_empresa',
        accion: 'Generación canónica de nómina',
        modulo: 'Nómina',
        detalles: `Se generaron ${created} nóminas para ${params.periodo}`,
        estado: 'Success',
        timestamp: now,
      });
    }
    return created;
  }

  async updateStatus(payrollId: string, estado: PayrollStatus, actor: { id: string; nombre: string }): Promise<void> {
    const now = new Date().toISOString();
    const payrollRef = doc(db, 'nominas', payrollId);
    const payrollSnapshot = await getDoc(payrollRef);
    const record = payrollSnapshot.exists() ? ({ id: payrollSnapshot.id, ...payrollSnapshot.data() } as PayrollRecord) : null;
    await updateDoc(payrollRef, {
      estado,
      aprobadoPor: actor.id,
      aprobadoPorNombre: actor.nombre,
      fechaAprobacion: estado === 'pagado' ? now : null,
      updatedAt: now,
    });
    if (record?.legacyPaymentId) {
      await updateDoc(doc(db, 'payments', record.legacyPaymentId), {
        estado: estado === 'pagado' ? 'Pagado' : estado === 'revisado' ? 'Procesando' : 'Pendiente',
        fecha_pago: estado === 'pagado' ? now : '',
      });
    }
    if (estado === 'pagado' && record) {
      await addDoc(collection(db, 'notificaciones'), {
        usuario_id: record.empleadoId,
        empresaId: record.empresaId,
        titulo: 'Nómina pagada',
        mensaje: `Se ha aprobado tu nómina del periodo ${record.periodo}. Total neto: $${record.totalPagar.toFixed(2)}.`,
        tipo: 'info',
        leida: false,
        fecha: now,
      });
    }
  }

  async approveAllForPeriod(params: { empresaId: string; periodo: string; actorId: string; actorName: string; actorRole?: string }): Promise<number> {
    const records = await this.getByPeriod(params.empresaId, params.periodo);
    const pending = records.filter((record) => record.estado !== 'pagado');
    if (pending.length === 0) return 0;

    const now = new Date().toISOString();
    const batch = writeBatch(db);
    pending.forEach((record) => {
      batch.update(doc(db, 'nominas', record.id), {
        estado: 'pagado',
        aprobadoPor: params.actorId,
        aprobadoPorNombre: params.actorName,
        fechaAprobacion: now,
        updatedAt: now,
      });
      if (record.legacyPaymentId) {
        batch.update(doc(db, 'payments', record.legacyPaymentId), {
          estado: 'Pagado',
          fecha_pago: now,
        });
      }
      batch.set(doc(collection(db, 'notificaciones')), {
        usuario_id: record.empleadoId,
        empresaId: params.empresaId,
        titulo: 'Nómina pagada',
        mensaje: `Se ha aprobado tu nómina del periodo ${record.periodo}. Total neto: $${record.totalPagar.toFixed(2)}.`,
        tipo: 'info',
        leida: false,
        fecha: now,
      });
    });
    await batch.commit();
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: params.empresaId,
      empresa_id: params.empresaId,
      usuarioId: params.actorId,
      usuario_id: params.actorId,
      usuarioNombre: params.actorName,
      rol: params.actorRole || 'admin_empresa',
      accion: 'Aprobación masiva de nómina',
      modulo: 'Nómina',
      detalles: `Se aprobaron ${pending.length} nóminas para ${params.periodo}`,
      estado: 'Success',
      timestamp: now,
    });
    return pending.length;
  }
}
