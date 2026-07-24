---
id: task-2
title: Types — widen AiProvider, AI_MODEL_REGISTRY, ApiKeyStatus reshape
slice: 1
scenarios: [s3, s6, s9]
status: done
paths: [libs/types/src/ai-provider.ts, libs/types/src/ai-model.ts, libs/types/src/api-key.ts, libs/types/src/api-key-settings.ts, libs/types/src/index.ts]
---

## Goal
Widen the provider contract and add the model registry as the single client source. Widen `AiProvider` union to `'groq' | 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek'` and export `AI_PROVIDERS` (fixed order: groq, openai, anthropic, google, xai, deepseek). Add `AI_MODEL_REGISTRY: Record<AiProvider, { models: { id: string; labelKey: string; vision: boolean }[]; visionDefault: string | null }>` with the confirmed curated IDs. Export **`PROVIDER_NAME_KEYS`** + **`API_KEY_SETTINGS_GUIDANCE_URLS`** (`api-key-settings.ts`) for settings/generate UI. Reshape `ApiKeyStatus` to `{ keys: SavedProviderKey[] }` where `SavedProviderKey = { provider: AiProvider; updatedAt: string }`; `SaveApiKeyParams` remains `{ provider, apiKey }`. Remove the old scalar `hasKey/provider/updatedAt` + its shape-lock (replace with a `keys`-shape lock preserving "no key material" invariant).

## Done criteria
- [ ] Scenario(s) s3, s6, s9 covered by concrete type-level/registry test(s)
- [ ] `AI_MODEL_REGISTRY` holds the confirmed models + nullable `visionDefault`; `labelKey` per model (i18n)
- [ ] `PROVIDER_NAME_KEYS` + `API_KEY_SETTINGS_GUIDANCE_URLS` exported for all six providers
- [ ] `ApiKeyStatus = { keys: SavedProviderKey[] }`; only provider + timestamp (no key material)
- [ ] Barrel exports updated
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Curated IDs per spec.md Open decisions. Registry + name/guidance maps consumed by settings (task-6) and generate pickers (task-11/12); registry hand-mirrored into Deno (task-9). Keep a shape-lock test guarding `SavedProviderKey` against key-shaped fields.
