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
DAO/service pair that reads `ai_providers` joined to `ai_provider_models` in one query. The DAO
returns the raw, untransformed rows; the service maps snake_case to camelCase and sorts by
`sort_order` at both levels — the foundation every later task's hook/UI migration builds on.

## Done criteria
- [ ] No scenario owned directly by this task (pure data-layer plumbing, not user-facing behavior) —
      DAO test asserts the query is a single `select('*, ai_provider_models(*)')` call with **no**
      `.order()` calls, and that the DAO returns the raw row shape (snake_case, unsorted) exactly as
      Supabase/PostgREST returns it; service test asserts `getCatalog()` maps every column
      (`id`/`name`/`guidanceUrl`/`enabled`/`sortOrder`, `modelId`/`label`/`vision`/`isVisionDefault`/
      `sortOrder`) and sorts by `sort_order` at both the provider level and each provider's nested
      `models` array, from unsorted/mixed-case raw fixture input — and that it resolves to an empty
      array (not a throw) on a DAO failure (Decision 11) — this is the data foundation scenarios
      s1–s4 (owned by task-2/task-3/task-4) build on
- [ ] `AiProviderCatalogModel = { modelId: string; label: string; vision: boolean; isVisionDefault:
      boolean; sortOrder: number }` and `AiProviderCatalogEntry = { id: AiProvider; name: string;
      guidanceUrl: string | null; enabled: boolean; sortOrder: number; models:
      AiProviderCatalogModel[] }` added to the existing `libs/types/src/ai-provider.ts` (alongside
      the existing `AiProvider` union), replacing the deleted `AiModelEntry`/`AiProviderModels` —
      this is the Service's output type, never the DAO's
- [ ] `AiProvidersDao.getCatalog(): Promise<RawProviderRow[]>` — a single
      `select('*, ai_provider_models(*)')` query with **no** `.order()` calls; raw data access only,
      no mapping, no sorting, no error mapping (`.agents/rules/hooks-service-dao.mdc`); `RawProviderRow`
      is a small type local to the DAO file matching PostgREST's raw response shape (snake_case
      columns, nested `ai_provider_models` array), and is distinct from `AiProviderCatalogEntry`
- [ ] `AiProvidersService.getCatalog(): Promise<AiProviderCatalogEntry[]>` — calls the DAO, catches
      any DAO throw and resolves to `[]` (Decision 11); on success, owns all business logic: maps
      every raw row/nested model to camelCase and sorts providers by `sort_order` then each
      provider's `models` by `sort_order`
- [ ] `AiProvidersService.getEnabledCatalog(): Promise<AiProviderCatalogEntry[]>` — calls
      `getCatalog()` internally and filters to `enabled === true`; exists for any future non-hook
      caller (Decisions 1–2) — a test asserts it returns only the enabled entries from a mixed
      enabled/disabled fixture
- [ ] Both `index.ts` barrels updated
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/types` and
      `@helsoft/supabase-services`

## Notes
- Decisions 1–2, 11. Query shape: `getSupabase().from('ai_providers').select('*,
  ai_provider_models(*)')` — a single query, **no** `.order()` calls anywhere. The DAO returns the
  raw, untransformed rows exactly as Supabase/PostgREST returns them (snake_case, unsorted). All
  camelCase mapping and both levels of `sort_order` sorting happen in `AiProvidersService.getCatalog()`
  — never in the DAO.
- This is the client's own read, distinct in shape from the Edge Functions' scoped
  `loadProviderCatalog` (`supabase/functions/_shared/provider-catalog.ts`, backend-owned, not
  touched by this story) — no code is shared between them, only the column names line up.
- `id` is typed `AiProvider` (the existing 6-literal union, Decision 3), not `string` — the raw DAO
  row types `id` as `string`; the service's mapping step is where it's narrowed to `AiProvider`.
  Every row the seeded catalog returns today is one of the six known ids; an `id` outside that union
  is a type error at the service boundary, which is acceptable since adding a genuinely new provider
  is still code (non-goal).
