---
id: task-3
title: Migrate useLessons to useQuery + delete mutation; delete its reducer
slice: 2
scenarios: [s10, s11, s12, s13, s14, s15, s16]
status: todo
paths: [libs/hooks/src/hooks/use-lessons.ts, libs/hooks/src/hooks/use-lessons.reducer.ts, libs/hooks/src/hooks/use-lessons.test.ts, libs/hooks/src/hooks/lessons.integration.test.ts]
---

## Goal
Replace the reducer + `isMounted` + `requestId` + local-delete machinery in `useLessons` with `useQuery(['lessons'])` plus a delete `useMutation`. On delete success, filter the row out of the cached list with `setQueryData` — never `invalidateQueries`, so there is no post-mutation refetch and no loading flicker. Return the unchanged `{ lessons, isLoading, error, refetch, deleteLesson }`. Delete `use-lessons.reducer.ts`.

## Done criteria
- [ ] Scenario(s) s10, s11, s12, s13, s14, s15, s16 covered by concrete tests
- [ ] Key exported as a `const` tuple; `lessons` is `data ?? []`
- [ ] `deleteLesson` uses **`mutateAsync`**, so it still returns a Promise that rejects on failure (call sites do `void fn(...).catch(() => {})`)
- [ ] **D4 error merge:** `error = deleteMutation.error ?? query.error` (mutation-first)
- [ ] **D4 reset:** the `refetch` wrapper calls `deleteMutation.reset()` **before** `query.refetch()`, and stays `() => void`
- [ ] A failed delete leaves the cached list unchanged (s15)
- [ ] `use-lessons.reducer.ts` deleted; no `isMounted` or `requestId` ref remains
- [ ] `lessons.integration.test.ts` passes with the same wrapper, otherwise unedited
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
The single `error` field serves **two** sources. Today's reducer makes it a last-writer-wins slot: `load/start` and `delete/success` clear it, `load/failure` and `delete/failure` set it. Mutation-first ordering plus the reset-on-refetch reproduces every sequence — delete-after-read-failure shows the delete error; a refetch clears a stuck delete error; a refetch failure after a delete failure shows the read error, because the reset already cleared the mutation.

No `instanceof Error` normalizer — the service already rejects with real `Error`s.

Slices 2 and 3 are the same shape; land this one first and mirror it in task-4.
