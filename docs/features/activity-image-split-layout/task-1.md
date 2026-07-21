---
id: task-1
title: Add a layout variant to SlideImage (stacked | split)
slice: 1
scenarios: [s2, s14]
status: todo
paths:
  - libs/activities/src/organisms/slide-image/slide-image.tsx
  - libs/activities/src/organisms/slide-image/slide-image.types.ts
  - libs/activities/src/organisms/slide-image/slide-image.stories.tsx
  - libs/activities/src/organisms/slide-image/slide-image.test.tsx
---

## Goal
Give `SlideImage` a `layout: 'stacked' | 'split'` prop (default `'stacked'`) so the same component can render in two sizing modes. This is the leaf-first slice: no viewport logic yet, just a prop that switches styles.

- `stacked` (default) = **today's behavior, byte-for-byte**: `width:100%`, `aspectRatio`, `maxWidth: theme.layout.contentReading` (640), centered.
- `split` = **height-bounded `contain`**: the image fills its column but is bounded by the pane height (`maxHeight: '100%'` / `flex:1` within the parent), so a tall portrait image never balloons vertically. **No 640 `maxWidth` cap** in split. `resizeMode="contain"` (no crop) either way.
- The expand→`ImageLightbox` control and its focus-restore behavior are **unchanged** and present in both modes.

## Done criteria
- [ ] `SlideImageProps` gains `layout?: 'stacked' | 'split'` (documented; defaults to `'stacked'`)
- [ ] `@s14` — in `stacked`, the wrapper still caps at `contentReading` and the image keeps `width:100%` + `aspectRatio` (existing tests stay green)
- [ ] `@s2` — in `split`, the image is height-bounded (`contain`, bounded to pane height) with **no** 640 cap, and the expand control still renders and opens the lightbox
- [ ] New/updated Storybook story renders the `split` variant inside a bounded-height wide container
- [ ] All existing `slide-image.test.tsx` cases remain green; new cases assert the `split` style branch
- [ ] `pnpm lint` + `pnpm check-types` green; no hardcoded colors/dimensions (tokens only)

## Notes
Styles via `react-native-unistyles` `StyleSheet.create` (`atomic-design.mdc`, no inline literals). Keep `SlideImage` presentational — it does **not** import `useWindowDimensions` or the layout hook (Q4=(A), keeps the atom testable per-variant). The parent (`SlideView`) decides the mode and passes `layout`.
