---
feature: ai-provider-registry-backend
story: user-stories/in-progress/ai-provider-registry-backend.md
status: spec_drafted
---

# Spec — ai-provider-registry-backend

## Summary
Move AI provider/model metadata out of hardcoded TypeScript into two Postgres tables seeded to today's exact values, convert `user_ai_keys.provider`'s closed `CHECK` into a real foreign key, and rewire both Edge Functions to read the catalog per request and enforce an `enabled` flag — so a provider can be renamed, re-modelled, reordered or retired via Supabase Studio with no code deploy.

## User stories
- As **the app's data layer**, I want **`ai_providers` + `ai_provider_models` to be the single source of truth for provider name, guidance URL, curated models, vision defaults and enabled state**, so that **metadata is editable via SQL without a deploy, while `user_ai_keys` keeps real integrity against unknown or retired providers**.

## Acceptance criteria
→ **[`gherkin-scenarios.md`](./gherkin-scenarios.md)** — 28 `@s` scenarios, each an AC. Tasks: [`tasks.md`](./tasks.md) → `task-1 … task-12`. Risks: `tmp/ai-provider-registry-backend/risks.md`.

## UI states
None — no UI in scope. Logic-only, so slices split by **risk** (happy path → error/edge → integrity & verification) per `tdd.mdc`.

## Analytics events
None.

## Feature flags
None. `ai_providers.enabled` is operational data maintained via SQL, not a feature flag.

## Out of scope / non-goals
- Any in-app admin UI for editing providers/models.
- Dynamic `@ai-sdk` factory wiring — adding a genuinely new provider stays **code + DB**.
- Per-locale provider names; `enabled` on individual models.
- Making the platform provider/model (`PLATFORM_TEXT_MODEL_ID`, hardcoded `groq`) DB-driven.
- All `libs/` and app changes — hooks, services, components, `libs/types` unions, locale copy — owned by the paired frontend story.

## Open decisions (resolved, with rationale)
- **`sort_order` on both tables**, seeded to today's order — `select` has no inherent order and the canonical picker order is load-bearing; keeps the seed a no-op and makes reordering a no-deploy edit.
- **PK `(provider_id, model_id)`; models FK `on delete cascade`** — the pair *is* the identity at every call site; `user_ai_keys`' RESTRICT FK already guards the dangerous deletion.
- **Two migrations** (registry+seed, then FK swap) — FK validation needs the seed rows first, so timestamps enforce ordering; the FK stays independently revertible.
- **Edge reads use the existing service-role client** — global reference data, no per-user dimension; identical to how `plans` is already read. *Consequence:* the `select to authenticated` policy has no server-side consumer (risks R5) — task-12 verifies it manually.
- **One shared `supabase/functions/_shared/provider-catalog.ts`** (pure predicates + impure loader) — keeps every `enabled`/model-validity decision inside the Jest+Stryker harness; collapses duplication rather than adding a third mirror.
- **Fail closed; hardcoded registries deleted; `AiProvider` widened to `string`** — a disabled provider must stay disabled through a DB hiccup; a stale fallback could resurrect a retired provider.
- **No SDK-capability guard** *(human override of the recommendation)* — accepted risk R4: a row without a wired factory yields an opaque 502 and a storable-but-unusable key.
- **Scoped single-provider read**, `null` for unknown — neither function needs the other five providers; unknown-vs-missing collapses into the query.
- **No cross-invocation cache; loaded once per request** — `enabled = false` must take effect immediately, with no invalidation window; `@s28` guards it.
- **`save` rejected when disabled; `remove` always allowed; unknown rejected for both** — saving is a new choice (excluded), removing is cleanup; rejecting `remove` would trap the learner's API key in our Vault permanently.
- **`provider_disabled` fires only for a genuinely disabled provider** (`manage-api-key` 400, `generate-lesson` 422) — one code, one meaning, so copy can be precise; unknown stays byte-identical to today (`network_error` / `invalid_model`).
- **Platform route reuses `platform_key_unavailable` 503** — the learner's request isn't invalid and they can't fix it; existing copy fits, so no new vocabulary. Blast radius (disabling `groq` stops all paid generation) in risks R3.
- **`libs/types/src/ai-provider.ts` + `api-key-settings.ts` untouched** — deleting them would break the settings screen, provider selector and generation panel; that cleanup is the frontend story's.

### Cross-story traceability → `user-stories/pending/ai-provider-registry-frontend.md`
Amended to own three things excluded here: (1) widening **both** `ApiKeyErrorCode` and `GenerationErrorCode` with `provider_disabled` + copy + client mapping; (2) the corrected `remove`-allowed-when-disabled behaviour (its original AC said otherwise); (3) deleting the then-dead hardcoded registries and `aiModel.*` / `settings.apiKey.provider.*` locale keys. Until it ships, `provider_disabled` renders via the generic error fallback — degraded copy, not a crash.
