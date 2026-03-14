import type { SupportedLanguage } from "@/src/i18n";
import {
    isRtlLanguage,
    loadSavedLanguage,
    setLanguage as setI18nLanguage,
} from "@/src/i18n";
import { spacing } from "@/src/theme";
import i18n from "i18next";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import type { TextStyle, ViewStyle } from "react-native";

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isRtl: boolean;
}

/** Style for TextInput/Searchbar to align placeholder and text correctly in RTL. */
export function useRtlInputStyle() {
  const { isRtl } = useLanguageContext();

  // We remove `writingDirection: 'rtl'` because it causes the native Android
  // TextInput to swallow vertical pan gestures in a ScrollView.
  // `textAlign: 'right'` is sufficient for RTL visual alignment.
  return isRtl ? { textAlign: "right" as const } : {};
}

/** Prepends Unicode RTL mark to placeholder text when in RTL, forcing correct direction. */
export function useRtlPlaceholder() {
  const { isRtl } = useLanguageContext();
  return (text: string): string => (isRtl && text ? "\u200F" + text : text);
}

/** Text styles for field labels so they align correctly in RTL/LTR. */
export function useRtlLabelStyle(): TextStyle {
  const { isRtl } = useLanguageContext();
  return {
    // In a flex column with direction: 'rtl', 'flex-start' aligns to the right edge.
    alignSelf: "flex-start",
    textAlign: isRtl ? "right" : "left",
    writingDirection: isRtl ? "rtl" : "ltr",
  };
}

/** Styles for section headers on form screens so RTL/Hebrew titles align correctly and don't get cut off. */
export function useSectionHeaderStyle(): {
  containerStyle: ViewStyle;
  textStyle: TextStyle;
} {
  const { isRtl } = useLanguageContext();
  return {
    containerStyle: {
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    textStyle: {
      textAlign: isRtl ? "right" : "left",
      writingDirection: isRtl ? "rtl" : "ltr",
    },
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || "en",
  );
  const isRtl = isRtlLanguage(language);

  useEffect(() => {
    loadSavedLanguage().then((lang) => {
      setLanguageState(lang);
    });
    const handler = () =>
      setLanguageState((i18n.language as SupportedLanguage) || "en");
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
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
    throw new Error("useLanguageContext must be used within LanguageProvider");
  }
  return ctx;
}
