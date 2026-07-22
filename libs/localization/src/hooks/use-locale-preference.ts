import { LocalePreferenceService } from '@helsoft/services';
import type { Locale } from '@helsoft/types';
import { useCallback } from 'react';

/**
 * React wrapper around LocalePreferenceService — providers/components with effects
 * must not call the service directly (hooks-service-dao.mdc).
 */
export const useLocalePreference = () => {
  const getStoredLocale = useCallback(() => LocalePreferenceService.getStoredLocale(), []);
  const setStoredLocale = useCallback(
    (locale: Locale) => LocalePreferenceService.setStoredLocale(locale),
    [],
  );

  return { getStoredLocale, setStoredLocale };
};
