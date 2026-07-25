---
id: task-7
title: Migrate useLessonAttempt to useMutation, keeping the isSaving entry gate
slice: 5
scenarios: [s30, s31, s32, s33, s34, s35, s36]
status: todo
paths: [libs/hooks/src/hooks/use-lesson-attempt.ts, libs/hooks/src/hooks/use-lesson-attempt.test.ts]
---

## Goal
Replace `useState` + the `isMounted` and `lastInput` refs in `useLessonAttempt` with a save `useMutation`. Map the mutation status to the existing union (`idle | pending | success | error` → `idle | saving | saved | error`), expose `attempt` as `data ?? null`, and drive `retry` from `mutation.variables`. **Keep one `isSaving` ref** as a pure entry gate, cleared in `onSettled` (**D5**). Return the unchanged `{ status, attempt, saveAttempt, retry }`.

## Done criteria
- [ ] Scenario(s) s30, s31, s32, s33, s34, s35, s36 covered by concrete tests
- [ ] **s33 is a new test:** two `saveAttempt` calls **in the same tick** result in exactly one service call
- [ ] `isSaving` ref gates entry for **both** call sites (`saveAttempt` and `retry`) and is cleared in `onSettled`
- [ ] The ref does nothing but gate — `status` and `attempt` come from the mutation, never from parallel state
- [ ] `lastInput` ref deleted; `retry` replays `mutation.variables` and is a no-op when it is `undefined` (s36)
- [ ] `isMounted` ref deleted; no state-update-after-unmount warning (existing test)
- [ ] `saveAttempt` returns `void` (`mutate`, not `mutateAsync`) — unchanged from today
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
**Why the ref stays** (this amends the story's "now via `isPending`, not a ref"): `isPending` is React state and only becomes `true` after a re-render. TanStack does **not** dedupe — a second `mutate()` while one is pending builds a *new* mutation and executes it, discarding the first's result. So two calls in the same tick (a double-tap on Finish, or a handler firing alongside an effect) both read `isPending === false` and both insert, producing duplicate `lesson_attempts` rows. That is risk R4/R5, which the original ref was added to close.

The existing overlap tests use two **separate** `act()` blocks, so React re-renders between them and an `isPending` guard would pass them — they do not cover the case the ref exists for. Hence s33.

The deletion AC names `isMounted` and `requestId` refs; `isSaving` is a load-bearing domain invariant, not re-implemented cache machinery. Comment it in the source explaining precisely why TanStack does not cover it, so a future reader does not "clean it up".
