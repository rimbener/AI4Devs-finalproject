# Multi-provider AI keys & model picker

**As a** free-tier learner
**I want** to save API keys for multiple AI providers and pick provider + model when generating a lesson
**so that** I can use my preferred (or cheapest/best) provider without being locked to Groq

## Context
- Extends R6 (`ai-key-management`) and R2 (`ai-lesson-generation`). Today `AiProvider` is `'groq'` only; one key per user (save replaces); no provider/model UI — `DEFAULT_PROVIDER` is hardcoded.
- Providers (Vercel AI SDK, official packages): `groq` (keep), `openai`, `anthropic`, `google`, `xai`, `deepseek`.
- Storage: **multi-key** — at most one key per provider per user. Schema today upserts on `user_id`; needs per-`(user_id, provider)` rows (or equivalent). Encryption/Vault pattern stays; raw key never returns to client.
- Settings: entry on Settings tab → dedicated **API keys** screen. CRUD list of **configured** keys only. Empty when none; **Add new** opens add dialog. Not a fixed always-visible list of all six.
- Generate flow (free BYOK): explicit **provider** picker (saved keys only) + **model** picker filtered to that provider’s curated allow-list. Persist last-used provider+model **client-side**. Vision: auto — use selected model if vision-capable, else that provider’s curated vision default. No separate vision picker.
- Models: curated allow-lists per provider (object/structured generation required). Exact model IDs = `spec_partner` decision.
- Save: **no** provider validation probe (current behavior); invalid keys surface at generation.
- Paid / `use_platform_key`: unchanged — platform Groq key only; no BYOK pickers or multi-provider platform secrets this story.
- Out of scope: free-text model IDs, billing, cross-device last-used sync, multi-provider platform keys, analytics/feature flags.

## Acceptance criteria
- Given settings with no saved keys, when the learner opens the API keys screen, then they see an empty message and an **Add new** action.
- Given Add new, when the learner picks a provider not yet saved and submits a key, then that provider appears in the list as a masked “key saved” row (raw key never shown after save).
- Given a provider already saved, when the learner tries to add it again, then it is not offered in the add dialog (max one key per provider).
- Given a saved provider row, when the learner updates the key, then the new key replaces the old for that provider only; other providers’ keys are unchanged.
- Given a saved provider row, when the learner deletes it, then that provider’s key is removed; other keys remain; if it was last-used, generate defaults fall back to another saved provider (stable order) or the missing-key gate if none left.
- Given all six providers saved, when the learner views the API keys screen, then **Add new** is unavailable/hidden.
- Given free BYOK with ≥1 saved key, when the learner opens generate, then they can pick among **saved** providers only and then a curated model for that provider; last-used provider+model are preselected when still valid.
- Given free BYOK with no saved keys, when the learner reaches generate, then the existing missing-key gate still applies (no crash; path to add a key).
- Given a chosen provider+model, when generation runs, then the Edge Function uses that provider’s stored key server-side via the Vercel AI SDK and the selected model; key never reaches client or logs.
- Given image placement needs vision and the selected model is not vision-capable, when generation runs, then the provider’s curated vision default is used; if the selected model is vision-capable, it is used for placement.
- Given paid / `use_platform_key`, when the learner generates, then behavior stays platform Groq only — no BYOK provider/model pickers, user keys unused.
- Given any save/update/remove/generate, then raw API key values never appear in client state after save, responses, or server logs.

## Notes
- Related: R6 key management, R2 lesson generation, R10 plan entitlements (`use_platform_key` / `show_key_settings`).
- Open for `spec_partner`: exact curated text + vision model IDs per provider; schema migration shape for multi-key; generate-flow UI placement of pickers; last-used storage key/shape in client prefs.
- No analytics event or feature flag for this story.
