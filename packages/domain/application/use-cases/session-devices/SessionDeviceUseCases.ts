import { RegisterSessionDeviceInput, SessionDevice } from '../../../entities/SessionDevice';
import { ISessionDeviceRepository } from '../../../repositories/ISessionDeviceRepository';

export class GetSessionDevices {
  constructor(private repo: ISessionDeviceRepository) {}
  execute(userId: string): Promise<SessionDevice[]> {
    return this.repo.getByUser(userId);
  }
}

export class SubscribeSessionDevices {
  constructor(private repo: ISessionDeviceRepository) {}
  execute(userId: string, callback: (devices: SessionDevice[]) => void): () => void {
    return this.repo.subscribeByUser(userId, callback);
  }
}

export class RegisterSessionDevice {
  constructor(private repo: ISessionDeviceRepository) {}
  execute(input: RegisterSessionDeviceInput): Promise<void> {
    return this.repo.register(input);
  }
}

export class RemoveSessionDevice {
  constructor(private repo: ISessionDeviceRepository) {}
  execute(deviceRowId: string): Promise<void> {
    return this.repo.remove(deviceRowId);
  }
}

export class RemoveOtherSessionDevices {
  constructor(private repo: ISessionDeviceRepository) {}
  execute(userId: string, deviceId: string): Promise<void> {
    return this.repo.removeAllExcept(userId, deviceId);
  }
}
