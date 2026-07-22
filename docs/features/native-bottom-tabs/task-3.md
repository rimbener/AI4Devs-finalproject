---
id: task-3
title: New Lesson CTA on My lessons
slice: 2
scenarios: [s6]
status: todo
paths:
  [
    libs/study-buddy/src/components/saved-lessons/saved-lessons.tsx,
    libs/study-buddy/src/components/saved-lessons/saved-lessons.test.tsx,
    libs/study-buddy/src/components/saved-lessons/saved-lessons.stories.tsx,
  ]
---

## Goal
Add a persistent **New Lesson** call to action to `SavedLessons` (the My lessons wiring). Render a shared `Button` (`@helsoft/components`) labelled from `nav.newLesson` in the header area, visible in **both content and empty** list states, that does `router.push('/upload')`. Navigation stays in the study-buddy wiring; the button itself is a presentational atom.

## Done criteria
- [ ] Scenario s6 covered by concrete test(s)
- [ ] CTA visible in `content` and `empty` states; pushes `/upload` (s6)
- [ ] CTA label from `nav.newLesson` — no new i18n keys
- [ ] Uses the shared `Button` atom; no bespoke button
- [ ] Component unit test asserts CTA present in content + empty and calls `router.push('/upload')`
- [ ] Storybook story updated to show the CTA in content + empty states (no stale story)
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green
- [ ] No hardcoded strings/colors/dimensions

## Notes
- Revision Q2 lock (option A): persistent CTA in `SavedLessons` header across content + empty states.
- `/upload` is a Stack sibling (task-1), so pushing it is immersive with a header/back.
