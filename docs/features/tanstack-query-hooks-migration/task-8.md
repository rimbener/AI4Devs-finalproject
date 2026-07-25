---
id: task-8
title: Migrate useApiKey to a scoped query + one tagged-union mutation; delete ApiKeyProvider
slice: 6
scenarios: [s37, s38, s39, s40, s41, s42, s43, s44, s45, s46, s47, s48, s49, s50]
status: done
paths: [libs/hooks/src/hooks/use-api-key.ts, libs/hooks/src/hooks/use-api-key.types.ts, libs/hooks/src/hooks/use-api-key.reducer.ts, libs/hooks/src/hooks/use-api-key.reducer.test.ts, libs/hooks/src/hooks/index.ts, libs/hooks/src/hooks/use-api-key.test.ts, libs/hooks/src/hooks/api-key.integration.test.ts, apps/app-study-buddy/src/app/_layout.tsx, apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx]
---

## Goal
Replace the reducer + Context in `useApiKey` with a user-scoped `useQuery` and **one tagged-union `useMutation`**. Export `apiKeyStatusQueryKey(userId)` → `['api-key', 'status', userId]` (**D1**). Gate the read with `enabled: Boolean(sessionUserId) && !isSessionLoading` and derive `isLoading` so the unauthenticated case still reads `{ isLoading: false, status: { keys: [] } }`. One mutation over `{ kind: 'save' | 'remove' }` (**D3**), with `saveApiKey`/`removeApiKey` as thin `mutateAsync` wrappers. Delete `ApiKeyProvider`, the context, the `skip` parameter and the `useApiKeyState` split. Return the unchanged `{ status, isLoading, isSubmitting, error, hasKey, saveApiKey, removeApiKey }`.

## Done criteria
- [x] Scenario(s) s37–s50 covered by concrete tests
- [x] Key factory `apiKeyStatusQueryKey(userId)` exported; a different user id is a different cache entry (s40)
- [x] `isLoading` derived, **not** raw `isPending` — a disabled query reports `isPending: true`, which would break s38
- [x] **One** `useMutation` over a tagged union; `isSubmitting` is its `isPending`, `error` its normalized error (s48)
- [x] `saveApiKey`/`removeApiKey` use **`mutateAsync`** and still reject on failure
- [x] `onSuccess` writes the `ApiKeyStatus` the service already returned via `setQueryData` — never `invalidateQueries`, no refetch (s43, s44)
- [x] Error normalized through the existing `isApiKeyErrorShape` guard to the `ApiKeyErrorCode` union — no unchecked cast (s45, s46)
- [x] A successful remove clears an error left by a failed save (s47) — the single-slot semantics the tagged union preserves
- [x] `ApiKeyProvider` deleted and dropped from the `@helsoft/hooks` barrel, from `_layout.tsx`, and from the mock in `app-layout-settings.test.tsx`; `QueryProvider` stays
- [x] `use-api-key.reducer.ts` **and** `use-api-key.reducer.test.ts` deleted
- [x] The two deleted provider-sharing tests are replaced by s49 — two consumers, no provider in the tree, one read
- [x] `api-key.integration.test.ts` passes with the same wrapper (now taking an optional `queryClient` param, matching `use-pdf-documents.test.ts`'s signature); assertions immediately after an awaited `mutateAsync` call wrapped in `waitFor` — TanStack's observer notification lands a tick behind the settled promise (same root cause as slice 5's lesson-attempt timing note)
- [x] `pnpm lint` + `pnpm check-types` + `pnpm test` green (workspace and repo-wide)

## Notes
**Why one mutation, not two** (amends the story's "+2 mutations"): the contract exposes a single `error` and a single `isSubmitting`, and today's reducer clears the error on **any** mutation success — pinned by the existing "removeApiKey … updates status on success" test, which asserts `error` is null. Two independent `useMutation`s hold separate error state and would need circular `reset()` plumbing to fake cross-clearing. `tanstack-query.mdc`'s carve-out applies twice: both actions are consumed by the same `ApiKeyManager`, and they already share `runMutation`.

**Accepted micro-divergence:** TanStack resets mutation state on every `mutate`, so `error` now clears at submit **start** rather than on success. No test or component depends on the old behavior, and it is the better banner UX. Recorded in `spec.md`.

This task is deliberately large because deleting the provider must land atomically with its barrel and app-wiring removal — otherwise the tree does not type-check between tasks. `RootValidation` in `_layout.tsx` gates the whole app, so verify s49 before removing the provider.
