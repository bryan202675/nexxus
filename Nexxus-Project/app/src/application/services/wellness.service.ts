/**
 * Servicio de aplicación de Bienestar.
 * Contiene lógica pura de cálculo que NO depende de Firebase.
 * (Migrado y limpiado desde infrastructure/services/logicaBienestar.ts)
 */
import { CheckIn } from '@/domain/entities/CheckIn';

export function calcularNivelEstres(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 3;
  const recientes = checkIns.slice(0, 5);
  const promedioBalance = recientes.reduce((s, c) => s + c.balanceEmocional, 0) / recientes.length;
  const puntuacionEnergia = recientes.reduce((s, c) => {
    const v = c.energia === 'alto' ? 1 : c.energia === 'medio' ? 3 : 5;
    return s + v;
  }, 0) / recientes.length;
  return Math.max(1, Math.min(10, Math.round((5 - promedioBalance) * 0.6 + puntuacionEnergia * 0.4)));
}

export function calcularRacha(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  let racha = 1;
  for (let i = 0; i < checkIns.length - 1; i++) {
    const a = new Date(checkIns[i].fecha);
    const b = new Date(checkIns[i + 1].fecha);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    const diff = (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) racha++;
    else break;
  }
  return racha;
}

export function generarInsightIA(checkIns: CheckIn[], nombre: string): string {
  if (checkIns.length === 0) {
    return `¡Bienvenido, ${nombre}! Comienza tu primer check-in para obtener insights personalizados.`;
  }
  const ultimo = checkIns[0];
  const tendencia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
  const promedio = tendencia.reduce((a, b) => a + b, 0) / tendencia.length;
  if (ultimo.energia === 'alto' && promedio >= 2.5) {
    return `¡Excelente racha, ${nombre}! Tu energía ha estado consistentemente alta.`;
  }
  if (ultimo.energia === 'bajo' || promedio < 1.8) {
    return `${nombre}, he notado que tu energía ha estado baja. Considera una pausa de 10 minutos.`;
  }
  return `Tu nivel de enfoque mejoró esta semana, ${nombre}. Mantén la consistencia en tus check-ins.`;
}

export function generarDatosSemana(checkIns: CheckIn[]): { dia: string; energia: number; enfoque: number }[] {
  const dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const hoy = new Date();
  return dias.map((dia, idx) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (6 - idx));
    const fechaStr = fecha.toISOString().split('T')[0];
    const ci = checkIns.find(c => c.fecha.startsWith(fechaStr));
    if (ci) {
      return {
        dia,
        energia: ci.energia === 'alto' ? 85 : ci.energia === 'medio' ? 55 : 25,
        enfoque: Math.round(ci.balanceEmocional * 18),
      };
    }
    return { dia, energia: Math.round(Math.random() * 40 + 30), enfoque: Math.round(Math.random() * 40 + 30) };
  });
}
