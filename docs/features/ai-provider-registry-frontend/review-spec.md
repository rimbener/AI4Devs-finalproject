# Spec review — ai-provider-registry-frontend

## Round 1 — `spec_reviewer`

**Verdict: CHANGES_REQUESTED** → **all 7 findings resolved by `spec_partner`** (single review round; no re-review follows).

### Blocker

1. **[resolved]** Every `@s` scenario must have a single owning task — this bundle violates that repeatedly. Comparing each task's frontmatter `scenarios:` array:
   - `@s1`, `@s2`: claimed by task-1, task-2, and task-3 (3 tasks each).
   - `@s3`: claimed by task-1, task-2, task-3, and task-4 (4 tasks).
   - `@s4`: claimed by task-1, task-2, and task-4 (3 tasks).
   - `@s11`: claimed by task-2 and task-3 (2 tasks).
   - `@s19`: claimed by task-5 and task-14 (2 tasks).
   - `@s23`: claimed by task-11 and task-14 (2 tasks).
   The sibling `ai-provider-registry-backend` bundle (already `pr_ready`) got this right — every scenario there appears in exactly one `task-N.md`'s `scenarios:` list. Fix: prune each task's `scenarios:` frontmatter so each `@s` is claimed by exactly one task; other tasks that incidentally re-exercise the same behavior at a different layer may say so in prose (Notes) without re-adding the tag.

   **Resolution:** `task-1.md` and `task-2.md` (pure data-layer/hook plumbing) now have `scenarios: []`, with their Done criteria reworded to state they lay the foundation `s1`–`s4`/`s11` (owned by `task-3`/`task-4`) build on, without claiming the tags. `task-3.md` keeps sole ownership of `s1`/`s2`/`s3`/`s11` (its Done criteria now notes `task-4` separately re-exercises `s3` for the generate-flow surface without re-claiming it). `task-4.md`'s frontmatter is now `[s4, s10]` (dropped `s3`). `task-14.md`'s frontmatter is now `scenarios: []` (dropped `s19`/`s23`), with its Done criteria reworded to "re-confirm" `task-5`'s `s19` and `task-11`'s `s23` in prose only. Every `@s1`–`@s23` tag now appears in exactly one task's `scenarios:` frontmatter — verified by grepping all 14 `task-N.md` files' `scenarios:` lines.

2. **[resolved]** `task-13.md`'s integration test is placed in a workspace that cannot import what it needs. It requires `libs/hooks/src/hooks/ai-providers.integration.test.ts` to feed a mocked catalog through the real `useApiKeyManager` (lives in `@helsoft/components`) and the real `useLessonGenerationForm` (lives in `@helsoft/study-buddy`). But `libs/hooks/package.json`'s `dependencies` only list `@helsoft/supabase-services`/`@helsoft/types`/`@tanstack/react-query` — it does not depend on `@helsoft/components` or `@helsoft/study-buddy`. The dependency direction is in fact reversed: `libs/components/package.json` and `libs/study-buddy/package.json` both list `@helsoft/hooks` as a dependency. The task's cited precedents (`api-key.integration.test.ts`, `auth.integration.test.ts`) only cross hook→service→DAO within `@helsoft/hooks`/`@helsoft/supabase-services`; neither crosses into `@helsoft/components` or `@helsoft/study-buddy`. As written, task-13 cannot resolve modules / typecheck in `@helsoft/hooks`'s workspace. Fix: relocate this test to a lib that actually has all three in its dependency graph (e.g. `libs/study-buddy`, which depends on both `@helsoft/components` and `@helsoft/hooks`), or narrow task-13 to stop at `useAiProviders` and let task-3/task-4/task-6/task-7's own layer tests carry the cross-layer proof.

   **Resolution:** Relocated to `libs/study-buddy/src/components/ai-providers.integration.test.ts` — confirmed `libs/study-buddy/package.json` depends on both `@helsoft/hooks` and `@helsoft/components`, and `useLessonGenerationForm` is itself defined in that same workspace, so all three real implementations are reachable. Notes rewritten to cite `libs/study-buddy/src/components/profile-ui.integration.test.tsx` (top-level cross-component test placement convention in this workspace) and `libs/hooks/src/hooks/api-key.integration.test.ts`'s `createElement(QueryClientProvider, …)` wrapper (so `.test.ts`, no JSX needed) instead of the old (unreachable) `libs/hooks` placement rationale.

### Major

3. **[resolved]** The story's vision-default AC has zero scenario coverage and no traceability citation. The story's AC "Given generation needs a vision-capable model and the learner's selected model isn't vision-capable, when generation runs, then the provider's `is_vision_default` model from the DB is used, same behavior as today's hardcoded `visionDefault`" maps to no `@s` scenario in `gherkin-scenarios.md` and no task in `tasks.md`. `spec.md`'s Decision 7/non-goal argues (correctly — `visionDefault` today has zero non-type consumers in `libs/`) that this needs no new client code, but contrast this with the structurally identical platform-path AC (D14, also "no new client work"), which still gets an explicit regression scenario `@s15` owned by task-9. The vision-default AC gets nothing analogous. Fix: either add a client-side regression scenario (request shape unchanged) or explicitly cite the backend scenarios that satisfy this AC, mirroring how D14 is handled.

   **Resolution:** `spec.md`'s non-goals bullet and Decision 7 now explicitly cite backend `@s13`/`@s14`/`@s15` (`docs/features/ai-provider-registry-backend/gherkin-scenarios.md`, owned by backend `task-5`) as the scenarios that discharge this AC — no new frontend scenario/task, since there is genuinely no client-side behavior to regress.

