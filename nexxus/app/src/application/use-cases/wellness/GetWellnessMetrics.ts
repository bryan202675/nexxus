/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/wellness/GetWellnessMetrics.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { ICheckInRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
// Importa { WellnessMetricsDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { WellnessMetricsDTO } from '@/application/dtos/CheckInDTO';
// Importa { CheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn } from '@/domain/entities/CheckIn';

/**
 * Caso de Uso: Obtener métricas de bienestar calculadas para la UI.
 * Extrae la lógica pura de logicaBienestar.ts al dominio de aplicación.
 */
export class GetWellnessMetrics {
  constructor(private readonly checkInRepository: ICheckInRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(userId: string, nombre: string): Promise<WellnessMetricsDTO> {
    // Declara checkIns; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const checkIns = await this.checkInRepository.getByUser(userId, 30);

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      promedioBienestar: this.calcularPromedioBienestar(checkIns),
      racha: this.calcularRacha(checkIns),
      insightIA: this.generarInsightIA(checkIns, nombre),
      datosSemana: this.generarDatosSemana(checkIns),
      recentCheckIns: checkIns,
    };
  }

  // calcularPromedioBienestar ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  private calcularPromedioBienestar(checkIns: CheckIn[]): number {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (checkIns.length === 0) return 0;
    // Declara recientes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const recientes = checkIns.slice(0, 7);
    // Calcula suma; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const suma = recientes.reduce((acc, c) => {
      // Declara valorEnergia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const valorEnergia = c.energia === 'alto' ? 100 : c.energia === 'medio' ? 60 : 30;
      // Declara valorBalance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const valorBalance = c.balanceEmocional * 20; // 1-5 -> 20-100
      // Declara valorSueno; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const valorSueno = (c.calidadSueno || 3) * 20;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc + (valorEnergia + valorBalance + valorSueno) / 3;
    }, 0);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Math.round(suma / recientes.length);
  }

  // calcularRacha ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  private calcularRacha(checkIns: CheckIn[]): number {
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

  // generarInsightIA ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  private generarInsightIA(checkIns: CheckIn[], nombre: string): string {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (checkIns.length === 0) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return 'miPulso.insight_welcome';
    }
    // Declara ultimo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ultimo = checkIns[0];
    // Calcula tendencia; transforma la lista original en datos listos para renderizar o guardar.
    const tendencia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
    // Calcula promedio; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const promedio = tendencia.reduce((a, b) => a + b, 0) / tendencia.length;
    
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (ultimo.nivelEstres === 'alto' || ultimo.nivelEstres === 'critico') {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return 'miPulso.insight_stress';
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (ultimo.calidadSueno < 3) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return 'miPulso.insight_sleep';
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (ultimo.energia === 'alto' && promedio >= 2.5) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return 'miPulso.insight_energy';
    }
    
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return 'miPulso.insight_default';
  }

  // generarDatosSemana ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  private generarDatosSemana(checkIns: CheckIn[]): { dia: string; energia: number; estres: number; sueno: number }[] {
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
          energia: ci.energia === 'alto' ? 90 : ci.energia === 'medio' ? 60 : 30,
          estres: ci.estres * 20,
          sueno: (ci.calidadSueno || 3) * 20,
        };
      }
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return { dia, energia: 0, estres: 0, sueno: 0 };
    });
  }
}
