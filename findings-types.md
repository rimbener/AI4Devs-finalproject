# Findings: types.mdc

## Summary
Hard multi-file / export-surface violations fixed 2026-07-31. Soft “prefer inference” on hook/service/DAO return annotations left deferred (systematic, Prefer not Must).

## Violations
_None remaining (hard)._

## Fixed
- `RadioOption` / `RadioGroupProps` → `radio-group.types.ts` (+ barrel `export type *`)
- `RawProviderRow` (+ nested model row) → `ai-providers.types.ts`; DAO/service import from there
- `PaneSize` — already in `slide-image.types.ts` (prior commit)
- Removed `export type { …Props }` re-exports from activity/study-buddy component `.tsx`; barrels export `*.types.ts` (added `lesson-results.types.ts`)

## Deferred
### Explicit return types on hooks / services / DAOs
- **Rule:** Prefer inference for return types.
- **Where:** Widespread `: Use…Result` / `: Promise<…>` on hooks/services/DAOs.
- **Why:** Soft Prefer; large mechanical sweep — not done in this pass.

## Observations
- Simple single-file atoms/molecules with local Props OK until another module imports the type.
- `libs/types/src/*` runtime companions more `global.mdc` than `types.mdc`.
