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

**Slice 1 summary:** `ai-provider.ts` gained `AiProviderCatalogEntry`/`Model`; `AiProvidersDao.getCatalog`
+ `AiProvidersService.getCatalog`/`getEnabledCatalog` (task-1); `useAiProviders` hook (task-2);
`useApiKeyManager`/`ApiKeyManager`/`ApiKeyFormDialog`/`ApiKeySavedList` take `providers`/`providerNames`
instead of `AI_PROVIDERS`/`providerNameKeys` (task-3); `lesson-generation.helpers.ts`/
`useLessonGenerationForm`/`ProviderSelector`/`ModelSelector` catalog-backed (task-4); pinned
`AI_PROVIDER_CATALOG_FIXTURE` fixture + `.storybook/mocks/hooks.ts` wired to it (task-5). All RED→GREEN,
no refactor needed. Slice gate: types/supabase-services/hooks/components/study-buddy tests +
check-types + lint all green; e2e green for `@helsoft/components` (api-key-manager, api-key-form-dialog,
lesson-generation-panel); `@helsoft/study-buddy` e2e blocked by a pre-existing unrelated `expo-router/ui`
resolution issue, covered instead by unit + integration tests.

## @s → test map (Slice 2, task-6..10)
| @s | Test |
|---|---|
| s5 | `api-key-saved-list.test.tsx`/`api-key-manager.test.tsx`/`api-key-settings-screen.test.tsx` "shows the Disabled indicator..." |
| s6 | same tests — row/key stay present, not auto-removed |
| s7 | `api-key-manager-remove.test.tsx` "completes the confirm action normally for a disabled, keyed provider" |
| s8 | `use-api-key-manager.test.ts`/`api-key-manager.test.tsx`/`api-key-settings-screen.test.tsx` "excludes a disabled, unsaved provider..." |
| s9 | `use-lesson-generation.test.ts` "excludes a disabled provider from savedProviders even when a key exists" |
| s12 | `lesson-generation.service.test.ts` `it.each` `provider_disabled`; `lesson-generation.helpers.test.ts` distinct key |
| s13 | `lesson-generation.service.test.ts` "maps an unknown-provider 422 to invalid_model, never provider_disabled" |
| s14/s15 | `lesson-generation.service.test.ts` `it.each` `invalid_model`/`platform_key_unavailable` (unchanged) |
| s16 | `api-key.service.test.ts` "normalizes a provider_disabled Edge Function rejection..."; `use-api-key.test.ts`; `api-key-settings-screen.test.tsx` "maps a provider_disabled error..." |
| s17 | `api-key.service.test.ts`/`api-key.dao.test.ts` "normalizes/re-throws an unknown-provider save..." |
| s18 | `api-key.service.test.ts`/`api-key.dao.test.ts` "normalizes/re-throws an unknown-provider remove..." |
| s22 | `api-key-saved-list.test.tsx` "renders the Disabled indicator as real text content, not a color-only marker" |

**Slice 2 summary:**
- **task-6**: `ApiKeySavedListProps`/`ApiKeyManagerProps` gain `enabledProviders: readonly AiProvider[]`
  (array of ids, mirrors `providers`). `ApiKeySavedList` renders a plain-text "Disabled" chip next to a
  row absent from `enabledProviders` — `providers`/`savedProviders` untouched, so the row/Remove action
  stay present (@s5/@s6). New locale key `settings.apiKey.manager.disabled` (all 4 bundles).
- **task-7**: `useApiKeyManager` drops its `providers` arg entirely — `unsavedProviders` now derives
  from the new `enabledProviders` arg intersected with "not saved", never a re-derived `enabled` check.
  `useLessonGenerationForm` (study-buddy) switches from `useAiProviders().providers` to
  `.enabledProviders` for `savedProviderEntries`. `ApiKeyManagerRemove` unchanged (no `enabled` notion at
  all) — @s7 is a regression-lock test only.
- **task-8**: `ApiKeyErrorCode` widened with `provider_disabled`. `api-key.service.ts` gained
  `normalizeApiKeyError`/`readFunctionErrorCode`/`errorCodeFromBody` (mirrors
  `lesson-generation.service.ts`), replacing the blanket `catch { throw networkError() }` in
  `saveApiKey`/`removeApiKey`. `api-key.dao.ts` unchanged (`throw error` already raw). `use-api-key.ts`'s
  `API_KEY_ERROR_CODES` Set + `api-key-settings-screen.tsx`'s `API_KEY_ERROR_KEYS` gained the code.
- **task-9**: `GenerationErrorCode` widened with `provider_disabled`; `GENERATION_ERROR_CODES`,
  `GENERATION_ERROR_KEYS` (`generation.error.providerDisabled`), `GENERATION_ERROR_RECOVERY` (`'none'`,
  same family as `invalid_model`) all gained the code.
- **task-10**: regression-only, no production code — added unknown-provider assertions to
  `lesson-generation.service.test.ts` (@s13), `api-key.service.test.ts`/`api-key.dao.test.ts` (@s17/@s18),
  each asserting the mapped code itself stays `invalid_model`/`network_error`.
- New locale keys `settings.apiKey.error.providerDisabled` + `generation.error.providerDisabled`
  (distinct copy from `network_error`/`invalid_model`), all 4 bundles; `platform_key_unavailable` gets
  no new copy (Decision 10).

**Slice gate:** `@helsoft/types` 48, `@helsoft/supabase-services` 308 (+10), `@helsoft/hooks` 158 (+1),
`@helsoft/components` 500 (+9), `@helsoft/study-buddy` 310 (+6), `@helsoft/localization` 245 — all green.
`pnpm turbo run check-types` (repo-wide) clean. `pnpm turbo run lint` (repo-wide) clean after `biome
check --write` on touched workspaces (import/format only). No hardcoded strings/colors introduced; the
"Disabled" indicator uses `theme.colors.outline`/`onSurfaceVariant` + `theme.shape.chip`, no new tokens.
