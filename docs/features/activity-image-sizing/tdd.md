# TDD — activity-image-sizing

## Slice 1

| Scenario | Test | File |
| --- | --- | --- |
| @s1 | caps and centers the image at the readable content width | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s2 | renders the image scaled to fit when a url is available | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |

- @s1 Red: added cap and centering assertion; failed (missing max width).
- @s1 Green: wrapped image and applied `theme.layout.contentReading`.
- @s1 Refactor: retained existing aspect ratio and silent degrade.
- @s2: existing width assertion covers narrow viewport scaling.
- Gate: scoped activities lint, types, and targeted tests pass.
- Full-repo lint skipped — pre-existing study-buddy format debt, out of scope.
- Review fix: @s1 assertion derives max width from `lightTheme.layout.contentReading`; targeted test passes.
