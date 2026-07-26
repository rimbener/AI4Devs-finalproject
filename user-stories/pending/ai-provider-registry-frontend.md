# AI provider registry — consume DB-driven provider/model catalog

**As a** learner configuring AI providers and generating lessons
**I want** the provider names, guidance links, and model pickers I see to always reflect the live provider catalog (including a provider being disabled)
**so that** the app keeps working correctly when a provider's details are updated or a provider is retired, with no app update needed

## Context

Extends the multi-provider work from `multi-provider-ai-keys`. Provider/model metadata currently lives in hardcoded TypeScript (`AI_PROVIDERS`, `AI_MODEL_REGISTRY`, `PROVIDER_NAME_KEYS`, `API_KEY_SETTINGS_GUIDANCE_URLS` in `libs/types/src`) and is hand-mirrored again inside the `generate-lesson` Edge Function. This story assumes the paired backend story (`ai-provider-registry-backend.md`) exists: `ai_providers` (id, name, guidance_url, enabled) and `ai_provider_models` (provider_id, model_id, label, vision, is_vision_default) tables, readable by any authenticated user via RLS.

Consumers to migrate:
- `libs/study-buddy/src/components/api-key-settings-screen` — provider names + guidance URLs (`API_KEY_SETTINGS_GUIDANCE_URLS`, `PROVIDER_NAME_KEYS`)
- `libs/components/src/organisms/api-key-manager`, `api-key-form`, `api-key-form-dialog` — provider list + guidance URL props
- `libs/components/src/organisms/lesson-generation-panel/components/provider-selector.tsx` — provider + model pickers for the generate flow
- `supabase/functions/generate-lesson/_shared/models.ts` and `supabase/functions/manage-api-key/provider.ts` — replace the hardcoded/mirrored `AiProvider` union and allow-list checks with a DB read + `enabled` check

`@tanstack/react-query` is installed and is the required pattern for new data-fetching hooks (see `use-session`, `use-auth` in `@helsoft/hooks`) — the new hook follows that precedent, not the legacy reducer pattern.

Per the confirmed scope: provider names are a plain string (not localized per-locale); a disabled provider stays visible wherever the user already has a saved key for it (with a "Disabled" indicator) but is excluded from anywhere a *new* choice is made (add-key picker, generate provider/model pickers).

## Acceptance criteria

- A new `use-ai-providers` hook (`libs/hooks/src/hooks/use-ai-providers.ts`) fetches the full provider + model catalog via `useQuery`, replacing direct imports of `AI_PROVIDERS`/`AI_MODEL_REGISTRY`/`PROVIDER_NAME_KEYS`/`API_KEY_SETTINGS_GUIDANCE_URLS` in every consumer listed above.
- Given the API keys settings screen, when it renders, then each provider's name and guidance link reflect the current DB row (edit a `name` or `guidance_url` in the table → the screen shows the new value on next load, no app deploy).
- Given a provider the learner has already saved a key for, when that provider is later disabled (`enabled = false`), then it still appears in their saved-keys list with a "Disabled" indicator, and their key is not deleted.
- Given the add-key picker or the generate-flow provider picker, when a provider is disabled, then it does not appear as a choice (whether or not the learner has a key for it) — consistent with "no new choice involving a disabled provider."
- Given the generate-flow model picker for a selected provider, when models are shown, then they reflect that provider's current `ai_provider_models` rows (adding/removing a model in the DB is reflected without a code change).
- Given generation needs a vision-capable model and the learner's selected model isn't vision-capable, when generation runs, then the provider's `is_vision_default` model from the DB is used, same behavior as today's hardcoded `visionDefault`.
- Given the `generate-lesson` Edge Function resolves a provider (BYOK or platform path), when that provider is disabled in the DB, then generation is rejected with a clear error instead of proceeding — replacing the current hardcoded `AiProvider` union and mirrored `models.ts`.
- Given the `manage-api-key` Edge Function receives a save/remove request, when the requested provider is disabled or unknown, then the request is rejected the same way today's `isAiProvider` allow-list check rejects an unknown provider.
- No visual/behavioral regression for the six existing providers: names, guidance URLs, model lists, and vision defaults render identically to today immediately after this ships (the seeded DB data matches current hardcoded values).

## Notes

- Pairs with the backend story `ai-provider-registry-backend.md` (independent — this story's UI/edge-function acceptance criteria assume that schema/contract exists, but the two can be reviewed/implemented separately).
- Out of scope: any in-app admin UI for editing providers/models; localized provider names; making the SDK-factory wiring dynamic (adding a genuinely new provider is still code + DB, per the backend story's Context).
- No analytics event or feature flag called out for this story.
