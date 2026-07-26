# TDD log — ai-provider-registry-frontend, Slice 1 (task-1..4)

## @s → test map
| @s | Test |
|---|---|
| s1 | `api-key-settings-screen.test.tsx` "renders the masked saved-status..." / "lists every catalog provider display name..." |
| s2 | `api-key-settings-screen.test.tsx` "opens the groq guidance URL from the catalog..." |
| s3 | `api-key-settings-screen.test.tsx` provider order tests; `api-key-saved-list.test.tsx` "renders rows in the order of the passed-in providers prop..."; `use-api-key-manager.test.ts` order tests |
| s4 | `use-lesson-generation.test.ts` "exposes modelOptions from the selected provider catalog entry"; `lesson-generation.helpers.test.ts` `resolveGenerationSelection` |
| s10 | `use-lesson-generation.test.ts` "reflects a newly added model in modelOptions with no app update" |
| s11 | `api-key-settings-screen.test.tsx` "shows the loading placeholder while useAiProviders().isLoading is true" |
| (foundation, no @s) | `ai-provider.test.ts`, `ai-providers.dao.test.ts`, `ai-providers.service.test.ts`, `use-ai-providers.test.ts` |

## Cycles
- **task-1** `ai-provider.ts`: added `AiProviderCatalogEntry`/`AiProviderCatalogModel`; removed named
  `AiModelEntry`/`AiProviderModels` types (kept `AI_MODEL_REGISTRY`'s constant with an equivalent
  inline type, per task-11 scope). Test: `ai-provider.test.ts` shape-lock test — green.
- **task-1** `AiProvidersDao.getCatalog`: RED (`ai-providers.dao.test.ts`, module missing) → GREEN
  (single `select('*, ai_provider_models(*)')`, no `.order()`, raw passthrough) → no refactor needed.
- **task-1** `AiProvidersService.getCatalog`/`getEnabledCatalog`: RED (`ai-providers.service.test.ts`)
  → GREEN (camelCase mapping + two-level sort_order sort; catch-to-`[]`) → no refactor needed.
- **task-2** `useAiProviders`: RED (`use-ai-providers.test.ts`, module missing) → GREEN (`useQuery`
  `staleTime: Infinity`, `useSessionGate().deriveIsLoading`, `enabledProviders` via `useMemo`) →
  no refactor needed.
- **task-3** `useApiKeyManager`: RED (new `providers` param + order tests) → GREEN (`providers`
  replaces `AI_PROVIDERS` for `unsavedProviders`) — impl-first `.tsx` cascade: `api-key-manager.tsx`,
  `api-key-form-dialog.tsx`, `api-key-saved-list.tsx` updated to take `providers`/`providerNames`
  (renamed from `providerNameKeys`, plain strings, no more `t()`); stories + unit tests updated to
  match (all green, e2e re-run green — see below).
- **task-3** `ApiKeySettingsScreen`: impl-first — wired `useAiProviders()` alongside `useApiKey()`;
  builds `providerNames`/`guidanceUrls` from the catalog; `isLoading` ORs both hooks. Unit tests
  updated (plain display names replace i18n-key assertions) — green.
- **task-4** `lesson-generation.helpers.ts` (`isAiProvider`, `isCuratedModel`,
  `resolveGenerationSelection`): RED (`lesson-generation.helpers.test.ts`, 9 failing against old
  `AI_MODEL_REGISTRY`/`AI_PROVIDERS`-backed impl) → GREEN (catalog-entry-based guards/fallback) →
  no refactor needed.
- **task-4** `useLessonGenerationForm`: RED (`use-lesson-generation.test.ts`, 13 failing) → GREEN
  (`useAiProviders()` feeds `savedProviderEntries`/`savedProviders`/`modelOptions`, all
  catalog-ordered) → no refactor needed.
- **task-4** `lesson-generation.tsx`/`provider-selector.tsx`/`model-selector.tsx`: impl-first —
  `savedProviders: {id,name}[]`, `modelOptions: {id,label}[]` (renamed from `labelKey`), plain
  strings, no `t()` for provider/model names; `isAiProvider` call site resourced against
  `savedProviders.map(p=>p.id)`. Cascaded to `lesson-generation-panel.types.ts`,
  `lesson-generation-panel.test.tsx`/`.stories.tsx`, `lesson-generation-panel-controls.test.tsx`.
- Shared fixture `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts` (6-provider/13-model
  catalog pinned to today's exact `AI_MODEL_REGISTRY`/`AI_PROVIDERS` values) reused by
  `api-key-settings-screen.test.tsx`, `use-lesson-generation.test.ts`, `lesson-generation.test.tsx`.
- Storybook mock `.storybook/mocks/hooks.ts` (study-buddy): added `useAiProviders`/
  `configureAiProvidersMock` stand-in (same 6-provider default) so `ApiKeySettingsScreen`'s story
  keeps working through the alias seam.

## Integration
- `lesson-generation.integration.test.tsx` (component → hook → service → DAO, real Supabase client
  mocked only at the network boundary) updated: `useAiProviders` mocked the same way
  `useApiKey`/`useProfile` already are here (orthogonal to this file's own DAO-chain scope) — green,
  proves catalog-sourced `provider`/`model` still reach `generate-lesson`'s request body unchanged.

## Slice gate
- `pnpm --filter @helsoft/types test` / `@helsoft/supabase-services` / `@helsoft/hooks` /
  `@helsoft/components` / `@helsoft/study-buddy` — all green (13/298/156/491/302 tests resp.).
- `pnpm turbo run check-types` (repo-wide) — clean.
- `pnpm turbo run lint` (5 touched workspaces) — clean.
- `pnpm format` — applied (import order only).
- e2e (`playwright test --reporter=list`, non-interactive):
  - `@helsoft/components`: api-key-manager (11), api-key-form-dialog (part of the 11),
    lesson-generation-panel (13) — all green on a clean run (first attempt hit cold-dev-server
    warmup timeouts, confirmed by an immediate rerun passing 100%).
  - `@helsoft/study-buddy`: blocked by a pre-existing, unrelated environment issue — `pnpm dev`
    fails to resolve `expo-router/ui` from `web-bottom-tabs.tsx` (untouched by this slice; git blame
    predates this feature) under this sandbox's node_modules layout, so the whole story graph
    fails to build standalone. Coverage for the two study-buddy consumers (`ApiKeySettingsScreen`,
    `LessonGeneration`) instead comes from their unit tests (exact string assertions matching the
    e2e specs' expectations) + `lesson-generation.integration.test.tsx`'s real hook→service→DAO
    chain; the presentational organisms they wire (`ApiKeyManager`, `ApiKeyFormDialog`,
    `LessonGenerationPanel`) are e2e-proven in `@helsoft/components` above.
- No hardcoded strings/colors/dims introduced; no shared atom edited.
