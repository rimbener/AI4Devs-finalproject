---
id: task-2
title: Migrate useLesson to useQuery; delete its reducer
slice: 1
scenarios: [s5, s6, s7, s8, s9]
status: todo
paths: [libs/hooks/src/hooks/use-lesson.ts, libs/hooks/src/hooks/use-lesson.reducer.ts, libs/hooks/src/hooks/use-lesson.test.ts]
---

## Goal
Replace the reducer + `requestId` machinery in `useLesson` with `useQuery`. Export the key as a `const` tuple (`['lesson', id]`), fetch via `LessonsService.getLesson(id)`, and return the unchanged `{ lesson, isLoading, error, refetch }`. Delete `use-lesson.reducer.ts`. This is the simplest hook and establishes the pattern the next four slices repeat.

## Done criteria
- [ ] Scenario(s) s5, s6, s7, s8, s9 covered by concrete tests in `use-lesson.test.ts`
- [ ] Return shape byte-for-byte identical; `lesson` is `data ?? null`
- [ ] `refetch` wrapped to stay `() => void` (TanStack's returns a Promise)
- [ ] `use-lesson.reducer.ts` deleted; no `requestId` ref remains
- [ ] Stale-response handling comes from the key changing with `id` (s9) — no manual guard
- [ ] Hook calls `LessonsService` only, never a DAO (`hooks-service-dao.mdc`)
- [ ] Tests adapted, not rewritten: `renderHook` wrapped in `QueryClientProvider` with a fresh `QueryClient` per test constructed with `retry: false`; synchronous post-`act` reads replaced with `await waitFor(...)`
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Do **not** re-add a `cause instanceof Error ? … : new Error(String(cause))` normalizer — `LessonsService.getLesson` already rejects with a real `Error`, so TanStack's default `TError = Error` is accurate and a hand-rolled guard would be dead code Stryker flags.

`next-request-id.ts` still has one importer (`use-slide-image-url`) after this task; it is deleted in task-6, not here.

An empty lesson (`slides: []`) is a **successful** read, not an error (s6) — it must not be coerced into an error or an empty-data branch.
