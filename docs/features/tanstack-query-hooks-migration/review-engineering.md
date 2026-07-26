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

---

## Round 2 — verdict: APPROVED

Scope: `git diff 0f5bb0622..6883a9aca` (the fix commit) plus current-state reads of every touched
file and its full test file. CI trusted per `reviews_lead`: **CI green @ 6883a9aca** (`pnpm lint`
14/14, `pnpm turbo run check-types --force` 14/14, `pnpm turbo run test --force` 12/12) — not
re-run here.

### Round-1 finding 1 [security][major] — RESOLVED, re-verified

`libs/hooks/src/hooks/use-api-key.ts:31-33,44,48,61-71,74-79` re-read in full.

- `ApiKeyMutationVariables`'s `save` branch is now `{ kind: 'save'; provider: AiProvider }` — no
  `rawKey` field exists in the type at all, so `mutation.state.variables` structurally cannot carry
  the raw key for a save, success or failure, because the value handed to `mutateAsync` (line 77:
  `{ kind: 'save', provider }`) never contains it in the first place — not merely cleared after the
  fact.
- `pendingRawKeyRef` (line 48, `useRef<string | null>(null)`) is set at `use-api-key.ts:76`
  immediately before `mutateAsync`, read once inside `mutationFn` at line 63
  (`pendingRawKeyRef.current ?? ''`), and cleared in `onSettled` at `use-api-key.ts:69-71`.
  `onSettled` (unlike `onSuccess`/`onError`) fires on **both** outcomes in TanStack Query v5 — traced
  against the installed `@tanstack/query-core@5.101.4` source
  (`node_modules/.pnpm/@tanstack+query-core@5.101.4/.../build/legacy/mutation.cjs:169-183`): the
  `onSettled` callbacks run unconditionally after either the success branch or the caught-error
  branch, before `execute()` returns. So a failed `saveApiKey` clears the ref exactly the same as a
  successful one — no failure-path leak.
- No `onMutate`/optimistic-update path exists in this hook (grepped `use-api-key.ts` — only
  `onSuccess`/`onSettled` are wired), and no second call site constructs
  `ApiKeyMutationVariables` — `saveApiKey` (line 74-80) and `removeApiKey` (line 82-87) are the only
  two `mutateAsync` callers, both in this one file. `removeApiKey` never touches
  `pendingRawKeyRef`, so its path is unaffected and not newly broken.
