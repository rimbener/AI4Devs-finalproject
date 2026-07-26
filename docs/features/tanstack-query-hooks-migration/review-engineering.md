---
feature: tanstack-query-hooks-migration
review_round: 1
---

# Full-review engineering trail — tanstack-query-hooks-migration

Durable trail across full-review rounds (never emptied; fixed findings marked `resolved`, kept).
Scope: `git diff feature-entrega3-HernanLaura...HEAD` (63 files) reviewed as one unit — every
per-slice decision (`review-slice.md`, 9 slices, all APPROVED) is trusted and cross-checked, not
re-litigated. CI: green @ current worktree HEAD (lint 14/14, check-types 14/14, test 12/12, all
force re-run by reviews_lead) — trusted, not re-run here.

## Round 1 — verdict: CHANGES_REQUESTED

One blocking-tier finding (security), everything else pass or non-blocking.

### [security][major] Raw API key retained in the in-memory TanStack `MutationCache` beyond the hook's public contract — RESOLVED (implementer fixup)

`libs/hooks/src/hooks/use-api-key.ts:46-59` (the tagged-union `useMutation`) — OWASP/MASVS:
sensitive data retained in memory longer than its intended lifetime (comparable to MASVS-STORAGE-2
/ CWE-316 "cleartext storage of sensitive information in memory").

- `saveApiKey`'s mutation variables are `{ kind: 'save', provider, rawKey }` (`use-api-key.ts:24,53,63`).
  TanStack Query's `MutationCache` keeps the **full state** of a settled mutation — including
  `variables` — alive until `gcTime` elapses (default 5 min; `libs/hooks/src/provider/query-provider.tsx:12`
  constructs `new QueryClient()` with zero default overrides, so the stock 5-minute mutation
  `gcTime` applies here same as everywhere else).
- Nothing in `use-api-key.ts` calls `mutation.reset()` in `onSettled`/`onSuccess` (verified —
  `onSuccess` only calls `queryClient.setQueryData`, `use-api-key.ts:55-58`), so the raw key sits
  reachable via `queryClient.getMutationCache().getAll().at(-1)?.state.variables.rawKey` for up to
  5 minutes after every save, on every platform this app ships (including web, where a heap
  snapshot or a compromised script has a much lower bar to read it than native memory).
- s50's test (`use-api-key.test.ts:346-358`, "does not retain the raw key anywhere in the returned
  hook state") only asserts `JSON.stringify(result.current)` excludes the raw key — i.e. it proves
  the **hook's returned value** is clean, not that the underlying **query cache** is. The task's
  own instruction to "verify structurally, not just by trusting the test name" catches this: the
  test name promises more than it checks, and the gap it misses is real (structurally confirmed
  above, not hypothetical).
- Fix: `mutation.reset()` in `onSettled` (clears `variables`/`data`/`error` immediately once the
  hook has consumed the result — a fresh `mutate` on the next save doesn't need the old variables
  retained anyway), or a scoped `gcTime: 0` on this specific mutation; add a test that inspects
  `queryClient.getMutationCache().getAll()` after settle and asserts no `rawKey` survives.

**Fixup (implementer, round 1 rework):** neither of the two suggested fixes actually works as
described once traced against `@tanstack/query-core@5.101.4`'s source
(`mutationObserver.cjs`/`mutation.cjs`/`removable.cjs`): the hook-level `onSettled` runs **before**
the mutation's `'success'`/`'error'` dispatch reaches observers (see `mutation.cjs`'s
`execute()` — `onSettled` is called, then `dispatch_fn` runs afterward), so calling the observer's
own `mutation.reset()` there detaches the observer *before* it ever receives the failure, silently
suppressing `error` from ever becoming visible — breaking s45/s46 (error must persist after a
failed save). `gcTime: 0` alone doesn't help either: `scheduleGc()` is only invoked from
`removeObserver()`/construction, and `addObserver()` cancels any pending GC — so as long as the
hook's `useMutation` keeps the settled mutation as its `currentMutation` (i.e., no further
mutate/unmount happens), the entry is never scheduled for GC regardless of `gcTime`, only
`gcTime`-bounded *after* it's replaced by the next call or the component unmounts.

Root-caused the fix instead: the raw key never needs to be a mutation **variable** in the first
place. `ApiKeyMutationVariables`'s `save` branch dropped `rawKey`; `saveApiKey` now stashes it in a
plain `useRef` (`pendingRawKeyRef`) immediately before calling `mutateAsync({ kind: 'save', provider })`,
`mutationFn` reads the ref, and `onSettled` clears the ref. This means
`mutation.state.variables` never contains the raw key — for either a successful or a failed save —
with zero change to the existing error/isSubmitting semantics (s45-s47 untouched, still green).
New test: `use-api-key.test.ts` — "never writes the raw key into the mutation cache after a
saveApiKey call" — inspects `queryClient.getMutationCache().getAll()` post-settle.

### [code][minor] `enabled`/`isLoading` gating duplicated verbatim across the two user-scoped hooks — RESOLVED (implementer fixup)

