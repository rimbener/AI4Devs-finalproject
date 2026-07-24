---
id: task-5
title: useApiKey multi-key hook + derived hasKey
slice: 1
scenarios: [s1, s4, s5, s7, s8]
status: done
paths: [libs/hooks/src/hooks/use-api-key.ts, libs/hooks/src/hooks/use-api-key.reducer.ts, libs/hooks/src/hooks/use-api-key.types.ts]
---

## Goal
Expose multi-key state. `status.keys` from the reshaped `ApiKeyStatus`; add a **derived `hasKey: boolean` (`keys.length > 0`)** on the hook result so `useProfile().canCreate` + `ApiKeyGate` keep working unchanged. `saveApiKey(provider, rawKey)` and `removeApiKey(provider)`; keep `isLoading`/`isSubmitting`/`error` bookkeeping and the `ApiKeyProvider` shared-context path. Loading state (s7) and mutation-failure error (s8) preserved.

## Done criteria
- [ ] Scenario(s) s1, s4, s5, s7, s8 covered by concrete hook test(s)
- [ ] `status.keys` + derived `hasKey`; per-provider save/remove
- [ ] `useProfile().canCreate` unaffected (still `platform || hasKey`)
- [ ] Reducer/types updated; memoized result value retained
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Update `use-profile.ts` consumer to read derived `hasKey`. Keep isXErrorShape guard. Related-state uses `useReducer` (state.mdc) as today.
