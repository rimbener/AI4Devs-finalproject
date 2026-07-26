# TDD log — tanstack-query-hooks-migration

## Slice 0 — use-session.ts (task-1)
s1-s4: evict-other-users-on-sign-in / preserve-on-same-user-refresh / evict-on-sign-out / write-after-eviction.
`removeQueries({predicate: key[0]!=='auth'})` before `setQueryData`, guarded by `previousUserIdRef`. 162 green.

## Slice 1 — use-lesson (task-2)
s5-s9: load/empty-slides/error/refetch-clears-error/id-switch-never-shows-stale.
`useQuery({queryKey: lessonQueryKey(id)})`; deleted `use-lesson.reducer.ts`. 161 green; repo-wide clean.

## Slice 2 — use-lessons (task-3)
s10-s16: load/empty/error/refetch-clears-error, delete-removes-from-cache(no re-read), failed-delete-rejects, D4 delete-error-outranks-read-error+cleared-by-refetch.
`useQuery(['lessons'])` + delete `useMutation`; `error = deleteMutation.error ?? query.error`. 156 green.

## Slice 3 — use-pdf-documents (task-4)
s17-s23: mirrors slice 2 1:1 (`pdfDocumentsQueryKey`, D4). GREEN first pass. 150 green.

## Slice 4 — use-slide-image-url (task-5/6)
s24-s29: TTL-derived staleTime/gcTime under TTL; no-ref→not-loading/no-call; ref→loading-then-url; signing-failure degrades w/o throw; stale response never wins; cache-window re-view skips 2nd sign.
`useQuery({enabled: Boolean(storagePath), staleTime/gcTime: CACHE_WINDOW_MS})`. 152 green.

## Slice 5 — use-lesson-attempt (task-7)
s30-s36: saving→saved; failed→error/no attempt; separate save after settle is fresh; two same-tick calls insert once; in-flight refuses 2nd; retry replays last input; retry no-ops (no prior/in-flight).
`useMutation` + one `isSaving` ref (D5, TanStack doesn't dedupe `mutate()`). 154 green.

## Slice 6 — use-api-key + ApiKeyProvider removal (task-8)
s37-s50: per-user key under `apiKeyStatusQueryKey`; unauth→empty/no-call; session-resolving→loading; user-change→new key; same-user replace→no re-read; in-flight-before-logout never clobbers; save/remove write via `setQueryData`; failed save→normalized code+rejects; unrecognized→`network_error`; remove clears prior save error (D3); isSubmitting true during save/remove; 2 consumers share 1 read (s49); raw key never retained.
One tagged-union `useMutation({kind:'save'|'remove'})`; deleted ApiKeyProvider/context/reducer. 18/142 green.

## Slice 7 — use-profile + ProfileProvider removal (task-9)
s51-s58: per-user profile under `profileQueryKey`; unauth→no profile/no-call; loading ORs session+api-key+read; withheld while loading/errored; canCreate (platform/saved-key/neither); retry re-reads+clears error; session→unauth resets profile; 2 consumers share 1 read (s58).
Composed `useSession`+`useApiKey`; deleted ProfileProvider/context/reducer. 18/137 green (incl. reviewer_slice non-Error-rejection fixup).

## Round 1 review fixups (reviewer_engineering)
Dup: hoisted `useSessionGate()`, both hooks use it. Security: raw key moved off mutation `variables` into a ref read by mutationFn (`getMutationCache()` no longer exposes it). 19/142 green; repo-wide clean.

## Mutation round 1 — 24 in-scope survivors (mutation.md)
Killed (new/modified tests): use-api-key.ts:51 + use-profile.ts:28 + use-slide-image-url.ts:22 (disabled query registers under the exact `key('')`, not a mutated placeholder — `queryCache.find()` assertion); use-api-key.ts:93×2 (hasKey false at the 0-keys boundary); use-lesson-attempt.ts:49,51 (retry-guard tests now flush pending microtasks via `await act(async…)` before asserting — a bare sync `act()` let the guard-removal/boolean-flip mutants hide behind the mutationFn's one-tick dispatch lag); use-session-gate.ts:14 (session object with no `user` field must not throw); use-session.ts:28×2,29,40 (one fix: the existing stale-getSession test now awaits a real macrotask tick — notifyManager batches onto `setTimeout(0)` — before asserting, since `isLoading` was already false and let the assertion race ahead of the guard's own resolution); use-session.ts:49 (new test: swapping the ambient QueryClient must unsubscribe the old auth listener and re-subscribe against the new one).
Excluded as equivalent, `// Stryker disable next-line <Mutator>: <reason>` + confirmed via Stryker re-run (score unaffected either way): use-api-key.ts:63 (`pendingRawKeyRef.current ?? ''` — NoCoverage, ref is always non-null when read, only exists for the `string|null` type), :69 (onSettled ref-reset — pure memory hygiene, ref never read except right after a fresh overwrite), :79, :86; use-lesson-attempt.ts:45; use-lesson.ts:27; use-lessons.ts:46,48; use-pdf-documents.ts:46,48; use-profile.ts:43 — all `useCallback([mutate|mutateAsync|refetch])` deps arrays, and TanStack's Mutation/QueryObserver bind those methods once in their constructors (`@tanstack/query-core`), so they're referentially stable regardless of the array's contents.
Verified per-mutant: manually reproduced each mutation, confirmed RED against the unfixed test then GREEN after: exact repro commands in the session, not repeated here. Final Stryker run across all 9 files: 208 mutants, 77 killed, 11 ignored (justified above), 0 survived — 100.00 score. `@helsoft/hooks` full suite 148/148 green; repo-wide `pnpm turbo run test --force` 12/12 and `check-types --force` 14/14 clean; `pnpm format`/lint clean.
