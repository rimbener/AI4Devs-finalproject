---
id: task-12
title: Prove a catalog reorder/rename propagates to every consumer with no code change
slice: 3
scenarios: [s20]
status: done
paths:
  - libs/hooks/src/hooks/use-ai-providers.test.ts
---

## Goal
The story's headline promise is "no app update needed" — prove it mechanically: editing a mocked
catalog row's `sort_order` (or `name`) and re-reading the hook reflects the change immediately, with
no cache/memoization masking it.

## Done criteria
- [ ] Scenario s20 covered: a test drives `useAiProviders()` against one mocked
      `AiProvidersService.getCatalog` implementation, asserts the initial order, then swaps the
      mocked rows' `sort_order` (no new `QueryClient`, no remount) and re-triggers the query,
      asserting the new order is reflected
- [ ] The same test (or a sibling) proves a `name`/`guidanceUrl` edit is reflected the same way
- [ ] Written so a future module-level cache added ahead of `useQuery` (e.g. memoizing the mapped
      array) would make this test fail — mirrors the backend story's `@s28` intent at the client
      layer
- [ ] `pnpm test` green for `@helsoft/hooks`

## Notes
- Decision 1. This does **not** mean invalidating/refetching automatically on a timer — `staleTime:
  Infinity` (task-2) means the query only re-reads on an explicit `invalidateQueries`/remount/
  refetch, same as `useSession`'s reference-data precedent. This task proves the *read path* is
  correct (no re-sort/rename gets lost or cached stale), not that the app polls the catalog.
- No production code changes expected here — if the test fails, the fix belongs in task-1's DAO/
  service or task-2's hook, not here.
