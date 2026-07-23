jest.mock('../supabase/supabase-client', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../supabase/supabase-client';
import { ApiKeyDao } from './api-key.dao';

const mockGetSupabase = getSupabase as jest.Mock;

describe('ApiKeyDao', () => {
  const invoke = jest.fn();
  const select = jest.fn();
  const from = jest.fn(() => ({ select }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue({ functions: { invoke }, from });
  });

  // @s2 (client half) — saveApiKey invokes manage-api-key and returns keys from the response body.
  it('saveApiKey returns keys from invoke response without a client re-select', async () => {
    const status = {
      keys: [
        { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
        { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
      ],
    };
    invoke.mockResolvedValue({ data: status, error: null });

    const result = await ApiKeyDao.saveApiKey({ provider: 'openai', apiKey: 'sk-test' });

    expect(invoke).toHaveBeenCalledWith('manage-api-key', {
      body: { action: 'save', provider: 'openai', apiKey: 'sk-test' },
    });
    expect(select).not.toHaveBeenCalled();
    expect(result).toEqual(status);
  });

  // @s2 (failure path) — a structured Edge Function error is thrown as-is
  it('saveApiKey throws the raw invoke error when the function call fails', async () => {
    const error = { message: 'edge function error' };
    invoke.mockResolvedValue({ data: null, error });

    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toBe(error);
  });

  // @s1/@s7 — getApiKeyStatus returns all provider rows as a keys array
  it('getApiKeyStatus maps all rows to a keys array', async () => {
    select.mockResolvedValue({
      data: [
        { provider: 'groq', updated_at: '2026-01-01T00:00:00.000Z' },
        { provider: 'openai', updated_at: '2026-02-01T00:00:00.000Z' },
      ],
      error: null,
    });

    const result = await ApiKeyDao.getApiKeyStatus();

    expect(from).toHaveBeenCalledWith('user_ai_keys');
    expect(select).toHaveBeenCalledWith('provider, updated_at');
    expect(result).toEqual({
      keys: [
        { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
        { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
      ],
    });
  });

  // @s1 — no rows maps to empty keys array
  it('getApiKeyStatus maps no rows to an empty keys array', async () => {
    select.mockResolvedValue({ data: [], error: null });

    await expect(ApiKeyDao.getApiKeyStatus()).resolves.toEqual({ keys: [] });
  });

  it('getApiKeyStatus maps null data to an empty keys array', async () => {
    select.mockResolvedValue({ data: null, error: null });

    await expect(ApiKeyDao.getApiKeyStatus()).resolves.toEqual({ keys: [] });
  });

  // @s1 (failure path) — raw select error is thrown; service degrades to { keys: [] }
  it('getApiKeyStatus throws the raw select error when the query fails', async () => {
    const error = { message: 'select failed' };
    select.mockResolvedValue({ data: null, error });

    await expect(ApiKeyDao.getApiKeyStatus()).rejects.toBe(error);
  });

  // @s9 — DAO selects only non-secret columns and returns no key material
  it('getApiKeyStatus selects only non-secret columns and returns no key material', async () => {
    select.mockResolvedValue({
      data: [{ provider: 'groq', updated_at: '2026-01-01T00:00:00.000Z' }],
      error: null,
    });

    const result = await ApiKeyDao.getApiKeyStatus();

    expect(select).toHaveBeenCalledWith(expect.not.stringMatching(/api_?key|secret/i));
    // No key material on any item in the keys array
    for (const key of result.keys) {
      expect(Object.keys(key).sort()).toEqual(['provider', 'updatedAt'].sort());
    }
  });

  // @s5 — removeApiKey invokes manage-api-key and returns keys from the response body.
  it('removeApiKey returns keys from invoke response without a client re-select', async () => {
    const status = { keys: [{ provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' }] };
    invoke.mockResolvedValue({ data: status, error: null });

    const result = await ApiKeyDao.removeApiKey('groq');

    expect(invoke).toHaveBeenCalledWith('manage-api-key', {
      body: { action: 'remove', provider: 'groq' },
    });
    expect(select).not.toHaveBeenCalled();
    expect(result).toEqual(status);
  });

  // @s5 (failure path)
  it('removeApiKey throws the raw invoke error when the function call fails', async () => {
    const error = { message: 'edge function error' };
    invoke.mockResolvedValue({ data: null, error });

    await expect(ApiKeyDao.removeApiKey('groq')).rejects.toBe(error);
  });

  it('saveApiKey rejects invoke payloads that fail the ApiKeyStatus type guard', async () => {
    invoke.mockResolvedValueOnce({ data: { keys: 'not-an-array' }, error: null });
    invoke.mockResolvedValueOnce({ data: 'not-an-object', error: null });
    invoke.mockResolvedValueOnce({
      data: { keys: [{ provider: 123, updatedAt: '2026-01-01T00:00:00.000Z' }] },
      error: null,
    });
    invoke.mockResolvedValueOnce({ data: { keys: [{ provider: 'groq' }] }, error: null });
    invoke.mockResolvedValueOnce({
      data: { keys: [{ provider: 'groq', updatedAt: 123 }] },
      error: null,
    });
    invoke.mockResolvedValueOnce({
      data: {
        keys: [
          { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
          { provider: 'openai', updatedAt: null },
        ],
      },
      error: null,
    });

    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
    await expect(ApiKeyDao.saveApiKey({ provider: 'groq', apiKey: 'sk-test' })).rejects.toThrow(
      'invalid status payload',
    );
  });

  it('removeApiKey rejects invoke payloads that fail the ApiKeyStatus type guard', async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(ApiKeyDao.removeApiKey('groq')).rejects.toThrow('invalid status payload');
  });
});
