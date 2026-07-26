---
feature: tanstack-query-hooks-migration
review_round: 2
---

# Full review — tanstack-query-hooks-migration

Durable trail across full-review rounds. Never emptied — every finding kept, marked
`open`/`resolved`/`ACCEPTED` with the round it was raised/fixed. This review runs once after all
9 slices closed (each already `APPROVED` at slice level — trail in `review-slice.md`); it looks at
the whole feature diff as one unit for cross-hook/aggregate issues a per-slice view can't see.

**Scope:** `git diff feature-entrega3-HernanLaura...HEAD` (63 files, ~2829 insertions / 1939
deletions) vs delivery branch `feature-entrega3-HernanLaura`.

**CI (round 1, run once by reviews_lead, forced/no-cache):**
`pnpm lint` — 14/14 packages green. `pnpm check-types` — 14/14 packages green.
`pnpm turbo run test --output-logs=errors-only --force` — 12/12 tasks green.
E2e: **out of scope** for this feature — spec's explicit non-goals state "no component/story/e2e
edited"; this is a pure hook-layer refactor with no UI touched, so no Playwright suite exercises
this diff. Not scoped out as pre-existing debt — genuinely not applicable.

CI green @ `feat/tanstack-query-hooks-migration` HEAD (0f5bb0622).

**Reviewer:** `reviewer_engineering` (sole full reviewer — code/TDD, architecture, performance,
security). Full findings trail lives in `review-engineering.md`; not copied verbatim here.
Neither lens was marked N/A — both performance (caching/retry defaults) and security (an
API-key hook) genuinely apply to this diff.

---

## Round 1 findings

### [security][major] — RESOLVED (implementer fixup, see below)
**Raw API key retained in the in-memory TanStack `MutationCache` beyond the hook's public contract**

`libs/hooks/src/hooks/use-api-key.ts:46-59` (the tagged-union `useMutation`). TanStack's
`MutationCache` retains a settled mutation's full state — including `variables`, which for
`saveApiKey` is `{ kind: 'save', provider, rawKey }` — until `gcTime` elapses. The `QueryClient` in
`libs/hooks/src/provider/query-provider.tsx:12` uses stock defaults (5-minute `gcTime`), and
nothing in `use-api-key.ts` calls `mutation.reset()` in `onSettled`/`onSuccess` (`onSuccess` only
calls `queryClient.setQueryData`). So the raw key is reachable via
`queryClient.getMutationCache().getAll().at(-1)?.state.variables.rawKey` for up to 5 minutes after
every save, on every platform including web.

s50's test (`use-api-key.test.ts:346-358`) only asserts the hook's *returned* value excludes the
raw key (`JSON.stringify(result.current)`) — it does not prove the underlying query-cache is
clean, so the gap is real and currently untested, not hypothetical (comparable to
MASVS-STORAGE-2 / CWE-316 class issue).

**Fix required:** call `mutation.reset()` in `onSettled` (or scope `gcTime: 0` to this mutation),
plus a new test that inspects `queryClient.getMutationCache().getAll()` after settle and asserts
no `rawKey` survives.

**Resolved (implementer fixup):** neither suggested fix actually works once traced against
`@tanstack/query-core`'s source — the hook-level `onSettled` fires *before* the mutation's final
dispatch, so calling `mutation.reset()` there silently suppresses a failed save's `error` from
ever reaching the hook (breaks s45/s46); `gcTime: 0` alone never triggers GC while the mutation
stays the observer's `currentMutation` (i.e. until the *next* mutate call or unmount), regardless
of the configured `gcTime`. Root-caused instead: `rawKey` no longer flows through the mutation's
`variables` at all — `saveApiKey` stashes it in a `useRef` read by `mutationFn`, cleared in
`onSettled`, so `mutation.state.variables` never contains it, success or failure. New test:
`use-api-key.test.ts` — "never writes the raw key into the mutation cache after a saveApiKey
call" — inspects `queryClient.getMutationCache().getAll()` post-settle. Full technical trace in
`review-engineering.md`. Existing s45-s47 (error persistence/clearing) untouched, still green.

