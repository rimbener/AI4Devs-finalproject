---
id: task-4
title: LessonPlayer measures its body area and feeds availableHeight down
slice: 3
scenarios: [s8, s13]
status: todo
paths:
  - libs/activities/src/organisms/lesson-player/lesson-player.tsx
  - libs/activities/src/organisms/lesson-player/lesson-player.test.tsx
---

## Goal
Plumb a real **bounded** available height from `LessonPlayer` into `SlideView` (revised Q5=(B)). The only genuinely viewport-bounded box is the player's body `ScrollView` frame; a node inside `SlideView` can only measure content height, so the measurement must happen here and pass down.

- Put a `ref` on the body `ScrollView`; in a `useLayoutEffect`, `ref.measure(...)` its frame height into state (`availableHeight`).
- Pass `availableHeight` to `SlideView` (only the content-slide branch; results slide unaffected).
- Re-measure when the measured size can change (e.g. remeasure on layout/resize); tolerate the first commit where it is still `undefined`.
- Outer `ScrollView` **stays** (Q2=(B) — this is height plumbing only, not the Q2-A wrapper swap).

## Done criteria
- [ ] `@s13` — after the body area is measured, `SlideView` receives a positive `availableHeight`; the results-slide path is untouched
- [ ] `@s8` — on the first commit (pre-measure) `availableHeight` is undefined and `SlideView` renders stacked; it flips to split once measured (given portrait image + landscape)
- [ ] Measurement uses `useLayoutEffect` + `ref.measure()` (jump-minimized vs async `onLayout`)
- [ ] Existing `LessonPlayer` states (Empty/Error/results/deck) and tests stay green
- [ ] `pnpm lint` + `pnpm check-types` green

## Notes
`useLayoutEffect` changes only timing; it does **not** create a bound — the bound comes from measuring the `flex:1` body `ScrollView`'s own frame (documented in `spec.md`). Guard against `measure` returning `0`/undefined (native old-arch async, see risks). This is the one task that touches a component outside `SlideView`.
