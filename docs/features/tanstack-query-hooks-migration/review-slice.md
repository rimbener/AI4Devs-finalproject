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

## Slice 3 — task-4 (migrate `usePdfDocuments` to `useQuery` + delete mutation, delete its reducer)

**Commit reviewed:** `05a76d747` (diff vs `05a76d747~1`)
**Scope:** `libs/hooks/src/hooks/use-pdf-documents.ts`, `libs/hooks/src/hooks/use-pdf-documents.reducer.ts` (deleted), `libs/hooks/src/hooks/use-pdf-documents.test.ts`, `libs/hooks/src/hooks/pdf-documents.integration.test.ts`, plus `task-4.md`/`tdd.md` status updates — matches task-4.md's declared `paths:`. No scope creep.

**Verdict: APPROVED**

### Rule-by-rule check (`.agents/rules/*.mdc`)

- `global.mdc` — functional hook, no Redux; `UsePdfDocumentsResult` (in `use-pdf-documents.types.ts`) unchanged; kebab-case filenames; `use-pdf-documents.ts` is 58 lines; one hook exported per file (`pdfDocumentsQueryKey` is a co-located const, same shape as `tanstack-query.mdc`'s own `SESSION_QUERY_KEY` example); the hook's doc comment explains *why* (`setQueryData`, never `invalidateQueries` — no flicker), the D4 inline comment explains *why* mutation-first. Pass.
- `hooks-service-dao.mdc` — hook calls `PdfDocumentsService.getDocuments`/`deleteDocument` only, never a DAO directly; no business logic added to the hook. Pass.
- `tanstack-query.mdc` — `useQuery({ queryKey: pdfDocumentsQueryKey, queryFn })` for the read; delete `useMutation` bridges its success into the cache via `queryClient.setQueryData` (never `invalidateQueries` — grep confirms zero calls, only the doc-comment mention), matching "bridge external effects via setQueryData"; query key exported as a `const` tuple; `refetch` stays `() => void` and calls `resetDelete()` before `void queryRefetch()` per D4 (`use-pdf-documents.ts:43-46`); no second `QueryClient`/`QueryProvider` created. `deleteDocument` returns `mutateAsync` rather than the rule's preferred bare `mutate` — this is the same deviation already reviewed and explicitly accepted as a documented spec decision in Slice 2 (task-3, `use-lessons`) to preserve the `Promise`-rejecting contract consumers depend on; task-4.md's own Done criteria mandate mirroring that exact shape, so this is not a new violation. Test wrapping: both `use-pdf-documents.test.ts` and `pdf-documents.integration.test.ts` wrap in `QueryClient({ retry: false })` + `QueryClientProvider`; query/mutation-derived assertions go through `await waitFor(...)` throughout. **Verified point (a) — the specific regression flagged and fixed twice in Slices 1 and 2 — was NOT reintroduced a third time:** `createWrapper` in `use-pdf-documents.test.ts` (lines 15-20) takes the optional `queryClient` param from the start, and the migration-anchor test (`caches the loaded documents under pdfDocumentsQueryKey`, lines 46-56) correctly calls `createWrapper(queryClient)` and reads cache state off that same instance — no hand-rolled second `QueryClientProvider` wrapper anywhere in the file (confirmed by reading the full file, not just the diff). Pass, no findings.
- `state.mdc` / `state-sharing.mdc` — the 3-field reducer (`documents`/`isLoading`/`error`) is correctly removed, not reintroduced elsewhere; `useQuery`+`useMutation` own that coordinated state now. No prop-drilling introduced. Pass / N/A.
- `atomic-design.mdc` / `component-split.mdc` — N/A, logic-only hook, no component/JSX touched.
- `types.mdc` — `UsePdfDocumentsResult` unchanged, stays in `use-pdf-documents.types.ts`, only exported types there, no runtime logic added; `pdfDocumentsQueryKey` is a runtime const, correctly kept in the implementation file (matches the `tanstack-query.mdc` reference pattern and the Slice 1/2 precedent). Pass.
- `i18n.mdc` — N/A, no user-facing strings touched.
- `tdd.mdc` — `tdd.md`'s new "Slice 3 — use-pdf-documents (task-4)" section has a complete `@s → test` map for s17-s23, each mapped by name to a test in `use-pdf-documents.test.ts` (cross-checked against `gherkin-scenarios.md` lines 143-191 — all seven scenario texts match the test behavior exactly); a terse Red→Green→Refactor cycle log (3 lines, prose only, no pasted diffs/output); explicitly logs the 8 dropped `isMounted`/`requestId`/unmount/stale-race/identity characterization tests as no-`@s`-mapping implementation detail of the deleted reducer (confirmed against the diff — these tests characterized only removed guard logic, not surviving production code, same call as Slice 2). Whole `tdd.md` is 7 553 bytes, under the 8 000-byte budget. No hardcoded strings/colors/dimensions (logic-only). Pass.
- `pre-slice-checklist.mdc` — `pdfDocumentsQueryKey` is barrel-exported (`export * from './use-pdf-documents'` in `libs/hooks/src/hooks/index.ts:16`); no new pure helpers requiring extraction; no loading-UI/a11y/atom/Modal/e2e surface in this slice; no `React.useRef`/regex-as-integration shortcuts; `use-pdf-documents.reducer.ts` fully deleted with zero remaining importers (repo-wide grep for `usePdfDocumentsReducer`/`usePdfDocumentsInitialState`/`use-pdf-documents.reducer` returns nothing). Pass.
- `e2e.mdc` — no `.e2e.js` added or needed; non-interactive data hook. Pass.

### Code quality

No findings. `createWrapper` duplication (the recurring finding in Slices 1 and 2) is absent here — confirmed by reading the full test file, not just the diff. Error contract preserved (`Error | null`); no `console.log`/TODOs; no magic numbers; single-purpose 58-line hook; short/revealing names (`pdfDocumentsQueryKey`, `queryRefetch`, `resetDelete`). D4 error-merge and reset-before-refetch ordering verified directly against the code (`error: deleteError ?? queryError`; `refetch` calls `resetDelete()` then `void queryRefetch()`) and against every ordering the old reducer produced (s20 clears a read error, s22 leaves the list on a delete failure, s23 clears a stuck delete error and exposes a later read failure). `deleteDocument` uses `mutateAsync` and still rejects to the caller (s22's `rejects.toBe(failure)`); a failed delete leaves the cached list byte-for-byte unchanged (s22); delete success filters the row via `setQueryData` with zero extra `getDocuments` calls (s21, asserted `toHaveBeenCalledTimes(1)`), never `invalidateQueries`.

### Design / Accessibility

**N/A** — logic-only hook, no UI added or touched by this slice.

**Status: no open findings — APPROVED, no fixes required before this slice closes.**

## Slice 4 — task-5 + task-6 (export `SIGNED_URL_TTL_SECONDS`; migrate `useSlideImageUrl` to `useQuery` with a derived cache window; delete `next-request-id`)

**Commits reviewed:** `9d7088705` (task-5, diff vs `9d7088705~1`), `597d7effa` (task-6, diff vs `597d7effa~1`)
**Scope:** `libs/supabase-services/src/services/lesson-image.service.ts`; `libs/hooks/src/hooks/use-slide-image-url.ts`, `use-slide-image-url.test.ts`; deletion of `next-request-id.ts`/`next-request-id.test.ts`; `task-5.md`/`task-6.md`/`tdd.md` status updates — matches both tasks' declared `paths:`. `lesson-player.integration.test.ts` listed in task-6's `paths:` but not touched by either commit (correctly — it exercises `useLesson`, not `useSlideImageUrl`; confirmed unmodified). No scope creep.

**Verdict: APPROVED**

### Rule-by-rule check (`.agents/rules/*.mdc`)

- `global.mdc` — functional hook, no Redux; kebab-case filenames; `use-slide-image-url.ts` is 28 lines; doc comments explain *why* (the CACHE_WINDOW_MS comment: "so a served cache hit is always still a valid, unexpired URL"; the exported-TTL comment: "so consumers ... can derive a cache window strictly under this lifetime instead of hard-coding one") — no restating of what the code does. Pass.
- `hooks-service-dao.mdc` — hook calls `LessonImageService.getSignedImageUrl` only, never `LessonImageDao` directly; `SIGNED_URL_TTL_SECONDS` export is a pure service-layer constant, no business logic added; service's `getSignedImageUrl` body/behavior unchanged (task-5 is export-only, verified byte-for-byte against the diff). Pass.
- `tanstack-query.mdc` — `useQuery({ queryKey: slideImageQueryKey(storagePath ?? ''), queryFn, enabled, staleTime, gcTime })`; query key exported as a function returning a `const` tuple (`slideImageQueryKey`), matching the rule's "export the query key" guidance; no second `QueryClient`/`QueryProvider` created; no manual `useState`/`useRef` re-derivation of anything TanStack already owns — `isLoading` is read straight off the hook, `url` is `data ?? null`. Test wrapping: `createWrapper()` in `use-slide-image-url.test.ts` (lines 15-19, current file) takes the optional `queryClient` param from the start — the recurring duplication finding from Slices 1/2 (and its Slice-4-sibling regression risk) is **not** present; every test that needs cache introspection (`caches the signed url...`, `derives staleTime and gcTime...`, `serves the cached url...`) calls `createWrapper(queryClient)` and reads off that same instance, no hand-rolled second wrapper. Query/mutation-derived assertions go through `await waitFor(...)` throughout (no synchronous read immediately after a triggering `act`). Pass, no findings.
- **D6 verified directly:** `CACHE_WINDOW_MS = (SIGNED_URL_TTL_SECONDS - 60) * 1000` (`use-slide-image-url.ts:12`) is used for **both** `staleTime` and `gcTime` (`use-slide-image-url.ts:24-25`) — single shared constant, not two independently-computed values that could drift from each other. Repo-wide grep for `240_000`/`240000` returns zero hits — no orphaned hardcode survives anywhere. `SIGNED_URL_TTL_SECONDS` is exported only once (`lesson-image.service.ts:8`, re-exported through `services/index.ts` → `supabase-services/index.ts` barrels) and value/every internal use (`LessonImageDao.createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)`) is unchanged from before task-5 (confirmed against the diff — export-only, no behavior change, as task-5.md promises). s24's test (`use-slide-image-url.test.ts:53-77`) introspects the live query cache's `options.staleTime`/`gcTime` and asserts both `> 0` and `< SIGNED_URL_TTL_SECONDS * 1000` — a real behavioral assertion, not a `flattenStyle`-style structural check. Pass.
- `enabled: Boolean(storagePath)` gating (`use-slide-image-url.ts:23`) verified against s25: when `imageRef` is absent, the disabled query yields `isLoading === false` (v5 semantics: `isLoading = isPending && isFetching`; a disabled query is never fetching) with **no manual derivation** — matches task-6.md's explicit Done criterion and its own noted contrast with `useProfile`/`useApiKey` (which must OR in session state). `url: data ?? null` (`use-slide-image-url.ts:27`) never throws — `LessonImageService.getSignedImageUrl` itself never rejects (try/catch → `null`), so the query can never enter an error state; s27 asserts this end-to-end (`service.getSignedImageUrl.mockResolvedValue(null)` → `url` null, `isLoading` false, no throw). s28 (stale-response guard) is now structural — the query key changes with `storagePath`, so a resolving promise for a superseded key can never land in the current key's cache slot; no manual `requestId`/`isMounted` guard remains, and the test (`ignores a stale signed URL that resolves after a newer storagePath`) exercises exactly this via `rerender` + out-of-order promise resolution. Pass.
- `state.mdc` / `state-sharing.mdc` — the prior `useState(url)` + `useState(isLoading)` + `useRef(requestId)` trio (3 related, coordinated values — arguably already a `useReducer` candidate under the old design) is correctly removed wholesale in favor of `useQuery` owning that state; no reducer needed since TanStack Query now owns the coordinated state. No prop-drilling introduced. Pass / N/A.
- `atomic-design.mdc` / `component-split.mdc` — N/A, logic-only hook, no component/JSX touched.
- `types.mdc` — `UseSlideImageUrlResult` (`use-slide-image-url.types.ts`) unchanged, stays export-only with no runtime logic; `slideImageQueryKey` and `CACHE_WINDOW_MS` are runtime values, correctly kept in the implementation file, not leaked into the `.types.ts` file. Pass.
- `i18n.mdc` — N/A, no user-facing strings touched by either commit.
- `tdd.mdc` — `tdd.md`'s "Slice 4 — use-slide-image-url" section (lines 52-62 of the current file) maps s24-s29 each to a named test in `use-slide-image-url.test.ts`, cross-checked against `gherkin-scenarios.md:197-238` — all six scenario texts match the corresponding test's behavior exactly (s24 cache-window derivation, s25 absent ref, s26 present ref, s27 service-null degrade, s28 stale-response guard, s29 cache-hit skips a second signing call). A terse Red→Green→Refactor log (3 lines) states the migration-anchor test plus s24-s29 were written failing against the pre-migration hook, then the hook was rewritten to green — no pasted diffs/output, no scope inflation. `next-request-id.ts`/`.test.ts` deletion is correctly *not* backfilled with a "removed" test — the module's own tests characterized only removed guard logic, not surviving behavior (same call pattern accepted in Slices 2/3). No hardcoded strings/colors/dimensions in the production diff (`CACHE_WINDOW_MS` is derived, not a literal `240_000`; test-side `SIGNED_URL_TTL_SECONDS: 300` mock mirrors the real exported constant, not an independent hardcode). Pass.
- `pre-slice-checklist.mdc` — `slideImageQueryKey` is barrel-exported (`export * from './use-slide-image-url'` in `libs/hooks/src/hooks/index.ts`); `SIGNED_URL_TTL_SECONDS` is barrel-exported through both the service's own file and `services/index.ts`/`supabase-services/index.ts` (confirmed present in both barrels); no new pure helpers requiring `*.helpers.ts` extraction (both new symbols are trivial, correctly left in the hook/service files per `component-split.mdc`'s "non-trivial" threshold); no loading-UI/a11y/atom/Modal/e2e surface in this slice (logic-only hook); `next-request-id.ts`/`next-request-id.test.ts` fully deleted with **zero remaining importers repo-wide** — grep for `next-request-id`/`nextRequestId` across all `.ts`/`.tsx` returns nothing. Pass.
- `e2e.mdc` — no `.e2e.js` added or needed; non-interactive data hook. Pass.

### Code quality

No findings. `createWrapper` duplication (the recurring finding in Slices 1/2, confirmed absent in Slice 3) remains absent here — verified by reading the full current test file, not just the diff. Error contract preserved (hook never throws — `url: data ?? null`, service degrades internally); no `console.log`/TODOs; no magic numbers (`CACHE_WINDOW_MS` derived, the `60` second safety margin is a named, commented constant offset, not a bare literal reused elsewhere); single-purpose ~28-line hook; short/revealing names (`slideImageQueryKey`, `CACHE_WINDOW_MS`, `storagePath`). D6 verified directly against the code as above — both windows share one derivation, both strictly under the TTL.

### Design / Accessibility

**N/A** — logic-only hook, no UI added or touched by this slice.

**Status: no open findings — APPROVED, no fixes required before this slice closes.**
