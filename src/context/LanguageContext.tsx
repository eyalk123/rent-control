import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
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

/** Style for TextInput/Searchbar to align placeholder and text correctly in RTL. */
export function useRtlInputStyle() {
  const { isRtl } = useLanguageContext();
  return isRtl
    ? ({ textAlign: 'right' as const, writingDirection: 'rtl' as const })
    : {};
}

/** Prepends Unicode RTL mark to placeholder text when in RTL, forcing correct direction. */
export function useRtlPlaceholder(text: string): string {
  const { isRtl } = useLanguageContext();
  return isRtl && text ? '\u200F' + text : text;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );
  const isRtl = isRtlLanguage(language);

  useEffect(() => {
    loadSavedLanguage().then((lang) => {
      setLanguageState(lang);
    });
    const handler = () =>
      setLanguageState((i18n.language as SupportedLanguage) || 'en');
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    await setI18nLanguage(lang);
    setLanguageState(lang);
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
