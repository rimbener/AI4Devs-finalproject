---
id: task-13
title: One cross-layer integration test — catalog rows drive every consumer end to end
slice: 3
scenarios: [s21]
status: done
paths:
  - libs/study-buddy/src/components/ai-providers.integration.test.ts
---

## Goal
The one integration test across the whole vertical slice (`tdd.mdc`): a single mocked catalog
fixture — renamed, reordered, with one provider disabled — read through the real
`AiProvidersService` → real `useAiProviders` → the real derivations `useApiKeyManager` and
`useLessonGenerationForm` build on top of it, proving rows alone decide identity, order, and
visibility, with no re-implementation in the test itself.

## Done criteria
- [ ] Scenario s21 covered: one test (mirrors `libs/study-buddy/src/components/
      profile-ui.integration.test.tsx`'s existing shape/naming convention — a top-level, cross-
      component integration test living directly under `libs/study-buddy/src/components/`, not
      nested in one component's own folder — and `libs/hooks/src/hooks/api-key.integration.test.ts`'s
      `createElement`-based `QueryClientProvider` wrapper convention for exercising a real hook
      without JSX) that:
      1. mocks the Supabase client boundary (not `AiProvidersDao` itself) with a renamed,
         reordered, one-disabled fixture
      2. renders/exercises the real `useAiProviders()` and asserts the resulting `providers` array's
         order and names, and asserts `enabledProviders` is exactly the `enabled === true` subset of
         `providers`, same order
      3. feeds that same `enabledProviders` field into the real `useApiKeyManager`'s
         `unsavedProviders` derivation and asserts the disabled provider is excluded (task-7) — not
         the raw `providers` array, since `unsavedProviders` no longer re-checks `enabled` itself
      4. feeds `enabledProviders` into the real `useLessonGenerationForm`'s `savedProviders`
         derivation and asserts the same exclusion there, for the same reason
- [ ] No mock of `useAiProviders` itself, `useApiKeyManager`, or `useLessonGenerationForm` inside
      this test — only the Supabase client boundary is mocked, so the wiring between them is what's
      actually exercised
- [ ] `pnpm test` green for `@helsoft/study-buddy`

## Notes
- Decision 1, 5, 12. Placed in `libs/study-buddy` (**not** `libs/hooks`, where the original draft of
  this task placed it) — `libs/study-buddy` is the one workspace whose dependency graph actually
  contains all three things this test exercises for real: `@helsoft/hooks` (`useAiProviders`),
  `@helsoft/components` (`useApiKeyManager`), and `useLessonGenerationForm` itself, which is defined
  locally in this same workspace. `libs/hooks/package.json` depends only on `@helsoft/
  supabase-services`/`@helsoft/types`/`@tanstack/react-query` — it does **not** depend on
  `@helsoft/components` or `@helsoft/study-buddy`; the dependency direction is in fact reversed
  (`libs/components/package.json` and `libs/study-buddy/package.json` both list `@helsoft/hooks` as a
  dependency), so a test living in `libs/hooks` could never resolve those two modules. Follow
  `libs/study-buddy/src/components/profile-ui.integration.test.tsx` for where a cross-component
  integration test lives in this workspace, and `libs/hooks/src/hooks/api-key.integration.test.ts`'s
  `createElement(QueryClientProvider, …)` wrapper (no JSX needed, so `.test.ts` — not `.test.tsx` —
  is fine) for how to exercise a real `useQuery`-backed hook under test.
- This is intentionally the **only** test in the whole feature allowed to span three modules in one
  file — every other task's tests stay scoped to their own layer.
