---
id: task-2
title: use-slide-layout hook — derive the split decision
slice: 2
scenarios: [s4, s5, s6, s8, s9, s10, s11]
status: todo
paths:
  - libs/activities/src/organisms/slide-view/use-slide-layout.ts
  - libs/activities/src/organisms/slide-view/use-slide-layout.test.ts
  - libs/activities/src/organisms/slide-view/slide-view.types.ts
---

## Goal
Add the co-located hook that owns the **single derived decision** `isSplit`, from the slide's image dimensions + the current window orientation + the measured `availableHeight`. Pure view logic, co-located with the `SlideView` organism per `component-split.mdc`.

Signature (implementer writes the body TDD-first):
```ts
// isSplit is true iff ALL hold:
//   image exists AND image.width > 0 AND image.height > 0   (valid dims)
//   image.height > image.width                              (portrait; square is NOT portrait)
//   window.width > window.height                            (landscape viewport; orientation-only, Q3=A)
//   availableHeight != null && availableHeight > 0          (height known — else stacked, Q6 guard)
export function useSlideLayout(args: {
  image?: SlideImageRef;
  availableHeight?: number | null;
}): { isSplit: boolean };
```
- Reads the viewport via `useWindowDimensions()` (Q1=(A)) — the only new pattern, a React Native built-in (no new dependency).
- Re-renders on resize/rotation automatically (drives `@s10`).

## Done criteria
- [ ] `@s6` — portrait image + `width <= height` viewport → `isSplit === false`
- [ ] `@s4` — landscape image (`width > height`) → `false`, regardless of viewport
- [ ] `@s5` — square image (`width === height`) → `false`
- [ ] `@s9` — `width <= 0` or `height <= 0` (or missing image) → `false`
- [ ] `@s8` — `availableHeight` `undefined`/`null`/`<= 0` → `false` even when orientation + portrait hold
- [ ] `@s10` — flipping `useWindowDimensions` from landscape to portrait flips `isSplit` true→false (and back)
- [ ] `@s11` — the decision is image/viewport-based only (independent of slide `kind`)
- [ ] Unit-tested by mocking `useWindowDimensions` and passing `availableHeight`; `pnpm lint` + `pnpm check-types` green

## Notes
`SlideImageRef` (`@helsoft/types`) already carries `width`/`height`. Keep every boolean sub-condition explicit (mutation testing bites on `>` vs `>=` and `&&` collapse). No I/O → not a `libs/hooks` data hook; this is a presentational co-located hook (`component-split.mdc`), rationale recorded in `spec.md`.
