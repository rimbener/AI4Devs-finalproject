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

## Slice 2 (task-6..10) — `reviewer_slice`, round 1

**Verdict: CHANGES_REQUESTED**

Scope reviewed: `git show e47a6cfdd` (task-6 disabled-provider indicator → task-7
enabled-providers picker filtering → task-8 `ApiKeyErrorCode` widening → task-9
`GenerationErrorCode` widening → task-10 unknown-provider regression proof), against every rule
in `.agents/rules/*.mdc`, `.agents/DESIGN.md`, and WCAG 2.2 AA, cross-checked against
`spec.md` (Decisions 5/8/9/10), `gherkin-scenarios.md` (`@s5`-`@s9`, `@s12`-`@s18`, `@s22`),
`task-6.md`…`task-10.md`, and `tdd.md`'s slice-2 `@s → test` map.

2 findings, both blocking per this gate's zero-minors policy. Both fixed post-round (no
re-review per the one-round slice gate) — see `[resolved]` notes below.

### Findings

1. **`[atomic-design]` [resolved]** — `api-key-saved-list.tsx`'s disabled indicator now composes
   `<Chip label={t('settings.apiKey.manager.disabled')} />` (no `onPress`, static label variant)
   instead of hand-rolled border/radius/typography; the now-unused `disabledIndicator` style was
   dropped (`statusRow` stays — it's the still-needed row layout for `savedStatusLabel` + `Chip`,
   not part of the ad-hoc reimplementation). Slice gate re-run green.

   **Original finding** —
   `libs/components/src/molecules/api-key-saved-list/api-key-saved-list.tsx:90-99` (the new
   `disabledIndicator` style: `borderWidth: 1`, `borderColor: theme.colors.outline`,
   `borderRadius: theme.shape.chip`, label typography, wrapped in a plain `<Text>`) hand-rolls the
   exact visual the design system already names and ships as an atom: `.agents/DESIGN.md`'s atom
   table lists `Chip` (`libs/components/src/atoms/chip/chip.tsx`) and its own corner-radii section
   defines "chips 8px" — precisely the `theme.shape.chip` value this new style reaches for
   directly instead of composing `<Chip label={t('settings.apiKey.manager.disabled')} />`. This is
   an ad-hoc reimplementation of an existing atom's border/radius/color/typography combination
   inside a molecule, which `atomic-design.mdc` requires reusing rather than recreating — even
   though `Chip` currently has no other production consumer, that doesn't license a second,
   independent copy of its markup; it's the first real use case for it. Composing `Chip` (no
   `onPress`, so it renders as the static, non-interactive label variant) would satisfy `@s5`/`@s22`
   identically while removing the duplicated token wiring. Fix: replace the `View`+`Text` pair at
   `api-key-saved-list.tsx:38-47` with `<Chip label={t('settings.apiKey.manager.disabled')} />` (or
   equivalent), drop the now-unused `statusRow`/`disabledIndicator` styles, and re-run
   `api-key-saved-list.test.tsx`'s `getByText('Disabled')`/`.props.children` assertions (a `Chip`'s
   label still renders as real text content, so `@s22`'s non-color-only assertion still holds).

2. **`[global.mdc]` [resolved]** — `use-lesson-generation.ts:23`'s doc comment now cites
   "task-7, @s9" (was "task-9, @s9"), matching `task-7.md`'s `scenarios`/`paths`.

   **Original finding** (comment the *why*, traceability) —
   `libs/study-buddy/src/components/lesson-generation/use-lesson-generation.ts:23` attributes the
   `enabledProviders`-sourced `savedProviderEntries` derivation to "task-9, @s9" in its doc comment.
   `@s9` is task-7's scenario (`task-7.md`'s `scenarios: [s7, s8, s9]`), and
   `use-lesson-generation.ts` is listed under task-7.md's `paths`, not task-9.md's (task-9 only
   touches `lesson-generation.ts`/`.service.ts`/`.helpers.ts` types+copy for `provider_disabled`,
   per its own `paths` list). The comment's task attribution is wrong, which undermines the
   `@s`↔task↔file traceability this feature's docs otherwise maintain precisely. Low severity but
   still incorrect provenance in a durable comment — fix: change "task-9, @s9" to "task-7, @s9" at
   that line.

