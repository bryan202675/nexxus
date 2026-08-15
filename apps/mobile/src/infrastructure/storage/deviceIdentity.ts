import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'nexxus_device_id';

function generarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function obtenerDeviceId(): Promise<string> {
  const existente = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existente) return existente;
  const nuevo = generarId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, nuevo);
  return nuevo;
}

export function obtenerNombreDispositivo(): string {
  if (Platform.OS === 'web') return 'Navegador web';
  return Device.deviceName || Device.modelName || `${Platform.OS} ${Platform.Version}`;
}

export function obtenerSistemaOperativo(): string {
  if (Platform.OS === 'web') return 'Web';
  return `${Device.osName || Platform.OS} ${Device.osVersion || ''}`.trim();
}

export function obtenerVersionApp(): string {
  return Constants.expoConfig?.version || '1.0.0';
}
