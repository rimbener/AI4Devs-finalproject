# DESIGN.md — AI Study Buddy brand & design system

Canonical design reference for any agent touching UI, copy, or design tokens. Source: **Claude Design** project ["AI Study Buddy Design System"](https://claude.ai/design/p/be7e10e0-8f41-465e-9f48-9162079c0f9c) (`project_id be7e10e0-8f41-465e-9f48-9162079c0f9c`) — read that project directly (`mcp__claude-design__read_file`/`list_files`) for full component source, `@dsCard` guideline specimens, and the `ui_kits/study-app` click-through when more detail is needed than this summary carries.

Foundation: **Material Design 3**. Palette **"Study Buddy"** (adopted from the brand logo). Fonts **Sora** (display/headline/title) + **IBM Plex Sans** (body/label) + IBM Plex Mono (code/data). Signature motif: the **alternating lesson/activity rhythm** — blue = instructional slide, orange = activity slide — encoded in `SlideProgress`.

## Already ported into this repo — reuse, don't re-derive

The design system's tokens and MD3 component set are already implemented here. **Never hardcode a color/spacing/radius/shadow value** — import from these:

| Design system | Repo |
|---|---|
| `tokens/colors.css` (oklch tonal ramps) | `libs/components/src/theme/colors.ts` (hex-converted `palette`) |
| `tokens/typography.css` | `libs/components/src/theme/typography.ts` |
| `tokens/spacing.css` | `libs/components/src/theme/spacing.ts` |
| `tokens/shape.css` | `libs/components/src/theme/shape.ts` |
| `tokens/elevation.css` | `libs/components/src/theme/elevation.ts` |
| `tokens/motion.css` | `libs/components/src/theme/motion.ts` |
| `components/atoms/*` (Icon, Button, IconButton, Fab, Checkbox, Switch, Chip, Badge, ProgressIndicator, Card) | `libs/components/src/atoms/*` |
| `components/molecules/*` (TextField, RadioGroup, AnswerOption, SlideProgress) | `libs/components/src/molecules/*` |
| `components/organisms/Dialog` | `libs/components/src/organisms/dialog` |

The repo has since added product-specific molecules/organisms beyond the design system's authored set (e.g. `lesson-list-item`, `pdf-document-list`, `web-bottom-tabs`, `account-menu`) — build new ones the same MD3 way: compose from `libs/components/src/theme` tokens and existing atoms, never introduce a new color/radius/type value ad hoc. See `.agents/rules/atomic-design.mdc` for layer placement.

## Colors — "Study Buddy" (adopted from the logo)

| Name | Hex | Role |
|---|---|---|
| Royal Blue | `#002C5D` | **Primary** — key actions, active states, hero/focus backgrounds |
| Azure Cyan | `#0090D8` | **Secondary** — book pages, info accents |
| Orange | `#F09030` | **Tertiary** accent — FABs, "correct" state, activity-slide markers, ≤10% of any screen |
| Red-Orange | `#F06018` | Warm hi-viz accent (book outline) |
| Gold | `#F0D860` | Brand wordmark highlight |
| Warm Off-White | `#F2EFE9` | Neutral app canvas |
| White | `#FFFFFF` | Raised cards & sheets |

Full tonal ramps + semantic roles (`--md-primary`, `--md-surface`, …) and a dark scheme live in `tokens/colors.css` / `libs/components/src/theme/colors.ts`. This palette is adopted directly from the brand logo (previously the system committed to a separate "Slate & Rust" palette that didn't match the logo — that mismatch is now resolved in favor of the logo's colors) and the logo sits unmodified on its native Royal Blue tile.

## Voice & content

- Address the learner as **"you"**; the app is **"we"** when it acts ("we'll build your lesson"). Avoid "I".
- **Sentence case** everywhere in UI — headings, buttons, menu items. Never Title Case.
- Warm, encouraging coach — never a stern instructor. Plain, concrete, short; prefer verbs.
- Quiz feedback: verdict first, then the *why* in one line — "Correct — chloroplasts contain chlorophyll, which captures the light energy…"
- Numbers/data stay factual and compact ("Biology · 14 slides", "2 of 2 correct") — never invented stats.
- Emoji: **very sparing**, a single 🎉 max at a completion/results moment; never as icons or in buttons/nav — iconography is Material Symbols, not emoji.
- Action-first, specific labels: "Generate lesson", "Check answer", "Review lesson again" — avoid vague "Submit"/"OK".

This governs the *copy itself*; user-facing strings still go through `t('ns.key')` per `.agents/rules/i18n.mdc` — voice rules apply to the string values, not the mechanism.

## Visual foundations

- **Backgrounds:** flat color only — no gradients, photographic heroes, textures. Canvas is Warm Off-White; raised surfaces step lighter via `--md-surface-container-*`. Full-bleed Royal Blue is reserved for hero/focus moments (generating screen, splash), where the logomark sits on its native navy tile.
- **Corner radii:** buttons fully rounded pills (999px); cards 12px; dialogs/sheets 28px; text fields 4px (filled, top corners); chips 8px; FAB 16px.
- **Cards:** elevated (default: surface-container-low + elevation-1) · filled (surface-container-highest, no shadow) · outlined (1px outline-variant, no shadow). No colored left-border accents except the deliberate lesson "key term" callout (4px rust left border).
- **Elevation:** MD3 5-level, neutral slate-tinted, two-layer (ambient + key). Most surfaces 0–1; FABs/dialogs 3; menus 2.
- **State layers:** translucent wash of content color — hover 8%, focus 12%, press 12%, drag 16%. Buttons/icon buttons/chips/cards all use this instead of swapping color; no color inversion on hover, no shrink/scale on press.
- **Motion:** emphasized-decelerate for content entering; emphasized for answer-feedback pops; standard for utility fades. 150–400ms UI, up to 500–700ms hero slide transitions. No infinite decorative loops; no bounce on utility controls; respect `prefers-reduced-motion`.
- **Layout:** 4px base grid; 24px page margins; 16px gutters; content columns capped ~560–640px for lesson text. Fixed top app bar (64px) + lesson footer nav + always-visible `SlideProgress` tracker under the app bar. One FAB per screen, bottom-right.
- **Iconography:** Material Symbols Rounded only, via the `Icon` component — no emoji-as-icons, no hand-rolled SVGs. Default outlined; `fill` for selected/active/"correct" states.

## Using this file

- **implementer** (and any agent writing UI): reuse `libs/components/src/theme` tokens and existing atoms/molecules/organisms per the table above; apply the voice rules to any new user-facing copy before it goes into a `t()` key; never hardcode colors/spacing/radii (already enforced by `.agents/rules/atomic-design.mdc` and the per-slice gate).
- **spec_partner**: when a story is UI-facing, resolve copy/microcopy decisions against the voice rules here instead of inventing tone ad hoc; note the 4 UI states in the spec per existing convention.
- **reviewer_slice**: the Design/UI lens checks the diff against this file (palette, type pairing, radii, motion, iconography, voice/copy) in addition to any provided screenshot/spec — cite `[design]` findings against the specific rule violated here.
