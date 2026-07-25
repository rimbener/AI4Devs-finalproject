---
id: task-1
title: Evict non-auth cache entries on user-id change in useSession
slice: 0
scenarios: [s1, s2, s3, s4]
status: todo
paths: [libs/hooks/src/hooks/use-session.ts, libs/hooks/src/hooks/use-session.test.ts]
---

## Goal
Close the cross-user cache leak (**D2**) before any user-scoped entry exists. In the existing `onAuthStateChange` bridge in `use-session.ts`, compare the incoming session's user id with the previously seen one; when it **changes** (including to/from `undefined`), call `queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })` **and then** `queryClient.setQueryData(SESSION_QUERY_KEY, next)`. When the id is unchanged — a token refresh, which fires roughly hourly — evict nothing and only write the session.

## Done criteria
- [ ] Scenario(s) s1, s2, s3, s4 covered by concrete tests in `use-session.test.ts`
- [ ] Eviction is guarded on **user-id change**, not on every auth event (s2 proves a same-user refresh evicts nothing)
- [ ] Eviction happens **before** the session write, so the new session survives (s4)
- [ ] The `'auth'`-prefixed session entry is never evicted
- [ ] The existing `receivedAuthEventRef` stale-resolution guard and every existing `use-session` test still pass unchanged
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Why here and not per-hook: `QueryProvider` is mounted above `Stack.Protected` in `apps/app-study-buddy/src/app/_layout.tsx`, so one `QueryClient` survives sign-out → sign-in for the whole app session. One choke point covers `['lessons']`, `['pdf-documents']`, `['lesson', id]`, `['lesson-image', path]` and every key added later. It composes with D1's user-scoped keys for profile/api-key rather than replacing them.

This task **modifies an already-migrated hook** — scope the diff to the bridge; do not restructure the query. The `'auth'` key prefix becomes a reserved convention; task-10 documents it. Track the previous user id in a ref, not state, so the comparison does not itself trigger a render.