- **Test genuinely regression-tests the vulnerability.** `use-api-key.test.ts:364-380` ("never
  writes the raw key into the mutation cache after a saveApiKey call") calls `saveApiKey('groq',
  'sk-should-never-be-cached')` then inspects `queryClient.getMutationCache().getAll()` and asserts
  none of the mutations' `JSON.stringify(state.variables)` contains the raw key. Mentally reverting
  to pre-fix code (`{ kind: 'save', provider, rawKey }` as the mutation variables, `rawKey` passed
  straight from `saveApiKey`'s argument) — the settled mutation's `state.variables` would literally
  be `{ kind: 'save', provider: 'groq', rawKey: 'sk-should-never-be-cached' }`, and
  `JSON.stringify(...)` would contain the literal string — the assertion would fail. Confirmed this
  is a real regression test, not a name that outruns its assertion (the s50-round-1 gap this task
  flagged).
- **Verdict: RESOLVED.** Structurally impossible for `rawKey` to reach the mutation cache post-fix,
  for either outcome.

**New, non-blocking observation (not in either round-1 finding, surfaced by this round's fresh
trace):** the fix trades a race-free design (each `mutateAsync` call previously carried its own
self-contained `variables` object) for a single shared `pendingRawKeyRef`. If `saveApiKey` were
invoked a second time before the first call's `mutationFn` has read the ref (e.g. two overlapping,
un-awaited calls — `mutateAsync`'s actual `mutationFn` invocation happens inside an async
`retryer.start()` chain, not synchronously at the `mutate()` call site, per
`mutation.cjs:96-153`), the second call's `pendingRawKeyRef.current = rawKey` assignment (line 76)
could overwrite the first's value before the first's `mutationFn` reads it, causing the wrong raw
key to be sent for the first call's provider. Pre-fix code had no such race (each call's `rawKey`
traveled with its own `variables` object). This is consistent with — not a violation of — the
hook's existing single-mutation-slot design (D3, one `isSubmitting`/error slot shared by
save/remove, meaning the hook already assumes at most one in-flight mutation at a time), and no
current call site invokes `saveApiKey` without awaiting/disabling the submit control first. This
is an **advisory note, not a scored finding** (no blocking/major/minor severity assigned — it does
not factor into this round's verdict): worth a one-line comment on `pendingRawKeyRef` noting the
single-in-flight assumption, or a future guard, should the team ever allow overlapping saves.

### Round-1 finding 2 [code][minor] — RESOLVED, re-verified

`libs/hooks/src/hooks/use-session-gate.ts` + `.types.ts` + consumers re-read in full.

- **Placement/typing.** `useSessionGate()` (`use-session-gate.ts:12-20`) is a small, correctly
  typed (`UseSessionGateResult`, co-located in `use-session-gate.types.ts` per `types.mdc`) pure
  composition over `useSession()`. It lives in `libs/hooks/src/hooks/` alongside the hooks it serves
  and is **not** re-exported from `libs/hooks/src/hooks/index.ts` (confirmed — the barrel lists all
  11 other `use-*` hooks/types but no `use-session-gate` entry) or from `libs/hooks/src/index.ts`.
  One nuance the implementer's own comment slightly overstates: `use-auth.helpers.ts` (the cited
  precedent) exports plain non-hook helper functions (`isAuthErrorShape`, `toErrorCode`), whereas
  `useSessionGate` is itself a genuine hook (composes `useSession()`, i.e. subject to the Rules of
  Hooks) using the `use-{feature}.ts` naming pattern that `hooks-service-dao.mdc`'s canonical
  example pairs with barrel export. This is a very minor naming-convention nuance, not a layering
  violation (`useSessionGate` still only wraps a hook, never a DAO/service directly, and un-exported
  internal composition hooks are a reasonable and common React pattern) — **not a finding**, noted
  for completeness only since the task asked to compare it against the cited convention explicitly.
- **Zero behavior drift — verified line-by-line for both consumers.**
  - `use-api-key.ts`: old `enabled: Boolean(sessionUserId) && !isSessionLoading` (pre-fix) ==
    `useSessionGate()`'s `enabled` (`use-session-gate.ts:14`, identical expression) — same line,
    same boolean algebra. Old `isLoading = isSessionLoading || (Boolean(sessionUserId) &&
    isPending)` == `deriveIsLoading(isPending)` (`use-api-key.ts:91` calling
    `use-session-gate.ts:17-18`, byte-identical expression body). Pass.
  - `use-profile.ts`: same `enabled` identity. Old `isLoading = isSessionLoading || isApiKeyLoading
    || (Boolean(sessionUserId) && isPending)` vs new `deriveIsLoading(isPending) || isApiKeyLoading`
    (`use-profile.ts:47`) — algebraically identical by associativity/commutativity of `||`
    (`(A || B) || C === (A || C) || B`, all boolean, no short-circuit side effects on either side to
    reorder around). The extra `isApiKeyLoading` term is correctly ORed **on top of**
    `useSessionGate()`'s output, not lost or double-counted — confirmed it appears exactly once,
    outside `deriveIsLoading`'s own internal OR, matching the pre-fix structure exactly.
- **New test.** `use-session-gate.test.ts` (4 cases, `use-session-gate.test.ts:1-59`): authenticated
  + settled → `enabled: true`, `deriveIsLoading(false): false`; no session → `enabled: false`,
  `deriveIsLoading(true): false` (a disabled query's stray `isPending: true` must never leak as
  loading); session itself still resolving → `enabled: false`, `deriveIsLoading(false): true`
  (loading regardless of query-pending); authenticated + settled → `deriveIsLoading` mirrors the
  query's own pending flag both ways. These four cases meaningfully cover the full 2x2 gating
  contract (`isSessionLoading` × `hasUser`) that both consumers depend on — pass.
- **Verdict: RESOLVED.** Pure refactor, no behavior change, correctly scoped/typed/un-exported.

### Fresh full-diff pass (net-new items beyond the two findings' direct fix)

- **Public return shape of `useApiKey`/`useProfile` — unchanged.** `git diff 0f5bb0622..6883a9aca`
  touches zero lines of `use-api-key.types.ts` / `use-profile.types.ts` (confirmed: empty diff on
  both files). `UseApiKeyResult`/`UseProfileResult` are structurally identical pre/post-fix; no
  field became optional/required, no new field added. check-types passing corroborates this but was
  independently confirmed by the empty type-file diff, not just trusted from CI.
- **Barrel (`index.ts`) changes — none.** `libs/hooks/src/hooks/index.ts` has no diff in this fix
  commit (confirmed via `git diff --stat` on the file — no hunk); `use-session-gate.ts`/`.types.ts`
  are correctly the two new files that stay un-barreled, per the finding-2 fixup.
- **No unrelated/opportunistic changes.** The fix commit's file list is exactly: `use-api-key.ts`,
  `use-api-key.test.ts`, `use-profile.ts`, `use-session-gate.ts` (new), `use-session-gate.types.ts`
  (new), `use-session-gate.test.ts` (new), plus the docs/tasks/tdd trail files. Nothing outside the
  two findings' direct scope; no drive-by refactors, no dependency bumps, no unrelated file touched.
- **s45-s47 untouched, still intact.** Re-read `use-api-key.test.ts:200-255` directly: all three
  tests (`sets error to the normalized code and preserves status after a failed saveApiKey`, `falls
  back to network_error when the rejection carries no recognized code`, `clears an error left by a
  failed saveApiKey once removeApiKey succeeds`) are present, unmodified, and structurally intact
  (error-normalization + D3 cross-clearing semantics both still asserted). Matches implementer's
  claim; CI green corroborates they pass.

## Lens summary — round 2

- **Code quality & TDD** — pass. Both round-1 findings resolved via TDD (new regression tests for
  each); one advisory (non-scored) observation surfaced (shared-ref race across overlapping
  un-awaited `saveApiKey` calls) — does not factor into the verdict, recorded for a future pass.
- **Architecture & layering** — pass. `useSessionGate` composes only `useSession()` (a hook), never
  a DAO/service; correctly un-exported from the barrel; `types.mdc` co-location respected
  (`use-session-gate.types.ts`).
- **Performance** — N/A/unchanged for this round's diff (pure refactor + a `useRef`, no new
  renders/round-trips introduced; `useSessionGate`'s `deriveIsLoading` is a plain function, not
  memoized, but it's O(1) boolean algebra called at most twice a render — no perf concern).
- **Security** — the round-1 blocking finding is resolved; structurally confirmed the raw key
  cannot reach `queryClient.getMutationCache()` for either a successful or failed save.

**Verdict: APPROVED** — both round-1 findings (1 major/security, 1 minor/code) confirmed resolved
by direct code/test inspection, not just by trusting the implementer's account. Zero new
blocking/major/minor findings from the fresh full-diff pass; one advisory (non-scored) observation
(shared-ref race on overlapping un-awaited `saveApiKey` calls) noted for the trail, not required to
fix.