`libs/hooks/src/hooks/use-api-key.ts:36,43,77` and `libs/hooks/src/hooks/use-profile.ts:19,31,48` —
both hooks repeat, byte-for-byte:
```
enabled: Boolean(sessionUserId) && !isSessionLoading
```
and the near-identical `isLoading = isSessionLoading || (Boolean(sessionUserId) && isPending)`
derivation (use-profile.ts additionally ORs in `isApiKeyLoading`). Not a rule violation as written
— `tanstack-query.mdc`'s explicit "extract into `use-{domain}.helpers.ts` once more than one hook
needs it" text is scoped to the mutation error-normalization guard (`isXErrorShape`/`toErrorCode`),
not to read-gating — but this is the same category of duplication the rule is guarding against,
and the "more than one hook needs it" threshold is now literally met (2 of 2 user-scoped hooks).
Not blocking; worth hoisting into a small shared helper (e.g. a `useSessionGate()` returning
`{ sessionUserId, isLoading: isSessionLoading, enabled }`) the next time a third user-scoped hook
is added, or now if the team prefers not to defer it.

**Fixup (implementer, round 1 rework):** hoisted exactly as suggested — new
`libs/hooks/src/hooks/use-session-gate.ts` (`useSessionGate()`, not barrel-exported, same
convention as `use-auth.helpers.ts`) returns `{ sessionUserId, isSessionLoading, enabled,
deriveIsLoading }`; `use-api-key.ts` and `use-profile.ts` both consume it in place of their own
`useSession()` + inline derivations. New unit test `use-session-gate.test.ts` (4 cases); both
consumer test suites pass unchanged (pure refactor, no behavior change).

### [perf][non-blocking, carried forward from slice 0] `use-session.ts:17-19` ref initializer

`useRef(queryClient.getQueryData<Session | null>(SESSION_QUERY_KEY)?.user?.id)` re-evaluates the
cache read on every render (`useRef`'s argument isn't lazy the way `useState`'s functional form
is), though only the mount-time result is ever used. Already flagged and accepted as non-blocking
in the slice-0 review (`review-slice.md`, Slice 0 section) — still present after every later slice
touched the file, still negligible (an in-memory `Map` lookup, not a network round-trip). Not
reflagged as new.

## Cross-hook / aggregate checks (full diff, not slice-by-slice)

- **D1/D2 cache-key coverage across all 7 hooks — verified, pass.** Every non-session query key's
  first tuple element (`'api-key'`, `'lesson'`, `'lessons'`, `'pdf-documents'`, `'profile'`,
  `'lesson-image'`) is distinct from `'auth'`, so `use-session.ts:43`'s eviction predicate
  (`query.queryKey[0] !== 'auth'`) correctly sweeps all of them on a user-id change; only
  `SESSION_QUERY_KEY = ['auth', 'session']` is spared, by design. Grepped every `queryKey:`/
  `*QueryKey` definition in `libs/hooks/src/hooks/use-*.ts` directly (not the diff) to confirm —
  no key silently uses `'auth'` as a prefix, no user-scoped hook is missing user-scoping (`use-api-key`,
  `use-profile` both key by `userId`; `use-lesson`/`use-lessons`/`use-pdf-documents`/
  `use-slide-image-url` are deliberately unscoped per spec, relying solely on D2's blanket eviction).
- **D2 eviction-vs-in-flight-fetch race — analyzed, no defect found, residual risk noted.**
  `queryClient.removeQueries({ predicate })` detaches the old `Query` object from the cache; an
  in-flight `queryFn` promise for that now-orphaned instance resolving afterwards can only update
  that same detached object — a still-mounted observer for the same key (e.g. a component that
  survives the user switch) rebuilds a fresh `Query` instance on next render, which is exactly what
  `use-session.test.ts`'s `@s1` proves in practice (a live `profileKey` observer re-fetches, call
  count 1, after eviction). No repo test explicitly exercises "a stale fetch for the old user lands
  after eviction and after the new user's query has already repopulated the same key" — this rests
  on TanStack's internal object-identity semantics rather than a project-level characterization
  test. Not blocking (consistent with the library's documented cache model and corroborated by
  `@s1`), but a good candidate for a follow-up characterization test if the team wants this
  race closed by an assertion rather than by design reasoning alone.
- **Architecture/layering — pass.** All 7 migrated hooks (`use-lesson`, `use-lessons`,
  `use-pdf-documents`, `use-slide-image-url`, `use-lesson-attempt`, `use-api-key`, `use-profile`)
  call their respective `*Service` only, never a DAO directly (`LessonsService`,
  `PdfDocumentsService`, `LessonImageService`, `LessonAttemptService`, `ApiKeyService`,
  `ProfileService`) — confirmed by reading each hook file in full, not just the diff hunks.
  `ApiKeyProvider`/`ProfileProvider` deletion leaves zero dangling references repo-wide (grep:
  only two explanatory code comments noting their removal, `use-api-key.test.ts:312`,
  `use-profile.test.ts:210`); `apps/app-study-buddy/src/app/_layout.tsx` confirms `QueryProvider`
  is the sole `@helsoft/hooks` provider remaining in the tree.
