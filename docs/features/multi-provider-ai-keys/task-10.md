---
id: task-10
title: Edge vision auto-selection + null-vision degrade
slice: 2
scenarios: [s13, s14, s15]
status: done
paths: [supabase/functions/generate-lesson/index.ts, supabase/functions/generate-lesson/_shared/models.ts]
---

## Goal
Make the vision-placement model automatic per the registry. When un-anchorable images need vision placement: use the **selected model** if it is `vision: true`; else use the provider's `visionDefault`; if `visionDefault` is `null` (provider has no vision model), **skip the vision call** and let the existing pipeline degrade those images to text-only. No separate vision picker; no error surfaced for the degrade path.

## Done criteria
- [ ] Scenario(s) s13, s14, s15 covered by concrete Deno unit test(s) on the model-choice helper
- [ ] Vision model resolved from registry (selected-if-vision → visionDefault → skip)
- [ ] Null-vision provider degrades to text-only via the existing unplaced→text path
- [ ] Manual live-verify note recorded

## Notes
Reuse the existing `runVisionPlacement` seam + `placeImagesByMetadata`/`applyVisionPlacements` degrade path. Vision default IDs per registry (task-2 mirror).