### Confirmed correct (no other findings)

- **Decision 5 asymmetry, exactly as specced**: `ApiKeySavedList`/`ApiKeyManager` (task-6) keep a
  disabled provider's row/key/Remove visible and reachable — `enabledProviders` never filters
  `savedKeys`/`savedProviders`/`providers` in either component (`api-key-saved-list.tsx`,
  `api-key-manager.tsx`) — while `useApiKeyManager.unsavedProviders` (task-7,
  `use-api-key-manager.ts:56-63`) and `useLessonGenerationForm.savedProviderEntries` (task-7,
  `use-lesson-generation.ts:29-35`) both derive purely from the threaded-in `enabledProviders`
  intersected with their own "not saved"/"has key" condition — **never a `p.enabled` check
  re-derived inline**. Confirmed via `grep -rn "\.enabled\b"` across `libs/components/src`,
  `libs/study-buddy/src`, `libs/hooks/src`: the only `.enabled` predicate outside comments/tests is
  `use-ai-providers.ts:35`'s single, hook-level `providers.filter((p) => p.enabled)` — the sole
  source of truth this slice's spec Decision 2/5 requires.
- **`@s22` (non-color-only)**: the "Disabled" indicator renders as real, localized `<Text>` content
  (`t('settings.apiKey.manager.disabled')`), asserted in `api-key-saved-list.test.tsx` via both
  `getByText('Disabled')` and `indicator.props.children === 'Disabled'` — genuinely perceivable
  without color, satisfying WCAG 1.4.1 (independent of finding #1's atom-reuse fix, which preserves
  this).
