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

  // @s2 (client half) — saveApiKey invokes the manage-api-key Edge Function with the save
  // action + the given provider/key, then selects all rows to return the full keys status.
  it('saveApiKey invokes manage-api-key save then selects all rows for the full keys status', async () => {
    const rows = [
      { provider: 'groq', updated_at: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updated_at: '2026-02-01T00:00:00.000Z' },
    ];
    invoke.mockResolvedValue({
      data: { hasKey: true, provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
      error: null,
    });
    select.mockResolvedValue({ data: rows, error: null });

    const result = await ApiKeyDao.saveApiKey({ provider: 'openai', apiKey: 'sk-test' });

    expect(invoke).toHaveBeenCalledWith('manage-api-key', {
      body: { action: 'save', provider: 'openai', apiKey: 'sk-test' },
    });
    expect(from).toHaveBeenCalledWith('user_ai_keys');
    expect(select).toHaveBeenCalledWith('provider, updated_at');
    expect(result).toEqual({
      keys: [
        { provider: 'groq', updatedAt: '2026-01-01T00:00:00.000Z' },
        { provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' },
      ],
    });
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

  // @s5 — removeApiKey invokes manage-api-key with the remove action + provider,
  // then selects remaining rows for the updated keys status.
  it('removeApiKey invokes manage-api-key remove with provider then selects remaining rows', async () => {
    const remainingRows = [{ provider: 'openai', updated_at: '2026-02-01T00:00:00.000Z' }];
    invoke.mockResolvedValue({ data: { hasKey: false }, error: null });
    select.mockResolvedValue({ data: remainingRows, error: null });

    const result = await ApiKeyDao.removeApiKey('groq');

    expect(invoke).toHaveBeenCalledWith('manage-api-key', {
      body: { action: 'remove', provider: 'groq' },
    });
    expect(result).toEqual({
      keys: [{ provider: 'openai', updatedAt: '2026-02-01T00:00:00.000Z' }],
    });
  });

  // @s5 (failure path)
  it('removeApiKey throws the raw invoke error when the function call fails', async () => {
    const error = { message: 'edge function error' };
    invoke.mockResolvedValue({ data: null, error });

    await expect(ApiKeyDao.removeApiKey('groq')).rejects.toBe(error);
  });
});
