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

## Slice 1, task-5 increment (`@s19` zero-regression fixture) — `reviewer_slice`, round 1

**Verdict: APPROVED**

Scope reviewed: `git show 465269403` only (task-5's diff, built after task-1..4 were already
approved above — that diff is not re-reviewed). Cross-checked against `task-5.md`, `tdd.md`'s
task-5 entries, `libs/types/src/ai-provider.ts` (`AI_PROVIDERS`/`AI_MODEL_REGISTRY`/
`API_KEY_SETTINGS_GUIDANCE_URLS`), and `libs/localization/src/resources/en.ts`.

No blocking findings.

### Verified correctness of the pinned fixture

- `libs/hooks/src/hooks/use-ai-providers.fixture.ts`'s `AI_PROVIDER_CATALOG_FIXTURE` — 6 providers/
  13 models — matches `AI_PROVIDERS`' canonical id order, `AI_MODEL_REGISTRY`'s per-provider model
  ids/vision flags/visionDefault, `API_KEY_SETTINGS_GUIDANCE_URLS`' URLs, and the resolved English
  model-label strings in `libs/localization/src/resources/en.ts` (e.g. `gptOss20b: 'GPT-OSS 20B'`,
  `v4Flash: 'DeepSeek V4 Flash'`) exactly, field by field, provider by provider.

### Requested spot-check — the two label-typo fixes left out of scope

Confirmed reasonable, not a latent bug requiring an in-scope fix now:
- `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts` (task-3/4, untouched by this
  commit — not in task-5's `paths`) still has `'GPT OSS 20B'`/`'GPT OSS 120B'` (no hyphen) and
  `'DeepSeek v4 Flash'`/`'DeepSeek v4 Pro'` (lowercase v), diverging from the real i18n resource
  strings that the new, correctly-pinned `AI_PROVIDER_CATALOG_FIXTURE` in `@helsoft/hooks` uses.
- Confirmed low-risk to defer: every existing assertion against that factory's typo'd labels
  (`lesson-generation.test.tsx:183,266,941,965`, `use-lesson-generation.test.ts:163-164`) is
  self-consistent — the mock's label is asserted against itself, never diffed against the real
  `en.ts` string — so the typo doesn't mask a production bug or a false-positive test; it's cosmetic
  test-fixture drift only.
- `task-5.md`'s Notes and the task-5 `tdd.md` entry both explicitly name this divergence and defer
  its retirement to task-9/12/13 (when the old factory is deleted in favor of this fixture) —
  consistent with Decision 13 and with not widening this round's scope beyond task-5's `paths`.

### Rule-by-rule pass (no violations found)

- `global.mdc` — kebab-case (`use-ai-providers.fixture.ts`), barrel-exported
  (`libs/hooks/src/hooks/index.ts`); the fixture's doc comment explains *why* (single source of
  truth, drift-prevention rationale, Decision 13 cite), not a restatement of *what* the array
  contains.
- `hooks-service-dao.mdc` / `tanstack-query.mdc` — no hook/service/DAO logic touched; existing
  `useAiProviders` query behavior unchanged.
- `atomic-design.mdc` / `component-split.mdc` / `state.mdc` / `state-sharing.mdc` — no components
  or local/shared state touched; N/A for this increment.
- `types.mdc` — the fixture file is a data constant (`.fixture.ts`), correctly not a `.types.ts`;
  no type declarations added outside `libs/types`.
- `i18n.mdc` — no new user-facing `t()`/labels/copy pattern introduced; catalog `name`/`label`
  fields are plain display data mirroring the DB, matching the pre-existing (task-1..4-approved)
  pattern, not translation keys.
- `tdd.mdc` — `use-ai-providers.fixture.ts` is non-UI `.ts`; `tdd.md`'s task-5 entry documents
  RED (new `@s19` test fails on missing module — "not importing counts as failing") → GREEN
  (minimal fixture added) → no refactor needed, satisfying strict TDD for this file. `@s19` maps to
  3 concrete tests (`use-ai-providers.test.ts`, `api-key-settings-screen.test.tsx`,
  `use-lesson-generation.test.ts`), one per migrated consumer, all sourced from the one fixture —
  matches the `@s → test` table. No hardcoded strings/colors/dimensions of the kind this rule
  guards against — the pinned values are intentionally-literal regression data, the documented
  purpose of this fixture. `tdd.md` is 7913 bytes, under the 8000-byte budget.
- `pre-slice-checklist.mdc` — new public symbol (`AI_PROVIDER_CATALOG_FIXTURE`) barrel-exported; no
  shared atom touched; `jest.mock('@helsoft/hooks', () => ({ ...jest.requireActual(...), ... }))` in
  both consumer test files correctly preserves the real fixture export through the partial mock (no
  breakage from the new barrel entry).
- `e2e.mdc` — no e2e files added or touched; the three new tests are unit tests (Jest +
  `@testing-library/react-native`), not Playwright — N/A.

### Design (`.agents/DESIGN.md`) / Accessibility (WCAG 2.2 AA)

**N/A** — this is a test-only/fixture commit (a data constant, its consuming unit tests, a
Storybook mock swap, and doc updates). No `.tsx` production component, style, or markup changed;
the Storybook mock swap (`'.storybook/mocks/hooks.ts'`) only changes which data a mock hook returns
in tests/stories, not any rendered UI, role, or label.

