import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
import { WellnessMetricsDTO } from '@/application/dtos/CheckInDTO';
import { CheckIn } from '@/domain/entities/CheckIn';

/**
 * Caso de Uso: Obtener métricas de bienestar calculadas para la UI.
 * Extrae la lógica pura de logicaBienestar.ts al dominio de aplicación.
 */
export class GetWellnessMetrics {
  constructor(private readonly checkInRepository: ICheckInRepository) {}

  async execute(userId: string, nombre: string): Promise<WellnessMetricsDTO> {
    const checkIns = await this.checkInRepository.getByUser(userId, 30);

    return {
      promedioBienestar: this.calcularPromedioBienestar(checkIns),
      racha: this.calcularRacha(checkIns),
      insightIA: this.generarInsightIA(checkIns, nombre),
      datosSemana: this.generarDatosSemana(checkIns),
      recentCheckIns: checkIns,
    };
  }

  private calcularPromedioBienestar(checkIns: CheckIn[]): number {
    if (checkIns.length === 0) return 0;
    const recientes = checkIns.slice(0, 7);
    const suma = recientes.reduce((acc, c) => {
      const valorEnergia = c.energia === 'alto' ? 100 : c.energia === 'medio' ? 60 : 30;
      const valorBalance = c.balanceEmocional * 20; // 1-5 -> 20-100
      const valorSueno = (c.calidadSueno || 3) * 20;
      return acc + (valorEnergia + valorBalance + valorSueno) / 3;
    }, 0);
    return Math.round(suma / recientes.length);
  }

  private calcularRacha(checkIns: CheckIn[]): number {
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

  private generarInsightIA(checkIns: CheckIn[], nombre: string): string {
    if (checkIns.length === 0) {
      return 'miPulso.insight_welcome';
    }
    const ultimo = checkIns[0];
    const tendencia = checkIns.slice(0, 3).map(c => c.energia === 'alto' ? 3 : c.energia === 'medio' ? 2 : 1);
    const promedio = tendencia.reduce((a, b) => a + b, 0) / tendencia.length;
    
    if (ultimo.nivelEstres === 'alto' || ultimo.nivelEstres === 'critico') {
      return 'miPulso.insight_stress';
    }

    if (ultimo.calidadSueno < 3) {
      return 'miPulso.insight_sleep';
    }

    if (ultimo.energia === 'alto' && promedio >= 2.5) {
      return 'miPulso.insight_energy';
    }
    
    return 'miPulso.insight_default';
  }

  private generarDatosSemana(checkIns: CheckIn[]): { dia: string; energia: number; estres: number; sueno: number }[] {
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
          energia: ci.energia === 'alto' ? 90 : ci.energia === 'medio' ? 60 : 30,
          estres: ci.estres * 20,
          sueno: (ci.calidadSueno || 3) * 20,
        };
      }
      return { dia, energia: 0, estres: 0, sueno: 0 };
    });
  }
}
