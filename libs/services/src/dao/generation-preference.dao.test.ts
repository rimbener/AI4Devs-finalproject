jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  GENERATION_PREFERENCE_STORAGE_KEY,
  GenerationPreferenceDao,
} from './generation-preference.dao';

const store = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('GenerationPreferenceDao', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s20/@s21 — stable device key for last-used provider+model.
  it('persists under a stable, well-known storage key', () => {
    expect(GENERATION_PREFERENCE_STORAGE_KEY).toBe('study-buddy.generation-preference');
  });

  // @s20 — read back the raw JSON blob.
  it('getStoredPreference returns the value stored under the preference key', async () => {
    store.getItem.mockResolvedValue('{"provider":"openai","model":"gpt-5.6-luna"}');

    await expect(GenerationPreferenceDao.getStoredPreference()).resolves.toBe(
      '{"provider":"openai","model":"gpt-5.6-luna"}',
    );
    expect(store.getItem).toHaveBeenCalledWith('study-buddy.generation-preference');
  });

  it('getStoredPreference returns null when nothing is stored', async () => {
    store.getItem.mockResolvedValue(null);

    await expect(GenerationPreferenceDao.getStoredPreference()).resolves.toBeNull();
  });

  // @s20 — write JSON under the well-known key.
  it('setStoredPreference writes the JSON value under the preference key', async () => {
    store.setItem.mockResolvedValue(undefined);

    await GenerationPreferenceDao.setStoredPreference(
      '{"provider":"anthropic","model":"claude-haiku-4-5"}',
    );

    expect(store.setItem).toHaveBeenCalledWith(
      GENERATION_PREFERENCE_STORAGE_KEY,
      '{"provider":"anthropic","model":"claude-haiku-4-5"}',
    );
  });
});
