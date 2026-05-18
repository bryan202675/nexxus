/**
 * Documentacion Nexxus - nexxus/app/src/shared/i18n/config.ts
 * Capa: compartido.
 * Proposito: Configuracion o recurso de internacionalizacion. Mantiene textos y cambio de idioma separados de la UI.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa i18n; permite traducir textos visibles y respetar el idioma activo del usuario.
import i18n from 'i18next';
// Importa { initReactI18next }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { initReactI18next } from 'react-i18next';
// Importa * as Localization desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import * as Localization from 'expo-localization';
// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importa es; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import es from './locales/es.json';
// Importa en; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import en from './locales/en.json';

/**
 * Declaracion LANGUAGE_KEY. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const LANGUAGE_KEY = '@nexxus_language';

/**
 * Declaracion resources. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const resources = {
  en: { translation: en },
  es: { translation: es }
};

/**
 * Declaracion initI18n. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const initI18n = async () => {
  // Declara savedLanguage; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!savedLanguage) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    savedLanguage = 'es';
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    await AsyncStorage.setItem(LANGUAGE_KEY, 'es');
  }

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'es',
      interpolation: {
        escapeValue: false 
      },
      compatibilityJSON: 'v4'
    });
};

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
initI18n();

/**
 * Declaracion changeLanguage. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const changeLanguage = async (lng: string) => {
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  i18n.changeLanguage(lng);
};

export default i18n;
