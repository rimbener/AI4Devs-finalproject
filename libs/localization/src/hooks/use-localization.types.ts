import type { Locale } from '@helsoft/types';

export type TranslateOptions = Record<string, unknown>;

export type UseLocalizationResult = {
  t: (key: string, options?: TranslateOptions) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  supportedLocales: readonly Locale[];
};
