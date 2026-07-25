# Slice review log — tanstack-query-hooks-migration

Durable trail across all slices. Each section appended, never overwritten/emptied.

## Slice 0 — task-1 (evict non-auth cache entries on user-id change, `use-session.ts`)

**Commit reviewed:** `00023a253` (diff vs `00023a253~1`)
**Scope:** `libs/hooks/src/hooks/use-session.ts`, `libs/hooks/src/hooks/use-session.test.ts` (+ doc bookkeeping in `task-1.md`/`tasks.md`/`tdd.md`) — matches task-1.md's declared `paths:` exactly, no scope creep.

**Verdict: APPROVED**

### Rule-by-rule check (`.agents/rules/*.mdc`)

- `global.mdc` — functional hook, no Redux, `Props`/result type (`UseSessionResult`) already in place and untouched; kebab-case filenames; file is 52 lines (well under the 150–200 smell threshold); single exported hook per file; new comment (lines 15–16 in `use-session.ts`) explains *why* a ref is used (avoid re-render on the comparison), not what the code does — compliant. `resolved`/n-a.
- `hooks-service-dao.mdc` — hook still wraps `AuthService` only, never a DAO; no business logic leaked into the hook beyond the id-comparison already specified by task-1; layering intact. Pass.
- `tanstack-query.mdc` — bridge still uses `queryClient.setQueryData` (no parallel `useState`); added `queryClient.removeQueries({ predicate })` is the documented eviction primitive; single shared `QueryClient` untouched; tests wrap `renderHook` in a fresh `QueryClientProvider` per test and use `waitFor` for query-derived state. Pass.
- `state.mdc` — only one new `useRef` added (`previousUserIdRef`); not 3+ coordinated `useState` fields, so no reducer is warranted. Pass.
- `state-sharing.mdc` — n/a, no prop-drilling introduced.
- `atomic-design.mdc` / `component-split.mdc` — n/a, this is a data hook, not a UI component; no split required.
- `types.mdc` — no new multi-file types; `UseSessionResult` unchanged; no types exported from the hook implementation file. Pass.
- `i18n.mdc` — n/a, no user-facing strings touched.
- `tdd.mdc` — `tdd.md` has a complete `@s → test` map for s1–s4, one block per Red→Green→Refactor cycle, terse (3003 bytes, well under the 8000-byte budget), prose only (no pasted test bodies/diffs). Each of s1–s4 in `gherkin-scenarios.md` maps to a named test (`@s1`…`@s4`) in `use-session.test.ts`. No hardcoded strings/colors/dimensions (none applicable — logic-only). Pass.
- `pre-slice-checklist.mdc` — no new public symbols requiring barrel export (`previousUserIdRef` is a private ref, `SESSION_QUERY_KEY`/`useSession` already barrel-exported pre-slice); no loading-UI/a11y/atom/Modal/e2e concerns (logic-only slice); no spying on global `React.useRef` in the tests; `tdd.md` notes confirm tests were run the monorepo way (`pnpm --filter @helsoft/hooks lint`/`check-types`). Pass.
- `e2e.mdc` — no e2e added for this slice, correctly — this is hook logic with no rendered UI/interaction, so no `.e2e.js` is warranted. Pass.

### Code quality
Short, single-purpose change (id-comparison guard + ref); revealing name (`previousUserIdRef`); no magic numbers/strings; no `console.log`/TODOs; error contract (`receivedAuthEventRef` stale-resolution guard) left untouched and still passing per the 4 pre-existing tests.

### Design / Accessibility
**N/A** — logic-only hook, no UI added or touched by this slice.

### Non-blocking observation (not a rule violation, not counted against the verdict)
- `use-session.ts:17-19`: `useRef(queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY)?.user?.id)` — the initializer expression is re-evaluated on every render (React's `useRef` isn't lazy like `useState`'s functional form), though the result is discarded after mount. Functionally correct (mount-time seeding is right), just a redundant cache read on subsequent renders. No rule in `.agents/rules/` requires lazy-init here; flagging only for awareness, not blocking.

**Status: all checks `resolved`/pass — no open findings.**

## Slice 1 — task-2 (migrate `useLesson` to `useQuery`, delete its reducer)

**Commit reviewed:** `27eedf21a` (diff vs `27eedf21a~1`)
**Scope:** `libs/hooks/src/hooks/use-lesson.ts`, `libs/hooks/src/hooks/use-lesson.reducer.ts` (deleted), `libs/hooks/src/hooks/use-lesson.test.ts`, `libs/hooks/src/hooks/lesson-player.integration.test.ts` — matches task-2.md's declared `paths:` (+ the integration test, listed as an artifact of the task's own scope). No scope creep.

