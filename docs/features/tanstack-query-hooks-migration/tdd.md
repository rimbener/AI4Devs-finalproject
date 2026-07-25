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
1. s1: unconditional `removeQueries({ predicate: q.queryKey[0] !== 'auth' })` before `setQueryData` in the auth bridge.
2. s2: added `previousUserIdRef` (seeded from cached session at mount) to guard eviction to real user-id changes only.
3. s3: characterization — sign-out eviction + predicate excludes `SESSION_QUERY_KEY`; passed on cycle-2 impl.
4. s4: characterization — asserts evict-before-write call order; passed on cycle-1 impl, verified teeth by reverting order manually.

### Notes
- Scope: `onAuthStateChange` bridge only; `queryFn`/`receivedAuthEventRef` untouched.
- Full `@helsoft/hooks` suite: 20 suites / 162 tests green. lint + check-types clean.

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
1. Migration anchor: `caches the loaded lesson under lessonQueryKey(id)`; rewrote hook on `useQuery({ queryKey: lessonQueryKey(id) })`; deleted `use-lesson.reducer.ts`.
2. s5-s7: wrapped pre-existing tests in `createWrapper()` (`QueryClient({retry:false})`); passed unchanged.
3. s8: renamed refetch test to fail-then-succeed shape; passed, TanStack clears `error` on successful refetch.
4. s9: kept id-change test + added stale-response race test; both pass — per-id key isolates caches, no manual guard needed.
5. Dropped 2 stale-`refetch()`-race tests (characterized deleted `requestId` ref, no `@s` mapping; TanStack owns same-key dedup).
6. Refactor: none beyond initial write.

### Notes
- `lesson-player.integration.test.ts` adapted with same `createWrapper()`.
- `use-lesson.reducer.ts` deleted, no other importers.
- No `instanceof Error` normalizer re-added.
- Full `@helsoft/hooks` suite: 20 suites / 161 tests green; lint + check-types clean; repo-wide format + check-types clean (14/14).

## Slice 2 — use-lessons (task-3)

### @s → test map
| @s | Test | File |
|---|---|---|
| s10 | `initializes isLoading to true on the first render before effects flush`, `starts loading and resolves with lessons from LessonsService.getLessons` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s11 | `resolves with an empty lessons array when the service returns none` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s12 | `sets error and clears loading when the service rejects` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s13 | `refetch clears a prior error on success` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s14 | `deleteLesson removes the lesson from the list after a successful service delete, without re-reading` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s15 | `deleteLesson leaves the list unchanged and sets error when the service rejects` | `libs/hooks/src/hooks/use-lessons.test.ts` |
| s16 | `refetch clears a delete error and exposes a later read failure instead` | `libs/hooks/src/hooks/use-lessons.test.ts` |

### Cycles
1. Migration anchor: rewrote hook on `useQuery(['lessons'])` + `useMutation` delete, `setQueryData` filter on success (no invalidate); deleted `use-lessons.reducer.ts`.
2. s10-s13: wrapped pre-existing tests in `createWrapper()`; passed unchanged (kept the non-error reload test too, no dedicated `@s`).
3. s14: added a `getLessons` call-count assertion (still 1) after delete success, proving no re-read; passed — `setQueryData` never triggers a refetch.
4. s15: wrapped pre-existing failed-delete test; passed — `mutateAsync` still rejects, cache untouched.
5. s16 (D4): new test — delete fails (error exposed), `refetch()` then a failing re-read; asserts the exposed error is the read failure, not the stale delete failure. Passed on `deleteMutation.error ?? query.error` + `reset()`-before-`refetch()` ordering.
6. Dropped 6 isMounted/requestId/unmount characterization tests — implementation details of the deleted reducer, no `@s` mapping; TanStack owns unmount safety.

### Notes
- `lessons.integration.test.ts` adapted with same `createWrapper()`, otherwise unedited.
- `use-lessons.reducer.ts` deleted, no other importers.
- No `instanceof Error` normalizer re-added.
- Fixed a flaky sync read after `act()` (notifyManager batches via `setTimeout`) — wrapped in `waitFor`.
- Full `@helsoft/hooks` suite: 20 suites / 156 tests green; lint + check-types clean; repo-wide format + check-types clean (14/14).

## Slice 3 — use-pdf-documents (task-4)

### @s → test map
| @s | Test | File |
|---|---|---|
| s17 | `initializes isLoading to true...`, `starts loading and resolves with documents from PdfDocumentsService.getDocuments` | `use-pdf-documents.test.ts` |
| s18 | `resolves with an empty documents array when the service returns none` | `use-pdf-documents.test.ts` |
| s19 | `sets error and clears loading when the service rejects` | `use-pdf-documents.test.ts` |
| s20 | `refetch clears a prior error on success` | `use-pdf-documents.test.ts` |
| s21 | `deleteDocument removes the document from the list after a successful service delete, without re-reading` | `use-pdf-documents.test.ts` |
| s22 | `deleteDocument leaves the list unchanged and sets error when the service rejects` | `use-pdf-documents.test.ts` |
| s23 | `refetch clears a delete error and exposes a later read failure instead` | `use-pdf-documents.test.ts` |

### Cycles
1. Mirrored task-3's shape 1:1: RED with adapted test file (`pdfDocumentsQueryKey`, `PdfDocumentsService`); rewrote hook on `useQuery(['pdf-documents'])` + delete `useMutation` with `setQueryData` filter (D4 mutation-first `error`, `reset()`-before-`refetch()`); deleted `use-pdf-documents.reducer.ts`. GREEN on first pass.
2. Dropped 8 isMounted/requestId/unmount/stale-race/identity characterization tests — deleted-reducer internals, no `@s` mapping (same call as slice 2).
3. Refactor: none beyond the mirrored shape.

### Notes
- `pdf-documents.integration.test.ts` given the same local `createWrapper()`, otherwise unedited.
- `use-pdf-documents.reducer.ts` deleted, no other importers.
- No `instanceof Error` normalizer re-added.
- Full `@helsoft/hooks` suite: 20 suites / 150 tests green; lint + check-types clean; repo-wide format + check-types clean (14/14).
</content>
