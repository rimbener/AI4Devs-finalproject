---
id: task-3
title: Multi-key api-key DAO + Service
slice: 1
scenarios: [s2, s4, s5, s9]
status: done
paths: [libs/supabase-services/src/dao/api-key.dao.ts, libs/supabase-services/src/services/api-key.service.ts]
---

## Goal
Make the api-key data layer multi-key. `ApiKeyDao.getApiKeyStatus()` selects **all** RLS rows (`provider, updated_at`) → `{ keys }`; `saveApiKey({ provider, apiKey })` unchanged (Edge `save`); `removeApiKey(provider)` sends `{ action: 'remove', provider }`. `ApiKeyService.saveApiKey(provider, rawKey)` (provider now required, no default) validates non-blank key then calls DAO; `removeApiKey(provider)`; `getApiKeyStatus()` returns `{ keys: [] }` on failure (never throws). Error normalization onto `ApiKeyErrorCode` unchanged.

## Done criteria
- [ ] Scenario(s) s2, s4, s5, s9 covered by concrete DAO + Service test(s)
- [ ] `getApiKeyStatus` returns all providers; save/remove are per-provider
- [ ] Raw key never returned upward; failures collapse to typed codes
- [ ] Barrel exports unchanged/consistent
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Mirrors current `api-key.dao.ts`/`api-key.service.ts` shape. Per-provider remove aligns with the composite-PK RPC (task-1) and the widened Edge allow-list (task-4).
