# Migrate data-fetching hooks to TanStack Query

**As a** developer on this codebase
**I want** every hook that reads or writes through a service to run on `@tanstack/react-query` instead of hand-rolled `useReducer`/`useState` plus `isMounted`/`requestId` cancellation refs
**so that** loading, error, caching and stale-response handling come from one audited library rather than being re-implemented (and re-reviewed) in every hook.

## Context

`@tanstack/react-query` is installed and `QueryProvider` is already mounted at the app root
(`apps/app-study-buddy/src/app/_layout.tsx`). Three hooks were migrated with it — `use-session`
(`useQuery`), `use-auth` and `use-sign-out` (`useMutation`) — and the pattern is written up in
`.agents/rules/tanstack-query.mdc`. Everything else still predates the install and carries stale
comments claiming "tanstack-query not installed → local state".

Each un-migrated hook re-implements the same ~40 lines: a reducer with `load/start`,
`load/success`, `load/failure` actions, an `isMounted` ref to avoid post-unmount dispatches, and a
monotonic `requestId` ref to discard stale responses. That is exactly what the query cache does.

### In scope — 7 hooks in `libs/hooks/src/hooks/`

| Hook | Current | Target |
|---|---|---|
| `use-lesson` | reducer + `requestId` | `useQuery(['lesson', id])` |
| `use-lessons` | reducer + `isMounted` + `requestId` + local delete | `useQuery(['lessons'])` + delete `useMutation` |
| `use-pdf-documents` | reducer + `isMounted` + `requestId` + local delete | `useQuery(['pdf-documents'])` + delete `useMutation` |
| `use-slide-image-url` | `useState` + `requestId` | `useQuery(['lesson-image', storagePath])` |
| `use-profile` | reducer + `requestId` + Context provider | `useQuery(['profile'])` |
| `use-api-key` | reducer + Context provider + save/remove | `useQuery(['api-key','status'])` + 2 mutations |
| `use-lesson-attempt` | `useState` + in-flight ref guard | save `useMutation` |

### Out of scope — documented exemptions, not oversights

- `libs/hooks/src/hooks/use-lesson-generation.ts` — multi-stage `stage` machine driven by a
  `setInterval` progress stepper over a long-running LLM call, plus a `retry` that must replay the
  exact prior request. Not query-shaped enough to be worth the risk.
- `libs/pdf-upload-extraction/src/hooks/use-pdf-extraction.ts` — same reasoning; `retry` must reuse
  the same `documentId` so a retry never mints a second document row.
- `libs/localization/src/hooks/use-locale-preference.ts` — imperative AsyncStorage getters/setters
  called from effects, no observable loading/error state.
- `libs/study-buddy/src/components/lesson-generation/use-lesson-generation.ts`
  (`useLessonGenerationForm`) — reads a stored preference once only to *seed* local picker state.

## Acceptance criteria

### Behavior preserved

- Every migrated hook's return shape is byte-for-byte identical — same keys, same names, same
  types. No component, Storybook story, `.storybook/mocks/hooks.ts` mock, or Playwright e2e is
  edited to accommodate the migration.
  - `useLesson` → `{ lesson, isLoading, error, refetch }`
  - `useLessons` → `{ lessons, isLoading, error, refetch, deleteLesson }`
  - `usePdfDocuments` → `{ documents, isLoading, error, refetch, deleteDocument }`
  - `useSlideImageUrl` → `{ url, isLoading }`
  - `useProfile` → `{ profile, isLoading, error, retry }`
  - `useApiKey` → `{ status, isLoading, isSubmitting, error, hasKey, saveApiKey, removeApiKey }`
  - `useLessonAttempt` → `{ status, attempt, saveAttempt, retry }`
- `deleteLesson`, `deleteDocument`, `saveApiKey` and `removeApiKey` still return a Promise that
  rejects on failure (call sites do `void fn(...).catch(() => {})`), i.e. `mutateAsync`, not `mutate`.
- Hooks still call services only, never DAOs (`hooks-service-dao.mdc`).
- Errors keep their current types: `Error` for the list/detail reads, the `ApiKeyErrorCode` union for
  `useApiKey` — normalized through the existing typed guard, no unchecked casts.
- `useSlideImageUrl` still resolves to `{ url: null }` and never throws when the ref is absent or
  signing fails.
- `useLessonAttempt.status` still moves `idle → saving → saved | error`; a second `saveAttempt`
  or `retry` while a save is in flight is still refused, not queued (now via `isPending`, not a ref).
- `useLessonAttempt.retry` replays the last input; a `retry` before any attempt is still a no-op.

### Query wiring

- Each hook exports its query key as a `const` tuple so other hooks can target the same cache entry.
- Mutations sync the cache in `onSuccess` via `setQueryData`, never `invalidateQueries`: a delete
  filters the row out of the cached list; `saveApiKey`/`removeApiKey` write the `ApiKeyStatus` the
  service already returns. No post-mutation refetch, no loading flicker.
