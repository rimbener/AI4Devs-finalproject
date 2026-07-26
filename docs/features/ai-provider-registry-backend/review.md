---
feature: ai-provider-registry-backend
---

# Full review — ai-provider-registry-backend

Consolidated by `reviews_lead` from `review-engineering.md` (the sole full reviewer,
`reviewer_engineering`). Durable trail across rounds — findings kept forever, marked
`open`/`resolved`/`ACCEPTED`; never emptied.

## Round 1 (post-Slice-3, whole-branch diff `feature-entrega3-HernanLaura...HEAD`, 39 files, +2441/-228)

**CI (run once by `reviews_lead`): green @ `f3eb14a8c`**
- `pnpm lint` — 14/14 packages pass (cached, full turbo).
- `pnpm check-types` — 14/14 packages pass (cached, full turbo).
- `pnpm --filter @helsoft/supabase-services test` — 35/35 suites, 290/290 tests pass.
- `deno test --no-check=remote .` in `supabase/functions/manage-api-key` — 18/18 pass.
- `deno check *.ts` in `supabase/functions/manage-api-key` — clean.
- **Scoped out, not charged to this feature**: `deno check` on `supabase/functions/generate-lesson/index.ts`
  fails on `npm:zod@4` resolution — pre-existing Deno/pnpm-workspace tooling friction (`deno check`
  doesn't resolve npm deps the way `deno test --no-check=remote` does); not a regression, `deno test`
  itself is not run against this file in this repo (its logic is exercised via the Jest-side
  `libs/supabase-services` tests instead, per `review-slice.md`'s established precedent). Documented
  here as pre-existing debt, not silently absorbed.

**Reviewer**: `reviewer_engineering` (sole full reviewer — code quality/TDD, architecture/layering,
performance, security/OWASP), one pass over the whole feature-branch diff, not just the last slice.

**Verdict this round: CHANGES_REQUESTED** — 1 open finding (minor). Two additional items the
reviewer recorded are informational only (no severity assigned, no action requested) — see below.

### Findings

1. **`[arch]` Minor — open (round 1).** `supabase/functions/manage-api-key/index.ts:14-23,63-77,113-173`.
   The service-role `adminClient` parameter was retyped from the real `SupabaseClient` (from
   `jsr:@supabase/supabase-js@2`) to a locally-declared `AnySupabaseClient = any` to satisfy
   `loadProviderCatalog`'s structural `CatalogQueryClient` contract — but the `any` isn't scoped to
   the two `loadProviderCatalog(adminClient, ...)` call sites; it widens the parameter type of
   `listUserApiKeys` and `dispatch` themselves, so every other use of `adminClient` in this file
   (`.from('user_ai_keys').select(...)`, `.rpc('remove_api_key', ...)`, `.rpc('save_api_key', ...)`)
   loses type checking too. Not a security leak (no unvalidated row shape reaches a trust boundary —
   `listUserApiKeys` still casts to the explicit `UserAiKeyRow` type, `loadProviderCatalog`'s
   `ProviderEntry | null` return type is unaffected, both RPC calls check `{ error }` before use), but
   a real regression versus the file's own pre-diff typing: unlike `generate-lesson/index.ts`'s
   pre-existing, untouched `AnySupabaseClient` (which sits in a file `deno check` can't currently
   evaluate at all, per the CI scoping note above), `manage-api-key`'s `deno check` **is** green in
   this run — so this diff gives up a check that was actually running and passing before this feature.
   **Fix**: scope the cast to the two `loadProviderCatalog(adminClient, ...)` call sites only (e.g.
   `loadProviderCatalog(adminClient as unknown as Parameters<typeof loadProviderCatalog>[0], ...)`),
   keeping `adminClient: SupabaseClient` on `listUserApiKeys`/`dispatch` so the rest of the file's
   Supabase calls keep real type checking.

### Informational only — not findings requiring a fix (recorded per reviewer's own framing)

- **`[code]` duplicate `AiProvider` type declaration** (`generate-lesson/_shared/types.ts:10` and
  `_shared/models.ts:10`, both `export type AiProvider = string`) — pre-dates this feature (both
  files already hand-mirrored the union before D6); this diff only widened both consistently. No
  action requested.
- **`[security]` D4's unconsumed `authenticated` select RLS policy** (`ai_providers_select_authenticated`
  / `ai_provider_models_select_authenticated`, `supabase/migrations/20260726185408_ai_provider_registry.sql:28-35,57-64`)
  — no server-side consumer yet (both Edge Functions read via service-role, D4); this is exactly what
  D4/`risks.md` R5 already documents and defers to task-12's manual verification, not a new gap now
  that all slices have landed. `anon` confirmed to get no grant/policy on either table (@s7 holds).

### Verified clean (no findings) — see `review-engineering.md` for full detail, not restated here

- Fail-closed correctness (D6, Slice-2's Major finding) re-verified solid across three independent
  test harnesses — not re-broken.
- Rejection matrix (D10-D14) consistent end-to-end across `manage-api-key/provider.ts`,
  `lesson-generation.validation.ts`, `lesson-generation.route.ts`, `_shared/types.ts`.
- Migrations (RLS/grants/FK: partial unique index, vision-implies-capable check, cascade, restrict,
  exact seed match) all correct.
- Cross-layer wiring (@s27/@s28) genuine, not a re-implementation; no-cache proof holds.
- TDD/coverage: all 28 `@s` scenarios mapped to ≥1 concrete test; no dead/orphaned/contradicted test
  surface across slices.
- Architecture/layering: no cross-layer leak, `types.mdc` extraction from Slice 1 held, no new deps,
  no business logic leaked into `apps/*`.
- Security (OWASP): userId derived from caller's own JWT (A01), parameterized queries throughout (A03),
  no PII/secrets in logs, no hardcoded secrets.
- Performance: single scoped query per request by design (D8/D9), no N+1, no UI surface in this
  backend-only diff.

## Round-2 status

Not yet run — pending `implementer`'s fix for the one open minor finding above, then one more
CI + `reviewer_engineering` pass per the 2-round cap.
