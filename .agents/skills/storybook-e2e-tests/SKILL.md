---
name: storybook-e2e-tests
description: Write Playwright end-to-end tests for Storybook-rendered UI components in this monorepo — `libs/components`, `libs/lib-with-storybook`, or any new Storybook-enabled lib. Use when adding a `.e2e.js` test for a `.stories.tsx` file, adding more test cases to an existing `.e2e.js`, or wiring up Playwright for a workspace that doesn't have it yet. Trigger on "e2e test", "playwright test", "storybook test", "test this component", "add e2e for <component>". Do NOT use for hooks/services/DAOs/non-visual logic — see the "When not to use this" section, those get Jest instead.
---

# Storybook + Playwright E2E Tests

Playwright drives a real browser against a running Storybook instance and exercises **real user
interaction** on a rendered story. It's for **Storybook-backed UI components** only.

> **Interaction-only — `.agents/rules/e2e.mdc`.** An e2e must perform an interaction (press, type,
> drag, select, open/close, submit, navigate) and assert the **resulting behavior/state change**.
> **Never** write an e2e that only renders a story and asserts elements are present/visible — Jest
> unit tests (`<name>.test.tsx`) already own rendering, props, the 4 UI states, and static presence.
> A component with no meaningful interaction gets **no** e2e file.

## When not to use this

Hooks, services, DAOs, and any non-visual logic get Jest unit tests
(`*.service.test.ts`, `*.dao.test.ts`, `use-*.test.ts`), not Playwright. If the thing you're
testing has no `.stories.tsx`, this skill doesn't apply — stop and use Jest instead. Likewise, if
the component has no interaction to drive, don't create an e2e just to assert it renders — that's a
unit-test job (see `.agents/rules/e2e.mdc`).

## The one tricky part: deriving the story URL

A story renders at `/?path=/story/{title-slug}--{export-slug}`. Both halves come from the
`.stories.tsx` file, not from the component name:

1. **`{title-slug}`** — the story's `title` field, lowercased, `/` replaced with `-`.
2. **`{export-slug}`** — the named export for the specific story, kebab-cased.

Worked examples from this repo:

| `title` in `.stories.tsx` | named export | URL path |
|---|---|---|
| `'Atoms/Card'` | `Elevated` | `atoms-card--elevated` |
| `'Molecules/SlideProgress'` | `Default` | `molecules-slide-progress--default` |
| `'Example/Button'` | `Primary` | `example-button--primary` |
| `'Example/Button'` | `Secondary` | `example-button--secondary` |

Always open the `.stories.tsx` file and read its `title` and export names directly — never guess
the slug from the component's file path. `CamelCase` exports become hyphen-separated lowercase
(`SlideProgress` title segment → `slide-progress`; export names are usually already single words
like `Default`/`Primary` so they lowercase straight across).

## Test file

Put `{component-name}.e2e.js` under `libs/{lib}/tests/e2e/`, at the same relative path the
component has under `src/`. Mirror the atomic-design folder — don't flatten it and don't
co-locate the test with the `.stories.tsx` file:

```
libs/{lib}/src/{atoms|molecules|organisms|templates|pages}/{name}/{name}.stories.tsx
libs/{lib}/tests/e2e/{atoms|molecules|organisms|templates|pages}/{name}/{name}.e2e.js
```

For `lib-with-storybook`, stories live under `src/stories/{name}/`, so tests live under
`tests/e2e/stories/{name}/`.

Plain CommonJS `.js` — no TS, no ESM import:

```js
const { test, expect } = require('@playwright/test');

// Interaction-only (.agents/rules/e2e.mdc): drive a real interaction, assert the OUTCOME.
test('selecting an answer enables Continue', async ({ page }) => {
  await page.goto('/?path=/story/organisms-multiple-choice--default');
  const canvas = page.frameLocator('iframe[title="storybook-preview-iframe"]');

  await canvas.locator('text=Mitochondria').click();           // interaction
  await expect(canvas.locator('text=Continue')).toBeEnabled();  // resulting state change
});
```

Do **not** write a bare "renders / story loads / text is visible" e2e — that's static presence, already covered by the Jest `<name>.test.tsx`. Every e2e must click/type/drag/etc. and assert what changed.

Rules that matter:

- **Always go through the iframe.** The story renders inside
  `iframe[title="storybook-preview-iframe"]`. `page.locator()` looks at the outer Storybook UI
  and will not see story content — use `page.frameLocator(...)` and query through that, or query
  the bare iframe element itself (`page.locator('iframe[...]')`) only to assert it's visible/loaded.
- **Prefer text locators over HTML semantics.** These are React Native components rendered via
  `react-native-web`. A `Pressable` becomes a `div`, not a `<button>`; there's no native `role`
  to rely on. Use `canvas.locator('text=...')` against visible copy in the story, not
  `getByRole`.
- **One test per interaction flow**, not one giant test per component — each `test()` drives an
  action (or short sequence) and asserts the outcome. Do **not** add "story loads" / "content
  renders" / per-variant presence tests — those are unit-test territory (`.agents/rules/e2e.mdc`).
- If a story variant only differs visually (no distinct interaction), it doesn't need its own e2e;
  cover the variants that actually behave differently.

## Adding tests to an existing `.e2e.js`

Just append more `test(...)` blocks to the file — same import, same file. No new file needed.

## Scaffolding a new workspace (no `playwright.config.js` yet)

If the target lib has no `playwright.config.js`, it means e2e was never wired up there. Do all
three of the following — Playwright itself is already a shared root devDependency (pnpm
workspace), do **not** add it again to this workspace's `package.json`.

**1. `{lib}/playwright.config.js`** — copy this, changing only the port (pick one not already
used by another workspace's Storybook dev server; check sibling libs' `package.json` `dev`
scripts):

```js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // 'list' prints pass/fail inline; the HTML reporter is kept but never auto-opens
  // (its default on-failure open starts a blocking report server that hangs non-interactive runs).
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:PORT',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:PORT',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

`PORT` must match the `-p` flag in that workspace's `dev` script (Storybook's dev server port).

**2. `package.json` scripts** — add these three (keep whatever `dev`/`build`/`check-types`
already exist):

```json
"test:e2e": "npx playwright test",
"test:e2e:ui": "npx playwright test --ui",
"test:e2e:report": "npx playwright show-report"
```

**3. Create `{lib}/tests/e2e/`** mirroring the `src/` path of the stories it will cover — this is
where `.e2e.js` files go, not next to the `.stories.tsx` files.

## Running tests

```bash
cd libs/{lib} && pnpm test:e2e:ui         # interactive UI mode (humans only)
```

**Non-interactive runs (agents & CI) — never let the report server hang the process.**
The default `test:e2e` (`npx playwright test`, HTML reporter) auto-opens/serves the report on
failure and **blocks**. Agents must run e2e with the `list` reporter, which prints results and
exits:

```bash
pnpm --filter @helsoft/{lib} exec playwright test --reporter=list   # from repo root, non-blocking
```

Never run bare `pnpm test:e2e` or `test:e2e:report` from an agent. Config auto-starts Storybook
(`pnpm dev`) if it isn't already running.
