# Findings: e2e.mdc

## Summary
Hard Matching e2e violations fixed 2026-07-31. Asserts now prove pending/pair/release via state-suffixed testIDs. Activities Storybook also mocks `expo-router/ui` so Matching stories load.

## Violations
_None._

## Fixed
- Matching pair-form / pair-release e2e — assert `matching-item-<id>--pending|paired|idle` (+ Submit disabled after one pair).
- `matching.tsx` — `testID={`matching-item-${id}--${state ?? 'idle'}`}` (RNW omits aria-selected/checked).
- `activities/.storybook` — `expo-router/ui` mock (components barrel).

## Observations (still open / ambiguous)
- `sign-out.e2e.js` confirm vs cancel same dialog-closed surface.
- `account-menu.e2e.js` hardcodes local `data-testid` (Storybook-local OK vs app test-ids).
