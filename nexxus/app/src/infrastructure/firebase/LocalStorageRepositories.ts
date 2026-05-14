/**
 * Implementación STUB del IUserRepository y ICheckInRepository.
 * Basada en la lógica existente de almacenamiento.ts (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
import { User } from '@/domain/entities/User';
import { CheckIn, NuevaEntradaCheckIn } from '@/domain/entities/CheckIn';

const CLAVE_USUARIO = 'nexxus_usuario';
const CLAVE_CHECKINS = 'nexxus_checkins';

export class LocalStorageUserRepository implements IUserRepository {
  async getById(_id: string): Promise<User | null> {
    const raw = await AsyncStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  }

  async update(_id: string, data: Partial<User>): Promise<void> {
    const current = await this.getById(_id);
    if (current) {
      const updated = { ...current, ...data };
      await AsyncStorage.setItem(CLAVE_USUARIO, JSON.stringify(updated));
    }
  }

  async getAll(): Promise<User[]> {
    const raw = await AsyncStorage.getItem(CLAVE_USUARIO);
    return raw ? [JSON.parse(raw)] : [];
  }

  async setActive(id: string, activo: boolean): Promise<void> {
    await this.update(id, { activo });
  }
}

export class LocalStorageCheckInRepository implements ICheckInRepository {
  async save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn> {
    const newCheckIn: CheckIn = {
      ...data,
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      userId,
    };
    const all = await this.getByUser(userId);
    const updated = [newCheckIn, ...all].slice(0, 30);
    await AsyncStorage.setItem(CLAVE_CHECKINS, JSON.stringify(updated));
    return newCheckIn;
  }

  async getByUser(_userId: string, limit = 30): Promise<CheckIn[]> {
    const raw = await AsyncStorage.getItem(CLAVE_CHECKINS);
    const all: CheckIn[] = raw ? JSON.parse(raw) : [];
    return all.slice(0, limit);
  }
}
