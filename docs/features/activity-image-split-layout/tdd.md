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
