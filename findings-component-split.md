# Findings: component-split.mdc

## Summary
Exported types moved out of helpers into `*.types.ts` (2026-07-31). No remaining violations from this findings pass.

## Violations
_None._

## Fixed
- `PaneSize` → `slide-image.types.ts`
- `GenerationErrorRecovery` → `lesson-generation.types.ts`
- `IndeterminateTiming` → `progress-indicator.types.ts`

## Observations (non-violations / ambiguous)
- `text-field.tsx` — Props + focus `useState` in one file; presentational chrome may stay.
- Activity organisms re-export `XProps` from tsx — soft reading of “don’t export types from the component.”
- `lesson-player` Deck keeps layout `availableHeight` `useState` in tsx — borderline presentational.
