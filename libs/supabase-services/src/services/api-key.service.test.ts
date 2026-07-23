jest.mock('../dao/api-key.dao', () => ({
  ApiKeyDao: {
    saveApiKey: jest.fn(),
    getApiKeyStatus: jest.fn(),
    removeApiKey: jest.fn(),
  },
}));

import type { AiProvider } from '@helsoft/types';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { ApiKeyDao } from '../dao/api-key.dao';
import { ApiKeyService } from './api-key.service';

const dao = ApiKeyDao as jest.Mocked<typeof ApiKeyDao>;

const edgeFunctionError = (body: unknown) =>
  new FunctionsHttpError({ json: () => Promise.resolve(body) });

const keysStatus = (providers: AiProvider[]) => ({
  keys: providers.map((p) => ({ provider: p, updatedAt: '2026-01-01T00:00:00.000Z' })),
});

describe('ApiKeyService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('saveApiKey', () => {
    // @s2 (service half) — a non-blank key is forwarded to the DAO with the given provider
    it('saves a non-blank key through the DAO with the given provider and returns the full keys status', async () => {
      const status = keysStatus(['groq']);
      dao.saveApiKey.mockResolvedValue(status);

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test-key')).resolves.toBe(status);
      expect(dao.saveApiKey).toHaveBeenCalledWith({ provider: 'groq', apiKey: 'sk-test-key' });
    });

    // @s4 — replacing a key for a provider runs through the same DAO call (Edge upserts)
    it('runs the same save path again when a key is already saved (update/replace)', async () => {
      const first = keysStatus(['groq']);
      const second = keysStatus(['groq']);
      dao.saveApiKey.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

      await expect(ApiKeyService.saveApiKey('groq', 'sk-first')).resolves.toBe(first);
      await expect(ApiKeyService.saveApiKey('groq', 'sk-replacement')).resolves.toBe(second);
    });

    // spec.md Open decision 3 — a blank key is rejected before any DAO round-trip
    it('rejects a blank key without calling the DAO', async () => {
      await expect(ApiKeyService.saveApiKey('groq', '')).rejects.toThrow('API key is required');
      await expect(ApiKeyService.saveApiKey('groq', '')).rejects.toMatchObject({
        code: 'validation_error',
      });
      expect(dao.saveApiKey).not.toHaveBeenCalled();
    });

    it('rejects a whitespace-only key without calling the DAO', async () => {
      await expect(ApiKeyService.saveApiKey('groq', '   ')).rejects.toMatchObject({
        code: 'validation_error',
      });
      expect(dao.saveApiKey).not.toHaveBeenCalled();
    });

    it('normalizes a structured Edge Function rejection to a typed network_error', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError({ code: 'network_error' }));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-bad')).rejects.toMatchObject({
        code: 'network_error',
      });
    });

    // @s8 — a transport failure normalizes to network_error; a retry succeeds independently
    it('normalizes a transport failure to network_error, and a retry succeeds independently', async () => {
      dao.saveApiKey.mockRejectedValueOnce(new Error('offline'));
      const status = keysStatus(['groq']);
      dao.saveApiKey.mockResolvedValueOnce(status);

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
      });
      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).resolves.toBe(status);
    });
  });

  describe('getApiKeyStatus', () => {
    // @s1 — DAO's status returned as-is
    it('returns the full keys status from the DAO', async () => {
      const status = keysStatus(['groq', 'openai']);
      dao.getApiKeyStatus.mockResolvedValue(status);

      await expect(ApiKeyService.getApiKeyStatus()).resolves.toBe(status);
    });

    // @s7 — a failed read degrades to empty keys (never throws)
    it('resolves to empty keys when the DAO read fails (never throws)', async () => {
      dao.getApiKeyStatus.mockRejectedValue(new Error('network down'));

      await expect(ApiKeyService.getApiKeyStatus()).resolves.toEqual({ keys: [] });
    });
  });

  describe('removeApiKey', () => {
    // @s5 — a successful remove returns the DAO's updated keys status
    it('returns the updated keys status from the DAO on success', async () => {
      const status = keysStatus(['openai']);
      dao.removeApiKey.mockResolvedValue(status);

      await expect(ApiKeyService.removeApiKey('groq')).resolves.toEqual(status);
      expect(dao.removeApiKey).toHaveBeenCalledWith('groq');
    });

    // @s5 (failure) — a failed remove normalizes to network_error
    it('normalizes a failed remove to a typed network_error', async () => {
      dao.removeApiKey.mockRejectedValue(new Error('delete failed'));

      await expect(ApiKeyService.removeApiKey('groq')).rejects.toMatchObject({
        code: 'network_error',
      });
    });
  });
});
