---
id: task-1
title: Add the catalog types + AiProvidersDao/Service reading the whole ordered catalog
slice: 1
scenarios: []
status: todo
paths:
  - libs/types/src/ai-provider.ts
  - libs/types/src/ai-provider.test.ts
  - libs/types/src/index.ts
  - libs/supabase-services/src/dao/ai-providers.dao.ts
  - libs/supabase-services/src/dao/ai-providers.dao.test.ts
  - libs/supabase-services/src/dao/index.ts
  - libs/supabase-services/src/services/ai-providers.service.ts
  - libs/supabase-services/src/services/ai-providers.service.test.ts
  - libs/supabase-services/src/services/index.ts
---

## Goal
Introduce the client-side catalog shape (`AiProviderCatalogModel`/`AiProviderCatalogEntry`) and the
DAO/service pair that reads `ai_providers` joined to `ai_provider_models` in one query, ordered by
`sort_order` at both levels — the foundation every later task's hook/UI migration builds on.

## Done criteria
- [ ] No scenario owned directly by this task (pure data-layer plumbing, not user-facing behavior) —
      DAO test asserts the query orders by `sort_order` (provider level and nested model level) and
      maps every column (`id`/`name`/`guidanceUrl`/`enabled`/`sortOrder`, `modelId`/`label`/`vision`/
      `isVisionDefault`/`sortOrder`); service test asserts it returns the DAO's rows unchanged on
      success and an empty array (not a throw) on a DAO failure (Decision 11) — this is the data
      foundation scenarios s1–s4 (owned by task-2/task-3/task-4) build on
- [ ] `AiProviderCatalogModel = { modelId: string; label: string; vision: boolean; isVisionDefault:
      boolean; sortOrder: number }` and `AiProviderCatalogEntry = { id: AiProvider; name: string;
      guidanceUrl: string | null; enabled: boolean; sortOrder: number; models:
      AiProviderCatalogModel[] }` added to the existing `libs/types/src/ai-provider.ts` (alongside
      the existing `AiProvider` union), replacing the deleted `AiModelEntry`/`AiProviderModels`
- [ ] `AiProvidersDao.getCatalog(): Promise<AiProviderCatalogEntry[]>` — raw data access only,
      no validation, no error mapping (`.agents/rules/hooks-service-dao.mdc`)
- [ ] `AiProvidersService.getCatalog(): Promise<AiProviderCatalogEntry[]>` — catches any DAO
      throw and resolves to `[]` (Decision 11), never rejects
- [ ] Both `index.ts` barrels updated
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/types` and
      `@helsoft/supabase-services`

## Notes
- Decisions 1–2, 11. Query shape: `getSupabase().from('ai_providers').select('id, name,
  guidance_url, enabled, sort_order, ai_provider_models(model_id, label, vision, is_vision_default,
  sort_order)').order('sort_order').order('sort_order', { foreignTable: 'ai_provider_models' })` —
  confirm the exact `order(..., { foreignTable })` call against the installed `@supabase/supabase-js`
  version in a quick DAO test before relying on it; fall back to a client-side `.sort()` on the
  nested `models` array inside the DAO (still counted as "raw data access", not business logic) if
  the foreign-table order option isn't supported.
- This is the client's own read, distinct in shape from the Edge Functions' scoped
  `loadProviderCatalog` (`supabase/functions/_shared/provider-catalog.ts`, backend-owned, not
  touched by this story) — no code is shared between them, only the column names line up.
- `id` is typed `AiProvider` (the existing 6-literal union, Decision 3), not `string` — every row the
  seeded catalog returns today is one of the six known ids; an `id` outside that union is a type
  error at the DAO boundary, which is acceptable since adding a genuinely new provider is still code
  (non-goal).
