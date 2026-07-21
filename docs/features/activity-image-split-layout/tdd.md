# TDD — activity-image-split-layout

## Slice 1

| Scenario | Test | File |
| --- | --- | --- |
| @s2 | contains split images within the available pane height without a width cap | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s2 | SplitImage opens the lightbox from the bounded pane | `libs/activities/tests/e2e/organisms/slide-image/slide-image.e2e.js` |
| @s14 | caps and centers the image with its expand overlay at the readable content width | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |

- @s2 RED→GREEN: added the split sizing test, then added the optional layout variant.
- @s2 RED→GREEN: added the split Storybook e2e, then added its bounded-pane story.
- @s14 REFACTOR: retained the existing stacked sizing branch as the default.
- @s2 REVIEW: expanded the split e2e to open and verify the lightbox.

## Slice 2

| Scenario | Test | File |
| --- | --- | --- |
| @s4, @s5, @s6, @s8, @s9, @s10, @s11 | `useSlideLayout` split decision cases | `libs/activities/src/organisms/slide-view/use-slide-layout.test.ts` |
| @s1, @s2, @s3, @s6, @s7, @s12, @s14 | `SlideView` split and stacked structure | `libs/activities/src/organisms/slide-view/slide-view.test.tsx` |
| @s1 | `SlideView layout integration` | `libs/activities/src/organisms/slide-view/slide-view.integration.test.tsx` |

- @s1 RED→GREEN: added portrait/landscape hook coverage, then derived explicit split conditions.
- @s4–@s10 REFACTOR: added orientation, dimensions, and measured-height regression cases.
- @s1–@s3 RED→GREEN: added split row test, then rendered 50/50 image/body panes with nested body scroller.
- @s6, @s7, @s12, @s14 REFACTOR: verified stacked fallback, text-only fallback, and source order.
- @s12 REVIEW RED→GREEN: asserted the named, focusable body scroll pane and image-before-body tree order, then added the localized accessibility contract.
- REVIEW REFACTOR: moved the instructional-slide discriminator into `slide-view.helpers.ts`.
- @s1 REVIEW RED→GREEN: rendered `SlideView` with the real layout hook and mocked landscape viewport.
