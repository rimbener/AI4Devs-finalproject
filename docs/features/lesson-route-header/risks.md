# Risks — lesson-route-header

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | Inverting the layout default (bare Stack) accidentally regresses `(tabs)` to show a header, or someone later nests a Stack inside a `NativeTabs.Trigger` (SDK 57 iOS release-build hang, expo/expo#47687) | technical | L | H | Explicit `headerShown: false` on the `(tabs)` `<Stack.Screen>`; scenario @s7 asserts tabs stay headerless and no Stack is nested in a `NativeTabs.Trigger`; `NativeTabs` file untouched |
| R2 | Most scenarios (@s1–@s7) are native-chrome/visual behavior and the app workspace has no test runner — only @s8 (the lib factory) is unit-testable | technical | M | M | Extract the testable config into `@helsoft/study-buddy` (@s8, unit-tested); verify @s1–@s7 via check-types + lint + reviewer + manual/visual check; scope called out honestly, no fabricated test coverage |
| R3 | `results.tsx` is a `<Redirect>` to `player`, so its configured header is dead/invisible today — reviewers may flag it as unused | product | M | L | Documented decision (D3): configure it for AC-literal completeness and future-proofing if the redirect is removed; noted in spec, task-2, and @s3 |

## Dependencies
| Dependency | Status | Notes |
|---|---|---|
| i18n keys `nav.lesson` / `nav.study` / `nav.results` | available | Present in en/es/pt/de (`libs/localization/src/resources/*`); reused, no new keys |
| `@helsoft/study-buddy` `app-chrome` module + Jest | available | Existing `native-tabs-triggers.ts` sets the pattern; study-buddy lib has a test runner |
| expo-router `Stack` / `Stack.Screen` header API (SDK 57) | available | Precedent: `(auth)/_layout.tsx` bare Stack already renders default headers |
