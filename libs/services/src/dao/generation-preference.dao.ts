import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for the persisted last-used provider+model (localStorage on web, native store on iOS/Android). */
export const GENERATION_PREFERENCE_STORAGE_KEY = 'study-buddy.generation-preference';

/**
 * Raw persistence for the last-used generation provider+model. Platform-store (non-Supabase) DAO:
 * reads/writes a JSON string via AsyncStorage. No validation, no React — a storage failure surfaces
 * as a rejected promise for the service to handle.
 */
export abstract class GenerationPreferenceDao {
  static getStoredPreference(): Promise<string | null> {
    return AsyncStorage.getItem(GENERATION_PREFERENCE_STORAGE_KEY);
  }

  static async setStoredPreference(value: string): Promise<void> {
    await AsyncStorage.setItem(GENERATION_PREFERENCE_STORAGE_KEY, value);
  }
}
