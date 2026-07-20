# Risks — activity-image-sizing

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | RN `Modal` behaves differently on web vs native (backdrop, `onRequestClose`, Esc) — dismiss paths may not all fire everywhere | technical | M | M | Mirror the proven `Dialog` pattern (transparent `Modal` + `Pressable` scrim + `onRequestClose`); cover X / backdrop / back with separate scenarios (@s7–@s9) and unit tests; add a Storybook e2e for the rendered interaction. |
| R2 | Expand `IconButton` overlaid on the image could be missed by assistive tech or fail contrast against arbitrary image pixels | technical | M | M | Icon-only control gets a localized `accessibilityLabel` via `t()` (@s10); overlay uses a token-based scrim/backing behind the icon rather than sitting directly on raw pixels; a11y asserted in unit tests. |
| R3 | Missing/typo'd i18n keys in one of es/pt/de breaks compile parity (`TranslationResource`) or ships an English stub | technical | M | L | Add all four bundles together; extend `player-locale-parity.test.ts` to assert `player.slideImage.*` differs from the English base (@s12). |
| R4 | Overlaying the expand control changes `SlideImage` layout and could regress the existing silent-degrade behavior (no URL → nothing) | technical | L | M | Keep the early `return null` guard; gate the control + lightbox strictly on `url` (@s4, @s5); existing tests stay green. |
| R5 | Reintroducing `maxWidth 700` from the story text (superseded by the 640 token) | product | L | L | Spec records 640 as the resolved decision; story AC treated as superseded; reviewer checks the token is used, not a literal. |

## Dependencies
| Dependency | Status | Notes |
|---|---|---|
| `@helsoft/components` `IconButton` atom | available | `open_in_full` / `close` icons, `accessibilityLabel` prop already supported |
| `layout.contentReading` (640) token | available | `libs/components/src/theme/spacing.ts` |
| `@helsoft/localization` `useLocalization().t` | available | already a dep of `@helsoft/activities` |
| RN `Modal` | available | web + native, per `Dialog` precedent |