- **`@s7`**: `ApiKeyManagerRemove` carries zero notion of `enabled` (component itself untouched in
  this diff, only its test gained a case) — confirmed the confirm action is ungated for a
  disabled/keyed provider (`api-key-manager-remove.test.tsx`'s new case).
- **Task-8/9 error-code widening** — `ApiKeyErrorCode`/`GenerationErrorCode` both correctly widened
  in `libs/types`; `api-key.service.ts`'s new `normalizeApiKeyError`/`readFunctionErrorCode`/
  `errorCodeFromBody` faithfully mirror `lesson-generation.service.ts`'s existing
  `normalizeGenerationError` pattern (closed `Record<Code, true>` guard, `FunctionsHttpError` body
  read via `.context.json()`, fallback to `network_error`/`generation_failed` respectively,
  `FunctionsFetchError`/`FunctionsRelayError` always `network_error`); `api-key.dao.ts` unchanged —
  `throw error` already re-throws the raw Supabase error, satisfying task-8's re-throw requirement
  without a DAO change. `use-api-key.ts`'s `API_KEY_ERROR_CODES` Set and
  `api-key-settings-screen.tsx`'s `API_KEY_ERROR_KEYS` both gained `provider_disabled`; `lesson-
  generation.helpers.ts`'s `GENERATION_ERROR_KEYS`/`GENERATION_ERROR_RECOVERY` gained
  `provider_disabled` → `'generation.error.providerDisabled'` / `'none'` (Decision 9, same family as
  `invalid_model`).
- **Task-10 regression proof** — `lesson-generation.service.test.ts` (`@s13`),
  `api-key.service.test.ts`/`api-key.dao.test.ts` (`@s17`/`@s18`) each assert the *mapped code
  itself* (`invalid_model`/`network_error`), not just "no throw" — a silent misclassification would
  fail these tests, per the task's own done-criterion.
- **Decision 10** — grepped the full diff for `platform_key_unavailable`: no new locale key, no new
  copy, no code change to that path — only a new regression test in
  `lesson-generation.service.test.ts`'s existing `it.each` table (unaffected by the widening).
- **i18n.mdc** — every new string added inline via `t('ns.key')` call sites
  (`settings.apiKey.manager.disabled`, `settings.apiKey.error.providerDisabled`,
  `generation.error.providerDisabled`), translated in all four bundles (en/es/pt/de) in this same
  commit; `API_KEY_ERROR_KEYS`/`GENERATION_ERROR_KEYS` remain the allowed code→key dictionaries
  (mapping normalized codes to keys, not pre-resolved `t()` calls).
- **tdd.mdc** — non-UI `.ts` (types, services, hooks, helpers) shows Red→Green evidence via the new
  regression/widening tests; UI `.tsx` (`ApiKeySavedList`, `ApiKeyManager`) followed impl → stories
  (`DisabledProvider` story added to both) → unit tests (interaction e2e unaffected/unneeded — the
  indicator itself has no interaction, and the add-picker filtering is exercised by existing
  Storybook/e2e-covered flows, not a new interactive surface). Every `@s` this slice owns (`s5`-`s9`,
  `s12`-`s18`, `s22`) maps to ≥1 concrete test per `tdd.md`'s table. `tdd.md` is 5895 bytes, under
  budget.
- **e2e.mdc** — no new `.e2e.js` added; none of this slice's behavior is a new interaction flow (the
  indicator is informative-only; picker filtering is exercised through existing, already-interactive
  Storybook/e2e-covered add/generate flows) — consistent with "a component with no interaction gets
  no e2e."
- **hooks-service-dao.mdc / tanstack-query.mdc** — layering intact; `useApiKey`'s
  `useQuery`/`useMutation` structure is unchanged by this slice (only the error-code `Set` gained a
  member); components stay presentational, only `ApiKeySettingsScreen`/`useLessonGenerationForm`
  call `useAiProviders()` (Decision 12).
- **state.mdc / state-sharing.mdc / component-split.mdc / types.mdc** — no new local state, no new
  prop-drilling depth, existing splits preserved, new fields added to existing `.types.ts` files
  only.
- **Design tokens** — every new/changed style in the diff (aside from finding #1's atom-reuse issue)
  uses `theme.*` tokens exclusively; no new ad-hoc colors/spacing/typography introduced.

### Accessibility (WCAG 2.2 AA)

- `@s22` satisfied as noted above (real text content, not color-only) — holds regardless of
  finding #1's fix (a `Chip`'s label is still real text).
- Touch targets: the "Disabled" indicator is informative-only (no `onPress`), so the 44pt/48dp
  minimum doesn't apply to it; Replace/Remove buttons are unchanged by this slice.
- Contrast: the indicator reuses `theme.colors.onSurfaceVariant` on the existing card background —
  the same color/background pairing already used for the adjacent `savedStatusLabel` text in the
  same row (approved in slice 1), so no new contrast risk introduced.
- Error-state announcements: `provider_disabled` copy renders through each consumer's existing
  error-banner slot (`ApiKeySettingsScreen`'s `errorMessage`, generation panel's error state) — no
  new UI shell, so the existing announcement behavior for that slot carries over unchanged.
- `api-key-saved-list.test.tsx`/`api-key-manager.test.tsx`/`api-key-settings-screen.test.tsx` assert
  the indicator/error copy via `getByText`/`getByRole`, not implementation detail.

## Slice 3 (task-11..14, final slice) — `reviewer_slice`, round 1 — 2026-07-26

**Verdict: APPROVED**

Scope reviewed: `git show bbde00928` (task-11 dead-constant/locale-key deletion → task-12
reorder/rename propagation proof → task-13 cross-layer integration test → task-14 wrap-up sweep),
against every rule in `.agents/rules/*.mdc`, `.agents/DESIGN.md`, and WCAG 2.2 AA, cross-checked
against `spec.md` (Decisions 1-3, 12, 13), `gherkin-scenarios.md` (`@s20`, `@s21`, `@s23`),
`task-11.md`…`task-14.md`, and `tdd.md`'s slice-3 `@s → test` map.

No blocking findings.

### Independent verification of task-11/14's grep + check-types claims (re-run myself, not trusted blind)

- Repo-wide grep for `AI_PROVIDERS`, `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`,
  `API_KEY_SETTINGS_GUIDANCE_URLS`, `aiModel.`, `settings.apiKey.provider.` across all `.ts`/`.tsx`
  (excluding `node_modules`): **zero matches**. A second, unfiltered pass confirms the only
  remaining hits anywhere in the tree are historical planning docs (`docs/features/**`,
  `user-stories/**`) — exactly the claimed exception, nothing else. `@s23` genuinely holds.
- `pnpm turbo run check-types` (all 14 packages, repo-wide): all cached green, `FULL TURBO`
  — confirms task-14's own criterion, no compile fallout from deleting
  `libs/types/src/api-key-settings.ts` or the two `ai-provider.ts` constants.
- `pnpm turbo run lint` on the 6 touched workspaces: clean, no fixes applied.
- `pnpm turbo run test` re-run for all 6 touched workspaces: counts match `tdd.md`'s claimed
  gate exactly — `@helsoft/types` 38, `@helsoft/hooks` 160 (+2), `@helsoft/supabase-services` 308,
  `@helsoft/components` 500, `@helsoft/study-buddy` 311 (+1), `@helsoft/localization` 245 — all
  passed, no skips.
- `libs/study-buddy/.storybook/mocks/hooks.ts` and `libs/activities/.storybook/mocks/hooks.ts`
  (the files task-11's own Notes flagged as easy-to-miss, uncovered by `pnpm test`): grepped
  directly, zero references to any deleted constant.

### Rule-by-rule pass (no violations found)

- `global.mdc` — kebab-case preserved; every touched comment explains *why* the old name is gone
  (task-11 cite) rather than restating *what* the surrounding code does — verified across
  `ai-provider.ts`, `lesson-generation.ts`, `use-lesson-generation.ts`, `provider.ts` (Deno),
  `use-ai-providers.fixture.ts`, `ai-provider-test-factories.ts`. No new component added, so no new
  Storybook-story obligation from this slice.
- `hooks-service-dao.mdc` — task-13's integration test mocks only the Supabase client boundary
  (`client.from('ai_providers').select`), never `useAiProviders`/`useApiKeyManager`/
  `useLessonGenerationForm` themselves, so the real Hook→Service→DAO chain is what's actually
  exercised, per its own done-criteria. `useApiKeyManager` is a local-state hook (`useReducer` +
  derived `useMemo`s, no service/DAO call of its own) — barrel-exporting it from
  `organisms/index.ts` does not introduce a new data-fetching entry point or bypass the layering;
  it stays a UI-state hook, now just reachable outside its own component folder. Scope of the
  export is a single named hook (one line), added solely because task-13's cross-layer test (in a
  different workspace, `@helsoft/study-buddy`) needs the real hook, not a re-mock of it — reasonable
  and narrowly-scoped, not a broad internals-to-public sweep. D12 ("components stay presentational")
  is unaffected: `ApiKeySettingsScreen`/`useLessonGenerationForm` remain the only two
  `useAiProviders()` callers; nothing here adds a third.
- `tanstack-query.mdc` — task-12's two new `use-ai-providers.test.ts` cases and task-13's
  integration test both wrap `renderHook` in a real `QueryClientProvider` and use `waitFor`; the
  reorder/rename cases drive the change via `queryClient.invalidateQueries` on the *same* mounted
  hook/`QueryClient` (no remount, no second `QueryClient`) — exactly what's needed to falsify a
  hypothetical module-level memoization ahead of `useQuery`, per task-12's own done-criteria.
- `state-sharing.mdc` / `state.mdc` — no new local or shared state introduced this slice; N/A.
- `atomic-design.mdc` — no new/changed component markup or styles in this slice (pure deletion +
  test files); N/A for token/atom reuse this round.
- `component-split.mdc` — `use-api-key-manager.ts`'s existing split (hook/reducer/component)
  untouched in shape; only its barrel visibility changed.
- `types.mdc` — `libs/types/src/api-key-settings.ts` deleted outright (was export-only, no runtime
  logic — correctly a `.ts` under `libs/types`, not a `.types.ts`, per the pre-existing convention
  for that lib); `ai-provider.ts` keeps only the `AiProvider` union + the already-approved
  `AiProviderCatalogEntry`/`Model` types, no runtime constant left behind. `UseApiKeyManagerArgs` in
  `use-api-key-manager.ts` stays un-exported (single-file-local type, correctly not lifted to a
  `.types.ts` since it's private) — the barrel change exports only the function.
- `i18n.mdc` — `aiModel.*`/`settings.apiKey.provider.*` removed from all four bundles (en/es/pt/de),
  symmetrically, key-for-key; no `labels`/`copy` pre-resolved-`t()` dictionary reintroduced;
  `migration-coverage.test.ts` re-run green with no code change needed (it flattens `en.ts`
  dynamically, confirmed by direct test run — 19/19 passing).
- `tdd.mdc` — task-12/13 are non-UI `.ts` test files (hook test, cross-layer integration test) →
  strict-TDD lane; task-12 adds test cases only, explicitly no production change (per its own Notes
  and confirmed by the diff — `use-ai-providers.ts` itself is untouched in this commit), which is
  consistent with the Three Laws (a passing assertion against already-correct production code is
  not a TDD violation when the task's own scope says "prove", not "build"). Task-13's integration
  test is the one test in the whole feature explicitly licensed to span three modules
  (`libs/hooks`/`@helsoft/components`/`libs/study-buddy` local hook), per its own Notes citing
  `libs/hooks`' one-directional dependency graph — verified correct: `libs/hooks/package.json` has
  no dependency on `@helsoft/components` or `@helsoft/study-buddy`, confirming the test could only
  live where it was placed. `@s20`/`@s21`/`@s23` each map to ≥1 concrete test per the `@s → test`
  table; task-14 owns no new scenario (wrap-up only), correctly reflected in its own frontmatter
  (`scenarios: []`). `tdd.md` is 6523 bytes, under the 8000-byte budget, terse log style maintained
  (no pasted diffs/test bodies).
- `pre-slice-checklist.mdc` — new public symbol (`useApiKeyManager` from `organisms/index.ts`)
  barrel-exported; no shared atom touched (diff has zero `libs/components/src/atoms` changes); no
  `AccessibilityInfo` direct calls introduced; tests run via `pnpm turbo run test`/`pnpm --filter`,
  never `yarn test-ci`.
- `e2e.mdc` — no `.e2e.js` files added or touched this slice; none of task-11-14's changes are a new
  interactive UI surface (deletions, a hook-level reorder test, and a hook-level integration test) —
  consistent with "a component with no interaction gets no e2e," and no render-only e2e was added
  in its place.

### Design (`.agents/DESIGN.md`) / Accessibility (WCAG 2.2 AA)

**N/A** — this slice touches zero rendered UI (`.tsx` markup/styles unchanged outside comment
edits); it is entirely type/constant deletion, locale-key deletion, and two new non-UI `.ts` test
files (a hook unit test and a hook-level cross-layer integration test). No new component, role,
label, color, or touch target introduced or at risk. `@s22` (non-color-only "Disabled" indicator)
was already discharged and unaffected in slice 2 — confirmed by an unchanged `@helsoft/components`
test count (500, identical to slice 2's post-fix total) and zero diff under
`libs/components/src/molecules/api-key-saved-list/api-key-saved-list.tsx` in this commit.

### Feature-level wrap-up confirmed

- `tasks.md`/every `task-N.md` frontmatter shows `status: done` for all 14 tasks; no `todo`/
  `in_progress` remaining.
- `AiProviderCatalogEntry`/`AiProviderCatalogModel` (`@helsoft/types`), `AiProvidersDao`/
  `AiProvidersService` (`@helsoft/supabase-services`), `useAiProviders`/`AI_PROVIDERS_QUERY_KEY`
  (`@helsoft/hooks`) all confirmed reachable from their workspace's public barrel via direct grep
  against each `index.ts` (all resolve through pre-existing `export * from './ai-provider'` /
  `'./ai-providers.dao'` / `'./ai-providers.service'` / `'./use-ai-providers'` wildcard lines — no
  barrel omission).
- Feature is ready for `reviews_lead`'s full review + `mutation_tester`'s StrykerJS pass.
