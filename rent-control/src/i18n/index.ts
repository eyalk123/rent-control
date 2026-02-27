import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'app_language';

const SUPPORTED_LANGS = ['en', 'he'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGS)[number];

const en = require('../locales/en.json');
const he = require('../locales/he.json');

const resources = {
  en: { translation: en },
  he: { translation: he },
};

function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  const primary = locales[0]?.languageCode ?? 'en';
  if (primary === 'he') return 'he';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'he'],
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export async function loadSavedLanguage() {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'he' || stored === 'en') {
    await i18n.changeLanguage(stored);
    return stored;
  }
  return i18n.language as SupportedLanguage;
}

export async function setLanguage(lang: SupportedLanguage) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function isRtlLanguage(lang: string): boolean {
  return lang === 'he';
}