### Minor

4. **[resolved]** `spec.md` is not a terse overview and duplicates task-level implementation detail. At ~118 lines, the "Open decisions" section — especially Decisions 8 and 9 — restates task-8.md/task-9.md's own Done-criteria wording almost verbatim (helper names like `normalizeApiKeyError`/`readFunctionErrorCode`, exact `Record` shapes, locale-key names). This implementation detail belongs in `task-N.md`; `spec.md` should stay at the rationale level.

   **Resolution:** Decisions 8 and 9 trimmed to rationale-only (why the union is widened, why the fallback/recovery category is what it is), with an explicit pointer that the DAO/service helper shapes and exact locale-key names live solely in `task-8.md`/`task-9.md`.

5. **[resolved]** `task-14.md`'s Goal text cites the wrong scenario: "the two whole-feature guarantees — no regression (s19) and no dead code left behind (**s22**) — hold across the full diff." `@s22` is the a11y "Disabled indicator perceivable without color alone" scenario (owned by task-6), not the dead-code scenario — that's `@s23` (correctly used in this same task's Done criteria and its `scenarios: [s19, s23]` frontmatter). Fix the stray `s22` → `s23`.

   **Resolution:** Fixed both occurrences of the stray `s22` (Goal text and Notes) to `s23`.

6. **[resolved]** `task-2.md` under-specifies `isLoading`, risking a stuck-loading state for signed-out users. The codebase's established pattern for a session-gated reference-data hook is `useSessionGate().deriveIsLoading(isQueryPending)` (used by `use-profile.ts`: `deriveIsLoading(isPending) || isApiKeyLoading`), which correctly resolves to `false` once the session finishes loading with no user. task-2's Done criteria only says `useAiProviders(): { providers, isLoading }` derived from `useQuery`'s own state with `enabled` gated by `useSessionGate()` — it never calls for reusing `deriveIsLoading`. Naively exposing `useQuery`'s `isPending` while `enabled: false` can leave `isLoading` `true` indefinitely for a signed-out session. Task-2 should explicitly require `deriveIsLoading`.

   **Resolution:** `task-2.md`'s Done criteria now explicitly requires `isLoading` to be `useSessionGate().deriveIsLoading(isPending)` — not raw `isPending` — mirroring `use-profile.ts`'s precedent, with a Notes line explaining why.

7. **[resolved]** `task-4.md` doesn't assign the fix for `isAiProvider`'s reliance on the soon-to-be-deleted `AI_PROVIDERS`. `libs/study-buddy/src/components/lesson-generation/lesson-generation.helpers.ts`'s `isAiProvider` guard currently does `(AI_PROVIDERS as readonly string[]).includes(value)`; task-11 deletes `AI_PROVIDERS` outright, and its own `@s23` repo-wide-grep would force this to change, but no task's Done criteria names the fix, and the guard's only caller (`lesson-generation.tsx`) isn't in any task's `paths` either. Should be named explicitly (task-4 already touches `lesson-generation.helpers.ts`, so it's the natural owner).

   **Resolution:** `task-4.md` gained an explicit Done criteria bullet naming `isAiProvider`'s re-implementation against the catalog-backed provider list, and `lesson-generation.tsx` (the guard's only caller) was added to task-4's `paths`.

### Clean (no findings — carried forward from round 1)

Every other `@s` scenario (s5–s10, s12–s18, s20–s22) has exactly one owning task, and every task's `scenarios` reference real tags. `manage-api-key`'s `provider_disabled` at HTTP 400 and `generate-lesson`'s at HTTP 422 match the story/spec's stated status codes; the platform path's 503 `platform_key_unavailable` is confirmed unchanged. All `libs/*` task paths are valid locations consistent with `hooks-service-dao.mdc`/`atomic-design.mdc`/`component-split.mdc`/`state.mdc`/`state-sharing.mdc`. No re-litigation of backend D1–D17 found; D10/D11/D12/D13/D14/D1/D15 are correctly cited and honored throughout.

### Files changed in this fix round

- `docs/features/ai-provider-registry-frontend/spec.md` — Decision 7 + non-goals bullet gained explicit backend `@s13`/`@s14`/`@s15` citation; Decisions 8/9 trimmed to rationale-level
- `docs/features/ai-provider-registry-frontend/task-1.md` — `scenarios: []`; Done criteria reworded to "foundation, not owner" of s1–s4
- `docs/features/ai-provider-registry-frontend/task-2.md` — `scenarios: []`; Done criteria reworded to "foundation, not owner" of s1–s4/s11; added explicit `deriveIsLoading` requirement + Notes
- `docs/features/ai-provider-registry-frontend/task-3.md` — Done criteria clarifies task-4 re-exercises s3 for the generate-flow surface without re-claiming it (no frontmatter change — already sole owner)
- `docs/features/ai-provider-registry-frontend/task-4.md` — `scenarios: [s4, s10]` (dropped s3); Done criteria reworded for s3 (re-exercise, not ownership) + new `isAiProvider` guard-fix bullet; `paths` gained `lesson-generation.tsx`
- `docs/features/ai-provider-registry-frontend/task-13.md` — `paths` relocated to `libs/study-buddy/src/components/ai-providers.integration.test.ts`; Done criteria + Notes rewritten for the new workspace's dependency graph and test-placement/wrapper conventions
- `docs/features/ai-provider-registry-frontend/task-14.md` — `scenarios: []` (dropped s19/s23); Goal + Notes stray `s22` → `s23`; Done criteria reworded to "re-confirm," not own
- `docs/features/ai-provider-registry-frontend/review-spec.md` — this trail
