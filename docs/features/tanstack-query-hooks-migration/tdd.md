# TDD log — tanstack-query-hooks-migration

## Slice 0 — auth-change cache reset (task-1, `use-session.ts`)
| @s | Test |
|---|---|
| s1 | evicts other cached entries and re-reads them when a different user signs in |
| s2 | preserves the cache and does not re-read on a same-user token refresh |
| s3 | evicts other cached entries on sign-out, never the session entry itself |
| s4 | evicts the cache before writing the new session (call order) |

Cycles: unconditional `removeQueries({predicate: key[0] !== 'auth'})` before `setQueryData` in the auth bridge (s1) → `previousUserIdRef` guard so only real user-id changes evict (s2) → s3/s4 characterized against that impl, passed unchanged.
Full `@helsoft/hooks` suite: 162 tests green; lint + check-types clean.

## Slice 1 — use-lesson (task-2)
| @s | Test |
|---|---|
| s5 | first render loading=true; resolves lesson, no error |
| s6 | resolves a lesson with zero slides |
| s7 | sets error, clears loading, on service rejection |
| s8 | refetch after failure clears error, exposes lesson |
| s9 | id-change reload + stale-response-for-previous-id never wins |

Cycles: rewrote on `useQuery({queryKey: lessonQueryKey(id)})`, deleted `use-lesson.reducer.ts`; wrapped tests in `createWrapper()`; s8 refetch relies on TanStack clearing error on success; s9 per-id key isolates caches, no manual guard. Dropped 2 stale-`refetch()`-race characterization tests (deleted-reducer internals, no `@s`).
`lesson-player.integration.test.ts` adapted with same `createWrapper()`. No `instanceof Error` normalizer re-added.
Full suite: 161 tests green; lint + check-types clean; repo-wide 14/14 clean.

## Slice 2 — use-lessons (task-3)
| @s | Test |
|---|---|
| s10-s13 | load / empty / error / refetch-clears-error (mirrors use-lesson shape) |
| s14 | delete removes from cached list, no re-read (`setQueryData`, no invalidate) |
| s15 | failed delete rejects to caller, list unchanged |
| s16 | D4: delete error cleared before refetch; later read failure wins |

Cycles: `useQuery(['lessons'])` + delete `useMutation`; deleted `use-lessons.reducer.ts`. D4: `error = deleteMutation.error ?? query.error`; `refetch` wrapper calls `deleteMutation.reset()` before `query.refetch()`. Dropped 6 isMounted/requestId/unmount characterization tests — no `@s` mapping.
`lessons.integration.test.ts` adapted, otherwise unedited. Fixed one flaky sync-read-after-`act()` with `waitFor` (notifyManager batches via setTimeout).
Full suite: 156 tests green; lint + check-types clean; repo-wide 14/14 clean.

## Slice 3 — use-pdf-documents (task-4)
| @s | Test |
|---|---|
| s17-s23 | mirrors task-3 1:1 (`pdfDocumentsQueryKey`, `PdfDocumentsService`, D4 mutation-first error + reset-before-refetch) |

Cycles: mirrored shape, GREEN on first pass; deleted `use-pdf-documents.reducer.ts`; dropped 8 deleted-reducer-internals characterization tests (no `@s`).
`pdf-documents.integration.test.ts` given local `createWrapper()`, otherwise unedited.
Full suite: 150 tests green; lint + check-types clean; repo-wide 14/14 clean.

## Slice 4 — use-slide-image-url (task-5 + task-6)
| @s | Test |
|---|---|
| — | task-5: no `@s` (pure prerequisite export, per review-spec finding 1) |
| s24 | derives `staleTime` and `gcTime` from `SIGNED_URL_TTL_SECONDS`, both under the TTL |
| s25 | absent ref → url null, not loading, service never called |
| s26 | ref present → loading true then resolves the signed url |
| s27 | service resolves null → url null, loading finished, no throw |
| s28 | stale response for a previous storagePath never replaces the newer one |
| s29 | re-view within the cache window serves cached url, no second signing call |

Cycles:
1. task-5: exported `SIGNED_URL_TTL_SECONDS` from `lesson-image.service.ts` (was module-private `const`); flows through the existing `services/index.ts` → lib `index.ts` barrels untouched (already `export *`). No behavior change; existing `lesson-image.service.test.ts` (4 tests) unaffected.
2. task-6 RED: new `use-slide-image-url.test.ts` — migration-anchor cache-key test + s24 (introspects `queryClient.getQueryCache().find(key)?.options.staleTime` / `.gcTime`) + s25-s29 (s25-s28 adapted from the pre-migration file; s29 new) — all failing against the old `useState`/`requestId` hook.
3. GREEN: rewrote hook on `useQuery({queryKey: slideImageQueryKey(storagePath), enabled: Boolean(storagePath), staleTime: CACHE_WINDOW_MS, gcTime: CACHE_WINDOW_MS})` where `CACHE_WINDOW_MS = (SIGNED_URL_TTL_SECONDS - 60) * 1000`; `url = data ?? null`. v5's `isLoading = isPending && isFetching` gives `false` for the disabled-query case with no manual derivation (s25). s28's stale-response guard is now free from the per-`storagePath` key. All 7 tests green.
4. Deleted `next-request-id.ts` + its test (repo-wide grep confirmed zero remaining importers after the rewrite).
5. `lesson-player.integration.test.ts` already carries the `QueryClientProvider` wrapper from slice 1 and doesn't reference this hook — left unedited, still green.
6. Refactor: none beyond initial write (biome flattened the query-key one-liner).

Notes:
- `retry: false` not set — service never rejects (catches internally), so the stock 3× retry never engages; not needed for correctness (per task-6 note).
- Repo-wide grep before delete: only `use-slide-image-url.ts` and `next-request-id.test.ts` imported `nextRequestId`.
- Full `@helsoft/hooks` suite: 19 suites / 152 tests green; `@helsoft/hooks` lint + check-types clean; `@helsoft/supabase-services` check-types clean; repo-wide `pnpm format` + `pnpm check-types` 14/14 clean.
