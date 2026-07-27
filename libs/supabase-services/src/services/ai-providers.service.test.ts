jest.mock('../dao/ai-providers.dao', () => ({ AiProvidersDao: { getCatalog: jest.fn() } }));

import { AiProvidersDao } from '../dao/ai-providers.dao';
import { AiProvidersService } from './ai-providers.service';

const dao = AiProvidersDao as jest.Mocked<typeof AiProvidersDao>;

// Unsorted, mixed-case raw rows — proves the Service (not the DAO) owns both mapping and sorting.
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
    enabled: false,
    sort_order: 1,
    ai_provider_models: [
      {
        model_id: 'openai/gpt-oss-20b',
        label: 'GPT OSS 20B',
        vision: false,
        is_vision_default: false,
        sort_order: 1,
      },
    ],
  },
];

const mappedGroq = {
  id: 'groq',
  name: 'Groq',
  guidanceUrl: null,
  enabled: false,
  sortOrder: 1,
  models: [
    {
      modelId: 'openai/gpt-oss-20b',
      label: 'GPT OSS 20B',
      vision: false,
      isVisionDefault: false,
      sortOrder: 1,
    },
  ],
};

const mappedOpenai = {
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
};

describe('AiProvidersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCatalog', () => {
    it('maps every column to camelCase and sorts providers + models by sort_order', async () => {
      dao.getCatalog.mockResolvedValue(rawRows);

      await expect(AiProvidersService.getCatalog()).resolves.toEqual([mappedGroq, mappedOpenai]);
    });

    it('resolves to an empty array (not a throw) when the DAO fails', async () => {
      dao.getCatalog.mockRejectedValue(new Error('read failed'));

      await expect(AiProvidersService.getCatalog()).resolves.toEqual([]);
    });

    // Trust-boundary guard (review finding) — a row whose id isn't one of the six closed
    // AiProvider literals is dropped rather than let through with an unchecked cast (Decision 11
    // precedent: degrade gracefully on a bad catalog read).
    it('filters out a row whose id is not a member of the AiProvider union', async () => {
      dao.getCatalog.mockResolvedValue([
        ...rawRows,
        {
          id: 'not-a-real-provider',
          name: 'Bogus',
          guidance_url: null,
          enabled: true,
          sort_order: 3,
          ai_provider_models: [],
        },
      ]);

      await expect(AiProvidersService.getCatalog()).resolves.toEqual([mappedGroq, mappedOpenai]);
    });
  });

  describe('getEnabledCatalog', () => {
    it('returns only the enabled entries from a mixed enabled/disabled fixture', async () => {
      dao.getCatalog.mockResolvedValue(rawRows);

      await expect(AiProvidersService.getEnabledCatalog()).resolves.toEqual([mappedOpenai]);
    });

    it('resolves to an empty array when the DAO fails', async () => {
      dao.getCatalog.mockRejectedValue(new Error('read failed'));

      await expect(AiProvidersService.getEnabledCatalog()).resolves.toEqual([]);
    });
  });
});
