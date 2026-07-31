# Findings: state.mdc

## Summary
Clean. Matching pairing machine now one `useReducer` (`pending` / `formedPairs` / `answer`) in `use-matching.reducer.ts`. Other activity hooks stay at 2 related fields (`useState` ok). No Redux.

## Fixed
### Matching: 3 related fields → `useReducer`
- **Was:** `answer` in `matching.tsx` + `pending`/`formedPairs` in `use-matching.ts` (split under-threshold per file).
- **Now:** `libs/activities/src/organisms/matching/use-matching.reducer.ts` — actions `item/press`, `submit`; hook owns state; component dispatches only.
