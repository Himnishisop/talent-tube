import { createContext, useContext, useEffect, type ReactNode } from "react";
import { translate, type TranslationKey } from "@/lib/i18n";

const englishCopy = { t: (key: TranslationKey) => translate("en", key) };
const LangContext = createContext(englishCopy);

export function LangProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    // Discard the previous locale preference so returning visitors get English too.
    try {
      localStorage.removeItem("tt_lang");
    } catch {
      // The interface stays English when browser storage is unavailable.
    }
  }, []);

  return <LangContext.Provider value={englishCopy}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}