---
name: app-e2e-tests
description: Write Playwright end-to-end tests for a live running app in this monorepo (currently `apps/app-study-buddy`, web only) — as opposed to Storybook-rendered components. Use when adding a `.e2e.js` test under `apps/*/tests/e2e/`, extending the shared golden-path helper, or wiring up Playwright for an app that doesn't have it yet. Trigger on "app e2e test", "playwright test for the app", "test the live app", "golden path test", "add e2e for the study-buddy app". Do NOT use for Storybook component tests (that's the `storybook-e2e-tests` skill) or for Jest/RTL unit tests.
---

# App-level Playwright E2E

Playwright drives a real browser against the **live running app** (`expo start --web`), not a
Storybook iframe preview. It's for exercising real cross-screen user journeys — login, upload,
generate, play a lesson — end to end against a real (local) Supabase backend.

> **Interaction-only — `.agents/rules/e2e.mdc`.** Same rule as Storybook e2e: drive a real
> interaction, assert the resulting behavior/state change. Never write an e2e that only asserts a
> screen or element is present.
>
> **App-specific mechanics — `.agents/rules/app-e2e.mdc`.** testID-first selectors, no
> `frameLocator`, the file-chooser gotcha, mocking paid/external calls. Read it before writing a
> test here — this skill covers the "where things live and how to run them" half.

## When not to use this

- Storybook-rendered components (`.stories.tsx`) → `storybook-e2e-tests` skill instead.
- Hooks/services/DAOs/pure logic → Jest unit tests, not Playwright.
- A screen with no cross-screen interaction to drive (e.g. a static settings page) doesn't need an
  app-level e2e just to prove it renders — that's unit-test territory.

## Where things live (`apps/app-study-buddy`)

```
apps/app-study-buddy/playwright.config.js       # testDir './tests/e2e', webServer 'pnpm web', baseURL :8081
apps/app-study-buddy/tests/fixtures/            # committed test fixtures (e.g. golden-path.pdf)
apps/app-study-buddy/tests/e2e/helpers/         # shared flows: login, upload+extract, generate, open-in-player
apps/app-study-buddy/tests/e2e/*.e2e.js         # one file per journey/slice of the journey
```

Plain CommonJS `.js` — no TS, no ESM import — matching the Storybook e2e convention.

## testID convention

Locate by `testID` (→ `data-testid` via `react-native-web`), not text or role:

```js
const { test, expect } = require('@playwright/test');
const { LOGIN_EMAIL_FIELD_TEST_ID } = require('@helsoft/logging-in-out/test-ids');

test('...', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId(LOGIN_EMAIL_FIELD_TEST_ID).fill('test@paid.com');
  // ...
});
```

**Each testID lives in the same lib as the component that owns it** — there is no separate,
centralized test-ids package. A lib that has components with e2e-visible testIDs exports them at
its own `@helsoft/{lib}/test-ids` subpath, e.g. `@helsoft/components/test-ids`,
`@helsoft/activities/test-ids`, `@helsoft/logging-in-out/test-ids`, `@helsoft/study-buddy/test-ids`.
Both the component (TypeScript, self-referencing import) and the e2e test (plain Node `require()`)
import the exact same constant from that one subpath — never redeclare the same string as a
second local constant in either place:

```ts
// component source, e.g. libs/logging-in-out/src/organisms/login-form/login-form.tsx
import { LOGIN_EMAIL_FIELD_TEST_ID } from '@helsoft/logging-in-out/test-ids';
```
```js
// e2e test (plain CommonJS)
const { LOGIN_EMAIL_FIELD_TEST_ID } = require('@helsoft/logging-in-out/test-ids');
```

