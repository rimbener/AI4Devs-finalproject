# Engineering review — ai-provider-registry-frontend

## Round 1 — `reviewer_engineering`

**Verdict: CHANGES_REQUESTED**

Scope: `git diff 7d28270fa..HEAD` (91 files, +4074/-693), the frontend-only slice built on top of
the already-shipped `ai-provider-registry-backend` (17 commits, `b0f050d49`..`830ab331f`).
Cross-checked against `spec.md` (23 Decisions), `gherkin-scenarios.md` (23 `@s`), `tasks.md` +
`task-1.md`…`task-14.md` (all `status: done`), `tdd.md`'s `@s → test` maps, and `review-slice.md`
(three APPROVED/one CHANGES_REQUESTED-then-resolved slice rounds — not re-litigated below except
where noted). Four lenses applied: code quality & TDD, architecture/layering, performance,
security (OWASP).

**CI status handed off by `reviews_lead`:** `CI green @ HEAD (study-buddy e2e infra-blocked,
pre-existing, scoped out — see reviews_lead's note)`. Accepted as-is, not re-run.

---

### Findings

1. **`[code]` major — duplicated, hand-copied, and drifted catalog fixture** (DRY violation,
   contradicts explicit in-repo guidance, and an explicitly-promised cleanup that never landed).

   `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts:10-150` defines its own
   `AI_PROVIDER_CATALOG_FIXTURE` (6 providers/13 models), hand-copied from
   `libs/hooks/src/hooks/use-ai-providers.fixture.ts:15-161` — a distinct file, same exported
   constant name, in a different workspace. The two have genuinely diverged:
   - `ai-provider-test-factories.ts:20` `label: 'GPT OSS 20B'` (no hyphen) vs.
     `use-ai-providers.fixture.ts:25` `label: 'GPT-OSS 20B'` (hyphen, matches the real
     `en.ts` string that existed pre-migration).
   - `ai-provider-test-factories.ts:136` `label: 'DeepSeek v4 Flash'` (lowercase v) vs.
     `use-ai-providers.fixture.ts:147` `label: 'DeepSeek V4 Flash'` (uppercase V, matches
     `en.ts`).

   `use-ai-providers.fixture.ts:11-13`'s own doc comment states: *"a second, independently-typed
   mock catalog would be exactly the kind of drift risk this fixture exists to prevent. Do not
   hand-copy these values elsewhere; import this instead."* This diff does precisely that inside
   the same feature that wrote the warning. `libs/study-buddy/package.json:24` already depends on
   `@helsoft/hooks`, so importing the real fixture (as `libs/study-buddy/.storybook/mocks/hooks.ts:27`
   correctly does via a relative import) was available and unused.

   Verified this was a known, explicitly-deferred gap, not new: `review-slice.md`'s Slice-1/task-5
   round flagged the exact same two typos and "confirmed low-risk to defer... task-5.md's Notes
   and the task-5 tdd.md entry both explicitly name this divergence and defer its retirement to
   task-9/12/13 (when the old factory is deleted in favor of this fixture)." `git log --follow`
   shows the file was touched again in task-11/12/13's own commit (`bbde00928`, slice 3) — but only
   a comment was edited (`ai-provider-test-factories.ts:8`), the duplicate data itself was left in
   place. Task-14's "wrap-up sweep" (`tdd.md`'s slice-3 summary) does not mention this cleanup
   either, despite it being the explicitly named condition for deferral.

   Impact today is contained (verified via `grep`: the actual `@s19` no-regression assertions in
   `api-key-settings-screen.test.tsx:278-310`, `use-lesson-generation.test.ts:44-73`, and
   `use-ai-providers.test.ts:112-133` all correctly import and diff against the *real*
   `AI_PROVIDER_CATALOG_FIXTURE` from `@helsoft/hooks` — the duplicated/typo'd factory is only used
   for scenarios that don't assert on exact labels). But it is a live, unresolved duplication that
   the feature's own documentation promised to remove and didn't, and it's exactly the kind of
   parallel source of truth that will silently start masking a real drift the next time someone
   edits one copy and not the other. Fix: delete
   `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts`'s hand-copied array and rebuild
   `aiProvidersValue()` on top of the imported `AI_PROVIDER_CATALOG_FIXTURE` from `@helsoft/hooks`.

2. **`[perf]` minor — fresh object/array literals recomputed every render, no memoization.**

   `libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx:37-50`
   recomputes `providerIds`, `enabledProviderIds`, `providerNames`, and `guidanceUrls` (4 new
   array/object allocations via `.map`/`Object.fromEntries`) on every render, then passes them as
   props into `ApiKeyManager` → `ApiKeySavedList`/`ApiKeyFormDialog` (none of which are
   `memo`-wrapped). Pre-migration, `guidanceUrls`/`providerNameKeys` were module-level constants
   (referentially stable across renders — see the diff at the same lines: was
   `guidanceUrls={API_KEY_SETTINGS_GUIDANCE_URLS}` / `providerNameKeys={PROVIDER_NAME_KEYS}`).
   Given the catalog is tiny (6 entries) and `ApiKeySettingsScreen` only re-renders on
   `useAiProviders`/`useApiKey` state changes (not on every keystroke — that's local to
   `useApiKeyManager` inside the child), this is not a hot path and not a re-render storm; flagging
   as minor/quantifiable-if-it-grows rather than blocking. `useMemo` keyed on `providers` would
   restore the previous referential-stability guarantee at negligible cost.

3. **`[code]` minor — unchecked type-narrowing cast at the DAO→Service boundary.**

   `libs/supabase-services/src/services/ai-providers.service.ts:14` (`mapEntry`) does
   `id: row.id as AiProvider` with no runtime guard that the DB's `ai_providers.id` is actually a
   member of the closed 6-literal `AiProvider` union — an unvalidated string from Postgres is cast,
   not checked, at the trust boundary between raw DB data and the app's closed-union type. Today
   this is inert (spec.md's non-goal: a genuinely new 7th provider id is still code + DB, so the
   seed is the only source), but it means a future stray/mistyped catalog row would silently
   masquerade as a valid `AiProvider` through every downstream consumer (`ProviderSelector`,
   `ApiKeySavedList`, etc.) rather than being filtered out or flagged, since nothing here narrows
   with an `isAiProvider`-style guard the way `lesson-generation.helpers.ts:13-16`'s own
   `isAiProvider` guard does for the *opposite* direction (narrowing a picker's string value back
   to `AiProvider`). Not blocking — genuinely low likelihood given the non-goal and DB being the
   only writer — but worth tightening if the catalog ever gains a second writer.

---

### Confirmed correct (verified independently, not restating rubric)

- **Layering (`hooks-service-dao.mdc`)**: `AiProvidersDao.getCatalog()` (`libs/supabase-services/
  src/dao/ai-providers.dao.ts`) does zero mapping/sorting/error-shielding; `AiProvidersService`
  owns 100% of camelCase mapping + two-level `sort_order` sort + Decision-11 catch-to-`[]`;
  `useAiProviders` wraps the Service, never the DAO. `ApiKeySettingsScreen` and
  `useLessonGenerationForm` are the only two `useAiProviders()` callers repo-wide (grepped) —
  Decision 12 holds. `ApiKeyManager`/`ApiKeySavedList`/`ApiKeyFormDialog`/`ProviderSelector`/
  `ModelSelector` stay presentational (props only, no hooks/services imported).
- **Types (`types.mdc`)**: `AiProviderCatalogEntry`/`AiProviderCatalogModel` live in `libs/types/
  src/ai-provider.ts` (Service's output shape); `RawProviderRow` is correctly DAO-local, not
  exported from `@helsoft/types`. Component-local prop types (`ApiKeyManagerProps`,
  `ApiKeySavedListProps`) correctly stay in their own `.types.ts`, not lifted to `libs/types`.
- **`tanstack-query.mdc`**: `useAiProviders` follows the required `useQuery` pattern (`AI_PROVIDERS_
  QUERY_KEY` exported, `staleTime: Infinity`, gated via `useSessionGate`); `useLessonGenerationForm`
  correctly stays off `useQuery` per its pre-existing Exemptions-section entry (one-shot preference
  read).
- **Atom ban**: `git diff 7d28270fa..HEAD -- libs/components/src/atoms` is empty — zero shared-atom
  changes; the slice-2 finding about `api-key-saved-list.tsx` hand-rolling border/radius instead of
  composing the `Chip` atom was fixed and re-verified in that same round (`review-slice.md`), and
  `Chip`'s own file is untouched here.
- **No new dependencies**: no `package.json`/`pnpm-lock.yaml` diff in range.
- **i18n (`i18n.mdc`)**: every new user-facing string (`settings.apiKey.manager.disabled`,
  `settings.apiKey.error.providerDisabled`, `generation.error.providerDisabled`) goes through
  inline `t('ns.key')` call sites, translated in all 4 bundles (en/es/pt/de). `GENERATION_ERROR_
  KEYS`/`GENERATION_ERROR_RECOVERY`/`API_KEY_ERROR_MESSAGES`/`API_KEY_ERROR_CODES` are the allowed
  code→key/code→message dictionaries (full `Record`s over closed unions), not pre-resolved-`t()`
  copy objects. Catalog `name`/`label` fields are correctly left as plain display strings, not
  `t()`-wrapped (Decision 3's explicit non-goal on localized provider names).
- **TDD discipline (`tdd.mdc`)**: every non-UI `.ts` touched (`ai-providers.dao.ts`/`.service.ts`,
  `use-ai-providers.ts`, `api-key.service.ts`, `lesson-generation.service.ts`,
  `lesson-generation.helpers.ts`) has a same-commit test with Red→Green evidence in `tdd.md`; no
  production `.ts` code found that isn't demanded by an accompanying test. UI `.tsx` files
  (`ApiKeyManager`, `ApiKeySavedList`, `ProviderSelector`, `ModelSelector`) each have their
  `.test.tsx` + `.stories.tsx`; pre-existing `.e2e.js` for the two touched interactive organisms
  (`api-key-manager`, `lesson-generation-panel`) re-ran green per CI (19/19) with no new
  interactive surface requiring a new e2e spec — consistent with `e2e.mdc`.
- **All 23 `@s` scenarios map to ≥1 concrete test** — verified against `tdd.md`'s three per-slice
  tables and by direct `grep -rn "@s[0-9]"` across the touched test files; spot-checked `@s9`,
  `@s13`, `@s19`, `@s20`, `@s21` test bodies directly (not just trusting the table) and confirmed
  each asserts the actual behavior claimed (e.g. `@s13`'s test asserts the mapped code is
  `invalid_model` specifically, not just "no throw"; `@s21`'s integration test
  (`libs/study-buddy/src/components/ai-providers.integration.test.ts`) genuinely exercises the real
  `AiProvidersService`→`useAiProviders`→`useApiKeyManager`/`useLessonGenerationForm` chain with only
  the Supabase client boundary mocked).
- **Error contract widening (Decisions 8/9)**: `ApiKeyErrorCode`/`GenerationErrorCode` both
  correctly widened with `provider_disabled` as closed-union members (not optional/loose strings);
  `normalizeApiKeyError`/`normalizeGenerationError`-style helpers exhaustively `Record`-guard the
  wire code before trusting it, falling back to `network_error`/`generation_failed` for anything
  unrecognized — no raw Supabase/Edge-Function shape reaches the UI.
- **Security (OWASP/MASVS)**: no secrets/keys introduced; no new env vars; `AiProvidersDao.getCatalog()`
  takes no user input (no injection surface); catalog read relies on the backend feature's existing
  `to authenticated` RLS (out of scope for this diff, already shipped/reviewed); no PII in the new
  code paths (provider ids/names/model ids only); no new deep links/webviews; TLS unaffected
  (Supabase client unchanged). `id: row.id as AiProvider` (finding 3) is the only unchecked-input
  observation, and it's DB-sourced (not learner-controllable), so it's a type-safety note, not an
  exploitable trust-boundary gap — not elevated to a security blocker.
- **Performance**: `AiProvidersDao.getCatalog()` is a single nested-select query (no N+1); no long
  lists needing virtualization (catalog is 6 providers/13 models, rendered via plain `.map`, well
  under any threshold that would justify `FlatList`/`FlashList`); `staleTime: Infinity` means the
  catalog is fetched once per session, not polled. Findings 2 is the only avoidable-re-render
  observation and is minor given render frequency and array size.
- **Disabled-provider visibility asymmetry (Decision 5)**: independently re-verified (not just
  trusting `review-slice.md`) via `grep -rn "\.enabled\b"` across `libs/components/src`,
  `libs/study-buddy/src`, `libs/hooks/src` — the only `.enabled` predicate outside comments/tests is
  `use-ai-providers.ts:35`'s single hook-level filter; `ApiKeySavedList`/`ApiKeyManager` never
  filter `savedKeys`/`providers` by `enabled` (row stays visible, badged), while
  `useApiKeyManager.unsavedProviders` and `useLessonGenerationForm.savedProviderEntries` both derive
  purely from the threaded-in `enabledProviders` — confirmed still true on the final diff, not just
  at the slice-2 snapshot.
- **`@s23` (dead-code removal)**: repeated the repo-wide grep for `AI_PROVIDERS`,
  `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS`, `aiModel.`,
  `settings.apiKey.provider.` myself against the current tree — zero matches outside `docs/`/
  `user-stories/` planning history. Holds.

### Design & accessibility

Out of this reviewer's scope per the round's assignment — already covered per-slice by
`reviewer_slice` (`review-slice.md`: slices 1 and 3 zero-finding APPROVED, slice 2's two findings
both `[resolved]`). Not re-reviewed here.

### Disposition

Finding 1 is the blocking item for this round (major, per the zero-severity-tolerance policy for
round 1: code duplication that contradicts explicit in-repo guidance and an explicitly-promised,
unfulfilled cleanup). Findings 2 and 3 are minor and would not independently block, but are
recorded for the same round per protocol. Re-review scope for round 2: confirm finding 1's fix
(re-derive `aiProvidersValue()` from the imported `@helsoft/hooks` fixture, delete the hand-copied
array) and that no test assertion relied on the now-corrected labels.

---

## Round 2 (final) — `reviewer_engineering`

**Verdict: APPROVED**

Scope: uncommitted working-tree fix diff only (`git status --short`; nothing committed this round)
— 7 files: `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts`,
`libs/study-buddy/src/components/lesson-generation/{lesson-generation.test.tsx,
use-lesson-generation.test.ts}`, `libs/study-buddy/src/components/api-key-settings-screen/
{api-key-settings-screen.test.tsx,api-key-settings-screen.tsx}`,
`libs/supabase-services/src/services/ai-providers.service.{test.ts,ts}`. Round 1's baseline
(`7d28270fa..HEAD`) not re-litigated per instructions.

**CI status handed off by `reviews_lead`:** `CI green @ HEAD+fixes (uncommitted)` — lint (6 scoped
workspaces) clean, check-types (all 14 packages) clean, test (same 6 workspaces) all green,
`@helsoft/study-buddy` 312/312 (+1), `@helsoft/supabase-services` 309/309 (+1). Accepted as-is, not
re-run.

### Round 1 findings — disposition

1. **`[code]` major — duplicated/drifted catalog fixture → `resolved`.**
   Verified `libs/study-buddy/src/test-utils/ai-provider-test-factories.ts:1-14`: the hand-copied
   153-line `AI_PROVIDER_CATALOG_FIXTURE` array is gone; the file now does
   `import { AI_PROVIDER_CATALOG_FIXTURE, ... } from '@helsoft/hooks'` and re-exports it verbatim
   (line 5), with `aiProvidersValue()` (lines 7-14) rebuilt directly on the imported constant
   (`providers: AI_PROVIDER_CATALOG_FIXTURE`, `enabledProviders: AI_PROVIDER_CATALOG_FIXTURE.filter(...)`).
   Confirmed `@helsoft/hooks`'s barrel (`libs/hooks/src/hooks/index.ts:2`) actually exports
   `use-ai-providers.fixture.ts`, so the import resolves to the real canonical fixture, not a stub.
   Single source of truth restored — one copy of the catalog data now exists in the repo.
   Confirmed the 6 label-assertion fixes (`use-lesson-generation.test.ts:223-224`,
   `lesson-generation.test.tsx:183,266,941,965`) all flip `'GPT OSS ...'` → `'GPT-OSS ...'`,
   matching `use-ai-providers.fixture.ts:25,32`'s real values — traced each to its source
   (`useAiProviders()` mocked via `aiProvidersValue()`, which now threads the corrected labels
   through `modelOptions`/radio labels), so these are genuine fixes, not just re-pinned typos.

   Residual, non-blocking observation (not new, not introduced by this fix, informational only):
   `libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.test.ts:22,29` and
   `lesson-generation.integration.test.tsx:25` still hand-roll their own local, self-contained
   `'GPT OSS 20B'`/`'GPT OSS 120B'` literals (no hyphen) as inline mock `AiProviderCatalogEntry`
   fixtures — a third/fourth instance of the same label, independent of both
   `ai-provider-test-factories.ts` and the canonical `@helsoft/hooks` fixture. These are untouched
   by this round's diff, and are self-consistent (label flows straight through the code under test
   with no comparison against the canonical fixture), so there is no drift/masking risk today — but
   it means the "single source of truth" claim from finding 1 is true for the two files actually
   fixed, not literally repo-wide. Not raised as a blocking finding (out of this round's scope, no
   behavioral risk, final round under the 2-round cap) — worth a follow-up cleanup ticket if this
   feature is revisited.

2. **`[perf]` minor — unmemoized derivations → `resolved`.**
   `api-key-settings-screen.tsx:38-63`: all four derivations (`providerIds`, `enabledProviderIds`,
   `providerNames`, `guidanceUrls`) now wrapped in `useMemo`, each keyed on exactly the input it
   reads (`[providers]` ×3, `[enabledProviders]` ×1) — no over-broad or missing dependencies.
   Verified the memoization is not cosmetic: `useAiProviders()` (`libs/hooks/src/hooks/
   use-ai-providers.ts:34-37`) returns `providers` straight from `useQuery`'s `data` (referentially
   stable across re-renders while the query cache is unchanged, `staleTime: Infinity`) and
   `enabledProviders` is itself already `useMemo`'d inside the hook — so the screen's new `useMemo`
   calls sit on genuinely stable inputs and will actually skip recomputation, not just theoretically.
   New test `api-key-settings-screen.test.tsx:345-365` mocks `@helsoft/components`'s `ApiKeyManager`
   to capture its received props across a `rerender()`, and asserts `toBe` (referential) equality
   on all four values by name (`providers`, `enabledProviders`, `providerNames`, `guidanceUrls`) —
   correctly targets the individual memoized values (not the whole props object, which is
   necessarily a fresh literal per JSX render regardless of memoization), so the test would
   genuinely fail without the fix and passes with it.

3. **`[code]` minor — unchecked DAO→Service cast → `resolved`.**
   `ai-providers.service.ts:5-19`: new `AI_PROVIDER_IDS` (all 6 `AiProvider` literals, verified
   against `libs/types/src/ai-provider.ts:5`'s union — complete, no typos, no extras) and
   `isValidProviderRow` (a proper `row is RawProviderRow & { id: AiProvider }` type predicate, not
   just a boolean check) replace the unchecked `row.id as AiProvider` cast. `getCatalog()` (line
   55) now does `.filter(isValidProviderRow).sort(...).map(mapEntry)` — filtering happens before
   sort/map, so a malformed row is dropped, not just mistyped through; `mapEntry`'s parameter type
   also tightened to the guard's post-narrowing type, so nothing downstream can bypass the guard
   without a type error. New test `ai-providers.service.test.ts:109-127` adds a bogus-id row
   alongside two valid ones and asserts the resolved catalog `toEqual([mappedGroq, mappedOpenai])`
   (bogus row absent, valid two present, sort_order still respected) — a real behavioral assertion,
   not just a type-level check.

### New findings from the fix diff itself

None. No memo dependency-array gaps, no test-assertion weakening, no scope creep (no new
production `.ts` code beyond what the two new tests demand — `AI_PROVIDER_IDS`/`isValidProviderRow`
are both exercised by the new test; the four `useMemo` wraps are both exercised by the new perf
test), no new cross-layer imports, no new dependencies, no i18n/security regressions introduced by
touching these seven files.

### Disposition

All three round-1 findings are genuinely resolved by the fix diff, verified independently (not
just trusting the implementer's report) against current file contents, the real
`@helsoft/hooks` barrel, `use-ai-providers.ts`'s referential-stability guarantees, and the
`AiProvider` union. CI is green per `reviews_lead`'s hand-off. No new issues introduced by the fix.
Round 2 is the final round under the 2-round cap — **APPROVED**.
