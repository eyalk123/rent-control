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

/**
 * Reload the JS bundle so `I18nManager.forceRTL` above actually takes effect — native views
 * (the navigation header, most notably) read the direction at startup and ignore it until then.
 *
 * Returns whether the reload was started. It can fail: `expo.modules.updates.ENABLED` is false
 * in the Android manifest and there is no `updates` config, so `reloadAsync` is unavailable in
 * some builds. Callers must handle `false` by telling the user to restart manually — swallowing
 * it silently leaves them tapping a button that does nothing.
 */
export async function restartAppForRTL(): Promise<boolean> {
  // Don't reload automatically in a dev client. Reloading there intermittently leaves the app
  // on a redbox — "[runtime not ready]: Cannot read property 'EventEmitter' of undefined",
  // with "reactInstance is null. Dropping work." in logcat — and it needs a force-stop to
  // recover. Both Updates.reloadAsync() and DevSettings.reload() hit it, so it is the dev
  // client's reload machinery rather than either API, and it is not worth risking a wedged
  // app to save a developer one manual restart. Returning false makes the caller show the
  // "please restart the app" message instead. Release builds have no DevLauncher and take the
  // reloadAsync path below.
  if (__DEV__) return false;
  try {
    const Updates = await import('expo-updates');
    if (!Updates.reloadAsync) return false;
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
