import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CLAVE_USUARIO = 'nexxus_usuario';
const CLAVE_CHECKINS = 'nexxus_checkins';

export interface CheckIn {
  id: string;
  fecha: string;
  energia: 'bajo' | 'medio' | 'alto';
  balanceEmocional: number;
  nota?: string;
}

export interface PerfilUsuario {
  nombre: string;
  rol: 'empleado' | 'jefe' | 'admin';
  departamento: string;
  racha: number;
  ultimoCheckIn?: string;
}

export async function guardarPerfil(perfil: PerfilUsuario): Promise<void> {
  await AsyncStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
}

export async function obtenerPerfil(): Promise<PerfilUsuario | null> {
  const datos = await AsyncStorage.getItem(CLAVE_USUARIO);
  return datos ? JSON.parse(datos) : null;
}

export async function guardarCheckIn(checkIn: CheckIn): Promise<void> {
  const existentes = await obtenerCheckIns();
  existentes.unshift(checkIn);
  const limite = existentes.slice(0, 30);
  await AsyncStorage.setItem(CLAVE_CHECKINS, JSON.stringify(limite));
}

export async function obtenerCheckIns(): Promise<CheckIn[]> {
  const datos = await AsyncStorage.getItem(CLAVE_CHECKINS);
  return datos ? JSON.parse(datos) : [];
}

export async function limpiarDatos(): Promise<void> {
  await AsyncStorage.multiRemove([CLAVE_USUARIO, CLAVE_CHECKINS]);
}

// --- Servicios de Almacenamiento en la Nube (Firebase Storage) ---

export async function subirFotoPerfil(userId: string, blob: Blob): Promise<string> {
  const path = `perfiles/${userId}/foto.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

