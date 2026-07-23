# Definition of Done — native-bottom-tabs

**Verdict:** PASS
_Validated by `dod_validator`. Each item re-checked against the code, not trusted from prior reports. **Keep terse:** one line of evidence per item — a `file:line`, a one-line command result (e.g. "lint: 0 errors"), or a link to `review.md` / `mutation.md`. Do **not** paste full command output or restate rubric text._

## Accepted minors (documented risk-accepted, if any)
_Only **minor** findings left after the 2-round review loop, explicitly risk-accepted by the human and mirrored in `spec.md` Open decisions. PASS may carry these; it may NOT carry an open blocker/major or an unmet mutation threshold. Leave empty if none._
- _none_ — `review.md` open findings empty; no ACCEPTED minors

## Functionality
- [x] All acceptance criteria met (the `@s` scenarios in `gherkin-scenarios.md`) — `tdd.md` @s1–@s17 → test map; green unit/integration
- [x] 4 UI states implemented (if UI) — `spec.md` nav states: Content/Loading/Empty CTA/@s6; Error N/A for nav
- [x] Robust error handling; no undefined/crash states — SignOut keeps existing confirm/`onSignOutError`; no nav fetch

## Code quality
- [x] `pnpm lint` clean — _evidence:_ `pnpm lint` → 14/14 successful (Biome, 0 errors)
- [x] `pnpm check-types` clean — _evidence:_ `pnpm check-types` → 14/14 successful
- [x] `pnpm test` (unit + integration) green — _evidence:_ components 345, study-buddy 263, activities 400; turbo 12/12
- [x] `test:e2e` green where relevant — _evidence:_ components playwright 144 passed; study-buddy 77 passed (re-run; first run flaked 1× api-key-gate Paid)
- [x] No TODOs without an issue; Conventional Commits — feature commits `fix|test|chore(native-bottom-tabs):…`; no TODO in chrome paths
- [x] `pnpm bootstrap` — _evidence:_ `pnpm bootstrap` → install + check-types 14/14 + lint 14/14 + test 12/12 green

## Architecture
- [x] `Component→Hook→Service→DAO` respected; no cross-layer imports — nav chrome only; `review-engineering.md` APPROVED; no new DAO/service
- [x] DTOs not leaked out of data/DAO; barrels updated — N/A data layer; MobileBar removed from organisms barrel (`mobile-bar-retired.test.ts`)
- [x] No unapproved dependencies — `expo-router/unstable-native-tabs` per `spec.md` Open decisions (Q1)

## Design system
- [x] Tokens/existing components reused; correct atomic-design placement — DesktopBar/AccountMenu/Button/SignOut; NativeTabs in app layouts
- [x] Storybook story per shared component (4 states) — `desktop-bar.stories.tsx` 4 stories; AppChrome Content+Loading (Empty/Error N/A per spec); SettingsSignOut Mobile/Desktop/Content
- [x] Every component has a Jest unit test (`<name>.test.tsx`) — `app-chrome.test.tsx`, `desktop-bar.test.tsx`, `settings-sign-out.test.tsx`, `native-tabs-triggers.test.ts`

## Security (OWASP)
- [x] No secrets/keys in code or logs; inputs validated — `review.md` security lens N/A; no new trust boundary
- [x] Supabase RLS/auth respected; no PII in logs; TLS for external calls — SignOut reposition only; no new network/storage

## Accessibility (WCAG 2.2 AA)
- [x] Labels/roles; contrast ≥ 4.5:1; touch targets ≥ 44/48; focus order; dynamic type — @s5 `tabs-layout.native.test.tsx` selected state; labels via `t(nav.*)`; NativeTabs system chrome; `review-slice.md` a11y OK

## Testing rigor
- [x] Every `@s` scenario covered — `tdd.md` map @s1–@s17 + slice2/slice3 integration
- [x] Mutation score threshold met on changed source (`.tsx` included) — `mutation.md` PASS 100% (components/activities/study-buddy); 0 survivors

## Observability & i18n
- [x] Analytics events per spec; feature flag wrapping (if applicable) — `spec.md`: none / none
- [x] No hardcoded strings — `NATIVE_TAB_TRIGGERS` + `t('nav.*')` in `(tabs)/_layout*.tsx`; no new copy keys (`@s10`)

---
**If PASS → `pr_ready`.** Opening & merging the PR is a manual human step → `done`.

**Lead:** DoD PASS after Biome format fix. Phase → `pr_ready`. Human opens/merges PR.
