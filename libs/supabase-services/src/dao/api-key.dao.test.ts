jest.mock('../supabase/supabase-client', () => ({ getSupabase: jest.fn() }));

import type { AiProvider } from '@helsoft/types';

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

  // @s2 (client half) — saveApiKey invokes manage-api-key and returns the raw response body.
  it('saveApiKey returns invoke response data without a client re-select', async () => {
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

  // task-10, @s17 — the DAO never branches on provider identity
  it('re-throws the raw invoke error unchanged for an unknown provider id (save, @s17)', async () => {
    const error = { message: 'edge function error' };
    invoke.mockResolvedValue({ data: null, error });

    await expect(
      ApiKeyDao.saveApiKey({ provider: 'not-a-real-provider' as AiProvider, apiKey: 'sk-test' }),
    ).rejects.toBe(error);
  });

  // @s1/@s7 — getApiKeyStatus returns raw non-secret rows
  it('getApiKeyStatus returns raw provider/updated_at rows', async () => {
    const rows = [
      { provider: 'groq', updated_at: '2026-01-01T00:00:00.000Z' },
      { provider: 'openai', updated_at: '2026-02-01T00:00:00.000Z' },
    ];
    select.mockResolvedValue({ data: rows, error: null });

    const result = await ApiKeyDao.getApiKeyStatus();

    expect(from).toHaveBeenCalledWith('user_ai_keys');
    expect(select).toHaveBeenCalledWith('provider, updated_at');
    expect(result).toEqual(rows);
  });

  // @s1 — no rows maps to empty array
  it('getApiKeyStatus maps no rows to an empty array', async () => {
    select.mockResolvedValue({ data: [], error: null });

    await expect(ApiKeyDao.getApiKeyStatus()).resolves.toEqual([]);
  });

  it('getApiKeyStatus maps null data to an empty array', async () => {
    select.mockResolvedValue({ data: null, error: null });

    await expect(ApiKeyDao.getApiKeyStatus()).resolves.toEqual([]);
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
    for (const row of result) {
      expect(Object.keys(row).sort()).toEqual(['provider', 'updated_at'].sort());
    }
  });

  // @s5 — removeApiKey invokes manage-api-key and returns the raw response body.
  it('removeApiKey returns invoke response data without a client re-select', async () => {
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

  // task-10, @s18
  it('re-throws the raw invoke error unchanged for an unknown provider id (remove, @s18)', async () => {
    const error = { message: 'edge function error' };
    invoke.mockResolvedValue({ data: null, error });

    await expect(ApiKeyDao.removeApiKey('not-a-real-provider' as AiProvider)).rejects.toBe(error);
  });
});
