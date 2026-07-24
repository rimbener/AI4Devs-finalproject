---
feature: lesson-route-header
slice: 1 (task-1 + task-2 — single slice)
commit: 8285ae4d2
---

# Slice review — lesson-route-header (slice 1/1)

## Round 1 — Verdict: CHANGES_REQUESTED

Scope reviewed: `git diff feature-entrega3-HernanLaura...HEAD` (8285ae4d2), against `.agents/rules/*.mdc`,
`docs/features/lesson-route-header/{spec.md,gherkin-scenarios.md,task-1.md,task-2.md,tdd.md}`.

### Findings

1. **[tdd] [open] — blocking.** `@s1`, `@s2`, `@s3`, `@s6`, `@s7` have **zero concrete tests**, and the stated
   rationale is factually wrong. `docs/features/lesson-route-header/task-2.md:39` and `tdd.md:13` justify this with
   "the app workspace has no test runner" / "no header-rendering test runner assertion in app workspace" — but
   `apps/app-study-buddy` **does** have jest + `jest-expo` + `@testing-library/react-native` installed
   (`apps/app-study-buddy/package.json:46-52,67`), and this exact technique (render a layout with `expo-router`
   mocked, assert on captured props) is already used twice in the very same test directory:
   - `apps/app-study-buddy/src/__tests__/app/(app)/(tabs)/tabs-layout-web.test.tsx` — mocks `expo-router`/`@helsoft/hooks`/`@helsoft/components`, renders `TabsWebLayout`, asserts on rendered children.
   - `apps/app-study-buddy/src/__tests__/app/(app)/(tabs)/tabs-layout.native.test.tsx` — mocks `expo-router/unstable-native-tabs`'s `Trigger`, renders `TabsLayout`, asserts `accessibilityState`.
   - Most tellingly: `apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.ts:1-23` **already renders/imports this exact `(app)/_layout.tsx`**, already mocks `ApiKeyProvider`/`ProfileProvider`/`useLocalization`/`expo-router`'s `Stack` (with a `Screen: () => null` stub) — but only asserts `unstable_settings`. This file was **not extended** by the slice despite being the natural, pre-existing home for the new behavior (`headerShown` flip + `LESSON_STACK_SCREENS` mapping).
   Fix: extend `app-layout-settings.test.ts` (or add a sibling test) — change the `Stack.Screen` mock to capture
   `name`/`options` (e.g. `Screen: ({ name, options }) => React.createElement(View, { testID: \`screen-${name}\`, ...options })`),
   render `AppLayout`, and assert: (a) `(tabs)` screen has `options.headerShown === false` (s7); (b) each of the 3
   lesson screens renders with `options.title` resolved from the mocked `t(titleKey)` and no `headerShown:false`
   override (s1–s3); (c) screen order/names match `LESSON_STACK_SCREENS` (reinforces s8 wiring end-to-end). s6
   (header persists across player states) is adequately covered by the fact the header lives at the Stack level and
   the player component itself is untouched — no separate test needed for s6 once (a)/(b) exist.

2. **[tdd] [open] — blocking, same root cause as #1.** The updated regression assertion for `@s9` in
   `apps/app-study-buddy/src/__tests__/app/(app)/tabs-layout.test.ts:65-71` was weakened to a shallow substring
   check:
   ```
   expect(src).toMatch(/LESSON_STACK_SCREENS/);
   expect(src).toMatch(/@helsoft\/study-buddy/);
   ```
   This proves the identifiers appear *somewhere* in the file's source text — it does not prove the three lesson
   routes are still rendered as `Stack.Screen` **siblings** of `(tabs)` inside the same top-level `<Stack>` (the
   actual regression `@s9`'s title guards against: "so tab bar is absent on lesson screens"). A mistaken nesting of
   the `.map()` call inside `(tabs)`'s own `Stack.Screen` subtree, or an unused import, would still pass this
   assertion. This is necessitated by the refactor (the previous literal `lesson/[id]` substring genuinely no
   longer appears in the file), but the replacement should be resolved by the rendering test in finding #1 (which
   proves structural sibling placement via actual render output), not left as a standalone text-regex proxy.

