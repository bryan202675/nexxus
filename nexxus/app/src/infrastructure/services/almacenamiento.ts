/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/services/almacenamiento.ts
 * Capa: infraestructura.
 * Proposito: Servicio de infraestructura. Encapsula integraciones o calculos cercanos a almacenamiento y plataforma.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importa { storage } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { storage } from '../firebase/firebaseConfig';
// Importa { ref, uploadBytes, getDownloadURL } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Declaracion CLAVE_USUARIO. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const CLAVE_USUARIO = 'nexxus_usuario';
/**
 * Declaracion CLAVE_CHECKINS. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const CLAVE_CHECKINS = 'nexxus_checkins';

/**
 * Define el contrato de datos CheckIn; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface CheckIn {
  id: string;
  fecha: string;
  energia: 'bajo' | 'medio' | 'alto';
  balanceEmocional: number;
  nota?: string;
}

/**
 * Define el contrato de datos PerfilUsuario; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface PerfilUsuario {
  nombre: string;
  rol: 'empleado' | 'jefe' | 'admin';
  departamento: string;
  racha: number;
  ultimoCheckIn?: string;
}

/**
 * Declaracion guardarPerfil. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export async function guardarPerfil(perfil: PerfilUsuario): Promise<void> {
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  await AsyncStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
}

/**
 * Declaracion obtenerPerfil. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export async function obtenerPerfil(): Promise<PerfilUsuario | null> {
  // Declara datos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datos = await AsyncStorage.getItem(CLAVE_USUARIO);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return datos ? JSON.parse(datos) : null;
}

/**
 * Declaracion guardarCheckIn. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export async function guardarCheckIn(checkIn: CheckIn): Promise<void> {
  // Declara existentes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const existentes = await obtenerCheckIns();
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  existentes.unshift(checkIn);
  // Declara limite; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const limite = existentes.slice(0, 30);
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  await AsyncStorage.setItem(CLAVE_CHECKINS, JSON.stringify(limite));
}

/**
 * Declaracion obtenerCheckIns. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export async function obtenerCheckIns(): Promise<CheckIn[]> {
  // Declara datos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datos = await AsyncStorage.getItem(CLAVE_CHECKINS);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return datos ? JSON.parse(datos) : [];
}

/**
 * Declaracion limpiarDatos. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export async function limpiarDatos(): Promise<void> {
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await AsyncStorage.multiRemove([CLAVE_USUARIO, CLAVE_CHECKINS]);
}

// --- Servicios de Almacenamiento en la Nube (Firebase Storage) ---

export async function subirFotoPerfil(userId: string, blob: Blob): Promise<string> {
  // Declara path; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const path = `perfiles/${userId}/foto.jpg`;
  // Declara storageRef; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const storageRef = ref(storage, path);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await uploadBytes(storageRef, blob);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return await getDownloadURL(storageRef);
}

