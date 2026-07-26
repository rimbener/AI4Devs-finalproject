---
id: task-10
title: "tanstack-query.mdc: Exemptions section + D2/D3/D5/D6 patterns"
slice: 8
scenarios: []
status: done
paths: [.agents/rules/tanstack-query.mdc]
---

## Goal
Bring the rule up to date with what this migration established, so a future agent neither migrates an exempt hook blindly nor copies the reducer pattern for a new one. Add an **Exemptions** section naming the 4 non-migrated hooks with the reason for each, and fold in the four patterns decided at the gate.

## Done criteria
- [x] **Exemptions** section names all 4 with their reason:
  - `libs/hooks/src/hooks/use-lesson-generation.ts` — multi-stage `stage` machine driven by a `setInterval` progress stepper over a long-running LLM call, plus a `retry` that must replay the exact prior request
  - `libs/pdf-upload-extraction/src/hooks/use-pdf-extraction.ts` — same reasoning; `retry` must reuse the same `documentId` so a retry never mints a second document row
  - `libs/localization/src/hooks/use-locale-preference.ts` — imperative AsyncStorage getters/setters called from effects, no observable loading/error state
  - `libs/study-buddy/src/components/lesson-generation/use-lesson-generation.ts` (`useLessonGenerationForm`) — reads a stored preference once only to seed local picker state
- [x] **D2** documented: the `'auth'` key prefix is reserved; `useSession` evicts every non-`auth` entry on user-id change (not on token refresh), and the eviction precedes the session write
- [x] **D3** documented: prefer one tagged-union mutation when the public contract exposes a single `error`/`isPending` slot shared by several actions — the existing "unless … used from the same file, or … shared code" carve-out, made concrete
- [x] **D5** documented: `isPending` is **not** a synchronous guard; TanStack does not dedupe `mutate()`, so an action that must never double-fire keeps a small entry-gate ref cleared in `onSettled`
- [x] **D6** documented: for time-limited resources, set `staleTime` **and** `gcTime`, both derived from the resource's published TTL — `gcTime` alone does not prevent a refetch on remount
- [x] The provider references in the opening paragraph are corrected — `ApiKeyProvider`/`ProfileProvider` no longer exist; `QueryProvider` is the only one
- [x] `pnpm lint` green

## Notes
Documentation only — no `@s` scenarios. Verified by the `dod_validator` checklist.

Land after slices 0–7 so the rule describes code that actually exists.
