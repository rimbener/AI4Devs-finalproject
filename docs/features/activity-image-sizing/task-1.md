---
id: task-1
title: Cap inline slide image at readable max width, centered
slice: 1
scenarios: [s1, s2]
status: done
paths:
  - libs/activities/src/organisms/slide-image/slide-image.tsx
  - libs/activities/src/organisms/slide-image/slide-image.test.tsx
  - libs/activities/src/organisms/slide-image/slide-image.stories.tsx
---

## Goal
Constrain the inline `SlideImage` to `maxWidth: layout.contentReading` (640) and center it horizontally within the slide, while keeping `width: '100%'` so it scales down on narrow viewports. Preserve `resizeMode="contain"`, the aspect-ratio math, and the existing silent-degrade (`return null` when no url/image).

## Done criteria
- [ ] Scenarios s1, s2 covered by concrete tests
- [ ] Inline image uses the `layout.contentReading` token (no `700`/magic number); centered via a wrapping `View` (`alignItems: 'center'`) or equivalent
- [ ] `width: '100%'` + `maxWidth` so it never exceeds 640 and shrinks below it
- [ ] Existing SlideImage behavior (aspect ratio, decorative-when-no-alt, no-url degrade) stays green
- [ ] Story still renders Content / NoImage / Unresolvable variants
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Token: `libs/components/src/theme/spacing.ts` → `layout.contentReading = 640`.
- Story's `700` is superseded by the 640 token (spec decision).