- **Test-hygiene `createWrapper` duplication (the recurring slices-1/2/5 finding) — confirmed
  absent across the whole diff**, including `use-slide-image-url.test.ts`'s 4 `new QueryClient(...)`
  call sites (lines 18, 39, 55, 147): these all follow the sanctioned pattern (`createWrapper`'s
  optional-`queryClient`-param signature, an explicit client constructed only when the test needs
  to introspect it, always passed into `createWrapper(queryClient)`) — not a hand-rolled second
  `QueryClientProvider`. Every integration test (`api-key.integration.test.ts`,
  `lessons.integration.test.ts`, `pdf-documents.integration.test.ts`,
  `lesson-player.integration.test.ts`, `saved-lessons.integration.test.tsx`) constructs exactly one
  wrapper each, no cross-file duplication.
- **Performance — QueryClient defaults, applies here (not N/A).** `libs/hooks/src/provider/query-provider.tsx:12`
  keeps stock `QueryClient()` defaults (3x retry w/ backoff on reads, refetch-on-focus/remount on
  web) — this is spec's explicit Accepted Behavior Change #1, not a new regression. Verified no
  hook overrides `retry`/adds `refetchInterval` anywhere in the diff (repo-wide grep on
  `libs/hooks/src/hooks/*.ts`, production files only, returns nothing) — no hook polls. Mutations
  default to `retry: 0` in TanStack Query v5 and none of the 5 mutations in this diff
  (`saveApiKey`/`removeApiKey`, `deleteLesson`, `deleteDocument`, `saveAttempt`) override that, so
  no retry-storm risk on writes. D6's `staleTime`/`gcTime` derivation in `use-slide-image-url.ts`
  correctly prevents the focus-refetch default from re-signing a still-valid URL. No `.map` over
  unbounded lists introduced by this diff (list hooks return arrays already rendered elsewhere by
  existing, unmodified components) and no new heavy synchronous work. Pass, aside from the mutation
  cache-retention finding above (security, not throughput).
- **Security — applies here (not N/A).** Beyond the blocking finding above: no secrets in code/logs/
  committed files (grepped the full diff for `console.*` — only a removed comment mentioning
  `console.error` survives, no new logging added); `EXPO_PUBLIC_*`/service-key handling untouched
  by this diff; no new external network surface; Supabase DAOs untouched by this migration (only
  `lesson-image.service.ts`'s `SIGNED_URL_TTL_SECONDS` export, a non-secret numeric constant, is
  new — no behavior change, confirmed byte-for-byte against the pre-migration body). `use-profile.ts`'s
  `error instanceof Error ? error : new Error(String(error))` normalization (added mid-pipeline,
  `c1cd64383`) correctly avoids leaking a raw Postgrest error object shape through the `Error | null`
  contract — checked it doesn't stringify anything sensitive (Postgrest error shape here is
  `{ message, code, details }`, no user PII, matches the existing test fixture).
- **i18n — N/A.** No user-facing strings touched anywhere in this diff (logic-only hooks + a
  docs-only slice 8); confirmed no `labels`/`copy` dictionaries added.
- **No new dependency without justification.** `libs/hooks/package.json` has no diff (`@tanstack/react-query`
  was already a dependency from an earlier feature) — confirmed via `git diff` on the file, zero
  hunks. The one new dependency in this diff, `@tanstack/react-query` in `libs/study-buddy/package.json`,
  is the explicitly-documented scope-gap fix (`2b04fc717`) required because `useLessons`'s consumer
  test needs a `QueryClientProvider` — justified in `review-slice.md`'s Slice 2 section, not a
  fresh unexplained addition.
- **Scope-gap fixes (both, re-verified against current file state, not just the commit diffs):**
  1. `libs/study-buddy/src/components/saved-lessons/saved-lessons.integration.test.tsx` — wraps in
     a local `QueryClientProvider` + fresh `QueryClient({ defaultOptions: { queries: { retry: false } } })`,
     exactly one wrapper, no duplication; landed correctly.
  2. `libs/hooks/src/hooks/use-profile.ts:36-40` — the `instanceof Error` normalizer fix is present
     and matches the deleted reducer's guard exactly; `use-profile.test.ts:135` carries the
     regression test (`"normalizes a non-Error rejection into a real Error"`). No loose end.

## Lens summary

- **Code quality & TDD** — pass, one minor duplication finding (non-blocking).
- **Architecture & layering** — pass, no cross-layer leaks, no dangling provider references.
- **Performance** — applies (not N/A); pass, accepted defaults, no new N+1/polling/retry-storm risk.
- **Security** — applies (not N/A); **one blocking finding** (mutation-cache retention of the raw
  API key beyond the hook's public contract — see above). Everything else pass.

**Verdict: CHANGES_REQUESTED** — fix the `use-api-key.ts` mutation-cache retention finding (and
ideally add the cache-inspecting regression test) before this feature is approved. The `enabled`/
`isLoading` duplication and the carried-forward `use-session.ts` ref-initializer note are
non-blocking and may be deferred.
