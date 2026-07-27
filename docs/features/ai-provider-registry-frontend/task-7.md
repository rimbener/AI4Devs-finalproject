---
id: task-7
title: Exclude disabled providers from both "new choice" pickers; keep Remove reachable
slice: 2
scenarios: [s7, s8, s9]
status: done
paths:
  - libs/components/src/organisms/api-key-manager/use-api-key-manager.ts
  - libs/components/src/organisms/api-key-manager/use-api-key-manager.test.ts
  - libs/components/src/organisms/api-key-manager/api-key-manager-remove.tsx
  - libs/components/src/organisms/api-key-manager/api-key-manager-remove.test.tsx
  - libs/study-buddy/src/components/lesson-generation/use-lesson-generation.ts
  - libs/study-buddy/src/components/lesson-generation/use-lesson-generation.test.ts
---

## Goal
A disabled provider must never appear as a choice in the add-key picker or the generate-flow
provider picker — even for a learner who already holds a key for it — while `remove` stays reachable
for that same learner's disabled-but-keyed row (backend D10's asymmetry, reflected client-side).

## Done criteria
- [ ] Scenario s7 covered: `ApiKeyManagerRemove`'s confirm action is exercised for a disabled,
      keyed provider and completes normally (no client-side gate blocks it)
- [ ] Scenario s8 covered: `useApiKeyManager`'s `unsavedProviders` (the add-picker's options) is
      derived from `useAiProviders().enabledProviders` (threaded in as a prop, per Decision 12/task-3 —
      `useApiKeyManager` doesn't call the hook itself), applying only the "not already saved" condition
      on top — `enabledProviders.filter((p) => !savedProviders.has(p.id))` — never a `p.enabled` check
      re-derived inline; a disabled, unkeyed provider is excluded because it's already absent from
      `enabledProviders`, not because this task re-checks `enabled`
- [ ] Scenario s9 covered: `useLessonGenerationForm`'s `savedProviders` (the generate-flow picker's
      options) is derived from `useAiProviders().enabledProviders`, applying only the "has a saved key"
      condition on top — `enabledProviders.filter((p) => hasKey(p.id))` — never a `p.enabled` check
      re-derived inline; a disabled provider is excluded even when the learner holds a key for it,
      unlike the settings list (task-6), which keeps it visible
- [ ] Neither filter removes a disabled provider's row from `ApiKeySavedList` (task-6's list stays
      unfiltered by `enabled`) — only the two *picker* derivations gain the filter
- [ ] `pnpm lint` + `pnpm check-types` + `pnpm test` green for `@helsoft/components` and
      `@helsoft/study-buddy`

## Notes
- Decision 5. This is the one behavioral asymmetry in the whole story: the same `enabled` flag
  excludes a provider from two pickers but must have zero effect on `ApiKeySavedList` (task-6) and
  zero effect on the ability to remove (this task). A single shared "is this row shown" predicate
  would be wrong here — keep the picker filters and the list rendering as two independent
  derivations, not one toggled by a flag, so a future change to one can't silently leak into the
  other.
- `useApiKeyManager` currently has no notion of `enabled` at all (`unsavedProviders =
  AI_PROVIDERS.filter(...)`) — this task is the first to thread the catalog's enabled subset into it,
  via a new prop built by `ApiKeySettingsScreen` from `useAiProviders().enabledProviders` (the hook
  itself takes `savedKeys`/`isSubmitting`/`hasError` only today, and doesn't call `useAiProviders()`
  directly — Decision 12). The prop carries the hook's already-filtered `enabledProviders`, not the
  raw `enabled` flag, so `useApiKeyManager` never re-derives the "is this provider choosable" check
  itself — it only intersects the given `enabledProviders` with its own "not saved" condition.
