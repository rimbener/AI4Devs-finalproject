# Findings: tdd.mdc

## Summary
Hard finding fixed 2026-07-31: LoginForm Storybook e2e added. Unblocked by dual ESM/CJS `test-ids` + logging-in-out Storybook `expo-router/ui` mock.

## Violations
_None._

## Fixed
- `libs/logging-in-out/tests/e2e/organisms/login-form/login-form.e2e.js` — interaction-only (enable submit; Error stays editable; inline errors keep submit disabled).
- Dual `test-ids.js` (ESM) + `test-ids.cjs` (Playwright require) for components/activities/logging-in-out/study-buddy.
- `logging-in-out/.storybook` aliases `expo-router/ui` (same mock as components) so barrel pull of WebBottomTabs doesn't crash stories.
