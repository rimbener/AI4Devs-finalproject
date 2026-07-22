# Slice 2 review — native-bottom-tabs

**Verdict: APPROVED**
Slice: task-3 + task-4 + task-5 | Scenarios owned: @s6 @s3 (desktop trim) @s11 @s12 @s13 @s14

---

## Findings

None.

---

## Passed checks

- **[global]** Functional React, no Redux; kebab-case; thin `settings.tsx` wiring; why-comments on `SettingsSignOut` / `AppChrome` / `SavedLessons`; Storybook stories for new + touched Storybook components; `SettingsSignOut` + barrel export.
- **[hooks-service-dao]** Component → hooks only (`useBreakpoint`, `useLessons`, `useAuth` via `SignOut`); no DAO/service skips.
- **[atomic-design]** Shared `Button` / `DesktopBar` / `SignOut`; tokens via Unistyles; stories cover owned states (SavedLessons content/empty CTA; SettingsSignOut mobile/desktop; DesktopBar content).
- **[component-split]** Handlers in components; trivial `SettingsSignOut` needs no hook/helpers; AppChrome helpers deleted with MobileBar path.
- **[state]** No ≥3 related local state introduced.
- **[types]** `SettingsSignOutProps` / `DesktopBarProps` in `*.types.ts`; no runtime in types files.
- **[i18n]** CTA `t('nav.newLesson')`; SignOut reuses `auth.logOut*`; no labels bag / no new keys.
- **[tdd]** @s6/@s3/@s11/@s12/@s13/@s14 mapped in `tdd.md`; unit + e2e + `slice-2.integration.test.tsx`; Red→Green logged; no scope inflation beyond tasks.
- **[design]** Persistent header CTA; DesktopBar My-lessons-only; AppChrome desktop-only (parent layout still breakpoint-gates); Settings SignOut mobile-only — matches spec Q2/Q3/Q6/Q7.
- **[a11y]** CTA via `Button` (`accessibilityRole="button"`, hitSlop→touchTarget, theme contrast); tests assert roles/labels; SignOut confirm flow unchanged; desktop null branch has no orphan control.
