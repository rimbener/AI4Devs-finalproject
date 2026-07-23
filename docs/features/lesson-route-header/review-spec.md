---
feature: lesson-route-header
round: 1
---

# Spec review — lesson-route-header

## Verdict: CHANGES_REQUESTED

## Findings

1. **[minor, open]** `gherkin-scenarios.md` `@s6` (Scenario Outline: "Player keeps its header across every state") — the shared
   `And the existing in-screen "Back" / "Retake" / "Back to my lessons" actions are unchanged` step is applied identically to
   all four Examples rows (loading, empty, error, loaded), but the actual CTA set differs per state and doesn't union that way:
   - `loading` (`PlayerLoading`, `libs/study-buddy/src/components/player-loading/player-loading.tsx`): no in-screen action at all.
   - `empty` (`LessonPlayerEmpty` in `libs/activities/src/organisms/lesson-player/lesson-player.tsx`): only `Back` (`player.back`).
   - `error` (`LessonPlayerError`, same file): `Retry` (`player.error.retry`) + `Back` (`player.back`), no `Retake`/`Back to my lessons`.
   - `loaded` (`LessonResults` → `ResultsSummary`): `Retake` (`onRetake`) + `Back to my lessons` (`onBackToLessons`), no plain `Back`.
   As written, the outline's blanket step is vacuously true for `loading` and imprecise for the other three rows (it implies all
   three CTA labels could apply to any row). Fix: either (a) add a per-row "expected unchanged action(s)" column to the Examples
   table, or (b) split `@s6` into state-specific scenarios/steps that name only the CTA(s) that actually exist in that state.
   Owning task: `task-2.md` (scenarios: s1–s7).

## Passed checks (no finding)
- spec.md: terse (~2.5 KB), no AC/behavior duplication (links to gherkin-scenarios.md), UI states table present (4 states for
  the player), non-goals present, analytics/flags correctly "none" (matches story), D1–D4 all carry rationale, scope matches
  the story with no gold-plating.
- gherkin-scenarios.md: one `@s` per behavior, tags unique (s1–s8), Given/When/Then testable, happy path (s1–s3) + navigation
  (s4) + cross-platform (s5) + multi-state (s6) + non-regression (s7) + unit-testable factory (s8) all covered; no
  selectors/clicks in steps.
- tasks.md: index-only, no duplication of per-task frontmatter; single-slice justification (small, non-3-slice-shaped story)
  stated explicitly.
- task-1.md: scenarios=[s8] real tag; path `libs/study-buddy/src/components/app-chrome/lesson-stack-screens.ts(+.test.ts)`
  mirrors the existing `native-tabs-triggers.ts` precedent in the same folder (verified on disk); pure module, no React/hook
  misclassification, exported via barrel — no hooks-service-dao/atomic-design/component-split/state.mdc violations.
- task-2.md: scenarios=[s1..s7] real tags, all distinct from task-1's; path is the only valid location for this expo-router
  `_layout.tsx` change (file-based routing), explicitly rationalized against `(auth)/_layout.tsx` precedent (D2) — not a
  libs/* rule violation given the nature of the change.
- Traceability: all 5 story ACs map to ≥1 scenario (AC1→s1,s2,s3,s5; AC2→s4; AC3→s7; AC4→s6; AC5→s7); every scenario has a
  single owning task, no orphans, no dual ownership.
- i18n keys `nav.lesson` / `nav.study` / `nav.results` already exist in `libs/localization/src/resources/{en,es,pt,de}.ts`
  and are already used, unmodified, in the current `_layout.tsx` — "no new i18n keys" claim verified.
- `(tabs)/_layout.tsx` / `NativeTabs` usage is untouched and isolated from this feature's routes — s7/non-goal verified
  against the actual tree.
