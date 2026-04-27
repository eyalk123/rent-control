import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

const LANGUAGE_STORAGE_KEY = 'app_language';

const SUPPORTED_LANGS = ['en', 'he'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGS)[number];

const en = require('./locales/en.json');
const he = require('./locales/he.json');

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
  }
  const lang = (stored === 'he' || stored === 'en' ? stored : i18n.language) as SupportedLanguage;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(lang === 'he');
  return lang;
}

export async function setLanguage(lang: SupportedLanguage) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(lang === 'he');
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export function isRtlLanguage(lang: string): boolean {
  return lang === 'he';
}

export async function restartAppForRTL(): Promise<void> {
  try {
    const Updates = await import('expo-updates');
    if (Updates.reloadAsync) await Updates.reloadAsync();
  } catch {
    // In dev/preview, reloadAsync may be unavailable; user must restart manually
  }
}
