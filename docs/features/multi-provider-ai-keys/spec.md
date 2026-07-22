---
feature: multi-provider-ai-keys
story: user-stories/in-progress/multi-provider-ai-keys.md
status: approved
---

# Spec — multi-provider-ai-keys

## Summary
Extends BYOK (R6) + generation (R2): free-tier learners save one key per provider across six providers (groq, openai, anthropic, google, xai, deepseek) and pick provider + curated model per generation. Keys stay server-side only; paid `use_platform_key` path is unchanged (platform Groq only).

## User stories
- As a **free-tier learner**, I want to **save keys for multiple AI providers and pick provider + model when generating**, so that **I can use my preferred/cheapest/best provider instead of being locked to Groq**.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — each `@s` scenario is an acceptance criterion (Given/When/Then). Story ACs map: settings `@s1–@s9`; generate + routing + vision `@s10–@s19`; last-used `@s20–@s21`.

## UI states (if UI)
| State | Trigger | Notes |
|---|---|---|
| Loading | saved-keys status fetch in flight | settings spinner (`@s7`) |
| Content | ≥1 saved key / pickers ready | configured rows + add flow; provider+model pickers (`@s2`,`@s10`) |
| Empty | no saved keys | empty list + "add new provider" (`@s1`); generate → missing-key gate (`@s16`) |
| Error | save/remove failure | banner, list unchanged, retry (`@s8`) |

## Analytics events
None (out of scope).

## Feature flags
None. (Paid/free behavior is driven by existing live `plans.use_platform_key`, not a new flag.)

## Out of scope / non-goals
- Free-text model IDs; billing; cross-device last-used sync; multi-provider platform secrets; analytics/feature flags; save-time provider validation probe (invalid keys still surface at generation).

## Open decisions (resolved, with rationale)
- **5 new `@ai-sdk/*` packages + `provider→createX(apiKey)` factory** behind the existing seams — **why:** first-party adapters share the `generateObject`/vision surface; callers/tests unchanged.
- **Composite PK `(user_id, provider)`** + DB `CHECK` allow-list; redefine `save/get/remove_api_key` RPCs (get/remove take `provider`); settings list via existing RLS `select` (no list RPC) — **why:** minimal faithful "≤1 key per provider"; DB CHECK is server-side defense beyond the TS union.
- **`AI_MODEL_REGISTRY` + widened `AiProvider`** in `@helsoft/types` (`{ id, labelKey, vision }[]` + nullable `visionDefault`), hand-mirrored into Deno — **why:** one source drives picker, vision fallback, server validation.
- **Curated models (Jul 2026 docs; `*`=vision, `→`=visionDefault):** groq `openai/gpt-oss-20b`,`openai/gpt-oss-120b`,`qwen/qwen3.6-27b`*→`qwen/qwen3.6-27b`; openai `gpt-5.6-luna`*,`gpt-5.6-terra`*→`gpt-5.6-luna`; anthropic `claude-haiku-4-5`*,`claude-sonnet-5`*→`claude-haiku-4-5`; google `gemini-3.6-flash`*,`gemini-2.5-flash`*→`gemini-3.6-flash`; xai `grok-4.3`*,`grok-4.5`*→`grok-4.3`; deepseek `deepseek-v4-flash`*,`deepseek-v4-pro`*→`deepseek-v4-flash`. Nullable `visionDefault` → skip vision + degrade to text-only when null.
- **`ApiKeyStatus = { keys: SavedProviderKey[] }`**; hook exposes derived `hasKey`; service `saveApiKey(provider, rawKey)`/`removeApiKey(provider)` — **why:** derived `hasKey` keeps `canCreate`/`ApiKeyGate` unchanged.
- **New `ApiKeyManager` organism** (configured rows + `RadioGroup` add flow); `ApiKeyForm` refactored to the add/replace sub-form; fixed provider order — **why:** matches "configured list + add flow", reuses existing molecules/states.
- **Provider + model `RadioGroup`s in `LessonGenerationPanel` above composition, free-BYOK only**; `GenerateLessonRequest` += optional `provider`/`model` (Edge validates, ignores on platform); vision auto — **why:** one cohesive panel; optional fields keep the platform path unchanged.
- **On-device `{ provider, model }` preference** (`study-buddy.generation-preference`) via new `GenerationPreferenceDao`+`Service` in `@helsoft/services`; validated-then-fallback on open, written on generate; corrupt/missing = no preference — **why:** reuses the locale-preference pattern; covers deleted-key/retired-model fallback.
- **New error code `invalid_model`** (mirrored client↔Deno + i18n) for unknown provider/model; `missing_key` for a named provider with no key; `invalid_key` unchanged — **why:** precise, actionable message.
