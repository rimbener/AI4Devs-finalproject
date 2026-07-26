---
feature: tanstack-query-hooks-migration
story: user-stories/in-progress/tanstack-query-hooks-migration.md   # pending/ → in-progress/ → done/
status: spec_drafted
---

# Spec — tanstack-query-hooks-migration

## Summary
Migrate the 7 remaining service-backed hooks in `libs/hooks/src/hooks/` from hand-rolled `useReducer`/`useState` + `isMounted`/`requestId` cancellation to `@tanstack/react-query`, deleting 6 reducers, 2 context providers and `next-request-id`. Pure refactor: every public return shape unchanged, no component/story/e2e edited, no new dependency.

## User stories
- As a **developer on this codebase**, I want **every service-backed hook to run on `@tanstack/react-query`**, so that **loading, error, caching and stale-response handling come from one audited library instead of ~40 re-reviewed lines per hook**.

## Acceptance criteria
→ **[`gherkin-scenarios.md`](./gherkin-scenarios.md)** — 58 `@s` scenarios. Task ↔ scenario map: [`tasks.md`](./tasks.md).

## UI states (if UI)
No component changes. The equivalent regression surface is the **hook-state contract**, which must stay identical:

| Hook | Loading | Content | Empty | Error |
|---|---|---|---|---|
| `useLesson` | `isLoading` | `lesson` | `slides: []` | `error: Error` |
| `useLessons` / `usePdfDocuments` | `isLoading` | rows | `[]` | `error: Error` — read **or** delete |
| `useSlideImageUrl` | `isLoading` | `url` | — | degrades to `url: null`, never throws |
| `useApiKey` | `isLoading` / `isSubmitting` | `status`, `hasKey` | `{ keys: [] }` | `error: ApiKeyErrorCode` |
| `useProfile` | `isLoading` (3 sources ORed) | `profile` + `canCreate` | — | `error: Error`, `profile: null` |
| `useLessonAttempt` | `status: 'saving'` | `'saved'` + `attempt` | `'idle'` | `'error'` |

## Analytics events
None — no user-facing behavior changes.

## Feature flags
None.

## Out of scope / non-goals
- The 4 documented exemptions (`use-lesson-generation`, `use-pdf-extraction`, `use-locale-preference`, `useLessonGenerationForm`) — reasons recorded in `.agents/rules/tanstack-query.mdc` by task-10.
- Editing any component, Storybook story, `.storybook/mocks/hooks.ts`, or Playwright e2e.
- Changing `QueryClient` defaults; adding a service or DAO method; any schema change.

## Open decisions (resolved, with rationale)
Implementation detail for each lives in the owning task.

- **D1 — user-scoped key factories** `apiKeyStatusQueryKey(userId)`, `profileQueryKey(userId)`, exported from their own hook files — **why:** flat keys can't satisfy the existing "reloads on user change" / "resets when unauthenticated" tests and leak across users. (task-8, task-9)
- **D2 — auth-change cache reset in `use-session.ts`:** on user-id change only, evict every non-`auth` entry, then write the session — **why:** `QueryProvider` sits above `Stack.Protected` and never unmounts, so one `QueryClient` survives a user switch; one choke point covers all unscoped and future keys, and the id guard spares hourly token refreshes. (task-1)
- **D3 — `useApiKey` uses 1 tagged-union mutation, not 2** — **why:** the contract has one `error` and one `isSubmitting` slot with cross-clearing semantics; two mutations would need circular `reset()` plumbing to fake it. (task-8)
- **D4 — list hooks merge errors mutation-first** (`deleteMutation.error ?? query.error`), `refetch` resets the mutation first — **why:** reproduces today's last-writer-wins single slot in every ordering. (task-3, task-4)
- **D5 — `useLessonAttempt` keeps one `isSaving` entry-gate ref**; `lastInput` dropped for `mutation.variables` — **why:** `isPending` is async and TanStack doesn't dedupe `mutate()`, so two same-tick calls both insert. (task-7)
- **D6 — `useSlideImageUrl` sets `staleTime` *and* `gcTime`, derived from an exported `SIGNED_URL_TTL_SECONDS`** — **why:** `gcTime` alone doesn't skip the re-sign, so the story's stated benefit was unachievable as written. (task-5, task-6)

### Accepted behavior changes
1. Failing reads retry 3× with backoff before the Error state appears; on web a focused/remounted screen refetches (stock `QueryClient` defaults kept, per the story).
2. `useApiKey.error` clears at **submit start** rather than on success — TanStack resets mutation state on every `mutate`. Nothing depends on the old behavior.
3. The `instanceof Error` normalizer is dropped from migrated reads — all services already reject with real `Error`s.
4. `refetch` / `retry` are wrapped to stay `() => void`.

### Story amendments approved at the gate
"+2 mutations" → 1 tagged-union (D3) · "(now via `isPending`, not a ref)" → ref retained (D5) · `gcTime`-only → `staleTime` + `gcTime` derived (D6) · 8 slices → **9**, adding slice 0 (D2), extending scope to `use-session.ts` + its test and the `@helsoft/supabase-services` barrel.

Risks: `tmp/tanstack-query-hooks-migration/risks.md` (gitignored).
