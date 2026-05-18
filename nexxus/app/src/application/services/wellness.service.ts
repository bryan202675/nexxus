/**
 * Documentacion Nexxus - nexxus/app/src/application/services/wellness.service.ts
 * Capa: aplicacion.
 * Proposito: Servicio de aplicacion. Agrupa reglas reutilizables que no pertenecen a una pantalla especifica.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

/**
 * Servicio de aplicación de Bienestar.
 * Contiene lógica pura de cálculo que NO depende de Firebase.
 * (Migrado y limpiado desde infrastructure/services/logicaBienestar.ts)
 */
// Importa { CheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn } from '@/domain/entities/CheckIn';

/**
 * Declaracion calcularNivelEstres. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function calcularNivelEstres(checkIns: CheckIn[]): number {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) return 3;
  // Declara recientes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const recientes = checkIns.slice(0, 5);
  // Calcula promedioBalance; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const promedioBalance = recientes.reduce((s, c) => s + c.balanceEmocional, 0) / recientes.length;
  // Calcula puntuacionEnergia; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const puntuacionEnergia = recientes.reduce((s, c) => {
    // Declara v; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const v = c.energia === 'alto' ? 1 : c.energia === 'medio' ? 3 : 5;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return s + v;
  }, 0) / recientes.length;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Math.max(1, Math.min(10, Math.round((5 - promedioBalance) * 0.6 + puntuacionEnergia * 0.4)));
}

/**
 * Declaracion calcularRacha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function calcularRacha(checkIns: CheckIn[]): number {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) return 0;
  // Declara racha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let racha = 1;
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < checkIns.length - 1; i++) {
    // Calcula a; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const a = new Date(checkIns[i].fecha);
    // Calcula b; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const b = new Date(checkIns[i + 1].fecha);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    a.setHours(0, 0, 0, 0);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    b.setHours(0, 0, 0, 0);
    // Declara diff; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const diff = (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (diff === 1) racha++;
    else break;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return racha;
}

/**
 * Declaracion generarInsightIA. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export function generarInsightIA(checkIns: CheckIn[], nombre: string): string {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (checkIns.length === 0) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `¡Bienvenido, ${nombre}! Comienza tu primer check-in para obtener insights personalizados.`;
  }
  // Declara ultimo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ultimo = checkIns[0];
  // Calcula tendencia; transforma la lista original en datos listos para renderizar o guardar.
  const tendencia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
  // Calcula promedio; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const promedio = tendencia.reduce((a, b) => a + b, 0) / tendencia.length;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (ultimo.energia === 'alto' && promedio >= 2.5) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `¡Excelente racha, ${nombre}! Tu energía ha estado consistentemente alta.`;
  }
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (ultimo.energia === 'bajo' || promedio < 1.8) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `${nombre}, he notado que tu energía ha estado baja. Considera una pausa de 10 minutos.`;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return `Tu nivel de enfoque mejoró esta semana, ${nombre}. Mantén la consistencia en tus check-ins.`;
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
    // Declara ci; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ci = checkIns.find(c => c.fecha.startsWith(fechaStr));
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (ci) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return {
        dia,
        energia: ci.energia === 'alto' ? 85 : ci.energia === 'medio' ? 55 : 25,
        enfoque: Math.round(ci.balanceEmocional * 18),
      };
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { dia, energia: Math.round(Math.random() * 40 + 30), enfoque: Math.round(Math.random() * 40 + 30) };
  });
}
