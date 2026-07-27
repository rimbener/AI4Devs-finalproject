# Full review — ai-provider-registry-frontend

Durable consolidated record. Every finding — any severity — stays listed here across rounds,
marked `open`/`resolved`/`ACCEPTED`. Never emptied.

## Round 1

**CI:** green. `pnpm turbo run lint` (scoped to touched workspaces: types, supabase-services,
hooks, components, study-buddy, localization) — clean, no fixes applied. `pnpm turbo run
check-types` (repo-wide, all 14 packages) — clean, `FULL TURBO`. `pnpm turbo run test` (scoped to
the 6 touched workspaces, `--output-logs=errors-only`) — all green, counts match `tdd.md`'s claimed
totals exactly (`@helsoft/types` 38, `@helsoft/hooks` 160, `@helsoft/supabase-services` 308,
`@helsoft/components` 500, `@helsoft/study-buddy` 311, `@helsoft/localization` 245).
`@helsoft/components` e2e (Playwright, serialized `--workers=1`, the two touched organisms
`api-key-manager`/`lesson-generation-panel`) — 19/19 passed, no flake.

**Scoped out as pre-existing debt (not this feature's fault):** `@helsoft/study-buddy` e2e is
entirely blocked — confirmed root cause is `libs/components/src/organisms/web-bottom-tabs/
web-bottom-tabs.tsx` importing `expo-router/ui`, which Storybook's Vite dev server cannot resolve,
breaking the *entire* study-buddy Storybook preview bundle (every story's iframe fails, including
`app-chrome`/`fill-in-the-blank-activity` — stories this feature never touched). This predates the
feature (already flagged in `tdd.md`'s slice-1 summary) and nothing in this feature's diff touches
`web-bottom-tabs.tsx` or `expo-router`. Covered instead by this feature's own green unit +
integration tests (`ai-providers.integration.test.ts`, `lesson-generation.integration.test.tsx`,
`api-key-settings-screen.test.tsx`, etc.). This is systemic Storybook/expo-router-ui infra debt,
not scoped to this feature — flagging here per protocol so it isn't silently absorbed; the durable
fix (a one-time resolution/alias fix for `expo-router/ui` under the study-buddy Storybook Vite
config, or the `web-bottom-tabs` organism moving off it) is out of this feature's scope.

**Reviewer:** `reviewer_engineering` (sole full reviewer — code · architecture · performance ·
security). Design & accessibility not in scope here — already covered per slice by
`reviewer_slice` (`review-slice.md`: slice 1 zero-finding APPROVED, slice 2 two findings both
resolved same-round, slice 3 zero-finding APPROVED). Full detail: `review-engineering.md`.

**Verdict: CHANGES_REQUESTED** (one major, two minors — all three block per this gate's
zero-severity-tolerance policy).

### Findings

1. **[major] [code] — resolved (round 2)** — duplicated, hand-copied, drifted catalog fixture.
   `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts:10-150` hand-copies the entire
   `AI_PROVIDER_CATALOG_FIXTURE` catalog (6 providers/13 models) instead of importing the canonical
   one from `libs/hooks/src/hooks/use-ai-providers.fixture.ts:15-161`. The two copies have already
   diverged: `ai-provider-test-factories.ts:20` `'GPT OSS 20B'` (no hyphen) vs.
   `use-ai-providers.fixture.ts:25` `'GPT-OSS 20B'` (hyphen, matches `en.ts`);
   `ai-provider-test-factories.ts:136` `'DeepSeek v4 Flash'` (lowercase v) vs.
   `use-ai-providers.fixture.ts:147` `'DeepSeek V4 Flash'` (uppercase V, matches `en.ts`).
   `use-ai-providers.fixture.ts:11-13`'s own doc comment: *"a second, independently-typed mock
   catalog would be exactly the kind of drift risk this fixture exists to prevent. Do not hand-copy
   these values elsewhere; import this instead."* — violated inside the same feature that wrote the
   warning. `libs/study-buddy/package.json:24` already depends on `@helsoft/hooks`, so importing the
   real fixture was available and unused (`.storybook/mocks/hooks.ts:27` already does this
   correctly). This was an explicitly-promised cleanup — `review-slice.md`'s slice-1/task-5 round
   flagged the same two typos and deferred retirement "to task-9/12/13 (when the old factory is
   deleted in favor of this fixture)" — that never landed: task-11/12/13's commit (`bbde00928`)
   only edited a comment in this file (`ai-provider-test-factories.ts:8`), not the duplicated data;
   task-14's wrap-up sweep doesn't mention it either. Impact today is contained (the actual `@s19`
   no-regression assertions in `api-key-settings-screen.test.tsx:278-310`,
   `use-lesson-generation.test.ts:44-73`, `use-ai-providers.test.ts:112-133` all correctly import
   and diff against the real `@helsoft/hooks` fixture — the duplicated/typo'd factory is only used
   where exact labels aren't asserted), but it's a live, unresolved second source of truth that will
   silently start masking real drift the next time only one copy is edited.
   **Round 2 disposition:** `ai-provider-test-factories.ts` now imports `AI_PROVIDER_CATALOG_FIXTURE`
   from `@helsoft/hooks` (barrel-verified) instead of hand-copying it; `aiProvidersValue()` rebuilt
   on the imported fixture. The 6 assertions that had pinned the drifted/typo'd labels
   (`use-lesson-generation.test.ts:223-224`, `lesson-generation.test.tsx:183,266,941,965`) were
   fixed to `'GPT-OSS ...'`, matching the real migration seed. `reviewer_engineering` independently
   verified the fix (not just trusting the implementer's report) and confirmed genuine — single
   source of truth restored for the two files actually in scope. Residual, non-blocking,
   informational-only observation carried forward: `lesson-generation.helpers.test.ts:22,29` and
   `lesson-generation.integration.test.tsx:25` still hand-roll their own local, self-contained
   `'GPT OSS ...'` literals (untouched by this feature, self-consistent, no drift/masking risk
   today) — not a blocking finding, a candidate for a future cleanup ticket if this feature area is
   revisited.

2. **[minor] [perf] — resolved (round 2)** — fresh object/array literals recomputed every render,
   unmemoized.
   `libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx:37-50`
   recomputes `providerIds`/`enabledProviderIds`/`providerNames`/`guidanceUrls` (4 new array/object
   allocations via `.map`/`Object.fromEntries`) on every render, flowing as props into
   `ApiKeyManager` → `ApiKeySavedList`/`ApiKeyFormDialog` (none `memo`-wrapped). Pre-migration these
   were module-level constants (referentially stable across renders — was
   `guidanceUrls={API_KEY_SETTINGS_GUIDANCE_URLS}` / `providerNameKeys={PROVIDER_NAME_KEYS}`). Not a
   hot path today (catalog is 6 entries, `ApiKeySettingsScreen` only re-renders on
   `useAiProviders`/`useApiKey` state changes, not per-keystroke), so not blocking on its own, but
   flagged per this gate's zero-severity-tolerance policy.
   **Round 2 disposition:** `api-key-settings-screen.tsx:38-63` wraps all four derivations in
   correctly-scoped `useMemo`s (each keyed on exactly the input it reads — no over-broad or missing
   dependencies). `reviewer_engineering` verified the memoization is not cosmetic —
   `useAiProviders()`'s `providers`/`enabledProviders` are genuinely referentially stable
   (`use-ai-providers.ts:34-37`), so the new `useMemo`s will actually skip recomputation. New test
   (`api-key-settings-screen.test.tsx:345-365`) mocks `ApiKeyManager` to capture props across a
   `rerender()` and asserts `toBe` identity on each of the four values — confirmed it would fail
   without the fix and passes with it.

3. **[minor] [code] — resolved (round 2)** — unchecked type-narrowing cast at the DAO→Service trust
   boundary.
   `libs/supabase-services/src/services/ai-providers.service.ts:14` (`mapEntry`) does
   `id: row.id as AiProvider` with no runtime guard that the DB's `ai_providers.id` is actually a
   member of the closed 6-literal `AiProvider` union — an unvalidated string from Postgres is cast,
   not checked. Inert today (spec.md's non-goal: a new 7th provider id is still code + DB, so the
   seed is the only source; DB is the only writer — not learner-controllable, so not an exploitable
   trust-boundary gap, just a type-safety gap), but a future stray/mistyped catalog row would
   silently masquerade as a valid `AiProvider` through every downstream consumer rather than being
   filtered/flagged, unlike `lesson-generation.helpers.ts:13-16`'s own `isAiProvider` guard which
   narrows in the opposite direction (a picker's string value back to `AiProvider`).
   **Round 2 disposition:** `ai-providers.service.ts:5-19,55-58` adds `AI_PROVIDER_IDS` (verified
   complete against the `AiProvider` union, no typos/extras) and `isValidProviderRow` (a proper type
   predicate); `getCatalog()` now filters before sort/map, so a malformed-id row is dropped rather
   than cast through unchecked — matching Decision 11's degrade-gracefully precedent. New test
   (`ai-providers.service.test.ts:109-127`) adds a bogus-id row alongside two valid ones and asserts
   the resolved catalog excludes it while preserving sort order for the valid two — a real
   behavioral assertion, `reviewer_engineering`-verified.

### Confirmed correct (no other findings — see `review-engineering.md` for full detail)

Layering (`hooks-service-dao.mdc`), types (`types.mdc`), `tanstack-query.mdc`, atom-ban, no new
dependencies, i18n (`i18n.mdc`), TDD discipline + all 23 `@s` scenarios independently re-verified
against concrete tests (not just trusted from `tdd.md`), error-contract widening (Decisions 8/9),
security/OWASP (no secrets, no injection surface, no PII, RLS out of this diff's scope/already
shipped), disabled-provider visibility asymmetry (Decision 5) re-verified on the final diff, `@s23`
dead-code removal re-verified via repo-wide grep.

### Design & accessibility

Not in this round's scope (full review is code/architecture/performance/security only). Covered
per-slice by `reviewer_slice` — see `review-slice.md`: slice 1 (task-1..4) zero findings, slice 2
(task-6..10) two findings (`[atomic-design]` Chip-atom reuse, `[global.mdc]` comment provenance),
both resolved same-round, slice 3 (task-11..14) zero findings. No lens marked N/A without reason in
that record.

---

## Round 2 (final)

**CI:** re-run once, green. `pnpm turbo run lint` (same 6 scoped workspaces) — clean. `pnpm turbo
run check-types` (repo-wide, all 14 packages) — clean. `pnpm turbo run test` (same 6 workspaces,
`--output-logs=errors-only`) — all green: `@helsoft/study-buddy` 39 suites/312 tests (was 311, +1
for finding 2's new test), `@helsoft/supabase-services` 37 suites/309 tests (was 308, +1 for
finding 3's new test), all other scoped workspaces unchanged and green. Fix diff was uncommitted
working-tree changes at review time (7 files: `ai-provider-test-factories.ts`,
`lesson-generation.test.tsx`, `use-lesson-generation.test.ts`, `api-key-settings-screen.tsx`,
`api-key-settings-screen.test.tsx`, `ai-providers.service.ts`, `ai-providers.service.test.ts`).
`@helsoft/components` e2e not re-run this round — no files in that workspace were touched by the
round-1 fixes.

**Reviewer:** `reviewer_engineering`, scoped strictly to the fix diff (round 1's already-approved
`7d28270fa..HEAD` baseline not re-litigated). Verified each of the 3 round-1 findings independently
against current file contents (not just the implementer's report) — see per-finding "Round 2
disposition" notes above. No new issues introduced by the fix itself: no memo dependency-array
gaps, no test-assertion weakening, no scope creep (`AI_PROVIDER_IDS`/`isValidProviderRow` and the
four `useMemo` wraps are each exercised by their accompanying new test, nothing added beyond what
the tests demand), no new cross-layer imports, no new dependencies, no i18n/security regressions.

**Verdict: APPROVED.** All three round-1 findings (1 major, 2 minor) resolved and independently
verified. Zero findings open. This is the final round under the 2-round cap.

### Design & accessibility

Unaffected by the round-1 fixes — none of the three fixes touch markup, styles, roles, or labels
(finding 2 is memoization-only, no rendered-output change; findings 1 and 3 are test-fixture/service
data-layer only). Per-slice design/accessibility coverage (`review-slice.md`) stands unchanged.

---

## Overall verdict: APPROVED (round 2 of 2)

Zero findings open. Full findings trail retained above (round 1's 3 findings, all marked
`resolved (round 2)`, plus one non-blocking residual observation carried forward as informational).
Feature `ai-provider-registry-frontend` is ready for `mutation_tester`'s StrykerJS pass (the
orchestrator's next gate after this full review).