3. **[a11y] [open] — blocking, same root cause.** Per the pre-slice checklist ("i18n keys that reach a11y props
   must be asserted — kills `t("")` mutants") and the per-slice a11y protocol ("state changes … announced;
   `<name>.test.tsx` asserts roles/labels"): the header's title text (from `t(titleKey)`, `apps/app-study-buddy/src/app/(app)/_layout.tsx:23`)
   is the accessible name a screen reader announces for that header/back-destination, yet nothing asserts the
   `titleKey → t() → options.title` path resolves correctly per route. No implementation defect is evident — the
   default expo-router/React Navigation native header ships an accessible back button (role `button`,
   platform-supplied label, e.g. "Back"/previous title) and an accessible header title out of the box, and this
   slice adds no custom `headerLeft`/chrome that could break that (matches spec D4) — so this is a **coverage** gap,
   not a runtime a11y bug. Resolved by the same test added for finding #1.

### Passed checks (no finding)

- **`global.mdc`** — app code stays thin (composes from `@helsoft/study-buddy`); functional React; kebab-case
  filenames (`lesson-stack-screens.ts`, `.test.ts`); comments explain *why* (e.g. `_layout.tsx:8-9`, `:18-19`).
- **`hooks-service-dao.mdc`** — N/A, no hook/service/DAO added; `LESSON_STACK_SCREENS` is a pure data factory, not a
  hook wrapping a service.
- **`atomic-design.mdc`** — `lesson-stack-screens.ts` is co-located under `app-chrome` beside its precedent
  `native-tabs-triggers.ts`; correctly has **no** `.stories.tsx` (it's a non-JSX pure config module, same as its
  precedent — the "every component ships a story" rule applies to components, not data factories).
- **`component-split.mdc`** — N/A, no non-trivial UI component added; the `_layout.tsx` change is declarative
  config, not a component with local state/handlers to split.
- **`state.mdc`** — N/A, no local state introduced.
- **`types.mdc`** — `LessonStackScreenConfig` is exported directly from `lesson-stack-screens.ts`, mirroring the
  existing, spec-approved (`review-spec.md` round 1 passed-checks) `NativeTabTriggerConfig`/`native-tabs-triggers.ts`
  precedent in the same folder — consistent with established codebase convention for this factory pattern, not a
  new violation.
- **`i18n.mdc`** — `t(titleKey)` is called directly at the usage site inside `.map()` (`_layout.tsx:23`), not
  collected into a `labels` object; `LESSON_STACK_SCREENS` is a keys-only dictionary (`titleKey` values are i18n
  keys, resolved only by the app) — matches the allowed "key dictionary" exception. No new i18n keys added; reuses
  existing `nav.lesson`/`nav.study`/`nav.results`.
- **Barrel export** — `libs/study-buddy/src/index.ts:8-9` exports `LessonStackScreenConfig` (type) and
  `LESSON_STACK_SCREENS` (value), alphabetically placed before the sibling `native-tabs-triggers` export block.
- **Hard constraint** — `NativeTabs`/`(tabs)/_layout.tsx` files are untouched by this diff (verified via
  `git diff --name-only`); no `Stack` nested inside any `NativeTabs.Trigger`.
- **Design/UI** — `(app)/_layout.tsx`'s bare `<Stack>` + `headerShown:false` on `(tabs)` only, default back button,
  no custom `headerLeft`/colors, correctly mirrors the `(auth)/_layout.tsx` precedent (verified byte-for-byte
  pattern match). `ApiKeyProvider`/`ProfileProvider` wrapping order/nesting unchanged.
- **No hardcoded strings/colors/dimensions**, no magic numbers, no `console.log`/TODO leftovers in the diff.
- `@s8` is properly covered by `lesson-stack-screens.test.ts` (exact order + shape assertion).

## Verdict

**CHANGES_REQUESTED** — 3 findings (all tagged `[tdd]`/`[a11y]`, sharing one fix: add a rendering test to
`app-layout-settings.test.ts` that captures `Stack.Screen` props and asserts per-route `headerShown`/`title`).
No security/performance review performed here (deferred to the full review). No design/atomic-design/i18n/state/
types/hooks-service-dao violations found.

## Round 2 — Verdict: APPROVED

Scope reviewed: `git diff feature-entrega3-HernanLaura...HEAD` (adds `8f47f86e6` on top of `8285ae4d2`),
re-checked against `.agents/rules/*.mdc`, `tdd.md`'s `@s → test` map, and the round-1 findings below.
Fix commit touched **zero production code** (`git diff 8285ae4d2 8f47f86e6 -- apps/app-study-buddy/src/app
libs/study-buddy/src` is empty) — only tests + docs, as expected for a coverage-gap fix.

### Round-1 findings — disposition

1. **[tdd] — resolved.** `apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx` (renamed
   from `.test.ts`, now `.tsx` to host JSX) extends the pre-existing suite exactly as prescribed. Verified the
   new assertions are real, not tautological:
   - The `Stack.Screen` mock (`app-layout-settings.test.tsx:18-19`) is a **pure prop-reflector**
     (`React.createElement(View, { testID: \`screen-${name}\`, ...options })`) with no test-side hardcoding of
     title/headerShown — it only echoes whatever `_layout.tsx` actually passes as `options`. So the assertions
     genuinely exercise the production wiring in `_layout.tsx:22-25` (the `t(titleKey)` call and the `.map()`
     over `LESSON_STACK_SCREENS`), not a self-fulfilling mock.
   - `:39-42` renders `AppLayout` and asserts `screen-(tabs)`'s reflected `headerShown === false` — proves s7.
   - `:44-55` is `it.each(LESSON_STACK_SCREENS)` (the *real*, unmocked factory) asserting per-route
     `props.title === titleKey` (mocked `t(k) => k`, so this kills a `t('')`/hardcoded-title mutant) and
     `props.headerShown !== false` — proves s1/s2/s3 for all three lesson routes generically, not by name.
   - `:57-63` asserts `getAllByTestId(/^screen-/)` render order is `['(tabs)', ...LESSON_STACK_SCREENS names]` —
     proves the lesson screens are Stack.Screen **siblings** of `(tabs)` in the stated order, which is the
     structural claim `@s9`/`@s8` needs and the thing a nesting mistake or reordering would break. This directly
     closes finding #2 (the weakened `@s9` regex): `tabs-layout.test.ts:65-71` was honestly relabeled
     (`imports LESSON_STACK_SCREENS from @helsoft/study-buddy for the lesson Stack.Screen list`) with a comment
     pointing at this render-order test as the actual structural proof — no more overclaiming.
   - s6 (header persists across player states): correctly left untested here per the sound rationale (header is
     wired at the Stack level in code the slice didn't touch; s1-s3/s7 already prove that wiring) — matches
     `tdd.md`'s `s6 | no separate test …` row.
   - Test pattern (`await render(...)`, `screen` singleton from `@testing-library/react-native`) matches the
     established sibling precedent verbatim (`tabs-layout-web.test.tsx:58,68-101`), so no invented convention.
2. **[tdd] — resolved.** Same fix as #1 (render-order assertion is the structural proof); `tabs-layout.test.ts`'s
   surviving regex check is now honestly scoped to "imports the factory" only, with a comment disclaiming
   further structural claims and pointing at the new test — no longer a weak proxy standing in for a stronger
   claim.
3. **[a11y] — resolved.** The `it.each` assertion (`props.title === titleKey`, real `t()` call site exercised)
   is exactly the "i18n keys that reach a11y props must be asserted (kills `t("")` mutants)" item in
   `pre-slice-checklist.mdc:19` — the accessible header title's resolution path is now asserted per route.

### Additional round-2 checks

- **Rename `.ts` → `.tsx` regression check** — old file (`git show 8285ae4d2:...app-layout-settings.test.ts`)
  had exactly one test (`unstable_settings`); it is preserved verbatim as the first `describe` block in the new
  file (`:30-35`). Jest `testMatch` (`apps/app-study-buddy/jest.config.js`) already includes
  `<rootDir>/src/**/*.test.tsx`, so the rename needs no config change. No stray references to the old filename
  remain in code/config (only in historical docs, which is expected/correct for a durable trail). Gate counts
  in `tdd.md` (25→30 tests, same 4 suites) arithmetically match the net +5 new `it`/`it.each` cases added to
  this one file — consistent with an actually-executed gate, not a guessed number.
- **`task-2.md`/`tdd.md` corrections** — the replaced text is now accurate: `apps/app-study-buddy` does have
  jest + `@testing-library/react-native` (already used by the native/web tabs-layout tests cited); the new
  `s1–s3/s7/s8` rows in `tdd.md`'s test map point at concrete, existing test names in the new file. No
  remaining "no test runner" or other factually-incorrect claims found in either doc.
- **Full-diff re-scan against `.agents/rules/*.mdc`** — the fix commit adds no production code (confirmed above),
  so `hooks-service-dao.mdc`/`atomic-design.mdc`/`component-split.mdc`/`state.mdc`/`types.mdc` remain N/A as in
  round 1. `i18n.mdc`: no new i18n keys, `t()` still called inline in `_layout.tsx` (unchanged this round).
  `global.mdc`: new test file is kebab-case, comments explain *why* (`:16-17`, `:52`). No `console.log`/TODO/
  magic numbers introduced. `tdd.mdc`: Red→Green→Refactor evidence for this round is recorded in `tdd.md`
  ("Cycle 3" — RED/GREEN/REFACTOR entries), consistent with the diff.
- **Design/a11y** — no UI/screenshot changes this round (test-only commit); default expo-router header behavior
  from round 1 stands, now with coverage proving the title-resolution path that feeds the header's accessible
  name.

### Passed checks (round 1, still valid — unchanged this round)

See Round 1 "Passed checks" above; nothing in the fix commit invalidates any of them (no production code
changed).

## Verdict

**APPROVED** — all 3 round-1 findings resolved with genuine, non-tautological rendering assertions; no new
findings introduced by the fix commit (test/docs-only diff). No security/performance review performed here
(deferred to the full review, per protocol).
