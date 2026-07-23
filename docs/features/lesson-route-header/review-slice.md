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
