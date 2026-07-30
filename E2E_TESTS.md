# E2E Tests with Playwright

This project uses [Playwright](https://playwright.dev) for end-to-end testing of Storybook components, and (separately, see below) of the live `app-study-buddy` app. Storybook tests live in each workspace's `tests/e2e/` folder, mirroring the `src/` path of the component/story they cover, using the `*.e2e.js` naming convention.

## Setup

Playwright is installed at the root level as a shared devDependency.

```bash
pnpm install
```

## Running Tests

### From workspace directory (recommended)
```bash
cd libs/components && pnpm test:e2e
cd libs/lib-with-storybook && pnpm test:e2e
```

### From monorepo root using pnpm filter
```bash
pnpm --filter @helsoft/components test:e2e
pnpm --filter @helsoft/lib-with-storybook test:e2e
```

### Watch mode
```bash
cd libs/components && npx playwright test --watch
```

### UI mode (interactive testing dashboard)
```bash
cd libs/components && npx playwright test --ui
```

### Specific browser
```bash
cd libs/components && npx playwright test --project=chromium
```

### View test report
```bash
cd libs/components && npx playwright show-report
```

## Test Structure

Tests live under each workspace's `tests/e2e/` folder, mirroring the component's path under `src/`, using the `.e2e.js` naming suffix. For example:

**Components library:**
- `libs/components/tests/e2e/atoms/card/card.e2e.js` — Card component tests
- `libs/components/tests/e2e/molecules/slide-progress/slide-progress.e2e.js` — SlideProgress tests
- `libs/components/tests/e2e/molecules/text-field/text-field.e2e.js` — TextField tests

**Lib-with-Storybook:**
- `libs/lib-with-storybook/tests/e2e/stories/button/button.e2e.js` — Button component tests

Each Playwright config discovers tests matching `**/*.e2e.js` in the `tests/e2e/` directory.

## Writing Tests

Create a `{component}.e2e.js` file under `tests/e2e/`, at the same relative path as the component's story file under `src/` (e.g. `src/atoms/card/card.stories.tsx` → `tests/e2e/atoms/card/card.e2e.js`). Tests access Storybook stories via URL patterns. Stories are rendered inside an iframe, so use `frameLocator()` to access them:

```javascript
const { test, expect } = require('@playwright/test');

test('Button renders', async ({ page }) => {
  await page.goto('/?path=/story/example-button--primary');
  
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');
  const button = canvas.locator('button');
  
  await expect(button).toBeVisible();
  await expect(button).toContainText('Button');
});
```

**File naming:** `{ComponentName}.e2e.js`  
**Location:** `tests/e2e/`, mirroring the component's path under `src/`

## Configuration

Each workspace has its own `playwright.config.js`:
- **Components** (`libs/components/playwright.config.js`):
  - Discovers: `tests/e2e/**/*.e2e.js`
  - Port: 6007
- **Lib-with-Storybook** (`libs/lib-with-storybook/playwright.config.js`):
  - Discovers: `tests/e2e/**/*.e2e.js`
  - Port: 6006

Both auto-start Storybook on `pnpm dev`.

## CI/CD

In CI environments (when `process.env.CI` is set), tests run with:
- 2 retries for flaky tests
- 1 worker (serial execution)
- Fresh servers (no reuse of existing servers)

## Test Results

After running tests, artifacts are saved in each workspace:
- `test-results/` — detailed test results and traces
- `playwright-report/` — HTML report with screenshots/videos on failure

View with:
```bash
npx playwright show-report
```

## App-level E2E (app-study-buddy)

Separate from the Storybook e2e above: `apps/app-study-buddy` has its own Playwright suite targeting the **live running app** (Expo web), not a Storybook iframe preview. Currently **web-only** — mobile (Maestro, Android/iOS) is a separate, independent phase tracked in `docs/plans/e2e-testing-phase2-mobile.md`.

- **Config:** `apps/app-study-buddy/playwright.config.js` — `testDir: './tests/e2e'`, `webServer.command: 'pnpm web'` (`expo start --web`), `baseURL: 'http://localhost:8081'`, single `chromium` project, `workers: 1` (the suite shares one Supabase-backed account/dataset — see Determinism below).
- **Tests:** `apps/app-study-buddy/tests/e2e/{login,pdf-upload-and-generate,lesson-player}.e2e.js`, sharing a `tests/e2e/helpers/golden-path.js` helper (login, file-choose+extract, generate, open-in-player). Same interaction-only philosophy as `.agents/rules/e2e.mdc`: see `.agents/rules/app-e2e.mdc` and the `app-e2e-tests` skill for the app-specific conventions.
- **Selectors:** testID-based — `react-native-web` renders RN's `testID` prop as `data-testid`, which Playwright's `getByTestId()` reads by default. This is a deliberate departure from the Storybook e2e convention above (which locates by text inside an iframe): a real app screen needs stable, locale-independent selectors, and testID also carries over to Phase 2's Maestro suite unchanged (it matches `testID` directly as the native accessibility id).
- **testID strings live in the same lib as the component:** a lib with e2e-visible testIDs exports them at its own `@helsoft/{lib}/test-ids` subpath (`libs/{lib}/src/test-ids.js`) — e.g. `@helsoft/components/test-ids`, `@helsoft/activities/test-ids`, `@helsoft/logging-in-out/test-ids`, `@helsoft/study-buddy/test-ids`. Both the component (TypeScript, self-referencing package import) and these Playwright tests (plain Node `require()`) read the exact same named constant/function from that one subpath, so a testID string is declared exactly once. Each `src/test-ids.js` is plain CommonJS (`module.exports` + a hand-written `src/test-ids.d.ts`) rather than this repo's usual ESM `export` — every other `@helsoft/*` module is raw TS consumed directly by a bundler with no build step, but this one file also has to be `require()`-able from vanilla Node with zero transform (confirmed empirically: requiring a lib's TS entry point directly from Node throws a `SyntaxError` on the first `import type`/JSX), and CJS + a `.d.ts` is the one format both sides can read as-is. `package.json`'s `exports` map routes the subpath to that pair; an app or lib whose e2e tests need another lib's testIDs (but that doesn't otherwise depend on it) adds it as a plain workspace `devDependency` so its `node_modules` has the symlink (see `apps/app-study-buddy/package.json`'s `@helsoft/logging-in-out` entry).
- **Fixture:** `apps/app-study-buddy/tests/fixtures/golden-path.pdf` — a small, generated, multi-page PDF with embedded images (see the lib's `build-solid-png`/`build-test-pdf` pattern in `libs/pdf-upload-extraction`). Reused as-is by Phase 2.
- **File picker:** `expo-document-picker`'s web implementation creates a hidden `<input type="file">` and calls `.click()` on it from within a real user gesture — Chromium therefore treats it as a genuine native file-chooser open (auto-cancelled almost instantly in headless mode), **not** a plain toggleable `<input>`. `page.locator('input[type="file"]').setInputFiles(...)` loses that race essentially every time. Always intercept the chooser directly instead: `const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), triggerButton.click()]); await fileChooser.setFiles(path);` (see `chooseFileAndExtract` in the shared helper).
- **AI generation is mocked, not real** — see "Mocked: AI lesson generation" below. Everything else (login, PDF upload/extraction) is real, local, and free.

### Prerequisites — local Supabase

The suite drives real login and real PDF extraction (local mupdf, no external cost) against a local Supabase stack — there is no mocking layer for those.

```bash
npx supabase start        # once per machine session
npx supabase db reset     # before each suite run — see Determinism below
```

Login uses the seeded `test@paid.com` / `test123` account (`supabase/seed.sql`, plan `use_platform_key = true` → `canCreate` true, so generation isn't gated by `ApiKeyGate`'s missing-key screen — irrelevant to whether generation itself is mocked, but still required for the upload affordance to render at all).

### Mocked: AI lesson generation

Real AI generation (Groq, via the edge function's `PLATFORM_GROQ_API_KEY`) costs money and is slow/occasionally flaky (provider latency, local edge-runtime cold starts) — none of which this suite should pay for just to test UI interaction. The shared helper's `mockLessonGeneration(page)` (used by `generateLesson`) intercepts, with `page.route()`, both real network calls generation triggers — **before** the real Groq-backed edge function is ever invoked:

1. `POST .../functions/v1/generate-lesson` → fulfilled instantly with a fixed, hand-authored deck (`buildMockLesson()`) instead of hitting Groq.
2. `GET .../rest/v1/lessons?...id=eq.<id>...` → the player screen re-fetches the lesson by id via a **separate** direct Postgres read (`LessonsDao.getLessonById`), not through the edge-function response — mocking only #1 would leave the player fetching a lesson that was never actually persisted. Only this by-id shape and the Home tab's saved-lessons list query are intercepted; every other `lessons`/other-table request `route.continue()`s through to the real local stack untouched.

Because the deck is fixed, `lesson-player.e2e.js` knows exactly which slide is the Flashcard and which is the MultipleChoice ahead of time (positions 1 and 3) — no need to search AI-generated content for an activity type, and no non-determinism from the model's output.

If a test genuinely needs to exercise the real Groq call (e.g. testing the edge function itself, not the app UI), that belongs in a different test suite (unit/integration tests against the edge function, or a manual smoke test) — not this Playwright suite.

### Determinism

Every extraction/upload inserts a new `documents` row (no uniqueness constraint on filename), and the row's status-driven action button is located by filename (`pdfDocumentListItemActionTestId`) — a second upload of the same filename makes that locator ambiguous. `npx supabase db reset` before a run gives a clean slate; the shared helper's `stageFixtureCopy(tag)` additionally copies the committed fixture to a uniquely-named temp file per test file, so the three specs never collide with each other even within one run.

### Scripts

```bash
pnpm --filter app-study-buddy test:e2e         # run the suite headless
pnpm --filter app-study-buddy test:e2e:ui      # Playwright UI mode
pnpm --filter app-study-buddy test:e2e:report  # open the last HTML report
```

No `turbo.json` task is wired for this — invoke directly via `pnpm --filter app-study-buddy test:e2e`, matching this repo's existing precedent of not running e2e through turbo's pipeline.
