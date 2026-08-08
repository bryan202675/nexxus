import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateAdminProtectedString, useAdminProtectedTerms } from './AdminTranslatedText';

/**
 * Hook useApiTranslate.
 * Traduce un texto en español de manera dinámica usando la API de traducción según el idioma activo.
 */
export function useApiTranslate(sourceText: string): string {
  const { i18n } = useTranslation();
  const protectedTerms = useAdminProtectedTerms();
  const [translatedText, setTranslatedText] = useState(sourceText);

  useEffect(() => {
    let active = true;

    const performTranslation = async () => {
      if (!sourceText || !sourceText.trim()) {
        if (active) setTranslatedText('');
        return;
      }
      const res = await translateAdminProtectedString(sourceText, i18n.language, protectedTerms);
      if (active) {
        setTranslatedText(res);
      }
    };

    performTranslation();

    return () => {
      active = false;
    };
  }, [sourceText, i18n.language, protectedTerms]);

  return translatedText;
}
