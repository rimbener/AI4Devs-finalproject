# TDD log — ai-provider-registry-frontend

## @s → test map (Slice 1, task-1..5)
| @s | Test |
|---|---|
| s1 | `api-key-settings-screen.test.tsx` masked saved-status / catalog provider names |
| s2 | `api-key-settings-screen.test.tsx` groq guidance URL from catalog |
| s3 | `api-key-settings-screen.test.tsx`/`api-key-saved-list.test.tsx`/`use-api-key-manager.test.ts` order |
| s4 | `use-lesson-generation.test.ts` modelOptions; `lesson-generation.helpers.test.ts` `resolveGenerationSelection` |
| s10 | `use-lesson-generation.test.ts` newly added model reflected |
| s11 | `api-key-settings-screen.test.tsx` loading placeholder |
| s19 | `use-ai-providers.test.ts` / `api-key-settings-screen.test.tsx` / `use-lesson-generation.test.ts` fixture-pinned regression |

**Slice 1 summary:** `ai-provider.ts` gained `AiProviderCatalogEntry`/`Model`; `AiProvidersDao`/
`AiProvidersService.getCatalog`/`getEnabledCatalog` (task-1); `useAiProviders` hook (task-2);
`useApiKeyManager`/`ApiKeyManager`/`ApiKeyFormDialog`/`ApiKeySavedList` take `providers`/
`providerNames` (task-3); `lesson-generation.helpers.ts`/`useLessonGenerationForm`/
`ProviderSelector`/`ModelSelector` catalog-backed (task-4); pinned `AI_PROVIDER_CATALOG_FIXTURE` +
`.storybook/mocks/hooks.ts` wired to it (task-5). Slice gate: types/supabase-services/hooks/
components/study-buddy tests + check-types + lint green; `@helsoft/study-buddy` e2e blocked by a
pre-existing unrelated `expo-router/ui` resolution issue, covered by unit + integration instead.

## @s → test map (Slice 2, task-6..10)
| @s | Test |
|---|---|
| s5/s6 | `api-key-saved-list.test.tsx`/`api-key-manager.test.tsx`/`api-key-settings-screen.test.tsx` "Disabled" indicator + row/key stay present |
| s7 | `api-key-manager-remove.test.tsx` confirm action for a disabled, keyed provider |
| s8 | `use-api-key-manager.test.ts`/`api-key-manager.test.tsx`/`api-key-settings-screen.test.tsx` excludes disabled unsaved provider |
| s9 | `use-lesson-generation.test.ts` excludes disabled provider from savedProviders even with a key |
| s12/s13 | `lesson-generation.service.test.ts` `provider_disabled` vs. unknown-provider `invalid_model` |
| s14/s15 | `lesson-generation.service.test.ts` `invalid_model`/`platform_key_unavailable` (unchanged) |
| s16 | `api-key.service.test.ts`/`use-api-key.test.ts`/`api-key-settings-screen.test.tsx` `provider_disabled` |
| s17/s18 | `api-key.service.test.ts`/`api-key.dao.test.ts` unknown-provider save/remove unaffected |
| s22 | `api-key-saved-list.test.tsx` "Disabled" indicator is real text, not color-only |

**Slice 2 summary:** `ApiKeySavedListProps`/`ApiKeyManagerProps` gain `enabledProviders` (task-6);
`useApiKeyManager` drops `providers`, derives `unsavedProviders` from `enabledProviders` ∩ "not
saved"; `useLessonGenerationForm` switches to `.enabledProviders` (task-7); `ApiKeyErrorCode`/
`GenerationErrorCode` both widened with `provider_disabled`, mapped via
`normalizeApiKeyError`/existing `lesson-generation.service.ts` pattern (task-8/9); task-10 added
unknown-provider regression assertions only. New locale keys: `settings.apiKey.manager.disabled`,
`settings.apiKey.error.providerDisabled`, `generation.error.providerDisabled` (all 4 bundles).

**Slice 2 gate:** `@helsoft/types` 48, `@helsoft/supabase-services` 308 (+10), `@helsoft/hooks` 158
(+1), `@helsoft/components` 500 (+9), `@helsoft/study-buddy` 310 (+6), `@helsoft/localization` 245
— all green. Repo-wide check-types/lint clean.

## @s → test map (Slice 3, task-11..14)
| @s | Test |
|---|---|
| s20 | `use-ai-providers.test.ts` reorder + rename/guidanceUrl edit, same mounted hook/QueryClient |
| s21 | `ai-providers.integration.test.ts` (new) — single cross-layer test |
| s23 | repo-wide grep (task-11); re-run in task-14 against the final diff |

**Slice 3 summary:**
- **task-11**: deleted `AI_PROVIDERS`/`AI_MODEL_REGISTRY` from `ai-provider.ts` (keeps only
  `AiProvider`/`AiProviderCatalogEntry`/`AiProviderCatalogModel`); deleted `libs/types/src/
  api-key-settings.ts` (`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`) outright, barrel
  export removed. `aiModel.*`/`settings.apiKey.provider.*` removed from all 4 locale bundles
  (`migration-coverage.test.ts` needed no change — flattens `en.ts` dynamically). All consumers
  (component/study-buddy tests+stories, supabase Deno comments) updated to derive ids from
  `AI_PROVIDER_CATALOG_FIXTURE`/`providerNames`; dead `tMap` entries for the deleted key family
  removed from 3 component test files. Repo-wide grep for all 4 constants + both key-prefixes:
  zero matches outside `docs/`/`user-stories/` planning docs. `ai-provider.test.ts` trimmed to
  surviving shape-lock tests (`@helsoft/types` 38, was 48 — delta is the deleted registry tests,
  redundant with catalog-based coverage per Slice 1/2 map above).
- **task-12**: two new `use-ai-providers.test.ts` cases (reorder, rename/guidanceUrl) via
  `queryClient.invalidateQueries` on the same mounted hook (no remount) — proves no memoization
  ahead of `useQuery`. No production change. `@helsoft/hooks` 160 (+2).
- **task-13**: new `libs/study-buddy/src/components/ai-providers.integration.test.ts` — real
  `useAiProviders`/`useApiKeyManager`/`useLessonGenerationForm`, only the Supabase client boundary
  mocked (`client.from('ai_providers').select(...)`, session mocked per `api-key.integration.
  test.ts`'s convention); `useApiKey`/`useProfile`/`GenerationPreferenceService` mocked as
  incidental collaborators. Required barrel-exporting `useApiKeyManager` from `@helsoft/components`
  (`organisms/index.ts`, was internal-only). Renamed/reordered/one-disabled fixture proves order/
  identity/visibility end to end. `@helsoft/study-buddy` 311 (+1).
- **task-14**: wrap-up sweep, no new behavior. Confirmed `AiProviderCatalogEntry`/Model,
  `AiProvidersDao`/`Service`, `useAiProviders`/`AI_PROVIDERS_QUERY_KEY` all barrel-reachable
  (already true). s19/s23 both re-hold on the final diff.

**Slice 3 gate:** `@helsoft/types` 38, `@helsoft/hooks` 160 (+2), `@helsoft/supabase-services` 308,
`@helsoft/components` 500, `@helsoft/study-buddy` 311 (+1), `@helsoft/localization` 245 — all
green. `pnpm turbo run check-types`/`lint` clean, full repo, all 14 packages. Repo-wide grep for
`AI_PROVIDERS`/`AI_MODEL_REGISTRY`/`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`/
`aiModel.`/`settings.apiKey.provider.`: zero matches outside `docs/`/`user-stories/` planning
documents. Feature complete — all 14 tasks `done`.
