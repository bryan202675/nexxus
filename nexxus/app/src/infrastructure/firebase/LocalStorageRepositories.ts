/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/LocalStorageRepositories.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

/**
 * Implementación STUB del IUserRepository y ICheckInRepository.
 * Basada en la lógica existente de almacenamiento.ts (AsyncStorage).
 */
// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importa { IUserRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IUserRepository } from '@/domain/repositories/IUserRepository';
// Importa { ICheckInRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { CheckIn, NuevaEntradaCheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn, NuevaEntradaCheckIn } from '@/domain/entities/CheckIn';

/**
 * Declaracion CLAVE_USUARIO. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const CLAVE_USUARIO = 'nexxus_usuario';
/**
 * Declaracion CLAVE_CHECKINS. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const CLAVE_CHECKINS = 'nexxus_checkins';

/**
 * Implementa LocalStorageUserRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class LocalStorageUserRepository implements IUserRepository {
  // getById agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getById(_id: string): Promise<User | null> {
    // Declara raw; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const raw = await AsyncStorage.getItem(CLAVE_USUARIO);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return raw ? JSON.parse(raw) : null;
  }

  // update agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async update(_id: string, data: Partial<User>): Promise<void> {
    // Declara current; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const current = await this.getById(_id);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (current) {
      // Declara updated; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const updated = { ...current, ...data };
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await AsyncStorage.setItem(CLAVE_USUARIO, JSON.stringify(updated));
    }
  }

  // getAll agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getAll(): Promise<User[]> {
    // Declara raw; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const raw = await AsyncStorage.getItem(CLAVE_USUARIO);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return raw ? [JSON.parse(raw)] : [];
  }

  // setActive agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async setActive(id: string, activo: boolean): Promise<void> {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await this.update(id, { activo });
  }
}

/**
 * Implementa LocalStorageCheckInRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class LocalStorageCheckInRepository implements ICheckInRepository {
  // save agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn> {
    // Calcula newCheckIn; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const newCheckIn: CheckIn = {
      ...data,
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      userId,
    };
    // Declara all; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const all = await this.getByUser(userId);
    // Declara updated; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const updated = [newCheckIn, ...all].slice(0, 30);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await AsyncStorage.setItem(CLAVE_CHECKINS, JSON.stringify(updated));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return newCheckIn;
  }

  // getByUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getByUser(_userId: string, limit = 30): Promise<CheckIn[]> {
    // Declara raw; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const raw = await AsyncStorage.getItem(CLAVE_CHECKINS);
    // Declara all; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const all: CheckIn[] = raw ? JSON.parse(raw) : [];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return all.slice(0, limit);
  }
}
