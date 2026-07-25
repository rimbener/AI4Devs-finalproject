---
id: task-11
title: Sweep stale "tanstack-query not installed" comments
slice: 8
scenarios: []
status: todo
paths: [libs/hooks/src/hooks/, libs/pdf-upload-extraction/src/hooks/, libs/localization/src/hooks/, libs/study-buddy/src/components/lesson-generation/]
---

## Goal
Every hook that predates the install carries a doc comment claiming "tanstack-query not installed → local state" or "tanstack-query not installed (spec's locked hook-style decision)". Correct all of them — in the 7 migrated hooks **and** in the 4 exempt ones, where the comment must state the actual exemption reason rather than a false claim about the dependency.

## Done criteria
- [ ] A repo-wide search for "tanstack-query not installed" returns **zero** hits
- [ ] Each of the 7 migrated hooks' doc comments describes what it now does (query/mutation, key, cache-sync), not what it used to do
- [ ] Each of the 4 exempt hooks carries the reason from task-10's Exemptions section, cross-referencing `.agents/rules/tanstack-query.mdc`
- [ ] References to `ApiKeyProvider` / `ProfileProvider` in surviving comments are removed
- [ ] Comments only — no behavioral change, no logic touched in the exempt files
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green

## Notes
Documentation only — no `@s` scenarios.

The exempt files are the important half: leaving "not installed" there tells the next agent the dependency is missing and invites a fresh reducer. Their comments should say *why this hook is exempt*, not *why tanstack-query was unavailable*.

Land last among the code-adjacent tasks, after every hook has settled, so the sweep is done once.
