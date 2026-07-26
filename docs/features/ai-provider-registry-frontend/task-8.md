---
id: task-8
title: Widen ApiKeyErrorCode with provider_disabled and stop swallowing it to network_error
slice: 2
scenarios: [s16]
status: todo
paths:
  - libs/types/src/api-key-error.ts
  - libs/types/src/api-key-error.test.ts
  - libs/supabase-services/src/dao/api-key.dao.ts
  - libs/supabase-services/src/dao/api-key.dao.test.ts
  - libs/supabase-services/src/services/api-key.service.ts
  - libs/supabase-services/src/services/api-key.service.test.ts
  - libs/hooks/src/hooks/use-api-key.ts
  - libs/hooks/src/hooks/use-api-key.test.ts
  - libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx
  - libs/localization/src/resources/en.ts
  - libs/localization/src/resources/es.ts
  - libs/localization/src/resources/pt.ts
  - libs/localization/src/resources/de.ts
---

## Goal
`manage-api-key` already returns HTTP 400 `{ code: 'provider_disabled' }` for a save against a
disabled provider (backend D11/D12) — today's client silently reclassifies every DAO failure as
`network_error` before it ever reaches the UI. Widen the closed `ApiKeyErrorCode` union, read the
wire body instead of swallowing it, and give the learner distinct copy.

## Done criteria
- [ ] Scenario s16 covered: saving a key against a mocked 400 `{ code: 'provider_disabled' }`
      response surfaces `error === 'provider_disabled'` out of `useApiKey()`, and the settings
      screen renders `settings.apiKey.error.providerDisabled`'s copy — distinct from the
      `network_error` banner
- [ ] `ApiKeyErrorCode` widened to `'network_error' | 'validation_error' | 'provider_disabled'`
      (`libs/types/src/api-key-error.ts` + its test)
- [ ] `api-key.dao.ts` re-throws the raw `FunctionsHttpError`/`FunctionsFetchError`/
      `FunctionsRelayError` (not a generic `Error`) so the service layer can branch on it — mirrors
      `lesson-generation.dao.ts`'s existing convention, not a new pattern
- [ ] `api-key.service.ts` replaces its blanket `catch { throw networkError(); }` in `saveApiKey`/
      `removeApiKey` with a `normalizeApiKeyError`-style helper (mirrors
      `lesson-generation.service.ts`'s `normalizeGenerationError`/`readFunctionErrorCode`): a
      `FunctionsHttpError` has its JSON body's `{ code }` read and mapped through a closed
      `Record<ApiKeyErrorCode, true>` guard (falls back to `network_error` for an unrecognized code,
      matching `lesson-generation.service.ts`'s `generation_failed` fallback precedent); a transport
      failure (`FunctionsFetchError`/`FunctionsRelayError`) stays `network_error`
- [ ] `use-api-key.ts`'s `API_KEY_ERROR_CODES` Set gains `'provider_disabled'` so `isApiKeyErrorShape`
      recognizes it instead of falling through to its own `'network_error'` default
- [ ] `api-key-settings-screen.tsx`'s `API_KEY_ERROR_KEYS` gains `provider_disabled:
      'settings.apiKey.error.providerDisabled'`
- [ ] New locale key added, translated, to all four bundles in the same commit
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/types`,
      `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/study-buddy`

## Notes
- Decision 8 (mirrors backend D11/D12). `getApiKeyStatus()` is unaffected — it already
  catches-to-empty and has no error code to widen.
- This is the one place today's code actively **loses** information (`api-key.service.ts`'s
  `catch { throw networkError(); }` is unconditional) — the fix is not additive, it changes existing
  behavior for every non-2xx `manage-api-key` response, so re-run the full existing
  `api-key.service.test.ts`/`use-api-key.test.ts` suites, not just add new cases.
