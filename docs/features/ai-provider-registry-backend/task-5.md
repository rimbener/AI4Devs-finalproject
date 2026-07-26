---
id: task-5
title: Resolve the image-placement vision model from the catalog entry
slice: 1
scenarios: [s13, s14, s15]
status: todo
paths:
  - supabase/functions/generate-lesson/_shared/lesson-generation.vision-model.ts
  - libs/supabase-services/src/services/lesson-generation.vision-model.test.ts
---

## Goal
Re-point vision-model selection at the injected provider entry so `is_vision_default` in the catalog
drives image placement, replacing the deleted `AI_MODEL_REGISTRY`'s `visionDefault`.

## Done criteria
- [ ] Scenarios s13, s14, s15 covered by TDD'd Jest tests
- [ ] Resolution order preserved exactly: selected-model-if-vision-capable → the entry's
      `isVisionDefault` model → `null` (s13, s14, s15)
- [ ] `resolveVisionModelForPlacement` no longer reads a module-level registry; it takes the entry
- [ ] `null` still means "skip the vision call and degrade to text-only", unchanged
- [ ] Existing test cases preserved, re-expressed against a `ProviderEntry` fixture
- [ ] `pnpm --filter @helsoft/supabase-services test` + `pnpm lint` + `pnpm check-types` green

## Notes
- Decision: **D6** (the global registry this closed over is deleted). Rationale lives in `spec.md`.
- **Strict TDD**, non-UI `.ts`.
- This file is already the right shape — `resolveVisionModelFromRegistry(registry, provider, model)`
  takes its data as a **parameter**, which is exactly the injected-catalog pattern. The change is
  narrowing that parameter from a whole registry to one `ProviderEntry` from task-3.
- `resolveVisionModelForPlacement` currently closes over the global `AI_MODEL_REGISTRY` deleted in
  task-4; it must now receive the entry the caller already loaded (task-6 threads it).
- Behaviour must not shift: `libs/supabase-services/src/services/lesson-generation.vision-model.test.ts`
  documents the three existing outcomes and its assertions should survive the refactor intact.
- At most one model per provider can carry `isVisionDefault` — task-1's partial unique index
  guarantees it, so the resolver may take the first match without tie-breaking.
