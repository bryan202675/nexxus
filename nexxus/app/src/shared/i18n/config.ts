import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@nexxus_language';

const resources = {
  en: { translation: en },
  es: { translation: es }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLanguage) {
    savedLanguage = 'es';
    await AsyncStorage.setItem(LANGUAGE_KEY, 'es');
  }

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

initI18n();

export const changeLanguage = async (lng: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  i18n.changeLanguage(lng);
};

export default i18n;
