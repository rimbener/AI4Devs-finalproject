# Slice 3 review — native-bottom-tabs

**Verdict: APPROVED**
Slice: task-6 only | Scenarios owned: @s2 @s17

---

## Findings

None.

---

## Passed checks

- **[global]** Deletion-only; kebab-case `mobile-bar-retired.test.ts`; no new Storybook component without stories; AccountMenu export kept; thin apps unchanged beyond @s2 test.
- **[hooks-service-dao]** N/A — no hook/service/DAO changes.
- **[atomic-design]** Retired organism + stories/e2e removed; no ad-hoc tokens; AccountMenu remains for desktop avatar.
- **[component-split]** N/A — no new UI split.
- **[state]** N/A — no local state introduced.
- **[types]** `mobile-bar.types.ts` deleted with component; no orphan type exports.
- **[i18n]** No new user-facing strings.
- **[tdd]** @s2 → `tabs-layout-web.test.tsx` (no `mobile-top-bar` / `mobile-bottom-bar`); @s17 → `mobile-bar-retired.test.ts` (barrel/folder/e2e gone, AccountMenu remains); slice integration via AppChrome source assert; Red→Green logged; `tdd.md` ~2.5KB; no production beyond deletion.
- **[design]** Matches Q6 / task-6: MobileBar gone; NativeTabs (native) / WebBottomTabs (narrow web); AccountMenu kept; DesktopBar My lessons + PDF files.
- **[a11y]** N/A for deletion slice. Product nav a11y: NativeTabs + WebBottomTabs tab roles.