**Round 2 re-verification: RESOLVED, confirmed.** `reviewer_engineering` re-read
`use-api-key.ts:31-33,44,48,61-71,74-80` in full and traced the installed
`@tanstack/query-core@5.101.4` source directly (not just trusted the implementer's account):
`ApiKeyMutationVariables`'s `save` branch structurally no longer has a `rawKey` field, so
`mutation.state.variables` cannot carry it for either outcome; `pendingRawKeyRef` is cleared in
`onSettled`, which fires on both success and failure per the traced library source, so no
failure-path leak; no `onMutate`/optimistic path or second call site exists; `removeApiKey` is
unaffected. Confirmed the new regression test (`use-api-key.test.ts:364-380`) would genuinely fail
against the pre-fix code (mentally reverting, `JSON.stringify(state.variables)` would contain the
literal raw-key string) — a real regression test, not a name that outruns its assertion. **New
advisory (non-scored, not a finding):** the shared `pendingRawKeyRef` reintroduces a latent race
if `saveApiKey` were invoked twice without awaiting (pre-fix, each call's `variables` was
self-contained); consistent with the hook's existing single-mutation-slot (D3) design and no
current call site does this — recorded for a future hardening pass, not blocking, not scored.
Full trace in `review-engineering.md` Round 2 section.

### [code][minor] — RESOLVED (implementer fixup, see below)
**`enabled`/`isLoading` session-gating duplicated verbatim across the two user-scoped hooks**

`libs/hooks/src/hooks/use-api-key.ts:36,43,77` and `libs/hooks/src/hooks/use-profile.ts:19,31,48`
both repeat `enabled: Boolean(sessionUserId) && !isSessionLoading` and the near-identical
`isLoading = isSessionLoading || (Boolean(sessionUserId) && isPending)` derivation byte-for-byte.
Not an explicit rule violation as written (`tanstack-query.mdc`'s "extract once more than one hook
needs it" text is scoped to the error-normalization guard, not read-gating), but the same category
of duplication, and the 2-hook threshold is now met. Per this role's any-finding-blocks policy,
this is fixed in this round rather than deferred.

**Fix suggested:** hoist into a small shared helper (e.g. `useSessionGate()` returning
`{ sessionUserId, isLoading: isSessionLoading, enabled }`), reused by both `use-api-key.ts` and
`use-profile.ts`.

**Resolved (implementer fixup):** new `libs/hooks/src/hooks/use-session-gate.ts` (`useSessionGate()`,
internal — not barrel-exported, same convention as `use-auth.helpers.ts`) returns
`{ sessionUserId, isSessionLoading, enabled, deriveIsLoading }`; both `use-api-key.ts` and
`use-profile.ts` now consume it in place of their own `useSession()` + inline derivations. New
`use-session-gate.test.ts` (4 cases); pure refactor — both hooks' existing suites pass unchanged.

**Round 2 re-verification: RESOLVED, confirmed.** `reviewer_engineering` re-read
`use-session-gate.ts`/`.types.ts` and both consumers line-by-line: `enabled` is identity-identical
to the pre-fix expression; `use-api-key.ts`'s old `isLoading` derivation matches
`deriveIsLoading(isPending)` byte-for-byte; `use-profile.ts`'s extra `isApiKeyLoading` term is
still correctly ORed on top of `deriveIsLoading(isPending)`, not lost or double-counted (confirmed
algebraically equivalent to the pre-fix triple-OR by associativity/commutativity, no short-circuit
side effects to reorder around). Confirmed `use-session-gate.ts`/`.types.ts` are not barrel-exported
(`libs/hooks/src/hooks/index.ts` has zero diff and lists no entry for them) and correctly co-locate
types per `types.mdc`. The 4-case `use-session-gate.test.ts` meaningfully covers the full 2×2
gating contract (`isSessionLoading` × `hasUser`). One minor naming-precision nuance noted but not
scored as a finding: `useSessionGate` is itself a genuine hook (composes `useSession()`), whereas
the cited `use-auth.helpers.ts` precedent exports plain non-hook functions — no layering violation,
not blocking. Full trace in `review-engineering.md` Round 2 section.

### [perf][non-blocking, carried forward from slice 0] — ACCEPTED (round 1)
**`use-session.ts:17-19` `useRef` initializer re-evaluates a cache lookup every render**

Already flagged and explicitly accepted as non-blocking in the slice-0 `reviewer_slice` review
(`review-slice.md`, Slice 0 section: "Functionally correct... just a redundant cache read on
subsequent renders. No rule in `.agents/rules/` requires lazy-init here"). Still present after
every later slice touched the file; re-confirmed still negligible (an in-memory `Map` lookup, not
a network round-trip) by `reviewer_engineering` in round 1. Untouched by the round-1 rework diff;
not re-litigated in round 2 per this role's scoping rules. **Accepted, not reopened.**

---

## Cross-hook / aggregate checks — all pass, no findings

Verified by `reviewer_engineering` against the whole diff (not slice-by-slice); full detail in
`review-engineering.md`:

- **D1/D2 cache-key coverage across all 7 hooks** — every non-session query key's first tuple
  element (`api-key`, `lesson`, `lessons`, `pdf-documents`, `profile`, `lesson-image`) is distinct
  from `auth`, so `use-session.ts`'s eviction predicate correctly sweeps all of them on a user-id
  change; only `SESSION_QUERY_KEY = ['auth', 'session']` is spared, by design.
- **D2 eviction-vs-in-flight-fetch race** — analyzed structurally, no defect found; a residual,
  not-fully-test-proven edge case is noted (no project test explicitly characterizes "a stale
  fetch for the old user lands after eviction and after the new user's query has already
  repopulated the same key") — not blocking, a good candidate for a future characterization test.
- **Architecture/layering** — all 7 migrated hooks call their respective `*Service` only, never a
  DAO directly; `ApiKeyProvider`/`ProfileProvider` deletion leaves zero dangling references
  repo-wide; `QueryProvider` confirmed the sole `@helsoft/hooks` provider in `_layout.tsx`.
- **`createWrapper` test-hygiene duplication** (the recurring slices-1/2/5 finding, fixed each
  time it recurred) — confirmed absent across the whole diff, including in `use-slide-image-url.test.ts`'s
  4 `new QueryClient(...)` call sites (sanctioned pattern, not a regression).
- **Performance — QueryClient defaults** — stock 3x-retry/refetch-on-focus reads are the spec's
  accepted behavior change #1, not a new regression; no hook overrides `retry`/adds
  `refetchInterval`; all 5 mutations in the diff default to `retry: 0` (no retry-storm risk on
  writes); D6's `staleTime`/`gcTime` derivation in `use-slide-image-url.ts` correctly prevents a
  focus-refetch from re-signing a still-valid URL.
- **Security (beyond the blocking finding)** — no secrets/PII in logs; no new external network
  surface; `use-profile.ts`'s `instanceof Error` normalizer correctly avoids leaking a raw
  Postgrest error shape through the `Error | null` contract.
- **i18n** — N/A, no user-facing strings touched anywhere in this diff.
- **New dependency justification** — the only new dependency in this diff,
  `@tanstack/react-query` in `libs/study-buddy/package.json`, is the documented scope-gap fix
  (`2b04fc717`), not an unexplained addition.
- **Both scope-gap fixes re-verified landed correctly, no loose ends:**
  1. `libs/study-buddy/src/components/saved-lessons/saved-lessons.integration.test.tsx` — wraps in
     a local `QueryClientProvider` + fresh `QueryClient`, exactly one wrapper, no duplication.
  2. `libs/hooks/src/hooks/use-profile.ts` — the `instanceof Error` normalizer fix is present and
     matches the deleted reducer's guard exactly; `use-profile.test.ts` carries the regression
     test. No loose end.

## Round 2 — fresh full-diff pass (net-new items beyond the two findings' direct fix)

Verified by `reviewer_engineering` against the fix commit (`0f5bb0622..6883a9aca`) plus current
file state, full detail in `review-engineering.md`:

- **Public return shapes of `useApiKey`/`useProfile` — unchanged.** Zero diff on
  `use-api-key.types.ts`/`use-profile.types.ts`; no field became optional/required, no new field
  added.
- **Barrel (`index.ts`) — no changes.** `libs/hooks/src/hooks/index.ts` has zero diff in the fix
  commit; the two new `use-session-gate.*` files correctly stay un-barreled.
- **No unrelated/opportunistic changes** — fix commit's file list is exactly the two findings'
  direct scope (`use-api-key.ts/.test.ts`, `use-profile.ts`, three new `use-session-gate.*` files,
  plus trail docs). No drive-by refactors, no dependency bumps.
- **s45-s47 (error persistence/clearing)** re-read directly in `use-api-key.test.ts:200-255` —
  present, unmodified, structurally intact; CI green corroborates they pass.

## Lens N/A record

Neither lens was marked N/A by `reviewer_engineering` — both performance (caching/retry defaults
across 7 migrated hooks) and security (an API-key hook, cross-user cache-key design) genuinely
apply to this diff, and both were fully exercised, in both rounds.

---

## CI (round 2, run once by reviews_lead, forced/no-cache)

`pnpm lint` — 14/14 packages green. `pnpm turbo run check-types --force` — 14/14 packages green.
`pnpm turbo run test --output-logs=errors-only --force` — 12/12 tasks green.
CI green @ `feat/tanstack-query-hooks-migration` HEAD (`6883a9aca`).

## Verdict — round 1: CHANGES_REQUESTED

Two open findings (1 major/security, 1 minor/code) — any finding blocks, per this role's policy.
One accepted non-blocking observation carried forward, not reopened.

**Change request → `implementer`:**
1. `[security][major]` Fix `libs/hooks/src/hooks/use-api-key.ts`'s mutation to not retain the raw
   API key in the `MutationCache` beyond its useful life — call `mutation.reset()` in `onSettled`
   (or scope `gcTime: 0` on this mutation) — and add a test asserting
   `queryClient.getMutationCache()` holds no `rawKey` after settle.
2. `[code][minor]` Hoist the duplicated `enabled`/`isLoading` session-gating logic out of
   `use-api-key.ts` and `use-profile.ts` into one shared helper, reused by both.

Both must be fixed via TDD before round 2. Round 2 will re-run CI once, re-run
`reviewer_engineering` over the fix diff, re-consolidate here (pruning resolved findings), and
increment `review_round` in `tasks.md`.

## Round 1 rework — both findings resolved (implementer)

Both findings above fixed via TDD (see per-finding "Resolved" notes and full technical trace in
`review-engineering.md`). `@helsoft/hooks` 19 suites/142 tests green; `pnpm turbo run test
--force` 12/12 and `pnpm turbo run check-types --force` 14/14 green repo-wide; `pnpm format` /
`pnpm --filter @helsoft/hooks lint` clean. Fix commit `6883a9aca`.

## Verdict — round 2: APPROVED

Both round-1 findings re-verified resolved by direct code/test inspection (not just trusting the
implementer's account) — see per-finding "Round 2 re-verification" notes above. Zero new
blocking/major/minor findings from this round's fresh full-diff pass. One new advisory
(non-scored, not a finding) surfaced this round — a latent shared-ref race in `use-api-key.ts` if
`saveApiKey` were ever called twice without awaiting — recorded above and in `review-engineering.md`
for a future hardening pass; does not block, no severity assigned, no current call site triggers
it. The carried-forward `use-session.ts` perf note remains ACCEPTED, not reopened.

**This review round is CLOSED at APPROVED.** `review_round` incremented to 2 in `tasks.md`.
Full findings trail above is retained per this role's durable-record requirement — never emptied.
Next: `mutation_tester` (StrykerJS, once) per the pipeline, then `dod_validator`.
