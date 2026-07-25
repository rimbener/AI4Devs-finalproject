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
