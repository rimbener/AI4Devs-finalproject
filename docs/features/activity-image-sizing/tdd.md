# TDD — activity-image-sizing

## Slice 1

| Scenario | Test | File |
| --- | --- | --- |
| @s1 | caps and centers the image with its expand overlay at the readable content width | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s2 | renders the image scaled to fit when a url is available | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |

- @s1 Red: added cap and centering assertion; failed (missing max width).
- @s1 Green: wrapped image and applied `theme.layout.contentReading`.
- @s1 Refactor: retained existing aspect ratio and silent degrade.
- @s2: existing width assertion covers narrow viewport scaling.
- Gate: scoped activities lint, types, and targeted tests pass.
- Full-repo lint skipped — pre-existing study-buddy format debt, out of scope.
- Review fix: @s1 assertion derives max width from `lightTheme.layout.contentReading`; targeted test passes.

## Slice 2

| Scenario | Test | File |
| --- | --- | --- |
| @s6 | shows a contained image in a fullscreen modal | `libs/components/src/molecules/image-lightbox/image-lightbox.test.tsx` |
| @s7 | dismisses when the close control is pressed | `libs/components/src/molecules/image-lightbox/image-lightbox.test.tsx` |
| @s8 | dismisses when the backdrop is pressed without closing from image presses | `libs/components/src/molecules/image-lightbox/image-lightbox.test.tsx` |
| @s9 | dismisses when the system requests closing the modal | `libs/components/src/molecules/image-lightbox/image-lightbox.test.tsx` |
| @s12 | translates `player.slideImage.*` away from the English placeholder | `libs/localization/src/coverage/player-locale-parity.test.ts` |

- @s12 Red: added the two locale-parity keys; failed as undefined.
- @s12 Green: added en/es/pt/de slide-image translations.
- @s6 Red: added contained-lightbox assertion; failed on missing module.
- @s6 Green: added controlled transparent fade `Modal` with contained image.
- @s7 Red: added close-control callback assertion; failed on missing accessible control.
- @s7 Green: composed `IconButton` with the caller-provided close label.
- @s8 Red: added backdrop and image press assertions; failed on missing backdrop target.
- @s8 Green: added scrim dismissal and stopped propagation inside content.
- @s9 Red: system-close via `fireEvent(..., 'requestClose')` on modal `testID`; failed under RN mock / direct fn call.
- @s9 Green: dropped `jest.mock('react-native')`; wired real `Modal` `onRequestClose`; Image uses `accessibilityLabel` (SlideImage pattern); await RNTL14 `fireEvent`.
- @s9 Refactor: no adapter wrapper.
- Slice-2 review fix: @s9 exercises Modal `requestClose` (not a direct jest.fn call).
- Gate: components biome + check-types + image-lightbox unit tests pass.
- Full components e2e has unrelated existing atoms failures; full-repo lint skipped for pre-existing study-buddy format debt.
- task-2 + task-3: done.

## Slice 3

| Scenario | Test | File |
| --- | --- | --- |
| @s3 | caps and centers the image with its expand overlay at the readable content width | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s10 | shows a localized expand control when the image url is ready | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s4 | renders nothing when there is no image | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s5 | renders nothing when the image ref fails to resolve | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |
| @s6, @s11 | opens and closes the lightbox from the image controls | `libs/activities/src/organisms/slide-image/slide-image.test.tsx` |

- @s3, @s10 Red: localized expand-control assertion failed; Green: composed `IconButton`.
- @s4, @s5: extended silent-degrade tests to assert no expand control or lightbox.
- @s6, @s11 Red: expand-to-lightbox integration failed; Green: added controlled `useState` lightbox wiring.
- E2E: `WithImage` opens and dismisses the Storybook lightbox.
- Gate: activities biome, types, unit suite, and scoped e2e pass.
- Full-repo lint skipped — existing study-buddy format debt, out of scope.
- task-4: done.
- Slice-3 review fix @s1, @s3 Red: asserted a shared capped positioned wrapper; failed as missing.
- Slice-3 review fix @s1, @s3 Green: constrained image and overlay in the same centered wrapper.
- Slice-3 review fix tdd: aligned @s1/@s3 map to the overlay test name; split @s10 to the visibility test.
