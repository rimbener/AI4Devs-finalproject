# Findings: atomic-design.mdc

## Summary
Hard finding already fixed in-tree (`43f95a93a`): Card padding defaults to `theme.spacing.s4`. Findings file updated 2026-07-31.

## Violations
_None._

## Fixed
- `Card` — `padding ?? theme.spacing.s4` (was hardcoded `16`).

## Observations (non-violations / ambiguous)
- `image-lightbox` as molecule vs organism — reusable pattern OK.
- Some molecules use RN + theme only (no atom imports) — prefer atoms, not required.
- study-buddy flat `components/` OK for feature wiring; templates/pages stay out of shared lib.
- Hardcoded hex in tests only.
