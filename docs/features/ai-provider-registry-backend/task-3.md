---
id: task-3
title: Add the shared provider-catalog module (pure predicates + scoped loader)
slice: 1
scenarios: [s10, s11]
status: todo
paths:
  - supabase/functions/_shared/provider-catalog.ts
  - libs/supabase-services/src/services/provider-catalog.test.ts
---

## Goal
One shared Edge module both functions import, split into a **pure** half (types + predicates over an
injected provider entry) and an **impure** half (`loadProviderCatalog`, a single scoped query). The
split is what keeps every `enabled`/model-validity decision inside the Jest + Stryker harness.

## Done criteria
- [ ] Scenarios s10, s11 covered by TDD'd Jest tests
- [ ] `ProviderEntry` type: `{ id, name, guidanceUrl, enabled, sortOrder, models: ProviderModel[] }`
- [ ] `ProviderModel` type: `{ modelId, label, vision, isVisionDefault, sortOrder }`
- [ ] `loadProviderCatalog(client, providerId): Promise<ProviderEntry | null>` — **one** query with
      an embedded select, models ordered by `sort_order`, `null` when no row matches (s10, s11)
- [ ] Pure predicates exported and unit-tested with plain fixture objects, no client
- [ ] The pure half imports **nothing** — so `libs/supabase-services` Jest can import it by relative path
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- **Strict TDD** (`tdd.mdc`) — this is non-UI `.ts`. Red → Green → Refactor, one `@s` at a time.
- Test-path precedent is established and must be followed:
  `libs/supabase-services/src/services/lesson-generation.validation.test.ts` imports directly from
  `../../../../supabase/functions/generate-lesson/_shared/lesson-generation.validation` — a Jest test
  reaching into `supabase/functions/`. Do the same here.
- The **pure half must stay import-free.** The moment it imports `supabase-js`, it leaves the Jest
  harness and mutation coverage drops. `loadProviderCatalog` may reference the client *type* only.
- Placed in `supabase/functions/_shared/` (alongside `cors.ts`, the existing cross-function
  precedent) so there is exactly **one** copy of the catalog contract — this story exists to delete
  duplication, not add a third mirror (decision D5).
- **Scoped, not full-catalog** (decision D8): neither function ever needs the other five providers.
  `null` for an unknown id collapses "unknown" and "missing" into one path the callers can branch on.
- Suggested query shape:
  `.from('ai_providers').select('id, name, guidance_url, enabled, sort_order, ai_provider_models(model_id, label, vision, is_vision_default, sort_order)').eq('id', providerId).maybeSingle()`
  with the embedded rows ordered by `sort_order` on the referenced table.
- Do **not** add caching. The entry is loaded once per request and threaded down (decision D9) —
  `enabled = false` must take effect on the very next request (`@s28`).
