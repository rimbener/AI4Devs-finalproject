# TDD log — tanstack-query-hooks-migration

## Slice 0 — auth-change cache reset (task-1, `use-session.ts`)

### @s → test map
| @s | Test | File |
|---|---|---|
| s1 | `@s1 evicts other cached entries and re-reads them when a different user signs in` | `libs/hooks/src/hooks/use-session.test.ts` |
| s2 | `@s2 preserves the cache and does not re-read on a same-user token refresh` | `libs/hooks/src/hooks/use-session.test.ts` |
| s3 | `@s3 evicts other cached entries when the session becomes unauthenticated, but never the session entry itself` | `libs/hooks/src/hooks/use-session.test.ts` |
| s4 | `@s4 evicts the cache before writing the new session, so the write is never clobbered` | `libs/hooks/src/hooks/use-session.test.ts` |

### Cycles
1. **RED s1** — seeded a non-`auth` cache entry, mounted `useSession`, pushed a session for a different user id; asserted the entry was evicted and a fresh consumer re-reads it. Failed (no eviction existed). **GREEN** — added an unconditional `queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })` before the existing `setQueryData` call in the `onAuthStateChange` bridge.
2. **RED s2** — same setup but pushed a session for the *same* user id (token refresh); asserted the cached entry survived and no re-read happened. Failed against the naive unconditional eviction from cycle 1 (it wiped the cache on every event). **GREEN** — added `previousUserIdRef` (lazily seeded from whatever session is already cached at mount, via `queryClient.getQueryData(SESSION_QUERY_KEY)?.user?.id`), guarding eviction to only fire when `next?.user?.id !== previousUserIdRef.current`; ref updated on every bridge event.
3. **RED/characterization s3** — sign-out (`push(null)`) evicts other entries; also asserts the `removeQueries` predicate itself returns `false` for the `SESSION_QUERY_KEY` and `true` for another key. Passed immediately on the cycle-2 implementation (optional chaining already generalizes `undefined` as "a different id"); kept as a distinct behavioral test locking down the `'auth'`-prefix exclusion directly via the predicate function, not just end-state.
4. **RED/characterization s4** — spies on `removeQueries`/`setQueryData` call order across a user-id change; asserts eviction happens before the session write. Passed immediately (order already correct from cycle 1). Verified it has real teeth: manually swapped the two statements' order, reran — test failed as expected (`removeCallOrder` > `setCallOrder`) — then reverted.

### Notes
- Scope held to the `onAuthStateChange` bridge only; the `queryFn`/`receivedAuthEventRef` guard untouched.
- All 4 pre-existing `use-session.test.ts` tests pass unchanged.
- Full `@helsoft/hooks` suite: 20 suites / 162 tests green (a `console.warn`-after-teardown / worker-exit warning is pre-existing Jest/Expo test-runner noise, unrelated to this change — reproduced identically on a clean re-run).
- `pnpm --filter @helsoft/hooks lint` and `check-types` clean.

## Slice 1 — use-lesson (task-2)

### @s → test map
| @s | Test | File |
|---|---|---|
| s5 | `initializes isLoading to true on the first render before effects flush`, `starts loading and resolves with the lesson from LessonsService.getLesson` | `libs/hooks/src/hooks/use-lesson.test.ts` |
| s6 | `resolves with a lesson that has zero slides` | `libs/hooks/src/hooks/use-lesson.test.ts` |
| s7 | `sets error and clears loading when the service rejects` | `libs/hooks/src/hooks/use-lesson.test.ts` |
| s8 | `refetch after a failed read clears the error and exposes the lesson` | `libs/hooks/src/hooks/use-lesson.test.ts` |
| s9 | `reloads when the lesson id changes`, `never lets a stale response for a previous lesson id replace the newly requested one` | `libs/hooks/src/hooks/use-lesson.test.ts` |

### Cycles
1. **RED** — added `caches the loaded lesson under lessonQueryKey(id)` (migration anchor: renders `useLesson` under a real `QueryClient`, asserts `queryClient.getQueryData(lessonQueryKey(id))` equals the lesson). Failed: `lessonQueryKey` doesn't exist yet. **GREEN** — rewrote `use-lesson.ts` on `useQuery({ queryKey: lessonQueryKey(id), queryFn: () => LessonsService.getLesson(id) })`; `refetch` wraps `queryRefetch` to stay `() => void`; deleted `use-lesson.reducer.ts`. **REFACTOR** — none needed, already minimal.
2. **Adapt s5/s6/s7** — wrapped the three pre-existing loading/content/error tests in a `createWrapper()` (`QueryClient({ retry: false })` + `QueryClientProvider`); no assertion changes. Passed unchanged (characterizes the new implementation against the same contract).
3. **Adapt s8** — rewrote `refetch reloads the lesson from the service` into `refetch after a failed read clears the error and exposes the lesson`: first call rejects, `refetch()` then resolves; asserts the error clears and the lesson appears. Passed on the `useQuery` implementation (TanStack clears `error` on a successful refetch) with no extra code.
4. **Adapt s9** — kept `reloads when the lesson id changes` (wrapper added only). Added a new race test, `never lets a stale response for a previous lesson id replace the newly requested one`: id switches while the first id's fetch is still pending, then the stale promise resolves after the second id's lesson is already exposed; asserts the stale value never overwrites. Passed with no manual guard — the per-id query key already isolates the two fetches' cache entries.
5. **Dropped** `ignores a stale successful load that resolves after a newer refetch` and `ignores a stale rejection that settles after a newer refetch` — these characterized the deleted `requestId` ref guard on same-id `refetch()` races, an implementation detail with no `@s` mapping; TanStack owns same-key in-flight dedup now (per task-2 notes, no manual guard is written).
6. **Refactor** — none beyond the initial write; `use-lesson.ts` is a single `useQuery` call plus a `useCallback`-wrapped `refetch`.

### Notes
- `lesson-player.integration.test.ts` adapted with the same `createWrapper()` (the only change — `useQuery` now requires a `QueryClientProvider` ancestor).
- `use-lesson.reducer.ts` deleted; no importers remained (`next-request-id.ts` keeps its one importer, `use-slide-image-url`, per task-2 notes — untouched here).
- No `instanceof Error` normalizer re-added — `LessonsService.getLesson` already rejects with a real `Error`.
- Full `@helsoft/hooks` suite: 20 suites / 161 tests green. `pnpm --filter @helsoft/hooks lint` + `check-types` clean; repo-wide `pnpm format` + `pnpm turbo run check-types --output-logs=errors-only` clean (14/14 packages).
