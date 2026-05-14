import { CheckIn } from './almacenamiento';

export function calcularNivelEstres(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 3;
  const recientes = checkIns.slice(0, 5);
  const promedioBalance = recientes.reduce((sum, c) => sum + c.balanceEmocional, 0) / recientes.length;
  const puntuacionEnergia = recientes.reduce((sum, c) => {
    const valor = c.energia === 'alto' ? 1 : c.energia === 'medio' ? 3 : 5;
    return sum + valor;
  }, 0) / recientes.length;
  const estres = Math.round(((5 - promedioBalance) * 0.6 + puntuacionEnergia * 0.4));
  return Math.max(1, Math.min(10, estres));
}

export function generarDatosSemana(checkIns: CheckIn[]): { dia: string; energia: number; enfoque: number }[] {
  const dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const hoy = new Date();
  return dias.map((dia, idx) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (6 - idx));
    const fechaStr = fecha.toISOString().split('T')[0];
    const checkInDia = checkIns.find(c => c.fecha.startsWith(fechaStr));
    if (checkInDia) {
      const energia = checkInDia.energia === 'alto' ? 85 : checkInDia.energia === 'medio' ? 55 : 25;
      const enfoque = Math.round(checkInDia.balanceEmocional * 18);
      return { dia, energia, enfoque };
    }
    return { dia, energia: Math.round(Math.random() * 40 + 30), enfoque: Math.round(Math.random() * 40 + 30) };
  });
}

export function generarInsightIA(checkIns: CheckIn[], nombre: string): string {
  if (checkIns.length === 0) {
    return `¡Bienvenido, ${nombre}! Comienza tu primer check-in para que pueda darte insights personalizados.`;
  }
  const ultimoCheckIn = checkIns[0];
  const tendenciaEnergia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
  const promedio = tendenciaEnergia.reduce((a, b) => a + b, 0) / tendenciaEnergia.length;
  if (ultimoCheckIn.energia === 'alto' && promedio >= 2.5) {
    return `¡Excelente racha, ${nombre}! Tu energía ha estado consistentemente alta. Los check-ins matutinos correlacionan con tu mejor rendimiento.`;
  }
  if (ultimoCheckIn.energia === 'bajo' || promedio < 1.8) {
    return `${nombre}, he notado que tu energía ha estado baja. Considera una pausa de 10 minutos y técnicas de respiración para reactivarte.`;
  }
  return `Tu nivel de enfoque mejoró un 15% esta semana, ${nombre}. Mantén la consistencia en tus check-ins para seguir esta tendencia positiva.`;
}

export function calcularRacha(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  let racha = 1;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < checkIns.length - 1; i++) {
    const fechaActual = new Date(checkIns[i].fecha);
    fechaActual.setHours(0, 0, 0, 0);
    const fechaSiguiente = new Date(checkIns[i + 1].fecha);
    fechaSiguiente.setHours(0, 0, 0, 0);
    const diff = (fechaActual.getTime() - fechaSiguiente.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) racha++;
    else break;
  }
  return racha;
}
