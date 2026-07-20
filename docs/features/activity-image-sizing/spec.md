---
feature: activity-image-sizing
story: user-stories/in-progress/activity-image-sizing.md
status: approved
---

# Spec — activity-image-sizing

Cap lesson activity images at a readable max width (centered, scales down on narrow viewports) and add a dedicated expand control that opens the image in an in-app lightbox modal so learners can inspect detail without breaking the slide layout.

## User stories
- As a **learner**, I want **activity images capped at a readable width with a way to open them fullscreen**, so that **large images don't break the slide layout and I can still inspect details**.

## Acceptance criteria
→ **`gherkin-scenarios.md`** — each `@s` scenario is an acceptance criterion (Given/When/Then).

## UI states
| State | Trigger | Notes |
|---|---|---|
| Content | image ref + signed URL resolved | inline image `maxWidth: layout.contentReading` (640), horizontally centered, `resizeMode="contain"`; expand `IconButton` (`open_in_full`) overlaid top-end |
| Empty | no image ref, or URL unresolved | silent degrade — renders nothing; **no** expand control; lightbox can never open |
| Loading | URL not yet resolved | silent degrade (no skeleton); expand control appears only once URL is ready |
| Lightbox (open) | expand control pressed | RN `Modal`; image `resizeMode="contain"` full-screen over a scrim; close `IconButton` (`close`) top-end; dismiss via X, backdrop, or system back (`onRequestClose`) |

## Analytics events
None (locked decision).

## Feature flags
None (locked decision).

## Out of scope / non-goals
- Browser Fullscreen API; pinch-zoom / zoom / pan / download in the lightbox.
- Tap-image-to-open (dedicated control only).
- New signed-URL error / skeleton UI (keep existing silent degrade).
- `maxWidth: 700` — superseded by the 640 `layout.contentReading` token (see decisions).
- Analytics / feature flags.

## Open decisions (resolved, with rationale)
- **Inline max width = `layout.contentReading` (640), not the story's 700** — reuse the existing readable-column token instead of a new magic number; keeps images aligned with lesson text width. Image is horizontally centered and still `width: 100%` so it scales down below 640.
- **Dedicated expand control, overlaid top-end on the image** — discoverable and explicit; avoids ambiguous tap-image gestures and accidental opens while scrolling.
- **In-app lightbox via RN `Modal`** — one implementation works on web + native where the player runs; the browser Fullscreen API is web-only and out of scope.
- **Dismiss = X + backdrop + system back (`onRequestClose`)** — covers all three platforms' expectations (Android back, web Esc, touch backdrop) with one prop.
- **New `ImageLightbox` molecule in `@helsoft/components`; `SlideImage` (`@helsoft/activities`) composes it** — the lightbox is generic, reusable presentation (atomic-design molecule); `SlideImage` owns the activity-specific wiring. `Dialog` was rejected as a base — wrong fit (headline/actions, `maxWidth: 420` surface).
- **Silent degrade unchanged** — no URL → nothing; expand control only when URL ready; lightbox never opens without a URL. Avoids adding error/skeleton surfaces (out of scope).
- **i18n: `player.slideImage.expand` + `player.slideImage.close` in en/es/pt/de, resolved with `t()` inline** — icon-only `IconButton`s need accessible labels; follows `.agents/rules/i18n.mdc` (no hardcoded strings, no `labels` object).
