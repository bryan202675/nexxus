export interface SessionDevice {
  id: string;
  userId: string;
  empresaId: string;
  deviceId: string;
  deviceName: string;
  deviceOs: string;
  appVersion: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface RegisterSessionDeviceInput {
  userId: string;
  empresaId: string;
  deviceId: string;
  deviceName: string;
  deviceOs: string;
  appVersion: string;
}
