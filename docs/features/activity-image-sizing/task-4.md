---
id: task-4
title: Wire SlideImage expand control + lightbox open/close + a11y
slice: 3
scenarios: [s3, s4, s5, s6, s10, s11]
status: todo
paths:
  - libs/activities/src/organisms/slide-image/slide-image.tsx
  - libs/activities/src/organisms/slide-image/slide-image.test.tsx
  - libs/activities/src/organisms/slide-image/slide-image.stories.tsx
  - libs/activities/tests/e2e/organisms/slide-image/slide-image.e2e.js
---

## Goal
Compose `ImageLightbox` into `SlideImage`: overlay an expand `IconButton` (`open_in_full`) top-end on the inline image (only when `url` is ready), hold local `open` state (single boolean → `useState`), open the lightbox on expand press, and close it via the lightbox's dismiss paths. Resolve both accessible labels inline with `useLocalization().t` — `player.slideImage.expand` on the expand control, `player.slideImage.close` passed to the lightbox. Preserve silent degrade: no control and no openable lightbox when there is no url.

## Done criteria
- [ ] Scenarios s3, s4, s5, s10, s11 covered by unit tests; s6 integration (expand press → lightbox visible; dismiss → hidden)
- [ ] Expand control rendered only when `url` is truthy (@s3); absent when no image / unresolved url (@s4, @s5)
- [ ] Lightbox never opens without a url (@s5)
- [ ] Expand control `accessibilityLabel` = `t('player.slideImage.expand')` (@s10)
- [ ] In the real `SlideImage` composition, the close control's rendered `accessibilityLabel` equals `t('player.slideImage.close')` (passed to `ImageLightbox`), asserted by test (@s11)
- [ ] Local open state is a single `useState` boolean (below the `state.mdc` ≥3-field `useReducer` threshold); handlers stay in the component (component-split)
- [ ] `SlideImage` imports `ImageLightbox` + `IconButton` from `@helsoft/components`; `t` from `@helsoft/localization`
- [ ] Storybook e2e added per the `storybook-e2e-tests` skill (expand opens, close dismisses)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Layering: `SlideImage` (organism, `@helsoft/activities`) composes the `ImageLightbox` molecule (`@helsoft/components`) — no new hook/service/DAO; URL still comes from `useSlideImageUrl`.
- Overlay control positioned top-end over the image without disturbing the inline-sizing from task-1.
- e2e follows `.claude/skills/storybook-e2e-tests/SKILL.md`; `@helsoft/activities` has Playwright per AGENTS.md.
