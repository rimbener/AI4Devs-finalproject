# AI provider registry — schema & RLS

**As a** the app's data layer
**I want** `ai_providers` and `ai_provider_models` tables that are the single source of truth for provider display name, guidance URL, curated model list, vision defaults, and enabled state
**so that** provider/model metadata can be edited (rename, add/remove a model, disable a provider) via direct SQL/Supabase Studio, with no code deploy, while `user_ai_keys` keeps a real integrity guarantee against unknown or removed providers

## Context

Today provider/model metadata is hardcoded TypeScript, duplicated in three places that must be kept in manual sync:
- `libs/types/src/ai-provider.ts` — `AI_PROVIDERS` union + `AI_MODEL_REGISTRY` (model ids, labels, vision flag, vision default per provider)
- `libs/types/src/api-key-settings.ts` — `PROVIDER_NAME_KEYS` (i18n keys) + `API_KEY_SETTINGS_GUIDANCE_URLS`
- `supabase/functions/generate-lesson/_shared/models.ts` — a hand-mirrored copy of the above (Deno can't import the workspace lib), flagged in its own header comment as a manual-sync liability

`user_ai_keys.provider` (from `20260722000000_multi_provider_ai_keys.sql`) is currently `text` with a closed `CHECK (provider in ('groq','openai',...))` — not a real foreign key.

The actual provider SDK integrations (`createGroq`, `createOpenAI`, etc. from `@ai-sdk/*` packages, wired in `supabase/functions/generate-lesson/_shared/lesson-generation.provider-factory.ts`) stay hardcoded — adding a genuinely new provider always requires wiring its SDK factory in code. This story only makes the *metadata* for providers whose factory already exists dynamic.

No admin UI exists anywhere in this repo. Rows are seeded by migration and maintained thereafter directly via Supabase Studio/SQL — this story does not add any admin-facing screen.

## Acceptance criteria

- `ai_providers` table: `id text primary key` (the existing provider key, e.g. `'groq'`), `name text not null` (literal display string, not an i18n key — provider names are not localized per this story), `guidance_url text`, `enabled boolean not null default true`.
- `ai_provider_models` table: one row per model, FK `provider_id` → `ai_providers(id)`, `model_id text not null`, `label text not null`, `vision boolean not null default false`, `is_vision_default boolean not null default false`.
  - Constraint: at most one `is_vision_default = true` row per `provider_id` (partial unique index).
  - Constraint: `is_vision_default = true` implies `vision = true` (a model can't be the vision default if it isn't vision-capable).
- `user_ai_keys.provider`'s existing `CHECK (provider in (...))` is replaced with a real foreign key to `ai_providers(id)`. Deleting an `ai_providers` row referenced by any `user_ai_keys` row is blocked (`ON DELETE RESTRICT`, the default) — disabling (`enabled = false`) is the only supported way to retire a provider while keys exist for it.
- A migration seeds `ai_providers` and `ai_provider_models` with the current six providers (`groq`, `openai`, `anthropic`, `google`, `xai`, `deepseek`) and their current curated models/vision defaults exactly as in today's `AI_MODEL_REGISTRY` and `API_KEY_SETTINGS_GUIDANCE_URLS` — so behavior is unchanged the moment this ships, before anyone edits a row.
- RLS: `SELECT` on both tables is allowed for the `authenticated` role (any signed-in user can read the full provider/model catalog, including disabled providers and their `enabled` flag — the frontend decides what to show/hide). No `INSERT`/`UPDATE`/`DELETE` policy exists for `anon` or `authenticated` — writes only happen via Supabase Studio/SQL (which bypass RLS) or a future service-role path, never from the client.
- Given a provider row has `enabled = false`, when any Edge Function resolves a provider before calling its SDK factory or reading/writing `user_ai_keys` for it, then the function checks `enabled` and rejects the operation for a disabled provider (replacing today's hardcoded `isAiProvider` allow-list checks in `manage-api-key/provider.ts` and the fixed `AiProvider` union in `generate-lesson/_shared/models.ts`).

## Notes

- Pairs with the frontend story `ai-provider-registry-frontend.md` (independent — either can ship first, but the frontend story assumes this schema/contract exists).
- Out of scope: any in-app admin UI for editing providers/models; making the SDK-factory wiring itself dynamic; per-locale provider names.
