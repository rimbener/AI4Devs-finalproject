# E2E testing for app-study-buddy — Phase 1: Web (full golden path)

> This is Phase 1 of a 2-phase plan. Phase 2 (Maestro, Android + iOS) lives in a separate file: `e2e-testing-phase2-mobile.md`, and is independent — it can start any time after this phase lands, since it reuses everything instrumented here (testIDs, fixture PDF) without changes.

## Context

`apps/app-study-buddy` (Expo SDK 57, Expo Router, RN 0.86) has no E2E coverage of its own today. The repo already runs Playwright E2E against **Storybook** in `libs/{components,activities,study-buddy,logging-in-out,lib-with-storybook}` (see `E2E_TESTS.md`, `.agents/rules/e2e.mdc`, `.agents/skills/storybook-e2e-tests/`), but that setup targets Storybook's iframe preview, not a live running app — it doesn't extend to `apps/app-study-buddy`. There is also no CI (`.github/workflows`) yet.

Goal of this phase: stand up a first, minimal **golden-path** E2E suite (login → upload PDF → generate lesson → play a lesson mixing instructional + activity slides → see results) running locally on **web only**, using Playwright — this repo's proven E2E tool. Mobile (Maestro, Android/iOS) is deliberately split into a separate, independent phase 2, since it introduces its own tool and its own hard problem (native file-picker automation) that shouldn't gate getting web coverage in place.

