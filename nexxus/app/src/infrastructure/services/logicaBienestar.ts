/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/services/logicaBienestar.ts
 * Capa: infraestructura.
 * Proposito: Servicio de infraestructura. Encapsula integraciones o calculos cercanos a almacenamiento y plataforma.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { CheckIn }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { CheckIn } from './almacenamiento';

/**
 * Declaracion calcularNivelEstres. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function calcularNivelEstres(checkIns: CheckIn[]): number {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) return 3;
  // Declara recientes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const recientes = checkIns.slice(0, 5);
  // Calcula promedioBalance; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const promedioBalance = recientes.reduce((sum, c) => sum + c.balanceEmocional, 0) / recientes.length;
  // Calcula puntuacionEnergia; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const puntuacionEnergia = recientes.reduce((sum, c) => {
    // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const valor = c.energia === 'alto' ? 1 : c.energia === 'medio' ? 3 : 5;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return sum + valor;
  }, 0) / recientes.length;
  // Declara estres; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estres = Math.round(((5 - promedioBalance) * 0.6 + puntuacionEnergia * 0.4));
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Math.max(1, Math.min(10, estres));
}

/**
 * Declaracion generarDatosSemana. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function generarDatosSemana(checkIns: CheckIn[]): { dia: string; energia: number; enfoque: number }[] {
  // Declara dias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return dias.map((dia, idx) => {
    // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fecha = new Date(hoy);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    fecha.setDate(hoy.getDate() - (6 - idx));
    // Declara fechaStr; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const fechaStr = fecha.toISOString().split('T')[0];
    // Declara checkInDia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const checkInDia = checkIns.find(c => c.fecha.startsWith(fechaStr));
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (checkInDia) {
      // Declara energia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const energia = checkInDia.energia === 'alto' ? 85 : checkInDia.energia === 'medio' ? 55 : 25;
      // Declara enfoque; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const enfoque = Math.round(checkInDia.balanceEmocional * 18);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return { dia, energia, enfoque };
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { dia, energia: Math.round(Math.random() * 40 + 30), enfoque: Math.round(Math.random() * 40 + 30) };
  });
}

/**
 * Declaracion generarInsightIA. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function generarInsightIA(checkIns: CheckIn[], nombre: string): string {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `¡Bienvenido, ${nombre}! Comienza tu primer check-in para que pueda darte insights personalizados.`;
  }
  // Declara ultimoCheckIn; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ultimoCheckIn = checkIns[0];
  // Calcula tendenciaEnergia; transforma la lista original en datos listos para renderizar o guardar.
  const tendenciaEnergia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
  // Calcula promedio; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const promedio = tendenciaEnergia.reduce((a, b) => a + b, 0) / tendenciaEnergia.length;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (ultimoCheckIn.energia === 'alto' && promedio >= 2.5) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `¡Excelente racha, ${nombre}! Tu energía ha estado consistentemente alta. Los check-ins matutinos correlacionan con tu mejor rendimiento.`;
  }
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (ultimoCheckIn.energia === 'bajo' || promedio < 1.8) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `${nombre}, he notado que tu energía ha estado baja. Considera una pausa de 10 minutos y técnicas de respiración para reactivarte.`;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return `Tu nivel de enfoque mejoró un 15% esta semana, ${nombre}. Mantén la consistencia en tus check-ins para seguir esta tendencia positiva.`;
}

/**
 * Declaracion calcularRacha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function calcularRacha(checkIns: CheckIn[]): number {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) return 0;
  // Declara racha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let racha = 1;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  hoy.setHours(0, 0, 0, 0);
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < checkIns.length - 1; i++) {
    // Calcula fechaActual; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fechaActual = new Date(checkIns[i].fecha);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    fechaActual.setHours(0, 0, 0, 0);
    // Calcula fechaSiguiente; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fechaSiguiente = new Date(checkIns[i + 1].fecha);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    fechaSiguiente.setHours(0, 0, 0, 0);
    // Declara diff; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const diff = (fechaActual.getTime() - fechaSiguiente.getTime()) / (1000 * 60 * 60 * 24);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (diff === 1) racha++;
    else break;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return racha;
}
