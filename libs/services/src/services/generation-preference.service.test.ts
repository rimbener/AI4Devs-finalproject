jest.mock('../dao/generation-preference.dao', () => ({
  GenerationPreferenceDao: {
    getStoredPreference: jest.fn(),
    setStoredPreference: jest.fn(),
  },
}));

import { GenerationPreferenceDao } from '../dao/generation-preference.dao';
import { GenerationPreferenceService } from './generation-preference.service';

const dao = GenerationPreferenceDao as jest.Mocked<typeof GenerationPreferenceDao>;

describe('GenerationPreferenceService', () => {
  beforeEach(() => jest.clearAllMocks());

  // @s20 — valid stored preference is read back.
  it('getStoredPreference returns a parsed provider and model', async () => {
    dao.getStoredPreference.mockResolvedValue('{"provider":"openai","model":"gpt-5.6-luna"}');

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toEqual({
      provider: 'openai',
      model: 'gpt-5.6-luna',
    });
  });

  // @s21 — missing storage resolves to null.
  it('getStoredPreference returns null when nothing is stored', async () => {
    dao.getStoredPreference.mockResolvedValue(null);

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  // @s21 — corrupt JSON resolves to null without throwing.
  it('getStoredPreference returns null when the stored value is not valid JSON', async () => {
    dao.getStoredPreference.mockResolvedValue('not-json');

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  it('getStoredPreference returns null when the stored JSON lacks provider or model', async () => {
    dao.getStoredPreference.mockResolvedValue('{"provider":"openai"}');

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  it('getStoredPreference returns null when provider or model is not a string', async () => {
    dao.getStoredPreference.mockResolvedValueOnce('{"provider":123,"model":"gpt-5.6-luna"}');
    dao.getStoredPreference.mockResolvedValueOnce('{"provider":"openai","model":null}');
    dao.getStoredPreference.mockResolvedValueOnce('{"provider":"openai","model":456}');

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  it('getStoredPreference returns null for non-object JSON values', async () => {
    dao.getStoredPreference.mockResolvedValueOnce('null');
    dao.getStoredPreference.mockResolvedValueOnce('"openai"');
    dao.getStoredPreference.mockResolvedValueOnce('[]');
    dao.getStoredPreference.mockResolvedValueOnce('42');
    dao.getStoredPreference.mockResolvedValueOnce('true');

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  // @s21 — read failure never throws; degrades to null.
  it('getStoredPreference resolves to null when the DAO read fails', async () => {
    dao.getStoredPreference.mockRejectedValue(new Error('storage unavailable'));

    await expect(GenerationPreferenceService.getStoredPreference()).resolves.toBeNull();
  });

  // @s20 — write persists provider+model as JSON via the DAO.
  it('setStoredPreference persists provider and model via the DAO', async () => {
    dao.setStoredPreference.mockResolvedValue(undefined);

    await GenerationPreferenceService.setStoredPreference({
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
    });

    expect(dao.setStoredPreference).toHaveBeenCalledWith(
      '{"provider":"anthropic","model":"claude-haiku-4-5"}',
    );
  });
});
