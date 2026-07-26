---
id: task-2
title: Add the useAiProviders hook over AiProvidersService
slice: 1
scenarios: []
status: todo
paths:
  - libs/hooks/src/hooks/use-ai-providers.ts
  - libs/hooks/src/hooks/use-ai-providers.types.ts
  - libs/hooks/src/hooks/use-ai-providers.test.ts
  - libs/hooks/src/hooks/index.ts
---

## Goal
Wrap `AiProvidersService.getCatalog()` in a `useQuery`-based hook so every consumer reads the
live catalog through the required tanstack-query pattern, gated on an authenticated session.

## Done criteria
- [ ] No scenario owned directly by this task (hook-level plumbing, not user-facing behavior) — hook
      test asserts it returns the service's ordered array unchanged (identity/order pass-through) and
      asserts `isLoading` is true before the query resolves and correctly resolves to `false` for a
      signed-out session — this is the foundation scenarios s1/s2/s3/s4 (owned by task-3/task-4) and
      s11 (owned by task-3) build on
- [ ] `useAiProviders(): UseAiProvidersResult` — `{ providers: AiProviderCatalogEntry[]; isLoading:
      boolean }`, `useQuery({ queryKey: AI_PROVIDERS_QUERY_KEY, queryFn:
      AiProvidersService.getCatalog, staleTime: Infinity, enabled })`
- [ ] Exported `AI_PROVIDERS_QUERY_KEY = ['ai-providers', 'catalog'] as const` (mirrors
      `SESSION_QUERY_KEY`/`apiKeyStatusQueryKey`'s exported-key convention)
- [ ] `enabled` derived from `useSessionGate()` (catalog RLS is `to authenticated`) — no per-user
      scoping in the query key itself, since the catalog isn't user-scoped (unlike
      `apiKeyStatusQueryKey`)
- [ ] `isLoading` is `useSessionGate().deriveIsLoading(isPending)` — **not** raw `useQuery` `isPending`
      — mirroring `use-profile.ts`'s `deriveIsLoading(isPending) || isApiKeyLoading` precedent, so a
      signed-out session (where `enabled` is `false` and the query never runs) resolves `isLoading` to
      `false` instead of staying stuck `true` forever
- [ ] Default to `providers: []` while `data` is undefined (never `undefined` to callers)
- [ ] Barrel-exported from `libs/hooks/src/hooks/index.ts`
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/hooks`

## Notes
- Decision 1. Mirrors `use-session.ts`'s `staleTime: Infinity` shape (reference data, no polling) —
  not `useSessionGate`'s per-user `apiKeyStatusQueryKey` pattern, since the catalog itself carries no
  user dimension; only *whether* the query runs is gated by the session.
- Because `AiProvidersService.getCatalog()` never rejects (task-1, Decision 11), this hook has
  no `error` to expose — a failed catalog read surfaces as `providers: []`, not a thrown/cached
  error state.
- `deriveIsLoading` (not raw `isPending`) is required precisely because `enabled: false` for a
  signed-out session means `useQuery` never transitions out of `isPending`; `useSessionGate`'s
  `deriveIsLoading` is the established fix for that (`use-profile.ts` is the precedent), so this hook
  must reuse it rather than exposing `isPending` directly.