**Verdict: CHANGES_REQUESTED**

### Rule-by-rule check (`.agents/rules/*.mdc`)

- `global.mdc` — functional hook, no Redux; `UseLessonResult` Props/result type untouched and byte-for-byte preserved; kebab-case filenames; `use-lesson.ts` is 35 lines (well under the 150–200 smell threshold); one hook (`useLesson`) exported per file, `lessonQueryKey` is a plain const helper alongside it (same shape as `SESSION_QUERY_KEY`/`useSession` in `tanstack-query.mdc`'s own example) — not a second hook/component/class; the new doc comment on `lessonQueryKey` (`use-lesson.ts:7`) explains *why* it's scoped by id, not what it does. Pass.
- `hooks-service-dao.mdc` — hook still calls `LessonsService.getLesson` only, never a DAO; no business logic added to the hook. Pass.
- `tanstack-query.mdc` — `useQuery({ queryKey: lessonQueryKey(id), queryFn })` matches the prescribed read pattern; query key exported as a `const` tuple; `refetch` wrapped to stay `() => void` per the mutation/read primitive-exposure guidance; no parallel `useState` reintroduced; no `QueryProvider`/second `QueryClient` created; both `use-lesson.test.ts` and `lesson-player.integration.test.ts` wrap `renderHook` in a fresh `QueryClient({ retry: false })` + `QueryClientProvider`, and query-derived state assertions go through `await waitFor(...)` (e.g. `use-lesson.test.ts:86,99,111,124,131,146,150,174`). Pass.
- `state.mdc` / `state-sharing.mdc` — the 3-field `useReducer` (`lesson`/`isLoading`/`error`) is correctly *removed*, not reintroduced elsewhere; `useQuery` owns that coordinated state now, consistent with `tanstack-query.mdc` superseding `state.mdc` for async-fetch state. No prop-drilling introduced. Pass / N/A.
- `atomic-design.mdc` / `component-split.mdc` — N/A, logic-only hook, no component/JSX.
- `types.mdc` — `UseLessonResult` unchanged, stays in `use-lesson.types.ts`, only exported types there; no runtime logic added to the types file; `lessonQueryKey` is a runtime value (not a type) so is correctly co-located in the implementation file, matching the `tanstack-query.mdc` reference pattern. Pass.
- `i18n.mdc` — N/A, no user-facing strings touched.
- `tdd.mdc` — `tdd.md`'s Slice 1 section has a complete `@s → test` map for s5–s9, each mapped to a named test in `use-lesson.test.ts`; one Red→Green→Refactor cycle block; terse, prose-only, no pasted diffs/output; whole file is 5739 bytes, under the 8000-byte budget. Task-2.md's explicit "no `instanceof Error` normalizer" guidance is honored — `error` flows straight from `useQuery`'s `TError = DefaultError (Error)`. No hardcoded strings/colors/dimensions (logic-only). Pass.
- `pre-slice-checklist.mdc` — `lessonQueryKey` is barrel-exported (`export * from './use-lesson'` in `libs/hooks/src/hooks/index.ts`, confirmed already covers it); no new pure helpers requiring extraction; no loading-UI/a11y/atom/Modal/e2e surface in this slice; no `React.useRef`/regex-as-integration shortcuts. Pass.
- `e2e.mdc` — no `.e2e.js` added or needed; this is a non-interactive data hook. Pass.

### Code quality
- `[code-quality] libs/hooks/src/hooks/use-lesson.test.ts:19-23,49-51` (resolved) — the "migration anchor" test (`caches the loaded lesson under lessonQueryKey(id)`) reconstructs the `QueryClient`/`QueryClientProvider` wrapper inline instead of calling the `createWrapper()` helper defined immediately above it in the same file. Pure duplication of already-factored setup with no behavioral reason for the divergence (both use identical `{ retry: false }` options) — violates the "no duplication" code-quality bar. Fix: call `createWrapper()` like every other test in the file, and read the resulting `QueryClient` off it (or return `{ wrapper, queryClient }` from `createWrapper()`) rather than hand-rolling a second copy. Low severity, but per this role's no-minors policy it blocks — the implementer fixes it before the slice closes.
  - **Resolution:** `createWrapper()` now accepts an optional `queryClient` param (defaulting to a fresh `{ retry: false }` client); the migration-anchor test passes its own `QueryClient` into `createWrapper(queryClient)` and reads cache state off that same instance. No hand-rolled second wrapper remains. `pnpm --filter @helsoft/hooks lint`, `check-types`, and `test` all green (156/156 tests, including the anchor test and every other `use-lesson.test.ts` case).

Everything else — error contract preserved (`Error | null`), no `console.log`/TODOs, no magic numbers, single-purpose 35-line hook, short/revealing names (`lessonQueryKey`, `queryRefetch`).

### Design / Accessibility
**N/A** — logic-only hook, no UI added or touched by this slice.

**Status: the one `open` finding (`[code-quality]`, test-only duplication, no rule-file violation otherwise) is now `resolved` — see Resolution note above.**

## Slice 2 — task-3 (migrate `useLessons` to `useQuery` + delete mutation, delete its reducer)

**Commit reviewed:** `0f844dda5` (diff vs `0f844dda5~1`)
**Scope:** `libs/hooks/src/hooks/use-lessons.ts`, `libs/hooks/src/hooks/use-lessons.reducer.ts` (deleted), `libs/hooks/src/hooks/use-lessons.test.ts`, `libs/hooks/src/hooks/lessons.integration.test.ts`, plus `task-3.md`/`tdd.md` status updates — matches task-3.md's declared `paths:`. No scope creep.

**Verdict: CHANGES_REQUESTED**

### Rule-by-rule check (`.agents/rules/*.mdc`)

- `global.mdc` — functional hook, no Redux; `UseLessonsResult` unchanged; kebab-case filenames; `use-lessons.ts` is 58 lines; one hook exported per file (`lessonsQueryKey` is a co-located const, same shape as `tanstack-query.mdc`'s own `SESSION_QUERY_KEY` example); the doc comment on the hook explains *why* (`setQueryData`, never `invalidateQueries` — no flicker), the D4 inline comment explains *why* mutation-first. Pass.
- `hooks-service-dao.mdc` — hook calls `LessonsService.getLessons`/`deleteLesson` only, never a DAO; no business logic added. Pass.
- `tanstack-query.mdc` — `useQuery({ queryKey: lessonsQueryKey, queryFn })` for the read; delete `useMutation` bridges its success into the cache via `queryClient.setQueryData` (never `invalidateQueries`), matching the "bridge external effects via setQueryData" guidance; query key exported as a `const` tuple; `refetch` wrapped to stay `() => void` and calls `resetDelete()` before `queryRefetch()` per D4; no second `QueryClient`/`QueryProvider` created. Deviations from the rule's *default* preferences are explicitly justified in `task-3.md`'s Done criteria / Notes (an approved spec decision, not a slice-level violation): `deleteLesson` returns `mutateAsync` rather than the preferred bare `mutate`, to preserve the existing `Promise`-rejecting contract that `SavedLessons`'s call site (`void deleteLesson(id).catch(() => {})`) already depends on; no typed error guard/normalizer is added, per the explicit note that `LessonsService` already rejects with real `Error`s. Both are consistent with the sibling `use-lesson` (task-2) precedent already accepted in Slice 1's review. Test wrapping: `use-lessons.test.ts` and `lessons.integration.test.ts` wrap in `QueryClient({ retry: false })` + `QueryClientProvider`; query/mutation-derived assertions go through `await waitFor(...)` throughout. Pass, with one test-hygiene finding below.
- `state.mdc` / `state-sharing.mdc` — the reducer (`lessons`/`isLoading`/`error`) is correctly removed and not reintroduced; `useQuery`+`useMutation` own that coordinated state now. No prop-drilling introduced. Pass / N/A.
- `atomic-design.mdc` / `component-split.mdc` — N/A, logic-only hook, no component/JSX touched.
- `types.mdc` — `UseLessonsResult` (in `use-lessons.types.ts`) unchanged, only exported types there, no runtime logic added to the types file; `lessonsQueryKey` is a runtime const, correctly kept in the implementation file. Pass.
- `i18n.mdc` — N/A, no user-facing strings touched.
- `tdd.mdc` — `tdd.md`'s new "Slice 2 — use-lessons (task-3)" section has a complete `@s → test` map for s10–s16, each mapped to a named test; a terse Red→Green→Refactor cycle log (6 lines, prose only, no pasted diffs/output); explicitly logs the 6 dropped `isMounted`/`requestId`/unmount characterization tests as no-`@s`-mapping implementation detail of the deleted reducer (correct — confirmed against the diff, these tests characterized only the removed guard, not surviving production code); whole `tdd.md` is 5 739 bytes, under the 8 000-byte budget. No hardcoded strings/colors/dimensions (logic-only). Pass.
- `pre-slice-checklist.mdc` — `lessonsQueryKey` is barrel-exported (`export * from './use-lessons'` in `libs/hooks/src/hooks/index.ts`); no new pure helpers requiring extraction; no loading-UI/a11y/atom/Modal/e2e surface in this slice; no `React.useRef`/regex-as-integration shortcuts; `use-lessons.reducer.ts` fully deleted with zero remaining importers (verified via repo-wide grep — no `useLessonsReducer`/`useLessonsInitialState`/`use-lessons.reducer` references anywhere). Pass.
- `e2e.mdc` — no `.e2e.js` added or needed; non-interactive data hook. Pass.

### Code quality

- `[tdd] libs/hooks/src/hooks/use-lessons.test.ts:15-19,31-37` (resolved) — the migration-anchor test (`caches the loaded lessons under lessonsQueryKey`) hand-rolls its own `QueryClient`/wrapper inline instead of calling the `createWrapper()` helper defined immediately above it, purely to get a handle on the `QueryClient` instance for the `getQueryData` assertion. **This is a direct regression of the exact finding raised and resolved in Slice 1** (`docs/features/tanstack-query-hooks-migration/review-slice.md`, Slice 1 section): there, `use-lesson.test.ts`'s `createWrapper()` was fixed to accept an optional `queryClient` param precisely so the anchor test could reuse it instead of duplicating the wrapper construction (confirmed present in the current `use-lesson.test.ts:19-24`). `use-lessons.test.ts`'s `createWrapper()` (`use-lessons.test.ts:15-19`) was not given the same optional-param treatment when this sibling hook was migrated, so the duplication was reintroduced verbatim. Fix: give `createWrapper` in `use-lessons.test.ts` the same `(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) => ...` signature as `use-lesson.test.ts`, and have the anchor test call `createWrapper(queryClient)` instead of hand-rolling a second `QueryClientProvider` wrapper. Blocks per this role's no-minors policy (repeat of an already-agreed fix, "no duplication" code-quality bar).
  - **Resolution:** `createWrapper()` in `use-lessons.test.ts` now takes the same optional `queryClient` param (defaulting to a fresh `{ retry: false }` client) as `use-lesson.test.ts`; the migration-anchor test calls `createWrapper(queryClient)` and reads cache state off that same instance — no second hand-rolled `QueryClientProvider` wrapper remains. `pnpm --filter @helsoft/hooks lint`, `check-types`, and `test` all green (156/156 tests, including the anchor test and every other case in `use-lessons.test.ts`).
- Everything else: error contract preserved (`Error | null`), no `console.log`/TODOs, no magic numbers, single-purpose ~50-line hook, short/revealing names (`lessonsQueryKey`, `queryRefetch`, `resetDelete`), D4 error-merge and reset-before-refetch ordering verified directly against the code (`error: deleteError ?? queryError`; `refetch` calls `resetDelete()` then `void queryRefetch()`) and against every ordering the old reducer produced (s13 clears a read error, s15 leaves the list on a delete failure, s16 clears a stuck delete error and exposes a later read failure). `deleteLesson` uses `mutateAsync` and still rejects to the caller (s15's `rejects.toBe(failure)`); a failed delete leaves the cached list byte-for-byte unchanged (s15); delete success filters the row via `setQueryData` with zero extra `getLessons` calls (s14, asserted `toHaveBeenCalledTimes(1)`), never `invalidateQueries` (grep confirms no `invalidateQueries` call anywhere in the file).

### Design / Accessibility

**N/A** — logic-only hook, no UI added or touched by this slice.

**Status: the one `open` finding (`[tdd]`, test-duplication regression) is now `resolved`** — see Resolution note above. No production-code rule violation; test-file hygiene only.
