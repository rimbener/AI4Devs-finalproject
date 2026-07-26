# Slice review — ai-provider-registry-frontend

## Slice 1 (task-1..4) — `reviewer_slice`, round 1

**Verdict: APPROVED**

Scope reviewed: `git diff ff58376c3~1 8e0691854` (task-1 catalog types/DAO/service → task-2
`useAiProviders` → task-3 settings-screen wiring → task-4 generate-flow wiring), against every
rule in `.agents/rules/*.mdc`, `.agents/DESIGN.md`, and WCAG 2.2 AA, cross-checked against
`spec.md`/`gherkin-scenarios.md`/`task-1.md`…`task-4.md`/`tdd.md`.

No findings. Zero blockers.

### Spec-drift double-check (explicitly requested) — all confirmed matching the final, corrected spec

- `AiProvidersDao.getCatalog()` (`libs/supabase-services/src/dao/ai-providers.dao.ts`): single
  `select('*, ai_provider_models(*)')`, zero `.order()` calls, raw snake_case passthrough, no
  mapping. `ai-providers.dao.test.ts` asserts `select` has no chainable `.order` (a DAO that called
  it would throw) and pins the raw-row-shape/null/error-passthrough behavior.
- `AiProvidersService.getCatalog()` (`libs/supabase-services/src/services/ai-providers.service.ts`):
  owns 100% of the camelCase mapping and the two-level `sort_order` sort (provider level +
  each provider's nested `models`); catches DAO throws to `[]` (Decision 11).
  `getEnabledCatalog()` exists, calls `getCatalog()` internally, filters `enabled === true` — unused
  by the hook, exactly as Decision 2 specifies.
- `useAiProviders()` (`libs/hooks/src/hooks/use-ai-providers.ts`): exposes a hook-computed
  `enabledProviders` field (`useMemo(() => providers.filter((p) => p.enabled), [providers])`) —
  no downstream consumer re-derives its own `enabled` filter for "choosable providers" duty (that
  duty is task-7's per its own scope, but the hook field itself is already in place per Decision 2).
  `isLoading` correctly uses `useSessionGate().deriveIsLoading(isPending)`, not raw `isPending`.
  `AI_PROVIDERS_QUERY_KEY` exported, `staleTime: Infinity`, defaults `providers: []`.

### Rule-by-rule pass (no violations found)

- `global.mdc` — kebab-case filenames, `Props`/args types on every touched component, functional
  React only, no Redux, barrels updated (`libs/types/src/index.ts`, `libs/supabase-services/src/dao
  /index.ts` + `services/index.ts`, `libs/hooks/src/hooks/index.ts`). Comments explain *why*
  (catalog-vs-Edge-Function distinction, Decision citations), not *what*.
- `hooks-service-dao.mdc` — layering intact: `ApiKeySettingsScreen`/`useLessonGenerationForm` are
  the only two `useAiProviders()` callers (Decision 12); `ApiKeyManager`/`ApiKeySavedList`/
  `ApiKeyFormDialog`/`ProviderSelector`/`ModelSelector` stay presentational, receiving catalog data
  as props. DAO has zero mapping/sorting/error-mapping; Service owns all of it; hook wraps the
  Service, never the DAO.
- `tanstack-query.mdc` — `useAiProviders` follows the required `useQuery` pattern (exported key,
  `staleTime: Infinity` reference-data precedent mirrors `use-session.ts`); `useLessonGenerationForm`
  correctly stays off `useQuery`/`useMutation` per its pre-existing, still-valid Exemptions-section
  entry (one-shot preference read, unrelated to the catalog read it now also consumes).
- `state-sharing.mdc` / `state.mdc` — no new prop-drilling depth introduced; `useApiKeyManager`'s
  existing `useReducer` (≥3 related fields) untouched in shape, only gains a `providers` param.
- `atomic-design.mdc` — no ad-hoc colors/spacing/typography (`git diff` shows every new/changed
  style using `theme.*` tokens only); every touched organism/molecule already has a co-located
  `.stories.tsx`, updated to the new `providers`/`providerNames` prop shape.
- `component-split.mdc` — `use-lesson-generation.ts` (hook)/`lesson-generation.helpers.ts`
  (pure)/`lesson-generation.tsx` (JSX+handlers) split preserved; handlers stay in the `.tsx`,
  `isAiProvider`/`isCuratedModel`/`resolveGenerationSelection` stay pure in `.helpers.ts`.
- `types.mdc` — `AiProviderCatalogEntry`/`AiProviderCatalogModel` added to `libs/types/src/ai-
  provider.ts` (exported type only, no runtime logic in that block); `RawProviderRow` is correctly
  DAO-local (not shared), matching the rule's "DAO's own row type, distinct from the Service's
  output type" note in task-1.
- `i18n.mdc` — `ModelSelector`/`ProviderSelector` now render `model.label`/`provider.name` as plain
  catalog strings (no `t()`, matching Decision 3's non-goal on localized names — correct, not a
  violation, since these are display data, not translatable UI chrome). Every remaining
  user-facing string still goes through `t()`. No `labels`/`copy` object of pre-resolved calls
  introduced; `API_KEY_ERROR_KEYS`/`GENERATION_ERROR_KEYS` key dictionaries are pre-existing,
  untouched by this slice, and already conform to the allowed-exception shape.
- `tdd.mdc` — non-UI `.ts` (`ai-providers.dao.ts`/`.service.ts`, `use-ai-providers.ts`, `lesson-
  generation.helpers.ts`) shows Red→Green→Refactor evidence in `tdd.md`; UI `.tsx` files follow
  impl-first → stories → (pre-existing) e2e → unit-test order, all four present. Every `@s` this
  slice owns (s1, s2, s3, s4, s10, s11) maps to a concrete test per the `@s → test` table. No
  hardcoded strings/colors/dimensions found in the diff. `tdd.md` is 6133 bytes, under the 8000
  budget.
- `pre-slice-checklist.mdc` — no shared atom edited (confirmed: `libs/components/src/atoms` has
  zero diff in this slice); barrels updated for every new public symbol; no `AccessibilityInfo`
  direct calls; tests run via `pnpm --filter <ws> test` per `tdd.md`'s Slice gate section.
- `e2e.mdc` — no e2e files touched in this slice (task-3/task-4 only changed props on already-
  e2e-covered organisms); `tdd.md` confirms the pre-existing interaction e2e specs were re-run
  green, not modified — no render-only e2e added.

### Design (`.agents/DESIGN.md`)

No new UI states or visual elements introduced — this slice re-sources existing chrome's data
(names/links/order/models) from the catalog. All touched `StyleSheet.create` blocks in the diff use
`theme.spacing.*`/`theme.typography.*`/`theme.colors.*` exclusively; no ad-hoc values.

### Accessibility (WCAG 2.2 AA)

- Interactive elements retain their existing roles/labels (`accessibilityRole="header"`, `role=
  "radio"`/`"button"` via `RadioGroup`/`Button` atoms, `accessibilityLabel` on Replace/Remove
  buttons built from the catalog's plain `name` instead of a translated key — still a real,
  non-empty label per row).
- No color-only signaling introduced by this slice (the "Disabled" indicator itself is task-6/
  task-7 scope, not built here — nothing to check yet).
- `api-key-settings-screen.test.tsx`/`use-lesson-generation.test.ts`/`lesson-generation.test.tsx`
  assert against `getByRole`/`getByLabelText` throughout, not implementation detail — roles/labels
  are exercised, not just presence.
- Loading state unchanged (existing spinner/disabled-picker affordance reused, per spec's UI-states
  table — no new loading UI to announce).

## Slice 2/3 (disabled-provider indicator, error-code widening, locale copy, dead-code cleanup)

Out of scope for this round — not yet built.
