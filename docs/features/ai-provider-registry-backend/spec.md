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
**This section is the single source of decision rationale.** `task-N.md` Notes cite these IDs and must not restate the reasoning.

- **D1 — `sort_order integer not null` on both tables**, seeded to today's order. *Why:* `select` has no inherent order and the canonical picker order is load-bearing; keeps the seed a no-op and makes reordering a no-deploy edit.
- **D2 — PK `(provider_id, model_id)`; models FK `on delete cascade`.** *Why:* the pair *is* the identity at every call site and it kills duplicate model rows; `user_ai_keys`' RESTRICT FK already guards the dangerous deletion, so cascade only tidies unused rows.
- **D3 — two migrations** (registry+seed, then FK swap). *Why:* FK validation needs the seed rows first, so timestamps enforce ordering; the FK stays independently revertible.
- **D4 — Edge reads use the existing service-role client.** *Why:* global reference data with no per-user dimension; identical to how `plans` is already read in `generate-lesson`. *Consequence:* the `select to authenticated` policy has no server-side consumer (risks R5) — task-12 verifies it manually.
- **D5 — one shared `supabase/functions/_shared/provider-catalog.ts`** (pure predicates + impure loader). *Why:* keeps every `enabled`/model-validity decision inside the Jest+Stryker harness; collapses duplication rather than adding a third mirror.
- **D6 — fail closed; hardcoded registries deleted; `AiProvider` widened to `string`.** *Why:* a disabled provider must stay disabled through a DB hiccup, and a stale fallback could silently resurrect a retired provider — worse than an error. `PLATFORM_TEXT_MODEL_ID` stays hardcoded (paired with the platform env var, deliberately not learner-configurable).
- **D7 — no SDK-capability guard** *(human override of the recommendation)*. *Why:* accepted risk R4 — a catalog row without a wired `@ai-sdk` factory yields an opaque `generation_failed` 502 and a storable-but-unusable key. Operator misconfiguration only; all six seeded providers have factories.
- **D8 — scoped single-provider read**, `null` for unknown. *Why:* neither function ever needs the other five providers; unknown-vs-missing collapses into the query.
- **D9 — no cross-invocation cache; the entry is loaded once per request and threaded down.** *Why:* `enabled = false` must take effect immediately, with no invalidation window to debug; the query cost is negligible beside the Vault/LLM round trips. `@s28` guards it.
- **D10 — `save` rejected when disabled; `remove` always allowed; unknown rejected for both.** *Why:* saving is a new choice (excluded), removing is cleanup — rejecting `remove` would trap the learner's API credential in our Vault permanently, since the UI keeps a disabled provider visible with a Remove button.
- **D11 — a distinct `provider_disabled` wire code for `manage-api-key`** (HTTP 400). *Why:* names the condition instead of hiding it behind a transport error. The `ApiKeyErrorCode` union widening, four-locale copy and `api-key.service.ts` mapping are **frontend-story scope** — this story emits the code only, keeping its blast radius inside `supabase/`.
- **D12 — `provider_disabled` fires only for a genuinely disabled provider; unknown keeps today's `network_error` for both actions.** *Why:* one code, one meaning, so the frontend can write precise copy; unknown-provider behaviour stays byte-identical to today.
- **D13 — a matching `provider_disabled` `GenerationErrorCode` at 422** for `generate-lesson`'s BYOK path; unknown provider and uncurated model stay `invalid_model` 422. *Why:* symmetry with D12 outweighs the saved ripple; 422 matches `invalid_model`'s existing status. Only the Edge-side mirror (`_shared/types.ts`) is widened here — the `libs/types` union, its test, copy and mapping are frontend-story scope.
- **D14 — the platform route reuses the existing `platform_key_unavailable` 503**, not `provider_disabled`. *Why:* the learner's request isn't invalid and they can't fix it; existing copy already fits, so this branch needs no new vocabulary. Blast radius (disabling `groq` stops all paid generation) in risks R3.
- **D15 — `libs/types/src/ai-provider.ts` + `api-key-settings.ts` left untouched.** *Why:* deleting them would break the settings screen, provider selector and generation panel; that cleanup (plus the then-dead `aiModel.*` / `settings.apiKey.provider.*` locale keys) is the frontend story's.
- **D16 — no analytics events, no feature flags.** *Why:* neither story calls for any; `enabled` is operational data.
- **D17 — slices split by risk, not the 4 UI states.** *Why:* logic-only feature, per `tdd.mdc`.

### Cross-story traceability → `user-stories/pending/ai-provider-registry-frontend.md`
That story owns, and has now been amended to cite by decision ID: **D10** (the save/remove asymmetry — its original "save/remove… is rejected" AC is superseded by three separate `manage-api-key` ACs), **D11/D12** (`ApiKeyErrorCode` widening + copy + mapping), **D13** (`GenerationErrorCode` widening + copy + mapping), **D14** (the platform path must return `platform_key_unavailable` 503, *not* `provider_disabled`), **D1** (both tables carry `sort_order`, which its pickers must order by), and **D15** (deleting the dead constants and locale keys). Until it ships, `provider_disabled` reaches the client unmapped and renders via the generic error fallback — degraded copy, not a crash.
