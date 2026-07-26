// Shared AI-provider/model catalog module (ai-provider-registry-backend, task-3), imported by
// both generate-lesson and manage-api-key so every enabled/model-validity decision lives in one
// place instead of a per-function mirror (D5). Split in two:
//   - the pure half (types below) takes no import at all, so libs/supabase-services' Jest suite
//     can import this file by relative path with zero Deno-only baggage;
//   - the impure half (`loadProviderCatalog`) is the single scoped query (D8) — no caching of any
//     kind (D9): callers must load fresh, once per request.

export type ProviderModel = {
  modelId: string;
  label: string;
  vision: boolean;
  isVisionDefault: boolean;
  sortOrder: number;
};

export type ProviderEntry = {
  id: string;
  name: string;
  guidanceUrl: string | null;
  enabled: boolean;
  sortOrder: number;
  models: ProviderModel[];
};

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
// Deno-only import (matching the ../_shared/cors.ts precedent).
export type CatalogQueryClient = {
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
 * Scoped single-provider read (D8) — neither caller ever needs the other five providers. */
export const loadProviderCatalog = async (
  client: CatalogQueryClient,
  providerId: string,
): Promise<ProviderEntry | null> => {
  const { data } = await client
    .from('ai_providers')
    .select(
      'id, name, guidance_url, enabled, sort_order, ai_provider_models(model_id, label, vision, is_vision_default, sort_order)',
    )
    .eq('id', providerId)
    .maybeSingle();

  return data ? toProviderEntry(data) : null;
};
