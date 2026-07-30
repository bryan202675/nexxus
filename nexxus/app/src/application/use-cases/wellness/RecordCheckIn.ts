/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/wellness/RecordCheckIn.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { ICheckInRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
// Importa { IUserRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IUserRepository } from '@/domain/repositories/IUserRepository';
// Importa { CheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn } from '@/domain/entities/CheckIn';
// Importa { CreateCheckInDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { CreateCheckInDTO } from '@/application/dtos/CheckInDTO';

/**
 * Caso de Uso: Registrar Check-In diario de bienestar.
 * Guarda el check-in y actualiza la racha del usuario.
 */
export class RecordCheckIn {
  constructor(
    private readonly checkInRepository: ICheckInRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(userId: string, dto: CreateCheckInDTO): Promise<CheckIn> {
    // Declara usuario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const usuario = await this.userRepository.getById(userId);
    // Declara saved; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const saved = await this.checkInRepository.save(userId, {
      ...dto,
      empresaId: usuario?.empresaId || (usuario as any)?.empresa_id || '',
      usuarioNombre: usuario?.nombre || '',
      departamento: usuario?.departamento || '',
    });

    // Actualizar último check-in en el perfil del usuario
    const prevCheckIns = await this.checkInRepository.getByUser(userId, 30);
    // Declara racha; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const racha = this.calcularRacha(prevCheckIns);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await this.userRepository.update(userId, {
      ultimoCheckIn: saved.fecha,
      racha,
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return saved;
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
}
