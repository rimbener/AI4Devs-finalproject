// Shared AI-provider/model catalog module (ai-provider-registry-backend, task-3), imported by
// both generate-lesson and manage-api-key so every enabled/model-validity decision lives in one
// place instead of a per-function mirror (D5). Split in two:
//   - the pure half (the public `ProviderEntry`/`ProviderModel` contract, split into the
//     co-located provider-catalog.types.ts per types.mdc) takes no import at all, so
//     libs/supabase-services' Jest suite can import this file by relative path with zero
//     Deno-only baggage;
//   - the impure half (`loadProviderCatalog`) is the single scoped query (D8) — no caching of any
//     kind (D9): callers must load fresh, once per request.
import type { ProviderEntry } from './provider-catalog.types.ts';

type RawProviderModelRow = {
  model_id: string;
  label: string;
  vision: boolean;
  is_vision_default: boolean;
  sort_order: number;
};

type RawProviderRow = {
  id: string;
  name: string;
  guidance_url: string | null;
  enabled: boolean;
  sort_order: number;
  ai_provider_models: RawProviderModelRow[];
};

// Minimal structural type for the one query chain this loader needs — avoids importing
// npm:@supabase/supabase-js just for a type, so this file stays resolvable by Jest with no
// Deno-only import (matching the ../_shared/cors.ts precedent). Private: used only by
// `loadProviderCatalog` below, not part of this module's public contract (types.mdc).
type CatalogQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{ data: RawProviderRow | null; error: unknown }>;
      };
    };
  };
};

const toProviderEntry = (row: RawProviderRow): ProviderEntry => ({
  id: row.id,
  name: row.name,
  guidanceUrl: row.guidance_url,
  enabled: row.enabled,
  sortOrder: row.sort_order,
  models: [...row.ai_provider_models]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((model) => ({
      modelId: model.model_id,
      label: model.label,
      vision: model.vision,
      isVisionDefault: model.is_vision_default,
      sortOrder: model.sort_order,
    })),
});

/** Loads one provider + its models in catalog order, or `null` when the id is unknown (s10/s11).
 * Scoped single-provider read (D8) — neither caller ever needs the other five providers.
 *
 * A genuine query failure (RLS block, connection drop, DB outage) resolves as `{ data: null,
 * error }`, not a rejected promise -- `@supabase/supabase-js`/postgrest-js only rejects for an
 * explicit `.throwOnError()` (unused in this repo) or a truly exceptional client bug. So `error`
 * must be checked and re-thrown here (D6 fail-closed; reviewer_slice round-1, slice 2), matching
 * the sibling `if (error) throw error;` convention at every other RPC call site in these two
 * functions (generate-lesson's acquirePlatformSlot/releasePlatformSlot,
 * manage-api-key's removeApiKey/storeApiKey) -- otherwise a real outage is silently
 * indistinguishable from "provider unknown" to every caller relying on fail-closed behaviour. */
export const loadProviderCatalog = async (
  client: CatalogQueryClient,
  providerId: string,
): Promise<ProviderEntry | null> => {
  const { data, error } = await client
    .from('ai_providers')
    .select(
      'id, name, guidance_url, enabled, sort_order, ai_provider_models(model_id, label, vision, is_vision_default, sort_order)',
    )
    .eq('id', providerId)
    .maybeSingle();

  if (error) throw error;

  return data ? toProviderEntry(data) : null;
};
