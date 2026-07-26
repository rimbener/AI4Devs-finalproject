import { loadProviderCatalog } from '../../../../supabase/functions/_shared/provider-catalog';

const buildClient = (data: unknown) => {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error: null });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { client: { from }, from, select, eq, maybeSingle };
};

describe('loadProviderCatalog', () => {
  // @s10 — provider + its models are returned, models ordered by catalog sort_order.
  it('returns the provider entry with models sorted by sort_order', async () => {
    const { client, from, eq } = buildClient({
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
    });

    await expect(loadProviderCatalog(client, 'openai')).resolves.toEqual({
      id: 'openai',
      name: 'OpenAI',
      guidanceUrl: 'https://platform.openai.com/api-keys',
      enabled: true,
      sortOrder: 2,
      models: [
        {
          modelId: 'gpt-5.6-luna',
          label: 'GPT-5.6 Luna',
          vision: true,
          isVisionDefault: true,
          sortOrder: 1,
        },
        {
          modelId: 'gpt-5.6-terra',
          label: 'GPT-5.6 Terra',
          vision: true,
          isVisionDefault: false,
          sortOrder: 2,
        },
      ],
    });
    expect(from).toHaveBeenCalledWith('ai_providers');
    expect(eq).toHaveBeenCalledWith('id', 'openai');
  });

  // @s11 — a provider id absent from the catalog yields no entry.
  it('returns null when no provider row matches the id', async () => {
    const { client } = buildClient(null);

    await expect(loadProviderCatalog(client, 'unknown')).resolves.toBeNull();
  });
});
