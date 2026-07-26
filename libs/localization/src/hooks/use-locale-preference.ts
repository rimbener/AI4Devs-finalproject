import { LocalePreferenceService } from '@helsoft/services';
import type { Locale } from '@helsoft/types';
import { useCallback } from 'react';

/**
 * React wrapper around LocalePreferenceService — providers/components with effects
 * must not call the service directly (hooks-service-dao.mdc). Exempt from `useQuery`/
 * `useMutation` — see `.agents/rules/tanstack-query.mdc`'s Exemptions section: these are thin
 * imperative AsyncStorage getters/setters called from effects, with no observable loading/error
 * state to model.
 */
export const useLocalePreference = () => {
  const getStoredLocale = useCallback(() => LocalePreferenceService.getStoredLocale(), []);
  const setStoredLocale = useCallback(
    (locale: Locale) => LocalePreferenceService.setStoredLocale(locale),
    [],
  );

  return { getStoredLocale, setStoredLocale };
};
