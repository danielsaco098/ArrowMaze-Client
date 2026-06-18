import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Language, TranslationKey, TranslationParams, translate } from './translations';

interface I18nApi {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
  readonly toggleLanguage: () => void;
  readonly t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nApi | null>(null);

export function I18nProvider({
  initialLanguage = 'en',
  children,
}: {
  initialLanguage?: Language;
  children: React.ReactNode;
}): React.JSX.Element {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'en' ? 'es' : 'en'));
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, toggleLanguage, t],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nApi {
  const api = useContext(I18nContext);
  if (!api) {
    throw new Error('useTranslation must be used within an I18nProvider.');
  }
  return api;
}
