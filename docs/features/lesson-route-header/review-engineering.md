---
feature: lesson-route-header
reviewer: reviewer_engineering
---

# Engineering review — lesson-route-header

## Round 1 — Verdict: APPROVED

Scope: `git diff feature-entrega3-HernanLaura...HEAD` (commits `8285ae4d2`, `8f47f86e6`, `0c5ff3137`,
`886707acc`, `e716b345e`). Production surface: `apps/app-study-buddy/src/app/(app)/_layout.tsx`,
`libs/study-buddy/src/components/app-chrome/lesson-stack-screens.ts`, `libs/study-buddy/src/index.ts`.
Test surface: `apps/app-study-buddy/src/__tests__/app/(app)/app-layout-settings.test.tsx`,
`apps/app-study-buddy/src/__tests__/app/(app)/tabs-layout.test.ts`,
`libs/study-buddy/src/components/app-chrome/lesson-stack-screens.test.ts`. Remaining files in the
diff are docs/session-state only (`0c5ff3137`, `886707acc`, `e716b345e` touch no source).
CI handed off as: `CI green @ e716b345e` (lint clean for touched workspaces — pre-existing unrelated
`@helsoft/activities` package.json formatting failure noted, untouched by this feature; check-types
14/14 packages green; `@helsoft/study-buddy` 36 suites/261 tests green; `app-study-buddy` 4 suites/30
tests green; no Playwright e2e in scope — `lesson-stack-screens.ts` is a non-JSX data factory with no
`.stories.tsx`, consistent with its `native-tabs-triggers.ts` precedent).

### Findings

None.

### Lens-by-lens

- **[code/TDD]** — Every `@s1`–`@s8` maps to ≥1 concrete test per `tdd.md`'s test map, verified against
  actual test files: `@s8` → `lesson-stack-screens.test.ts` (exact-order/shape assertion on the real,
  unmocked factory); `@s1`–`@s3`/`@s7` → `app-layout-settings.test.tsx`'s `it.each(LESSON_STACK_SCREENS)`
  + `(tabs)` headerShown assertion, against a pure prop-reflecting `Stack.Screen` mock (not
  self-fulfilling — it echoes whatever `_layout.tsx` actually passes); `@s8` render-order assertion
  (`renders (tabs) then the three lesson screens, in LESSON_STACK_SCREENS order`) is the structural
  proof for the sibling-placement regression `@s9` in `tabs-layout.test.ts:69-73`, whose surviving
  assertion is now honestly scoped to "imports the factory" with a comment pointing at the render-order
  test. `@s6` (header persists across player states) needs no separate test — the header lives at the
  Stack level, unchanged code the slice didn't touch, and `@s1`-`@s3` already prove that wiring; this
  reasoning is sound (verified the player screen/component files are absent from the diff). No
  production code introduced without a driving test — `LessonStackScreenConfig`/`LESSON_STACK_SCREENS`
  exist only to satisfy `@s8`'s factory contract and `_layout.tsx`'s `.map()` consumption. No
  `console.log`/TODO/debug leftovers in the diff (grepped clean). Functional React, `Props` type N/A
  (no component added), kebab-case filenames throughout. **i18n**: `t(titleKey)` is called inline at
  the `.map()` usage site (`_layout.tsx:24`), not pre-resolved into a `labels`/`copy` object;
  `LESSON_STACK_SCREENS` is a keys-only dictionary (`titleKey` values, never resolved outside the app) —
  matches the allowed "key dictionary" exception in `i18n.mdc`. No new i18n keys — reuses
  `nav.lesson`/`nav.study`/`nav.results`.

- **[arch]** — `Component → Hook → Service → DAO` : N/A, no hook/service/DAO touched — this is
  declarative router config + a pure data factory, not a data-flow change. `LessonStackScreenConfig`
  is exported directly from its implementation file (`lesson-stack-screens.ts:1`) rather than a
  separate `*.types.ts` — this mirrors the existing, already-accepted `NativeTabTriggerConfig`/
  `native-tabs-triggers.ts` precedent in the same folder (`libs/study-buddy/src/components/app-chrome/`);
  `types.mdc`'s "multi-file types live in `*.types.ts`" targets component/service/hook/DAO
  *implementations*, not standalone config-factory modules whose entire purpose is the type + its
  data — consistent with established convention, not a new violation. `state.mdc`: N/A, no local
  state. Business logic (the screen-config factory) correctly lives in `libs/study-buddy`, not
  `apps/app-study-buddy` — the app only consumes it via the public barrel (`import { LESSON_STACK_SCREENS }
  from '@helsoft/study-buddy'` — root package import, not a deep path bypassing `index.ts`).
  `libs/study-buddy/src/index.ts:8-9` exports both the type and the value, alphabetically placed
  before the sibling `native-tabs-triggers` block. No new dependency added. **Atom ban**: N/A — no
  `libs/*/src/atoms/**` file touched. `NativeTabs`/`(tabs)/_layout.tsx` files are untouched by this
  diff (verified via `git diff --name-only` and `git diff --stat -- apps/.../\(tabs\)`) — no `Stack`
  nested inside any `NativeTabs.Trigger`, no drift from the hard SDK-57 constraint (expo/expo#47687).

- **[perf]** — `LESSON_STACK_SCREENS.map(...)` (`_layout.tsx:23-25`) iterates a fixed 3-element,
  module-level `const` array on every `AppLayout` render — negligible cost, no virtualization
  concern (not a data list), no fresh-object-in-hot-prop pattern beyond what `Stack.Screen`'s API
  itself requires (`options={{ title: t(titleKey) }}` is a new object per screen per render, same
  as the pre-existing per-screen `options={{ title: t(...) }}` this replaces — no regression, router
  screen options are not a re-render-sensitive hot path). No network/Supabase calls, no bundle-weight
  change beyond one new ~300-byte data module. **Performance: no findings** — diff is
  navigation-config-only, well below any threshold that would need memoization.

- **[security]** — No secrets, no service/DAO/auth/network/storage surface touched by this diff — the
  entire change is client-side navigation chrome (route names + i18n keys, both already public,
  non-sensitive constants). **Security: N/A** — diff cannot trigger OWASP Top 10 / MASVS concerns.

### Passed checks (no finding)
- `hooks-service-dao.mdc`, `state.mdc`, `component-split.mdc` — N/A (no hook/service/DAO, no local
  state, no non-trivial component added; `_layout.tsx`'s change is declarative config).
- `global.mdc` — kebab-case filenames, comments explain *why* (`_layout.tsx:6,19-20`), barrels updated.
- Design/accessibility — out of scope for this review (already covered, 2 rounds, APPROVED, in
  `review-slice.md`); not re-litigated here.

## Verdict

**APPROVED** — zero findings across all four lenses (code/TDD, architecture, performance, security).
Performance and security lenses apply but produced no findings (both explicitly checked, not skipped);
neither lens is "N/A" in the sense of "diff can't trigger it" for security (client nav config, no
attack surface) — noted as such above for the durable trail.