The `@helsoft/{lib}` self-import (a component importing its *own* package by name rather than a
relative path) is a standard Node/bundler feature and works here because each lib's `package.json`
declares itself under `"exports"`. Each lib's `src/test-ids.js` is plain CommonJS
(`module.exports`, not this repo's usual ESM `export`), paired with a hand-written
`src/test-ids.d.ts` — Playwright e2e files run under vanilla Node with **no** TS/JSX transform
(confirmed empirically: `require()`-ing a lib's TS entry point directly throws a `SyntaxError` on
the first `import type`/JSX it hits), so the one file both a bundler-interop TS `import` and a
bare Node `require()` can consume as-is has to be plain JS + a `.d.ts`. `package.json`'s `exports`
map routes the subpath to that pair:

```json
"exports": {
  ".": "./src/index.ts",
  "./test-ids": {
    "types": "./src/test-ids.d.ts",
    "default": "./src/test-ids.js"
  }
}
```

If the golden path needs a component with no `testID` yet: (1) add `testID?: string` to that
component (additive-only — see `Button`/`IconButton`/`AnswerOption` in `libs/components` for the
pattern: optional prop, forwarded to the underlying `Pressable`/`TextInput`, default `undefined`),
(2) add the string as a new named export in that component's **own lib's** `src/test-ids.js`
**and** its type in `src/test-ids.d.ts` (create both files + the `exports` subpath if the lib
doesn't have them yet), (3) import it from `@helsoft/{lib}/test-ids` in the component and use it as
the `testID` prop. Component-only testIDs that no e2e test needs (covered solely by same-file
Jest/RTL tests) can stay declared locally in the component — only centralize the ones an app-level
e2e test actually locates. If the e2e test lives in a different app/package than the component's
lib, add that lib as a (dev)dependency there too, so its own `node_modules` has the symlink needed
to resolve the subpath (see `apps/app-study-buddy/package.json`'s `@helsoft/logging-in-out`
devDependency — added solely so its e2e tests can reach `@helsoft/logging-in-out/test-ids`, since
the app doesn't otherwise depend on that lib directly).

For a testID that must be unique per row/item in a list (no static constant possible), add a
small helper function to that lib's `src/test-ids.js` instead (with its own `.d.ts` signature),
e.g. `pdfDocumentListItemActionTestId(filename) => \`pdf-document-list-item-action-${filename}\`` —
both the component and the test import and call the same function (or, for dynamic/AI-generated
content whose id can't be known ahead of time, match by attribute prefix instead:
`page.locator('[data-testid^="multiple-choice-option-"]')`).

## The file-chooser gotcha

`expo-document-picker`'s web implementation creates a hidden `<input type="file">` and clicks it
from within a real user gesture (the button press) — Chromium therefore opens (and, headless,
auto-cancels) a genuine native file-chooser, not a plain toggleable `<input>`. Targeting the input
directly with `setInputFiles()` loses that race. Always intercept the chooser event instead:

```js
const [fileChooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.getByTestId('new-lesson-dialog-choose-file').click(),
]);
await fileChooser.setFiles(fixturePath);
```

## Mocking paid/external calls

A step that would otherwise trigger a real call to a paid/rate-limited external provider (AI
generation, etc.) must be intercepted with `page.route()` and fulfilled with a fixed response —
never driven for real in this suite. Two things to get right:

1. **Intercept before triggering it.** Register the route(s), then click.
2. **Trace the full read-back chain, not just the write.** A response from the write/trigger call
   is often not the only place the app reads that data from afterward — if a later screen
   re-fetches the same entity through a different endpoint, mock that too, or the app will try to
   load something that was never actually persisted.

```js
const mockLessonGeneration = async (page) => {
  const lesson = buildMockLesson(); // fixed, hand-authored deck — known slide types/positions

  // 1. The edge function call itself (would otherwise call Groq for real).
  await page.route('**/functions/v1/generate-lesson', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(lesson) });
  });

  // 2. The player screen's SEPARATE by-id read (LessonsDao.getLessonById) — a different
  //    endpoint than #1, and the one that actually renders the deck. Only intercept the
  //    single-lesson-by-id shape; let every other `lessons` query through to the real stack.
  await page.route('**/rest/v1/lessons*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('id') !== `eq.${lesson.lessonId}`) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: lesson.lessonId, title: lesson.title, slides: lesson.slides, /* ... */ }),
    });
  });

  return lesson;
};
```

A useful side effect: because the deck is fixed, a test can assert on **known** slide
types/positions/content directly (e.g. "slide 3 is the MultipleChoice with `correctOptionId: 'a'`")
instead of searching AI-generated output for an activity type — simpler and fully deterministic.

If a test genuinely needs the real external call (verifying the edge function/provider
integration itself, not the app's UI), that belongs in a different, non-Playwright suite.

## Determinism: unique fixture filenames per test file

Every extraction/upload inserts a new row with no filename-uniqueness constraint, and row-level
action buttons are located by filename — two uploads of the same filename in one suite run make
that locator ambiguous. Copy the committed fixture to a per-test-file temp path before uploading:

```js
const stageFixtureCopy = (tag) => {
  const dest = path.join(os.tmpdir(), `golden-path-${tag}.pdf`);
  fs.copyFileSync(FIXTURE_PATH, dest);
  return dest;
};
```

Pass a distinct `tag` per test file (e.g. `'upload-and-generate'`, `'lesson-player'`). Fixture
uniqueness complements — does not replace — the suite's automatic `supabase db reset` before
and after the run (see `E2E_TESTS.md`'s "App-level E2E").

## Running tests

```bash
pnpm --filter app-study-buddy test:e2e         # prepare + headless + cleanup
pnpm --filter app-study-buddy test:e2e:ui      # prepare + UI mode + cleanup (humans only)
pnpm --filter app-study-buddy test:e2e:report  # open the last HTML report
```

`test:e2e` / `:ci` / `:ui` go through `scripts/run-e2e.sh` → prepare (`db reset`) → Playwright →
cleanup (`db reset` again). Docker must be running. `SKIP_E2E_SUPABASE_PREPARE=1` skips both.

The config's reporter is `[['list'], ['html', { open: 'never' }]]` — pass/fail prints inline and
the process exits on its own; it never auto-opens a blocking report server, so `test:e2e` is safe
for agents and CI to run directly (unlike a bare `reporter: 'html'`, which does auto-open on
failure and hangs a non-interactive run).

## Adding a test to an existing journey file

Append more `test(...)` blocks, reusing the shared helper's exported functions
(`login`, `chooseFileAndExtract`, `mockLessonGeneration`, `generateLesson`, `openInPlayer`,
`multipleChoiceOptionTestId`, `stageFixtureCopy`) rather than re-deriving the same flow inline.

## Scaffolding a new app (no `playwright.config.js` yet)

Playwright is already a shared root devDependency — don't add it to the app's `package.json`
again. Do all three:

**1. `apps/{app}/playwright.config.js`:**

```js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:PORT',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm web',
    url: 'http://localhost:PORT',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

`workers: 1`/`fullyParallel: false` matter here specifically because the suite shares one
Supabase-backed account/dataset across tests — unlike the Storybook e2e config (stateless,
`fullyParallel: true`), concurrent app e2e tests would race on the same rows.

**2. `package.json` scripts** (keep whatever `dev`/`web`/`build` already exist):

```json
"test:e2e": "bash ./scripts/run-e2e.sh",
"test:e2e:ci": "bash ./scripts/run-e2e.sh --reporter=list",
"test:e2e:ui": "bash ./scripts/run-e2e.sh --ui",
"test:e2e:report": "npx playwright show-report"
```

Also copy `scripts/e2e-prepare-supabase.sh` + `scripts/run-e2e.sh` from `app-study-buddy` (or
equivalent) so prepare stays tied to the suite entrypoint — Playwright `globalSetup` alone is
not enough: `webServer` starts before `globalSetup`, and Expo needs `.env` pointing at local
Supabase first.

**3. `apps/{app}/tests/e2e/` and `apps/{app}/tests/fixtures/`** — journey files and a
`helpers/` folder for shared flows; fixtures alongside, not inside, `tests/e2e/`.

## Extending for a new platform

This skill and its sibling rule (`.agents/rules/app-e2e.mdc`) are written to be **extended**, not
replaced, when mobile e2e (Maestro) lands — add a Maestro section rather than forking a parallel
skill; the testID convention and fixtures carry over unchanged.
