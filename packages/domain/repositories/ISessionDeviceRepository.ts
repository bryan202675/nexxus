import { RegisterSessionDeviceInput, SessionDevice } from '../entities/SessionDevice';

export interface ISessionDeviceRepository {
  getByUser(userId: string): Promise<SessionDevice[]>;
  subscribeByUser(userId: string, callback: (devices: SessionDevice[]) => void): () => void;
  register(input: RegisterSessionDeviceInput): Promise<void>;
  remove(deviceRowId: string): Promise<void>;
  removeAllExcept(userId: string, deviceId: string): Promise<void>;
}