- `useProfile` and `useApiKey` gate their read with `enabled: Boolean(sessionUserId) && !isSessionLoading`.
  Because a disabled query reports `isPending: true`, `isLoading` is derived so the unauthenticated
  case still reads `{ isLoading: false, data: null }` exactly as today.
- `useProfile` keeps composing `useSession` + `useApiKey`: `isLoading` still ORs all three sources,
  and `profile` is still `null` while loading or errored, with `canCreate` derived unchanged.
- `useSlideImageUrl` sets `gcTime: 240_000` — under the 300s `SIGNED_URL_TTL_SECONDS` — so a served
  cache hit is always still a valid signed URL, while re-viewing the same slide skips a re-sign.
- The `QueryClient` in `libs/hooks/src/provider/query-provider.tsx` keeps stock defaults. The
  resulting changes are accepted deliberately: a failing read retries 3× with backoff before the
  Error state appears, and on web a focused/remounted screen refetches.

### Deletions

- All 6 reducer files are deleted with the code they served: `use-lesson.reducer.ts`,
  `use-lessons.reducer.ts`, `use-pdf-documents.reducer.ts`, `use-profile.reducer.ts`,
  `use-api-key.reducer.ts`, plus `use-api-key.reducer.test.ts`.
- Every `isMounted` and `requestId` ref in the migrated hooks is gone. `next-request-id.ts` and
  `next-request-id.test.ts` are deleted as well — its only two importers, `use-lesson` and
  `use-slide-image-url`, are both in scope, so nothing is left using it.
- `ApiKeyProvider` and `ProfileProvider` are deleted — the query cache dedupes by key, so the
  context plumbing (`createContext`/`useContext`/`skip` parameter and the `useXState` split) is
  removed from both hooks. They are dropped from the `@helsoft/hooks` barrel, from
  `apps/app-study-buddy/src/app/_layout.tsx`, and from the mock in
  `apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx`. `QueryProvider` stays.
- Two `useApiKey()` consumers mounted in the same session (e.g. Settings + Upload) still share a
  single `getApiKeyStatus()` read — now through the cache instead of the provider.

### Tests

- Existing hook tests are kept and adapted, not rewritten — they assert the unchanged public
  contract and are the regression proof. Adaptation is limited to wrapping `renderHook` in a
  `QueryClientProvider` with a fresh `QueryClient` per test and replacing synchronous post-`act`
  reads with `await waitFor(...)`, per the Testing section of `tanstack-query.mdc`.
- Test `QueryClient`s are constructed with `retry: false` so error-path assertions resolve on the
  first rejection instead of waiting out the production retry policy.
- The 4 integration tests keep passing with the same wrapper: `api-key.integration.test.ts`,
  `lessons.integration.test.ts`, `pdf-documents.integration.test.ts`,
  `lesson-player.integration.test.ts`.
- The two deleted provider-sharing tests (`use-api-key.test.ts` "shares one underlying status fetch
  …" / "falls back to its own independent state …", `use-profile.test.ts` "shares one profile fetch
  …") are replaced by equivalents proving two consumers of the same key share one fetch with no
  provider in the tree.
- `pnpm lint`, `pnpm check-types` and the Jest suites pass.

### Documentation

- `.agents/rules/tanstack-query.mdc` gains an **Exemptions** section naming the 4 non-migrated hooks
  with the reason for each, so a future agent neither migrates them blindly nor copies the reducer
  pattern for a new hook.
- Every stale "tanstack-query not installed → local state" / "tanstack-query not installed (spec's
  locked hook-style decision)" comment is corrected, including the ones in the exempted files.
- `AGENTS.md` no longer says tanstack-query "is not installed yet — add it to `@helsoft/hooks` when
  first needed"; it states that it is installed and is the required pattern, with the exemptions
  cross-referenced.

## Notes

- Pure refactor: no new user-facing feature, no schema change, no new service or DAO method.
- Natural vertical slices, each independently shippable and reviewable — suggested order, simplest
  first to establish the pattern: (1) `use-lesson`, (2) `use-lessons`, (3) `use-pdf-documents`,
  (4) `use-slide-image-url`, (5) `use-lesson-attempt`, (6) `use-api-key` + provider deletion,
  (7) `use-profile` + provider deletion, (8) docs and rule updates.
- Slices 6 and 7 are the only ones that touch `apps/app-study-buddy` (the `_layout.tsx` provider
  removal); slices 1–5 are contained in `libs/hooks`.
- Precedents to copy: `use-session.ts` (query + external-event bridge via `setQueryData`),
  `use-sign-out.ts` and `use-auth.ts` (mutation + typed error normalization through
  `use-auth.helpers.ts`).
- `libs/hooks/jest-setup-after.ts` already wires `notifyManager.setNotifyFunction(act)`; no
  test-infrastructure work is needed beyond the per-test wrapper.
