---
id: task-12
title: "AGENTS.md: tanstack-query is installed and required"
slice: 8
scenarios: []
status: todo
paths: [AGENTS.md]
---

## Goal
The Architecture → Hooks bullet in `AGENTS.md` still says tanstack-query "is the intended pattern for data-fetching hooks but is not installed yet — add it to `@helsoft/hooks` when first needed". Replace that with the truth: it is installed, it is the required pattern for hooks that read or write through a service, and there are four documented exemptions.

## Done criteria
- [ ] The "not installed yet" sentence is gone
- [ ] The bullet states tanstack-query is installed and is the **required** pattern for service-backed hooks in `@helsoft/hooks`
- [ ] It cross-references `.agents/rules/tanstack-query.mdc` for the pattern **and** its Exemptions section
- [ ] The surrounding guidance (`state.mdc` for ≥3 related local fields, `state-sharing.mdc` for prop-drilling) is preserved — those rules still apply to non-server state
- [ ] No other section of `AGENTS.md` is edited
- [ ] `pnpm lint` green

## Notes
Documentation only — no `@s` scenarios.

Note the nuance worth keeping: `state.mdc` and `state-sharing.mdc` are not superseded. This migration removed `useReducer` and Context where they were standing in for a **server cache**; both rules remain correct for genuine local and shared client state.

Land after task-10 so both documents tell the same story.
