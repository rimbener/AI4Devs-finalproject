---
feature: activity-image-sizing
reviewer: spec_reviewer
verdict: APPROVED
---

# Spec review — activity-image-sizing

## Findings

None. Both round-1 findings are fixed:

1. `task-4.md` `paths` now points to `libs/activities/tests/e2e/organisms/slide-image/slide-image.e2e.js` (mirrored under `tests/e2e/`, matching the cited skill and the existing `libs/activities/tests/e2e/organisms/` convention).
2. `@s11` is now owned solely by `task-4.md` (`scenarios: [s3, s4, s5, s6, s10, s11]`) with its own done-criterion asserting the real `t('player.slideImage.close')` value reaches the rendered close control. `task-3.md` dropped `s11` from its `scenarios` (`[s6, s7, s8, s9]`) and its done-criteria/Notes now correctly scope it to pass-through-only verification, cross-referencing where the localized guarantee is actually tested.

Fresh pass over the full bundle (story, spec.md, gherkin-scenarios.md, tasks.md, task-1..4.md) found no new issues: every `@s1`–`@s12` maps to ≥ 1 task and vice-versa, task frontmatter is internally consistent with its own done-criteria, all `paths` are valid `libs/*` locations obeying the layering/atomic-design/component-split rules, and spec.md/gherkin-scenarios.md are unchanged and were already sound.
