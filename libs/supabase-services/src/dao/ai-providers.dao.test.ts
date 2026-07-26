jest.mock('../supabase/supabase-client', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../supabase/supabase-client';
import { AiProvidersDao } from './ai-providers.dao';

const mockGetSupabase = getSupabase as jest.Mock;

const rawRows = [
  {
    id: 'openai',
    name: 'OpenAI',
    guidance_url: 'https://platform.openai.com/api-keys',
    enabled: true,
    sort_order: 2,
    ai_provider_models: [
      {
        model_id: 'gpt-5.6-terra',
        label: 'GPT-5.6 Terra',
        vision: true,
        is_vision_default: false,
        sort_order: 2,
      },
      {
        model_id: 'gpt-5.6-luna',
        label: 'GPT-5.6 Luna',
        vision: true,
        is_vision_default: true,
        sort_order: 1,
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    guidance_url: null,
    enabled: true,
    sort_order: 1,
    ai_provider_models: [],
  },
];

describe('AiProvidersDao', () => {
  const select = jest.fn();
  const from = jest.fn(() => ({ select }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue({ from });
  });

  // task-1 (data foundation for @s1-@s4) — a single unordered nested-select query, no .order().
  // `select` here has no chainable `.order` method, so a DAO that tried to call `.order()` would
  // throw a TypeError, failing this test — that's the "no .order() calls" proof.
  it('runs a single select with a nested ai_provider_models join and no .order() calls', async () => {
    select.mockResolvedValue({ data: [], error: null });

    await AiProvidersDao.getCatalog();

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('ai_providers');
    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('*, ai_provider_models(*)');
  });

  it('returns the raw rows exactly as Supabase/PostgREST returns them, unsorted, snake_case', async () => {
    select.mockResolvedValue({ data: rawRows, error: null });

    await expect(AiProvidersDao.getCatalog()).resolves.toEqual(rawRows);
  });

  it('maps null data to an empty array', async () => {
    select.mockResolvedValue({ data: null, error: null });

    await expect(AiProvidersDao.getCatalog()).resolves.toEqual([]);
  });

  it('throws the raw select error when the query fails', async () => {
    const error = { message: 'select failed' };
    select.mockResolvedValue({ data: null, error });

    await expect(AiProvidersDao.getCatalog()).rejects.toBe(error);
  });
});
