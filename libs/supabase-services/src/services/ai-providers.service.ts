import type { AiProvider, AiProviderCatalogEntry, AiProviderCatalogModel } from '@helsoft/types';

import { AiProvidersDao } from '../dao/ai-providers.dao';
import type { RawProviderRow } from '../dao/ai-providers.types';

/** The closed six-literal `AiProvider` union, as a runtime array — the single place this DAO→
 * Service trust boundary checks a row's raw `id` string against the type before narrowing it. */
const AI_PROVIDER_IDS: readonly AiProvider[] = [
  'groq',
  'openai',
  'anthropic',
  'google',
  'xai',
  'deepseek',
];

/** Runtime guard narrowing a raw catalog row's `id` (arbitrary DB string) to `AiProvider` before
 * it's ever cast — a row that fails this is dropped by `getCatalog()` rather than let through
 * (Decision 11's "degrade gracefully on a bad catalog read" precedent). */
const isValidProviderRow = (row: RawProviderRow): row is RawProviderRow & { id: AiProvider } =>
  (AI_PROVIDER_IDS as readonly string[]).includes(row.id);

const mapModel = (row: RawProviderRow['ai_provider_models'][number]): AiProviderCatalogModel => ({
  modelId: row.model_id,
  label: row.label,
  vision: row.vision,
  isVisionDefault: row.is_vision_default,
  sortOrder: row.sort_order,
});

const mapEntry = (row: RawProviderRow & { id: AiProvider }): AiProviderCatalogEntry => ({
  id: row.id,
  name: row.name,
  guidanceUrl: row.guidance_url,
  enabled: row.enabled,
  sortOrder: row.sort_order,
  models: [...row.ai_provider_models].sort((a, b) => a.sort_order - b.sort_order).map(mapModel),
});

/**
 * Business logic over AiProvidersDao: maps the raw, unsorted `ai_providers`/`ai_provider_models`
 * rows to the camelCase `AiProviderCatalogEntry` shape and sorts by `sort_order` at both the
 * provider level and each provider's nested `models` array (Decision 2) — the DAO never sorts or
 * maps (`.agents/rules/hooks-service-dao.mdc`).
 *
 * `getCatalog()` never rejects: a DAO failure degrades to an empty ordered list (Decision 11) —
 * the server-side gate, not the client's picker, is what actually protects a disabled/unknown
 * provider at save/generate time, so the client only needs to avoid crashing or showing a stale
 * hardcoded list.
 */
export abstract class AiProvidersService {
  static async getCatalog(): Promise<AiProviderCatalogEntry[]> {
    try {
      const rows = await AiProvidersDao.getCatalog();
      return [...rows]
        .filter(isValidProviderRow)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(mapEntry);
    } catch {
      return [];
    }
  }

  static async getEnabledCatalog(): Promise<AiProviderCatalogEntry[]> {
    const catalog = await AiProvidersService.getCatalog();
    return catalog.filter((entry) => entry.enabled);
  }
}
