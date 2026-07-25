---
id: task-9
title: Migrate useProfile to a scoped query; delete ProfileProvider
slice: 7
scenarios: [s51, s52, s53, s54, s55, s56, s57, s58]
status: done
paths: [libs/hooks/src/hooks/use-profile.ts, libs/hooks/src/hooks/use-profile.types.ts, libs/hooks/src/hooks/use-profile.reducer.ts, libs/hooks/src/hooks/index.ts, libs/hooks/src/hooks/use-profile.test.ts, apps/app-study-buddy/src/app/_layout.tsx, apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx]
---

## Goal
Replace the reducer + `requestId` + Context in `useProfile` with a user-scoped `useQuery`. Export `profileQueryKey(userId)` → `['profile', userId]` (**D1**), gated with `enabled: Boolean(sessionUserId) && !isSessionLoading`. Keep composing `useSession` + `useApiKey`: `isLoading` still ORs all three sources, `profile` is still `null` while loading or errored, and `canCreate` is still `keySource === 'platform' || hasKey`. Delete `ProfileProvider`, the context and the `skip`/`useProfileState` split. Return the unchanged `{ profile, isLoading, error, retry }`.

## Done criteria
- [x] Scenario(s) s51–s58 covered by concrete tests
- [x] Key factory `profileQueryKey(userId)` exported; a different user id is a different cache entry
- [x] `isLoading` derived so the unauthenticated case reads `{ isLoading: false, profile: null }` (s52) despite a disabled query reporting `isPending: true`
- [x] `isLoading` ORs profile + api-key + session (s53); `profile` is `null` whenever loading or errored (s54)
- [x] `canCreate` derivation unchanged (s55)
- [x] `retry` wrapped to stay `() => void` (s56)
- [x] `ProfileProvider` deleted and dropped from the `@helsoft/hooks` barrel, from `_layout.tsx`, and from the mock in `app-layout-settings.test.tsx`; `QueryProvider` stays
- [x] `use-profile.reducer.ts` deleted; no `requestId` ref remains
- [x] The deleted provider-sharing test is replaced by s58 — two consumers, no provider in the tree, one read
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Lands after task-8 because `useProfile` consumes `useApiKey`'s `hasKey`/`isLoading`; migrating the dependency first keeps this diff to one hook.

s57 (session becomes unauthenticated → profile resets) is satisfied by the user-scoped key plus the `enabled` gate, not by a manual reset action — and slice 0's eviction covers the cross-user case.

`_layout.tsx` will have no `@helsoft/hooks` providers left after this task apart from `QueryProvider`; `RootValidation` still calls `useProfile()` directly and must keep gating the app identically. This is the highest-blast-radius task in the feature — a mistake is a blank screen, not a hook bug.
