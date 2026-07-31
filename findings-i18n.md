# Findings: i18n.mdc

## Summary
Hard finding fixed 2026-07-31: SlideProgress a11y labels go through `t()`.

## Violations
_None._

## Fixed
- `SlideProgress` — `player.progress.lesson` / `player.progress.activity` (+ `{{n}}`) in en/es/pt/de; `useLocalization().t()` at the Pressable.
