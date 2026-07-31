# Findings: global.mdc

## Summary
Clean on the Storybook-port violation. Soft smells (file length / comment trim) left alone — remaining bulk is StyleSheet / reducer wiring, not comment bloat.

## Fixed
### Storybook ports wrong
- **Was:** components 6011 / activities 6010 / logging-in-out 6012.
- **Now:** `21604d4bd` — components **6007**, study-buddy **6008**, activities **6009**, logging-in-out **6010** (`dev` + Playwright `webServer` URLs).

## Observations (non-violations / ambiguous)
- **Extra libs** localization / pdf-upload-extraction — fine as `@helsoft/*`.
- **File length smell (>200)** — `matching.tsx` / `lesson-player.tsx` mostly styles; `use-card-list-with-abm-dialog.ts` now ~182. Comment-only shrink wouldn't move the needle.
- **study-buddy port** — already 6008 (matches AGENTS.md).
