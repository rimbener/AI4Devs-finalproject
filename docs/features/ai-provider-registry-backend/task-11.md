---
id: task-11
title: Integration test — catalog rows drive validation, vision resolution and the enabled gate
slice: 3
scenarios: [s27, s28]
status: done
paths: [libs/supabase-services/src/services/provider-catalog.integration.test.ts]
---

## Goal
The one integration test across the vertical slice required by `tdd.mdc`: with a mocked Supabase
client, prove that catalog rows alone decide provider usability, model validity and image-placement
model — and that flipping `enabled` changes the decision on the very next request.

## Done criteria
- [ ] Scenarios s27, s28 covered
- [ ] One test spanning `loadProviderCatalog` → model validation → vision resolution → route decision,
      with the Supabase client mocked (no network)
- [ ] s27: changing the mocked rows (rename, add a model, remove a model) changes the resolved outcome
      with **no code change** — the no-deploy promise, proven mechanically
- [ ] s28: a first request resolves successfully; the mocked rows then report `enabled = false`; the
      next request is refused as disabled — proving **no cross-invocation cache** exists
- [ ] Assertions target observable decisions, not internal call order
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- Decision: **D9** (no caching). Rationale lives in `spec.md`.
- Satisfies `tdd.mdc`'s "one integration test across the vertical slice".
- **s28 is the regression guard for D9.** If anyone later adds a module-level TTL cache to
  `loadProviderCatalog`, this test must fail — that is its entire purpose. Write it so it would.
- Mock at the client boundary (the `from(...).select(...)` chain), not at `loadProviderCatalog`, or the
  test proves nothing about the query wiring.
- Reuse the mocking style already established in `libs/supabase-services/src/services/*.test.ts` and
  `libs/hooks/src/hooks/api-key.integration.test.ts` rather than introducing a new harness.
- This test lives in `libs/supabase-services` but exercises `supabase/functions/_shared/` code by
  relative import — the same precedent task-3 relies on.
