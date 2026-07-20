---
id: task-3
title: Build ImageLightbox molecule in @helsoft/components
slice: 2
scenarios: [s6, s7, s8, s9]
status: done
paths:
  - libs/components/src/molecules/image-lightbox/image-lightbox.tsx
  - libs/components/src/molecules/image-lightbox/image-lightbox.types.ts
  - libs/components/src/molecules/image-lightbox/image-lightbox.stories.tsx
  - libs/components/src/molecules/image-lightbox/image-lightbox.test.tsx
  - libs/components/src/molecules/index.ts
---

## Goal
Create a generic, controlled `ImageLightbox` molecule: an RN `Modal` (transparent, `animationType="fade"`, `onRequestClose`) rendering a token-based scrim, the image `resizeMode="contain"` sized to the screen, and a close `IconButton` (`close`) overlaid top-end. Controlled via `visible` + `onRequestClose`; dismiss on X, backdrop `Pressable`, and system back. No zoom/pan/download. Close accessible label comes from the caller (prop) — the molecule is copy-agnostic, so the *localized* close-label guarantee (@s11) is verified in `task-4` where `t()` resolves; here the label is only proven to pass through to the close control.

## Done criteria
- [ ] Scenarios s6, s7, s8, s9 covered by unit tests (image contained; X / backdrop / back all call `onRequestClose`); the close control exposes the `closeLabel` prop passed to it (pass-through only — localized value asserted in task-4/@s11)
- [ ] Molecule composes the `IconButton` atom + `Image` + `Modal` (atomic-design; molecule never owns page layout)
- [ ] Props typed in `image-lightbox.types.ts` (`ImageLightboxProps`): `visible`, `source`/`uri`, `alt`, `closeLabel`, `onRequestClose` (no JSX → `.ts`)
- [ ] Backdrop tap dismisses but taps on the image do not (`stopPropagation`, per `Dialog` precedent)
- [ ] Co-located `image-lightbox.stories.tsx` covers open state (Content) — no hardcoded colors/spacing (tokens only)
- [ ] Exported from `molecules/index.ts` (component + `type *` for types)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Reference pattern only (do not extend): `libs/components/src/organisms/dialog/dialog.tsx` (`Modal` + `Pressable` scrim + `onRequestClose`). `Dialog` itself is the wrong fit (headline/actions, `maxWidth: 420`).
- Molecule is copy-agnostic: labels are passed in (SlideImage resolves them via `t()` in task-4).
- Simple controlled molecule → single `.tsx` (+ types/stories/test); no `use-*` hook needed per component-split.
