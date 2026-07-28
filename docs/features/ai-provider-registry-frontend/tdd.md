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
- **task-11**: deleted `AI_PROVIDERS`/`AI_MODEL_REGISTRY`/`api-key-settings.ts` registry outright;
  consumers derive ids from `AI_PROVIDER_CATALOG_FIXTURE`/`providerNames`. Zero grep hits outside
  docs. `@helsoft/types` 38 (was 48, deleted registry tests).
- **task-12**: 2 new `use-ai-providers.test.ts` cases (reorder, rename/guidanceUrl) via
  `invalidateQueries`, same mounted hook. `@helsoft/hooks` 160 (+2).
- **task-13**: new `ai-providers.integration.test.ts` — real hooks, only Supabase client boundary
  mocked; barrel-exported `useApiKeyManager`. `@helsoft/study-buddy` 311 (+1).
- **task-14**: wrap-up sweep, no new behavior; s19/s23 re-hold on final diff.

**Slice 3 gate:** `@helsoft/types` 38, `@helsoft/hooks` 160 (+2), `@helsoft/supabase-services` 308,
`@helsoft/components` 500, `@helsoft/study-buddy` 311 (+1), `@helsoft/localization` 245 — all
green. `pnpm turbo run check-types`/`lint` clean, full repo, all 14 packages. Repo-wide grep for
`AI_PROVIDERS`/`AI_MODEL_REGISTRY`/`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS`/
`aiModel.`/`settings.apiKey.provider.`: zero matches outside `docs/`/`user-stories/` planning
documents. Feature complete — all 14 tasks `done`.

## Review round 1 fixes (reviews_lead findings)
- **[major] duplicated catalog fixture**: `ai-provider-test-factories.ts` no longer hand-copies
  the catalog; imports `AI_PROVIDER_CATALOG_FIXTURE` from `@helsoft/hooks`, rebuilds
  `aiProvidersValue()` on top of it. Fixed 6 typo'd-label assertions (`GPT OSS` → `GPT-OSS`) in
  `use-lesson-generation.test.ts`/`lesson-generation.test.tsx` that had accidentally pinned the
  drifted (wrong) label. `@helsoft/study-buddy` 312 (net 0, one factory file shrank, no new tests
  needed here).
- **[minor] unmemoized derivations**: `api-key-settings-screen.tsx` wraps `providerIds`/
  `enabledProviderIds`/`providerNames`/`guidanceUrls` in `useMemo`. New test (impl-first, UI):
  `api-key-settings-screen.test.tsx` "keeps the derived provider props referentially stable across
  re-renders" — captures `ApiKeyManager` props via a partial `@helsoft/components` mock, asserts
  `toBe` identity across a forced re-render. Confirmed it fails pre-fix, passes post-fix.
  `@helsoft/study-buddy` 312 (+1).
- **[minor] unchecked DAO→Service cast**: `ai-providers.service.ts` adds `isValidProviderRow`
  (row-level type-predicate narrowing `row.id: string` to `AiProvider`) before `mapEntry`; a row
  failing it is filtered out of `getCatalog()` (Decision 11 degrade-gracefully precedent) — no
  cross-layer import from `study-buddy`'s `isAiProvider` (layering: `study-buddy` depends on
  `supabase-services`, not reverse). RED→GREEN: new test "filters out a row whose id is not a
  member of the AiProvider union" in `ai-providers.service.test.ts`, confirmed failing before the
  guard existed. `@helsoft/supabase-services` 309 (+1).

**Round 1 gate:** `@helsoft/study-buddy` 39 suites/312 tests green; `@helsoft/supabase-services` 37
suites/309 tests green; `pnpm turbo run lint`/`check-types` clean for both workspaces; `pnpm
format` no-op (already clean).
