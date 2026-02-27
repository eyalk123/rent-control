import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert, I18nManager } from 'react-native';
import i18n from 'i18next';
import {
  setLanguage as setI18nLanguage,
  loadSavedLanguage,
  isRtlLanguage,
} from '@/src/i18n';
import type { SupportedLanguage } from '@/src/i18n';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );
  const [isRtl, setIsRtl] = useState(I18nManager.isRTL);

  useEffect(() => {
    loadSavedLanguage().then((lang) => {
      setLanguageState(lang);
      setIsRtl(isRtlLanguage(lang));
    });
    const handler = () =>
      setLanguageState((i18n.language as SupportedLanguage) || 'en');
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    const willBeRtl = isRtlLanguage(lang);
    const currentlyRtl = I18nManager.isRTL;

    if (willBeRtl !== currentlyRtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(willBeRtl);
      await setI18nLanguage(lang);
      setLanguageState(lang);
      setIsRtl(willBeRtl);
      Alert.alert(
        i18n.t('restart.title'),
        i18n.t('restart.message'),
        [{ text: 'OK' }]
      );
    } else {
      await setI18nLanguage(lang);
      setLanguageState(lang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return ctx;
}
