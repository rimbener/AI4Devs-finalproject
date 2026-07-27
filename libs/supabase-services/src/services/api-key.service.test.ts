jest.mock('../dao/api-key.dao', () => ({
  ApiKeyDao: {
    saveApiKey: jest.fn(),
    getApiKeyStatus: jest.fn(),
    removeApiKey: jest.fn(),
  },
}));

import type { AiProvider } from '@helsoft/types';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

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

    // task-8, @s16 — a save against a disabled provider surfaces the distinct provider_disabled
    // code out of the wire body, instead of collapsing into network_error.
    it('normalizes a provider_disabled Edge Function rejection distinctly from network_error', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError({ code: 'provider_disabled' }));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'provider_disabled',
        message: 'Provider disabled',
      });
    });

    // task-8 — an unrecognized/malformed wire body still falls back to network_error, never a
    // raw shape leaking through. Different body than the provider_disabled case above, and a
    // different resulting code/message, proving readFunctionErrorCode's resolution actually
    // drives the output rather than a hardcoded value.
    it('falls back to network_error for an unrecognized wire code', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError({ code: 'not_a_real_code' }));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    // line 61 area — a raw network-transport failure (never reaching the Edge Function's HTTP
    // response) normalizes distinctly through the FunctionsFetchError/FunctionsRelayError branch,
    // not by falling through the final catch-all on the next line (NoCoverage survivor).
    it('normalizes a FunctionsFetchError rejection to a typed network_error', async () => {
      dao.saveApiKey.mockRejectedValue(new FunctionsFetchError({ requestId: 'req-1' }));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    // line 61 area — same for the relay-cannot-reach-function case.
    it('normalizes a FunctionsRelayError rejection to a typed network_error', async () => {
      dao.saveApiKey.mockRejectedValue(new FunctionsRelayError({ region: 'us-east-1' }));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    it('falls back to network_error when the server error body cannot be parsed', async () => {
      dao.saveApiKey.mockRejectedValue(
        new FunctionsHttpError({ json: () => Promise.reject(new Error('invalid JSON')) }),
      );

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
      });
    });

    // errorCodeFromBody's guard — a parsed body of `null` fails the `typeof body !== 'object'`
    // check (typeof null === 'object') but is caught by the `body === null` half of the `||`,
    // proving that half isn't dropped and isn't wrongly ANDed with the other.
    it('falls back to network_error when the parsed error body is null', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError(null));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    // errorCodeFromBody's guard — a parsed body that is a non-null non-object primitive fails
    // via the `typeof body !== 'object'` half of the `||` (and never reaches `.code`), proving
    // that half isn't dropped and isn't wrongly ANDed with the `body === null` half.
    it('falls back to network_error when the parsed error body is a non-object primitive', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError('unexpected-string-body'));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    // errorCodeFromBody's guard — `undefined` is distinct from `null`: it only fails the
    // `typeof body !== 'object'` half (the `body === null` half is false for `undefined`). If
    // that left half were ever short-circuited away, `undefined.code` would throw a raw
    // TypeError instead of resolving to network_error, so this proves the left half still runs.
    it('falls back to network_error when the parsed error body is undefined', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError(undefined));

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
      });
    });

    // task-10, @s17 — a save against a provider id absent from the catalog still normalizes to
    // network_error after task-8's widening, never provider_disabled/validation_error (mirrors
    // backend D12's "one code, one meaning" — unknown stays byte-identical to today). The wire
    // never distinguishes "unknown" from any other transport-shaped failure, so its response is
    // the same `{ code: 'network_error' }` body an unrecognized provider id gets today.
    it('normalizes an unknown-provider save rejection to network_error, never provider_disabled (@s17)', async () => {
      dao.saveApiKey.mockRejectedValue(edgeFunctionError({ code: 'network_error' }));

      await expect(
        ApiKeyService.saveApiKey('not-a-real-provider' as AiProvider, 'sk-test'),
      ).rejects.toMatchObject({ code: 'network_error' });
    });

    // @s8 — a transport failure normalizes to network_error; a retry succeeds independently
    it('normalizes a transport failure to network_error, and a retry succeeds independently', async () => {
      dao.saveApiKey.mockRejectedValueOnce(new Error('offline'));
      const status = keysStatus(['groq']);
      dao.saveApiKey.mockResolvedValueOnce(status);

      await expect(ApiKeyService.saveApiKey('groq', 'sk-test')).rejects.toMatchObject({
        code: 'network_error',
        message: 'Network error',
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
        message: 'Network error',
      });
    });

    // task-10, @s18 — a remove against a provider id absent from the catalog still normalizes to
    // network_error, unaffected by task-8 (remove was never gated by `enabled`, backend D10).
    it('normalizes an unknown-provider remove rejection to network_error, unaffected by task-8 (@s18)', async () => {
      dao.removeApiKey.mockRejectedValue(edgeFunctionError({ code: 'network_error' }));

      await expect(
        ApiKeyService.removeApiKey('not-a-real-provider' as AiProvider),
      ).rejects.toMatchObject({ code: 'network_error' });
    });

    // task-8 — a structured provider_disabled rejection is defensive-only here: backend D10 never
    // gates remove by `enabled`, but the service must still normalize the code correctly if ever
    // returned, rather than crashing or leaking a raw shape.
    it('normalizes a provider_disabled Edge Function rejection for remove', async () => {
      dao.removeApiKey.mockRejectedValue(edgeFunctionError({ code: 'provider_disabled' }));

      await expect(ApiKeyService.removeApiKey('groq')).rejects.toMatchObject({
        code: 'provider_disabled',
      });
    });
  });
});
