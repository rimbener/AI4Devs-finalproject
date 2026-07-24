import { GenerationPreferenceDao } from '../dao/generation-preference.dao';
import type { GenerationPreference } from './generation-preference.types';

const parseStoredPreference = (stored: string): GenerationPreference | null => {
  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'provider' in parsed &&
      'model' in parsed &&
      typeof (parsed as GenerationPreference).provider === 'string' &&
      typeof (parsed as GenerationPreference).model === 'string'
    ) {
      return {
        provider: (parsed as GenerationPreference).provider,
        model: (parsed as GenerationPreference).model,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Business logic over GenerationPreferenceDao: parses JSON and shields callers from storage failures.
 *
 * - `getStoredPreference` never throws: absent/corrupt/unparseable → `null`.
 * - `setStoredPreference` persists `{ provider, model }` as JSON.
 * - Validating the preference against saved keys + curated models lives in the generate wiring (task-14).
 */
export abstract class GenerationPreferenceService {
  static async getStoredPreference(): Promise<GenerationPreference | null> {
    try {
      const stored = await GenerationPreferenceDao.getStoredPreference();
      if (stored === null) return null;
      return parseStoredPreference(stored);
    } catch {
      return null;
    }
  }

  static setStoredPreference(preference: GenerationPreference): Promise<void> {
    return GenerationPreferenceDao.setStoredPreference(JSON.stringify(preference));
  }
}
