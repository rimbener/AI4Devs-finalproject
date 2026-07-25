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