Decisions made with the user:
- **Playwright** for web (reuses this repo's proven tool/conventions).
- **Local-only for now** — no GitHub Actions in this pass.
- **testID-based selectors** — `react-native-web` renders `testID` as `data-testid`, which Playwright's `getByTestId()` reads by default. This is a deliberate departure from the Storybook e2e convention (which uses text locators inside an iframe) because a real app screen needs stable, locale-independent selectors. Choosing testID now (rather than text) also means **zero rework needed in Phase 2** — Maestro matches `testID` directly too (exposed as the native accessibility id on iOS/Android).
- **Golden path only** — sign-up is out of scope; `src/app/(auth)/sign-up.tsx` is a stub with no real form. Login uses the seeded `test@paid.com` / `test123` account from `supabase/seed.sql` (plan `use_platform_key = true` → `canCreate` true, so generation isn't blocked by `ApiKeyGate`).

Key technical fact grounding this plan: **`Button` and `IconButton` in `libs/components/src/atoms/` currently have no `testID` prop at all** (confirmed by reading both files) and don't forward one to their underlying `Pressable`. Since nearly every golden-path action (login submit, choose file, continue, generate, open-in-player, nav back/next, activity submit buttons, retake/back-home) goes through one of these two atoms, adding `testID?: string` to both is the single highest-leverage change and must happen before any test can be written. `TextField` already supports `testID` (it spreads RN `TextInputProps`, which includes `testID`) — only call sites need to pass it.

## Implementation order (vertical slices)

### Slice 1 — testID instrumentation (additive only)

Add `testID?: string` (default `undefined`) and forward it to the underlying `Pressable`/`TextInput` — pure prop additions, cannot break existing RTL tests that query by role/label/text. Do the full set now (not just what web needs) since Phase 2 depends on it and re-touching these files twice would be wasteful.

- `libs/components/src/atoms/button/button.tsx` — add `testID` to `ButtonProps`, pass to `Pressable`.
- `libs/components/src/atoms/icon-button/icon-button.tsx` — same.
- `libs/components/src/molecules/answer-option/answer-option.tsx` — same (used by MultipleChoice options).
- Thread `testID` through call sites needed for the golden path:
  - `libs/logging-in-out/src/organisms/login-form/login-form.tsx`: email field, password field, submit button.
  - `libs/components/.../pdf-upload-panel/pdf-upload-panel.tsx`: "Choose file" button, "Continue" button.
  - `libs/components/.../pdf-document-list-item/pdf-document-list-item.tsx`: the status-driven action button (generate/retry/open).
  - `libs/components/.../lesson-generation-panel/.../lesson-generation-panel-content.tsx`: "Open in player" button.
  - `libs/components/.../results-summary/results-summary.tsx`: "Retake" and "Back home" buttons.
  - `libs/activities/.../lesson-player-navigator/lesson-player-navigator.tsx`: back/next `IconButton`s (these are conditionally *rendered*, not just disabled — tests assert presence/absence).
  - `libs/activities/.../multiple-choice/multiple-choice.tsx`: each `AnswerOption`, submit button.
  - `libs/activities/.../flashcard/flashcard.tsx`: reveal button, the two self-mark `Pressable`s (already inside the existing `flashcard-self-mark` container).
- Run `pnpm --filter <each touched lib> test` after each file to confirm existing Jest/RTL suites stay green.

### Slice 2 — Playwright web golden path

- New `apps/app-study-buddy/playwright.config.js`, same shape as `libs/components/playwright.config.js` but: `webServer.command: 'pnpm web'` (i.e. `expo start --web`), `url`/`baseURL: 'http://localhost:8081'` (Expo web's default port — confirmed via `apps/app-study-buddy/package.json`'s `web` script, distinct from the `dev` script's Metro port 8091), single `chromium` project. Do **not** add `@playwright/test` to this package's `package.json` — it's already a shared root devDependency.
- package.json scripts (mirror the libs pattern): `test:e2e`, `test:e2e:ui`, `test:e2e:report`.
- Fixture PDF at `apps/app-study-buddy/tests/fixtures/golden-path.pdf` (small, multi-page, at least one embeddable image). This same file is reused as-is by Phase 2.
- File-input handling: `expo-document-picker`'s web implementation dynamically creates/removes a bare `<input type="file">` with no `data-testid` on every call — it can't be targeted via `getByTestId`. Click "Choose file", then immediately target `page.locator('input[type="file"]')` and call `.setInputFiles(fixturePath)` directly (works regardless of whether the synthetic click actually opens a native chooser). Treat `page.waitForEvent('filechooser')` as a fallback to try, not the primary plan.
- Test files under `apps/app-study-buddy/tests/e2e/` (`.e2e.js`, matching repo convention) — recommend splitting into `login.e2e.js`, `pdf-upload-and-generate.e2e.js`, `lesson-player.e2e.js` sharing a login/upload helper, rather than one monolithic file, so failures localize. Each step drives a real interaction and asserts the resulting state change (same "interaction-only" philosophy as `.agents/rules/e2e.mdc`), e.g.:
  1. Fill login fields, submit, wait for the post-login screen (no explicit navigation to assert — `Stack.Protected` in `src/app/_layout.tsx` swaps automatically on auth state change).
  2. Choose file → set fixture PDF → wait for extraction Content state → Continue.
  3. Locate the new row, press Generate, wait through the generation stepper (`GENERATION_STEP_INTERVAL_MS = 4000ms` — use a generous polling assertion, not a fixed sleep) → Open in player.
  4. On the player: assert `LESSON_PLAYER_TEST_ID`, drive one instructional/Flashcard slide (reveal → self-mark) and one MultipleChoice slide (select → submit → assert correct/incorrect state) via the nav-next button.
  5. Reach results, press Back home, assert return to the list.

### Slice 3 — Local Supabase dependency & determinism

- The suite requires `npx supabase start` (and at least one `npx supabase db reset` to guarantee the seeded `test@paid.com`/`test123` account exists) — document as a hard prerequisite alongside the new scripts.
- Re-running the golden path with the same fixture inserts a new `pdf_documents`/`lessons` row each time (no uniqueness constraint) — row locators by filename become ambiguous after the second run. Document `npx supabase db reset` as the standard pre-run step for a clean slate (simplest, matches existing docs' own reset pattern); note "match the most-recently-created row" as a possible later optimization if reset-per-run proves too slow.

### Slice 4 — Documentation

- Extend `E2E_TESTS.md` with a new "App-level E2E (app-study-buddy)" section (distinct `testDir`, live-app target instead of Storybook iframe, Supabase prerequisite) — leave the existing Storybook section untouched. Frame it as web-only for now, with a note that mobile coverage is tracked separately (Phase 2).
- Add a new skill `.agents/skills/app-e2e-tests/SKILL.md` (testID-first convention, fixture location, Playwright web conventions) and a sibling rule `.agents/rules/app-e2e.mdc` scoped to `apps/*/tests/e2e/**`, referencing rather than duplicating `.agents/rules/e2e.mdc`'s interaction-only philosophy. Write these so Phase 2 can extend them (add a Maestro section) rather than replace them.

**No `turbo.json` task added** — matches existing precedent of invoking e2e directly via `pnpm --filter app-study-buddy test:e2e`, not through turbo's pipeline.

## Critical files

- `libs/components/src/atoms/button/button.tsx`, `libs/components/src/atoms/icon-button/icon-button.tsx`, `libs/components/src/molecules/answer-option/answer-option.tsx` — testID plumbing.
- `libs/logging-in-out/src/organisms/login-form/login-form.tsx`
- `libs/activities/src/organisms/lesson-player/lesson-player-navigator.tsx`, `multiple-choice/multiple-choice.tsx`, `flashcard/flashcard.tsx`
- `libs/components/src/organisms/pdf-upload-panel/pdf-upload-panel.tsx`, `pdf-document-list-item/pdf-document-list-item.tsx`, `lesson-generation-panel/.../lesson-generation-panel-content.tsx`, `results-summary/results-summary.tsx`
- `apps/app-study-buddy/package.json` (new scripts), new `apps/app-study-buddy/playwright.config.js`
- `libs/components/playwright.config.js` (pattern to adapt), `E2E_TESTS.md` (doc to extend)
- `supabase/seed.sql` (seeded test account reference)

## Verification

1. After Slice 1: `pnpm --filter @helsoft/components test`, `pnpm --filter @helsoft/logging-in-out test`, `pnpm --filter @helsoft/activities test` — all existing suites stay green.
2. After Slice 2: `npx supabase start` (+ `db reset` once), `pnpm --filter app-study-buddy test:e2e` runs the web golden path headless and green.
3. Manual sanity: run the suite twice in a row post-`db reset` to confirm no locator ambiguity from accumulated rows.
4. Run `pnpm bootstrap` in the root of the repo to confirm all packages build and all tests pass.